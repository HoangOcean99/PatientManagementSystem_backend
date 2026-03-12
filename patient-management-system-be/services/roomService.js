import { supabase } from '../supabaseClient.js';
import { AppError } from '../utils/app-error.js';

export const getListActiveRooms = async () => {
    const { data, error } = await supabase
        .from('Rooms')
        .select('*, Departments(*)')
        .eq('is_active', true);

    if (error) throw new AppError(error.message, 500);
    return data;
};