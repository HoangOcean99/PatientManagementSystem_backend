import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getListDepartments = async () => {
   const { data, error } = await supabase.from('Departments').select('*');
   if (error) throw new AppError(error.message, 500);
   return data;
}

export const getDepartmentById = async (departmentId) => {
   const { data, error } = await supabase.from('Departments').select('*').eq('department_id', departmentId).single();
   if (error) throw new AppError(error.message, 500);
   return data;
}

export const getListServicesByDepartment = async (departmentId) => {
   const { data, error } = await supabase.from('ClinicServices').select('*').eq('department_id', departmentId);
   if (error) throw new AppError(error.message, 500);
   return data;
}


