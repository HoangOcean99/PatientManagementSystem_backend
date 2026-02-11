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
