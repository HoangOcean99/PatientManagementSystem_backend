import { get } from "mongoose";
import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import { updateAvatar } from "./userService.js";

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
  const { data: user, error: userError } = await supabase
    .from("Users")
    .select(`
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
      address,
      Patients (
        patient_id,
        allergies,
        medical_history_summary
      )
    `)
    .eq("user_id", patientId)
    .single();

  if (userError || !user) {
    throw new AppError("Patient not found", 404);
  }

  let pInfo = user.Patients;

  return {
    patient_id: user.user_id,
    allergies: pInfo.allergies || null,
    medical_history_summary: pInfo.medical_history_summary || null,
    Users: {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      status: user.status,
      role: user.role,
      is_minor: user.is_minor,
      dob: user.dob,
      gender: user.gender,
      address: user.address
    }
  };
};

export const getPatientList = async ({
  gender,
  status,
  page,
  pageSize,
}) => {
  let query = supabase
    .from("Users")
    .select(`
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
      address,
      Patients (
        patient_id,
        allergies,
        medical_history_summary
      )
    `, { count: "exact" })
    .eq("role", "patient")
    .order("user_id", { ascending: false });

  if (keyword) {
    query = query.or(`full_name.ilike.%${keyword}%,phone_number.ilike.%${keyword}%`);
  }

  if (gender) {
    query = query.eq("gender", gender);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new AppError(error.message, 500);

  const formattedData = data.map(user => {
    const pInfo = user.Patients && user.Patients.length > 0 ? user.Patients[0] : {};
    return {
      patient_id: user.user_id,
      allergies: pInfo.allergies || null,
      medical_history_summary: pInfo.medical_history_summary || null,
      Users: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        status: user.status,
        role: user.role,
        is_minor: user.is_minor,
        dob: user.dob,
        gender: user.gender,
        address: user.address
      }
    };
  });

  return {
    data: formattedData,
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
    },
  };
};
export const updatePatient = async (payload, avatarFile) => {
  const { patient_id } = payload;
  const { data: existing, error: findError } = await supabase
    .from("Patients")
    .select("*")
    .eq("patient_id", patient_id)
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
      .eq("patient_id", patient_id);

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
      .eq("user_id", patient_id);

    if (updateUserError) {
      throw new AppError(updateUserError.message, 500);
    }
  }

  await updateAvatar({ ...payload, user_id: patient_id }, avatarFile);

  // 4. Fetch updated data
  const { data: fullData, error: fetchError } = await supabase
    .from("Patients")
    .select(PATIENT_SELECT_QUERY)
    .eq("patient_id", patient_id)
    .single();

  if (fetchError) {
    throw new AppError(fetchError.message, 500);
  }

  return fullData;
};

export const updatePatientInfo = async (patientId, payload) => {
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
  const userFields = ["username", "full_name", "fullName", "phone_number", "phoneNumber", "email", "status", "is_minor", "dob", "gender", "address"];
  const userPayload = {};

  userFields.forEach((key) => {
    if (payload[key] !== undefined) {
      // Map camelCase to snake_case if necessary
      if (key === 'fullName') userPayload.full_name = payload[key];
      else if (key === 'phoneNumber') userPayload.phone_number = payload[key];
      else userPayload[key] = payload[key];
    }
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
