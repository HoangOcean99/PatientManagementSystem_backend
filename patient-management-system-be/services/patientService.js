import { get } from "mongoose";
import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
export const createPatient = async (payload) => {
  const { data, error } = await supabase
    .from("Patients")
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
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
    .select(
      `
      patient_id,
      dob,
      gender,
      address,
      Users (
        full_name,
        phone_number,
        avatar_url,
        status,
        role
      )
    `,
      { count: "exact" },
    )
    .order("patient_id", { ascending: false });

  // Keyword search (Users.full_name + Users.phone_number)
  if (keyword) {
    query = query.or(
      `full_name.ilike.%${keyword}%,phone_number.ilike.%${keyword}%`,
      { foreignTable: "Users" },
    );
  }

  if (gender) query = query.eq("gender", gender);

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

export const getPatientById = async (patientId) => {
  const { data, error } = await supabase
    .from("Patients")
    .select(`
      *,
      Users (*)
    `)
    .eq("patient_id", patientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new AppError("Patient not found", 404);
    }
    throw new AppError(error.message, 500);
  }

  return data;
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
  const patientFields = ["dob", "gender", "address"];
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
  const userFields = ["full_name", "phone_number", "avatar_url", "status"];
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
    .select(
      `
    patient_id,
    dob,
    gender,
    address,
    Users (
      full_name,
      phone_number,
      avatar_url,
      status
    )
  `,
    )
    .eq("patient_id", patientId)
    .single();

  if (fetchError) {
    throw new AppError(fetchError.message, 500);
  }

  return fullData;
};
