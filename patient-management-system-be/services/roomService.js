import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getListActiveRooms = async () => {
    const { data, error } = await supabase
        .from('Rooms')
        .select('*, Departments(*)')
        .eq('is_active', true);

    if (error) throw new AppError(error.message, 500);
    return data;
};

export const updateStatusByDoctor = async (doctorId, status) => {
    const { data: doctor, error: docError } = await supabase
        .from('Doctors')
        .select('room_id')
        .eq('doctor_id', doctorId)
        .single();

    if (docError || !doctor) {
        throw new AppError('Doctor not found or not assigned to any room', 404);
    }

    if (!doctor.room_id) {
        throw new AppError('This doctor is not assigned to a clinic room', 400);
    }

    const { data: updatedRoom, error: roomError } = await supabase
        .from('Rooms')
        .update({ room_status: status })
        .eq('room_id', doctor.room_id)
        .select()
        .single();

    if (roomError) {
        throw new AppError(roomError.message, 500);
    }

    return updatedRoom;
};