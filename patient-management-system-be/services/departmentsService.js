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

export const createDepartment = async (department) => {
   const { data, error } = await supabase.from('Departments').insert(department).select().single();
   if (error) throw new AppError(error.message, 500);
   return data;
}

export const updateDepartment = async (departmentId, department) => {
   const { data, error } = await supabase.from('Departments').update(department).eq('department_id', departmentId).select().single();
   if (error) throw new AppError(error.message, 500);
   return data;
}

export const deleteDepartment = async (departmentId) => {
   const { data, error } = await supabase.from('Departments').delete().eq('department_id', departmentId).select().single();
   if (error) throw new AppError(error.message, 500);
   return data;
}

export const getDepartments = async () => {
   try {
      const { data, error } = await supabase
         .from('Departments')
         .select('department_id, name')
         .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
   } catch (error) {
      console.error("Lỗi lấy chuyên khoa:", error.message);
      return [];
   }
};

export const getAll = async (onlyActive = false) => {
    let query = supabase
        .from('Departments')
        .select(`
        *,
        clinic_services_count: ClinicServices(count)
      `);

    if (onlyActive) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
};

export const getById = async (id) => {
    const { data, error } = await supabase
        .from('Departments')
        .select('*, ClinicServices(*)')
        .eq('department_id', id)
        .single();

    if (error) throw error;
    return data;
};

export const create = async (payload) => {
    const { data, error } = await supabase
        .from('Departments')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const update = async (id, updates) => {
    const { data, error } = await supabase
        .from('Departments')
        .update(updates)
        .eq('department_id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};
export const remove = async (id) => {
    const { error } = await supabase
        .from('Departments')
        .delete()
        .eq('department_id', id);

    if (error) throw error;
    return true;
};


