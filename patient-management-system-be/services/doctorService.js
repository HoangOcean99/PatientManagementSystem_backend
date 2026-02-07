import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getAllDoctors = async () => {

    const { data, error } = await supabase
        .from('Doctors')
        .select(`
            doctor_id,
            specialization,
            bio,
            room_number,
            Users (
                user_id,
                full_name,
                email,
                phone_number,
                avatar_url,
                status
            )
        `);

    if (error) throw new AppError(error.message, 500);

    return data;
};

export const getDoctorById = async (doctorId) => {
    const { data, error } = await supabase
        .from('Doctors')
        .select(`
            doctor_id,
            specialization,
            bio,
            room_number,
            Users (
                user_id,
                full_name,
                email,
                phone_number,
                avatar_url,
                status
            )
        `)
        .eq('doctor_id', doctorId)
        .single();

    if (error) throw new AppError(error.message, 500);
    
    return data;
};

export const searchDoctors = async ({ name, specialization, status }) => {
    let query = supabase
        .from('Doctors')
        .select(`
            doctor_id,
            specialization,
            bio,
            room_number,
            Users!inner (
                user_id,
                full_name,
                email,
                phone_number,
                avatar_url,
                status
            )
        `);

    if (name) {
        query = query.ilike('Users.full_name', `%${name}%`);
    }

    if (specialization) {
        query = query.ilike('specialization', `%${specialization}%`);
    }

    if (status) {
        query = query.eq('Users.status', status);
    }

    // Sort by full_name in foreign table Users
    query = query.order('full_name', { foreignTable: 'Users', ascending: true });

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 500);

    return data;
};
