import { supabase } from '../supabaseClient.js';


export const getSystemConfig = async () => {
    const { data, error } = await supabase
        .from('SystemConfig')
        .select('config_value')
        .eq('config_key', 'operating_hours')
        .single();

    if (error) {
        console.error('Lỗi lấy lịch trình:', error);
        return null;
    }

    return typeof data.config_value === 'string'
        ? JSON.parse(data.config_value)
        : data.config_value;
};

export const updateSystemConfig = async (key, newValue) => {
    const { data, error } = await supabase
        .from('SystemConfig')
        .update('config_value', newValue)
        .eq('config_key', key)
    if (error) throw error;
    return data;
};


export const getAllHolidays = async () => {
    const { data, error } = await supabase
        .from('PublicHolidays')
        .select('*')
        .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
};

export const createHoliday = async (holiday) => {
    const { data, error } = await supabase
        .from('PublicHolidays')
        .insert([holiday])
        .select();

    if (error) throw error;
    return data[0];
}

export const deleteHoliday = async (id) => {
    const { error } = await supabase
        .from('PublicHolidays')
        .delete()
        .eq('holiday_id', id);

    if (error) throw error;
    return true;
}

export const checkIsHoliday = async (checkDate) => {
    const { data, error } = await supabase
        .from('PublicHolidays')
        .select('holiday_id')
        .lte('start_date', checkDate)
        .gte('end_date', checkDate);

    if (error) return false;
    return data.length > 0;
}

export const getHolidaysInRange = async (startDate, endDate) => {
    const { data: holidays, error } = await supabase
        .from('PublicHolidays')
        .select('*')
        .gte('end_date', startDate)
        .lte('start_date', endDate);

    if (error) throw error;
    return holidays || [];
}