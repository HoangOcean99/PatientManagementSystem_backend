import { get } from "mongoose";
import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
export const createPatient = async (payload) => {
  const { patient_id, dob, gender, address, allergies, medical_history_summary } = payload;

  if (dob !== undefined || gender !== undefined || address !== undefined) {
    const userPayload = {};
    if (dob !== undefined) userPayload.dob = dob;
    if (gender !== undefined) userPayload.gender = gender;
    if (address !== undefined) userPayload.address = address;

    const { error: userError } = await supabase
      .from("Users")
      .update(userPayload)
      .eq("user_id", patient_id);

    if (userError) {
      throw new AppError("Failed to update user profile: " + userError.message, 500);
    }
  }

  const patientPayload = {
    patient_id,
  };
  if (allergies !== undefined) patientPayload.allergies = allergies;
  if (medical_history_summary !== undefined) patientPayload.medical_history_summary = medical_history_summary;

  const { data, error } = await supabase
    .from("Patients")
    .insert([patientPayload])
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
};

const PATIENT_SELECT_QUERY = `
  patient_id,
  allergies,
  medical_history_summary,
  Users!inner (
    user_id,
    username,
    full_name,
    email,
    phone_number,
    avatar_url,
    status,
    role,
    is_minor,
    dob,
    gender,
    address
  )
`;

export const getPatientById = async (patientId) => {
  let { data, error } = await supabase
    .from("Patients")
    .select(PATIENT_SELECT_QUERY)
    .eq("patient_id", patientId)
    .single();

  if (error || !data) {
    // 1. Check if user exists in Users table
    const { data: user, error: userError } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", patientId)
      .single();

    if (userError || !user) {
      throw new AppError("Patient not found and User does not exist", 404);
    }

    // 2. Auto-create a basic patient profile for this user
    const { error: insertError } = await supabase
      .from("Patients")
      .insert([
        {
          patient_id: patientId
        }
      ]);

    if (insertError) {
      throw new AppError("Failed to auto-create patient profile: " + insertError.message, 500);
    }

    // 3. Fetch again
    const { data: newData, error: newError } = await supabase
      .from("Patients")
      .select(PATIENT_SELECT_QUERY)
      .eq("patient_id", patientId)
      .single();

    if (newError || !newData) {
      throw new AppError("Failed to retrieve auto-created patient", 500);
    }

    data = newData;
  }

  return data;
};

export const getPatientList = async ({
  keyword,
  gender,
  status,
  page,
  pageSize,
}) => {
  let query = supabase
    .from("Patients")
    .select(PATIENT_SELECT_QUERY, { count: "exact" })
    .order("patient_id", { ascending: false });

  // Keyword search (Users.full_name + Users.phone_number)
  if (keyword) {
    query = query.or(
      `full_name.ilike.%${keyword}%,phone_number.ilike.%${keyword}%`,
      { foreignTable: "Users" },
    );
  }

  if (gender) {
    query = query.eq("Users.gender", gender);
  }

  if (status) query = query.eq("Users.status", status);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new AppError(error.message, 500);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
    },
  };
};
export const updatePatient = async (patientId, payload) => {
  // 1. Check patient exists
  const { data: existing, error: findError } = await supabase
    .from("Patients")
    .select("*")
    .eq("patient_id", patientId)
    .single();

  if (findError || !existing) {
    throw new AppError("Patient not found", 404);
  }

  // 2. Update Patients table
  const patientFields = ["allergies", "medical_history_summary"];
  const patientPayload = {};

  patientFields.forEach((key) => {
    if (payload[key] !== undefined) patientPayload[key] = payload[key];
  });

  if (Object.keys(patientPayload).length > 0) {
    const { error: updatePatientError } = await supabase
      .from("Patients")
      .update(patientPayload)
      .eq("patient_id", patientId);

    if (updatePatientError) {
      throw new AppError(updatePatientError.message, 500);
    }
  }

  // 3. Update Users table
  const userFields = ["username", "full_name", "phone_number", "avatar_url", "status", "is_minor", "dob", "gender", "address"];
  const userPayload = {};

  userFields.forEach((key) => {
    if (payload[key] !== undefined) userPayload[key] = payload[key];
  });

  if (Object.keys(userPayload).length > 0) {
    const { error: updateUserError } = await supabase
      .from("Users")
      .update(userPayload)
      .eq("user_id", patientId);

    if (updateUserError) {
      throw new AppError(updateUserError.message, 500);
    }
  }

  // 4. Fetch updated data
  const { data: fullData, error: fetchError } = await supabase
    .from("Patients")
    .select(PATIENT_SELECT_QUERY)
    .eq("patient_id", patientId)
    .single();

  if (fetchError) {
    throw new AppError(fetchError.message, 500);
  }

  return fullData;
};

export const deletePatient = async (patientId) => {
  // Check if patient exists
  const { data: existing, error: findError } = await supabase
    .from("Patients")
    .select("patient_id")
    .eq("patient_id", patientId)
    .single();

  if (findError || !existing) {
    throw new AppError("Patient not found", 404);
  }

  // 1. Delete FamilyRelationships where patient is the child (dependent)
  const { error: deleteChildRelError } = await supabase
    .from("FamilyRelationships")
    .delete()
    .eq("child_user_id", patientId);

  if (deleteChildRelError) {
    throw new AppError(deleteChildRelError.message, 500);
  }

  // 2. Delete FamilyRelationships where patient is the parent
  const { error: deleteParentRelError } = await supabase
    .from("FamilyRelationships")
    .delete()
    .eq("parent_user_id", patientId);

  if (deleteParentRelError) {
    throw new AppError(deleteParentRelError.message, 500);
  }

  // 3. Delete from Patients table
  const { error: deletePatientError } = await supabase
    .from("Patients")
    .delete()
    .eq("patient_id", patientId);

  if (deletePatientError) {
    throw new AppError(deletePatientError.message, 500);
  }

  // 4. Delete from Users table
  const { error: deleteUserError } = await supabase
    .from("Users")
    .delete()
    .eq("user_id", patientId);

  if (deleteUserError) {
    throw new AppError(deleteUserError.message, 500);
  }

  return true;
};
