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

export const updateDoctor = async (doctorId, updateData) => {
    // 1. Tách dữ liệu cho 2 bảng
    const { 
        // Doctor fields
        specialization, bio, room_number, 
        // User fields
        full_name, phone_number, avatar_url, status 
    } = updateData;

    const doctorUpdates = {};
    if (specialization !== undefined) doctorUpdates.specialization = specialization;
    if (bio !== undefined) doctorUpdates.bio = bio;
    if (room_number !== undefined) doctorUpdates.room_number = room_number;

    const userUpdates = {};
    if (full_name !== undefined) userUpdates.full_name = full_name;
    if (phone_number !== undefined) userUpdates.phone_number = phone_number;
    if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url;
    if (status !== undefined) userUpdates.status = status;

    // 2. Với Schema hiện tại, doctor_id chính là user_id (Quan hệ 1-1)
    // Nên không cần query lấy user_id nữa.
    const userId = doctorId;

    // 3. Thực hiện Update song song (Parallel)
    const updatePromises = [];

    if (Object.keys(doctorUpdates).length > 0) {
        updatePromises.push(
            supabase.from('Doctors').update(doctorUpdates).eq('doctor_id', doctorId)
        );
    }

    if (Object.keys(userUpdates).length > 0 && userId) {
        updatePromises.push(
            supabase.from('Users').update(userUpdates).eq('user_id', userId)
        );
    }

    // Chờ tất cả update hoàn tất
    if (updatePromises.length > 0) {
        const results = await Promise.all(updatePromises);
        // Check lỗi của từng promise
        for (const res of results) {
            if (res.error) throw new AppError(res.error.message, 500);
        }
    }

    // 4. Trả về dữ liệu mới nhất sau khi update
    return await getDoctorById(doctorId);
};
