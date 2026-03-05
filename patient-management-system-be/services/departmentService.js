import { supabase } from '../supabaseClient.js';

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

