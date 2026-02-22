import { supabase } from "../supabaseClient.js"
import { AppError } from "../utils/app-error.js";

export const getListAppointments = async () => {
  const { data, error } = await supabase.from('Appointments').select('*');
  if(error) throw new AppError(error.message, 500);
  return data;
}