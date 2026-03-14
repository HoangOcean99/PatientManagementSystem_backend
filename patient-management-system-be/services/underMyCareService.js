import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import crypto from "crypto";
// import { sendFamilyInvitationEmail } from "./gmailService.js";

// ── In-memory share code store (TTL 15 min) ──
const shareCodes = new Map();
const SHARE_CODE_TTL = 15 * 60 * 1000;

// ── In-memory email invite store (TTL 24 hours) ──
const emailInvites = new Map();
const EMAIL_INVITE_TTL = 24 * 60 * 60 * 1000;

function cleanExpiredCodes() {
    const now = Date.now();
    for (const [code, entry] of shareCodes) {
        if (now > entry.expiresAt) shareCodes.delete(code);
    }
    for (const [code, entry] of emailInvites) {
        if (now > entry.expiresAt) emailInvites.delete(code);
    }
}

// ── Add Dependent (tạo mới User + Patient + FamilyRelationship) ──
export const addDependent = async (parentUserId, dependentData) => {
    const { full_name, dob, gender, address, allergies, medical_history_summary, relationship } = dependentData;

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const fakeEmail = `dependent_${randomSuffix}@family.local`;
    const fakeUsername = `dep_${randomSuffix}`;

    const { data: newUser, error: userError } = await supabase
        .from("Users")
        .insert([{
            username: fakeUsername,
            email: fakeEmail,
            full_name,
            role: "patient",
            is_minor: true
        }])
        .select()
        .single();

    if (userError) throw new AppError(`Error creating dependent user: ${userError.message}`, 500);

    const newUserId = newUser.user_id;

    const { error: patientError } = await supabase
        .from("Patients")
        .insert([{
            patient_id: newUserId,
            dob,
            gender: gender || "other",
            address,
            allergies,
            medical_history_summary
        }]);

    if (patientError) {
        await supabase.from("Users").delete().eq("user_id", newUserId);
        throw new AppError(`Error creating patient profile: ${patientError.message}`, 500);
    }

    const { data: relation, error: relationError } = await supabase
        .from("FamilyRelationships")
        .insert([{
            parent_user_id: parentUserId,
            child_user_id: newUserId,
            relationship: relationship || "child",
            can_manage: true
        }])
        .select(`
            relationship_id,
            relationship,
            can_manage,
            child_user_id,
            Users!FamilyRelationships_child_user_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .single();

    if (relationError) {
        await supabase.from("Patients").delete().eq("patient_id", newUserId);
        await supabase.from("Users").delete().eq("user_id", newUserId);
        throw new AppError(`Error linking family relationship: ${relationError.message}`, 500);
    }

    return relation;
};

// ── Get all dependents ──
export const getDependents = async (parentUserId) => {
    const { data, error } = await supabase
        .from("FamilyRelationships")
        .select(`
            relationship_id,
            relationship,
            can_manage,
            created_at,
            child_user_id,
            Users!FamilyRelationships_child_user_id_fkey (
                full_name,
                avatar_url,
                status,
                Patients (
                    dob,
                    gender,
                    allergies,
                    medical_history_summary
                )
            )
        `)
        .eq("parent_user_id", parentUserId);

    if (error) throw new AppError(error.message, 500);
    return data;
};

// ── Get single dependent detail ──
export const getDependentDetail = async (parentUserId, relationshipId) => {
    const { data, error } = await supabase
        .from("FamilyRelationships")
        .select(`
            relationship_id,
            relationship,
            can_manage,
            created_at,
            child_user_id,
            Users!FamilyRelationships_child_user_id_fkey (
                user_id,
                full_name,
                avatar_url,
                email,
                status,
                Patients (
                    dob,
                    gender,
                    address,
                    allergies,
                    medical_history_summary
                )
            )
        `)
        .eq("relationship_id", relationshipId)
        .eq("parent_user_id", parentUserId)
        .single();

    if (error || !data) {
        throw new AppError("Dependent not found or you don't have access", 404);
    }

    return data;
};

// ── Update dependent info ──
export const updateDependent = async (parentUserId, relationshipId, updateData) => {
    // Verify ownership
    const { data: relation, error: findError } = await supabase
        .from("FamilyRelationships")
        .select("relationship_id, child_user_id, can_manage")
        .eq("relationship_id", relationshipId)
        .eq("parent_user_id", parentUserId)
        .single();

    if (findError || !relation) {
        throw new AppError("Relationship not found or you don't have access", 404);
    }

    if (!relation.can_manage) {
        throw new AppError("You only have read-only access to this dependent", 403);
    }

    const childUserId = relation.child_user_id;
    const { full_name, dob, gender, address, allergies, medical_history_summary, relationship } = updateData;

    // Update Users table if full_name provided
    if (full_name) {
        const { error: userErr } = await supabase
            .from("Users")
            .update({ full_name })
            .eq("user_id", childUserId);

        if (userErr) throw new AppError(`Error updating user: ${userErr.message}`, 500);
    }

    // Update Patients table if any patient fields provided
    const patientFields = {};
    if (dob !== undefined) patientFields.dob = dob;
    if (gender !== undefined) patientFields.gender = gender;
    if (address !== undefined) patientFields.address = address;
    if (allergies !== undefined) patientFields.allergies = allergies;
    if (medical_history_summary !== undefined) patientFields.medical_history_summary = medical_history_summary;

    if (Object.keys(patientFields).length > 0) {
        const { error: patErr } = await supabase
            .from("Patients")
            .update(patientFields)
            .eq("patient_id", childUserId);

        if (patErr) throw new AppError(`Error updating patient: ${patErr.message}`, 500);
    }

    // Update relationship type if provided
    if (relationship) {
        const { error: relErr } = await supabase
            .from("FamilyRelationships")
            .update({ relationship })
            .eq("relationship_id", relationshipId);

        if (relErr) throw new AppError(`Error updating relationship: ${relErr.message}`, 500);
    }

    return getDependentDetail(parentUserId, relationshipId);
};

// ── Remove dependent link ──
export const removeDependent = async (parentUserId, relationshipId) => {
    const { data: existing, error: findError } = await supabase
        .from("FamilyRelationships")
        .select("relationship_id, child_user_id")
        .eq("relationship_id", relationshipId)
        .eq("parent_user_id", parentUserId)
        .single();

    if (findError || !existing) {
        throw new AppError("Relationship not found or you don't have access", 404);
    }

    const { error } = await supabase
        .from("FamilyRelationships")
        .delete()
        .eq("relationship_id", relationshipId);

    if (error) throw new AppError(error.message, 500);

    // Note: dữ liệu y tế của trẻ vẫn được giữ lại dù xóa liên kết
    return { success: true };
};

// ── Generate share code ──
export const generateShareCode = async (parentUserId, childUserId) => {
    // Verify parent owns this child relationship
    const { data: relation, error } = await supabase
        .from("FamilyRelationships")
        .select("relationship_id")
        .eq("parent_user_id", parentUserId)
        .eq("child_user_id", childUserId)
        .single();

    if (error || !relation) {
        throw new AppError("You don't have a relationship with this dependent", 403);
    }

    cleanExpiredCodes();

    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars: e.g. "A3F1B2"
    const expiresAt = Date.now() + SHARE_CODE_TTL;

    shareCodes.set(code, {
        parentUserId,
        childUserId,
        expiresAt,
    });

    return {
        share_code: code,
        expires_in_minutes: 15,
        expires_at: new Date(expiresAt).toISOString(),
    };
};

// ── Link dependent by share code ──
export const linkByShareCode = async (parentUserId, shareCode, relationship) => {
    cleanExpiredCodes();

    const entry = shareCodes.get(shareCode);
    if (!entry) {
        throw new AppError("Invalid or expired share code", 400);
    }

    // Prevent linking to yourself
    if (entry.parentUserId === parentUserId) {
        throw new AppError("You cannot link to your own dependent using your share code", 400);
    }

    const childUserId = entry.childUserId;

    // Check if relationship already exists
    const { data: existing } = await supabase
        .from("FamilyRelationships")
        .select("relationship_id")
        .eq("parent_user_id", parentUserId)
        .eq("child_user_id", childUserId)
        .single();

    if (existing) {
        throw new AppError("You already have a relationship with this dependent", 409);
    }

    // Create new relationship
    const { data: relation, error } = await supabase
        .from("FamilyRelationships")
        .insert([{
            parent_user_id: parentUserId,
            child_user_id: childUserId,
            relationship: relationship || "guardian",
            can_manage: true
        }])
        .select(`
            relationship_id,
            relationship,
            can_manage,
            child_user_id,
            Users!FamilyRelationships_child_user_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .single();

    if (error) throw new AppError(`Error linking dependent: ${error.message}`, 500);

    // Invalidate the share code after use
    shareCodes.delete(shareCode);

    return relation;
};

// ── Invite dependent by email ──
export const inviteByEmail = async (parentUserId, targetEmail, relationship) => {
    // 1. Find child user by email
    const { data: childUser, error: childError } = await supabase
        .from("Users")
        .select("user_id, full_name")
        .eq("email", targetEmail)
        .single();

    if (childError || !childUser) {
        throw new AppError("No user found with this email address", 404);
    }

    // 2. Prevent self-invitation
    if (childUser.user_id === parentUserId) {
        throw new AppError("You cannot invite yourself", 400);
    }

    // 3. Check if relationship already exists
    const { data: existing } = await supabase
        .from("FamilyRelationships")
        .select("relationship_id")
        .eq("parent_user_id", parentUserId)
        .eq("child_user_id", childUser.user_id)
        .single();

    if (existing) {
        throw new AppError("You already have a relationship with this user", 409);
    }

    // 4. Get parent's name for the email
    const { data: parentUser } = await supabase
        .from("Users")
        .select("full_name")
        .eq("user_id", parentUserId)
        .single();

    const inviterName = parentUser?.full_name || "Unknown User";

    // 5. Generate and store code
    cleanExpiredCodes();
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A3F1B2"
    const expiresAt = Date.now() + EMAIL_INVITE_TTL;

    emailInvites.set(code, {
        parentUserId,
        childUserId: childUser.user_id,
        relationship: relationship || "guardian",
        expiresAt,
    });

    // 6. Send email
    // await sendFamilyInvitationEmail(targetEmail, inviterName, code);

    return {
        message: "Invitation sent successfully",
        expires_at: new Date(expiresAt).toISOString(),
    };
};

// ── Accept email invitation ──
export const acceptEmailInvitation = async (childUserId, invitationCode) => {
    cleanExpiredCodes();

    const entry = emailInvites.get(invitationCode);
    if (!entry) {
        throw new AppError("Invalid or expired invitation code", 400);
    }

    if (entry.childUserId !== childUserId) {
        throw new AppError("This invitation code is not for your account", 403);
    }

    const { parentUserId, relationship } = entry;

    // Check if relationship already exists
    const { data: existing } = await supabase
        .from("FamilyRelationships")
        .select("relationship_id")
        .eq("parent_user_id", parentUserId)
        .eq("child_user_id", childUserId)
        .single();

    if (existing) {
        emailInvites.delete(invitationCode);
        throw new AppError("You are already connected to this user", 409);
    }

    // Create new relationship
    const { data: relation, error } = await supabase
        .from("FamilyRelationships")
        .insert([{
            parent_user_id: parentUserId,
            child_user_id: childUserId,
            relationship: relationship || "guardian",
            can_manage: true
        }])
        .select(`
            relationship_id,
            relationship,
            can_manage,
            parent_user_id,
            Users!FamilyRelationships_parent_user_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .single();

    if (error) throw new AppError(`Error accepting invitation: ${error.message}`, 500);

    // Invalidate the code
    emailInvites.delete(invitationCode);

    return relation;
};
