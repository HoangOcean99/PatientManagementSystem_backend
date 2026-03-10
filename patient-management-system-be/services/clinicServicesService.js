import { supabase } from '../supabaseClient.js';

export const getAll = async (filters = {}) => {
    let query = supabase
        .from('ClinicServices')
        .select(`
            *,
            department: Departments (name)
        `);

    if (filters.department) {
        query = query.eq('department_id', filters.department);
    }

    if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
};


export const getById = async (id) => {
    const { data, error } = await supabase
        .from('ClinicServices')
        .select(`
            *,
            department: Departments (*)
        `)
        .eq('service_id', id)
        .single();

    if (error) throw error;
    return data;
};

export const create = async (payload) => {
    const { data, error } = await supabase
        .from('ClinicServices')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};


export const update = async (id, updates) => {
    const { data, error } = await supabase
        .from('ClinicServices')
        .update(updates)
        .eq('service_id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const remove = async (id) => {
    const { error } = await supabase
        .from('ClinicServices')
        .delete()
        .eq('service_id', id);

    if (error) throw error;
    return true;
};
