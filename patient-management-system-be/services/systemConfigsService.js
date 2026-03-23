import { supabase } from '../supabaseClient.js';


export const getSystemConfig = async () => {
    const { data, error } = await supabase
        .from('SystemConfig')
        .select('*')

    if (error) {
        console.error('Lỗi lấy lịch trình:', error);
        return null;
    }

    return data;
};

export const updateSystemConfigs = async (configs) => {
    const { data, error } = await supabase
        .from('SystemConfig')
        .upsert(
            configs.map(c => ({
                config_key: c.key,
                config_value: c.value
            }))
        );

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