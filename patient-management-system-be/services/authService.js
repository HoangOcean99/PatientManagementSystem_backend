import { supabase } from "../supabaseClient.js"
import { AppError } from "../utils/app-error.js";
import { fakeEmail, hash } from "../utils/authUtils.js";
import { sendOtp, verifyOtp } from "./gmailService.js";
import crypto from "crypto";

// Function link to database
export const requestRegister = async (username, emailParent) => {
    const { data: dataUsername } = await supabase
        .from('Users')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();

    if (dataUsername) {
        throw new AppError("Username existed", 409);
    }
    const { data: parent } = await supabase
        .from('Users')
        .select('user_id')
        .eq('email', emailParent)
        .maybeSingle();

    if (!parent) {
        throw new AppError("Parent email does not exist", 404);
    }

    await sendOtp(emailParent, 'verifyEmail');

    return {
        message: "OTP sent",
        idParent: parent.user_id
    };
};


export const verifyAndCreateUser = async (
    username,
    password,
    emailParent,
    relationship,
    idParent,
    otp
) => {
    await verifyOtp(emailParent, otp);

    const email = fakeEmail(username);

    const { data: dataSignUp, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;

    const { data: dataRpc, error: errorRpc } = await supabase.rpc('create_minor_user', {
        p_user_id: dataSignUp.user.id,
        p_username: username,
        p_parent_id: idParent,
        p_relationship: relationship
    });

    if (errorRpc) {
        await supabase.auth.admin.deleteUser(dataSignUp.user.id);
        throw new AppError(errorRpc.message, 500);
    }
    const { data: role, error: errorRole } = await supabase
        .from('Users')
        .select('role')
        .eq('user_id', dataSignUp.user.id)
        .single();

    if (errorRole) {
        throw errorRole;
    }

    return {
        success: true,
        id: dataSignUp.user.id,
        role: role.role
    };
};




export const loginLocal = async (username, password) => {
    const email = fakeEmail(username);
    const { data: dataLogin, error: errorLogin } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (errorLogin) throw errorLogin;

    const { data, error } = await supabase
        .from('Users')
        .select('user_id, role')
        .eq('user_id', dataLogin.user.id)
        .single();

    if (error) {
        throw error;
    }
    return data;
}

export const syncUserGoogle = async (user) => {
    const { error: upsertError } = await supabase
        .from('Users')
        .upsert({
            user_id: user.id,
            email: user.email,
            is_minor: false
        });

    if (upsertError) {
        throw upsertError;
    }
    const { data, error } = await supabase
        .from('Users')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (error) {
        throw error;
    }

    return {
        id: user.id,
        role: data.role
    };
};

export const requestForgetPassword = async (username) => {
    const { data, error } = await supabase
        .from('Users')
        .select(`
            user_id,
            FamilyRelationships!FamilyRelationships_child_user_id_fkey!inner (
                parent_user_id,
                Users!FamilyRelationships_parent_user_id_fkey (
                    email
                )
            )
        `)
        .eq('username', username)
        .maybeSingle();

    if (error) {
        console.error(error);
        throw new AppError("Database error", 500);
    }

    if (!data) {
        throw new AppError("Username không tồn tại", 404);
    }

    const parentEmail =
        data.FamilyRelationships?.[0]?.Users?.email;

    if (!parentEmail) {
        throw new AppError("Không tìm thấy email người giám hộ", 404);
    }

    await sendOtp(parentEmail, 'resetPassword');

    return {
        message: "OTP sent",
        email: parentEmail
    };
};


export const verifyResetOtp = async (username, emailParent, otp) => {

    await verifyOtp(emailParent, otp);

    const { data: user } = await supabase
        .from("Users")
        .select("user_id")
        .eq("username", username)
        .single();

    if (!user) {
        return { success: false };
    }

    await supabase
        .from("password_reset_tokens")
        .delete()
        .eq("user_id", user.user_id);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hash(rawToken);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await supabase
        .from("password_reset_tokens")
        .insert({
            user_id: user.user_id,
            token_hash: tokenHash,
            expires_at: expiresAt
        });
    return { resetToken: rawToken };
};

export const resetPassword = async (token, newPassword) => {

    const tokenHash = hash(token);

    const { data, error } = await supabase
        .from("password_reset_tokens")
        .select("*")
        .eq("token_hash", tokenHash)
        .single();

    if (error || !data)
        throw new Error("Invalid or expired token");

    if (new Date(data.expires_at) < new Date())
        throw new Error("Token expired");

    await supabase.auth.admin.updateUserById(
        data.user_id,
        { password: newPassword }
    );

    await supabase.auth.admin.signOut(data.user_id);

    return { success: true };
};