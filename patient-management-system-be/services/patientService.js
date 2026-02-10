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
