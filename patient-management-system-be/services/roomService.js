import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import { getDoctorById } from "./doctorService.js";

export const getListActiveRooms = async () => {
  const { data: activeRooms, error } = await supabase
    .from("Rooms")
    .select("*, Doctors!inner (doctor_id)")
    .eq("is_active", true);

  if (error) throw new AppError(error.message, 500);

  const mainRooms = await Promise.all(
    activeRooms.map(async (room) => {
      const doctorId = Array.isArray(room.Doctors)
        ? room.Doctors[0]?.doctor_id // Supabase trả về MẢNG
        : room.Doctors?.doctor_id; // Supabase trả về OBJECT

      const doctorData = doctorId ? await getDoctorById(doctorId) : null;

      return {
        ...room,
        doctor: doctorData,
      };
    })
  );

  return mainRooms;
};

export const getListInactiveRooms = async () => {
  const { data: inactiveRooms, error } = await supabase
    .from("Rooms")
    .select(
      "*, Doctors!inner (doctor_id,  Users!inner ( full_name, email) )"
    )
    .eq("is_active", false);

  if (error) throw new AppError(error.message, 500);

  const doctorData = await getDoctorById(
    inactiveRooms[0].Doctors[0].doctor_id
  );

  return {
    ...inactiveRooms[0],
    doctor: doctorData,
  };
};

export const getListRooms = async () => {
  const { data: rooms, error } = await supabase
    .from("Rooms")
    .select(
      "*, Doctors!inner (doctor_id,  Users!inner ( full_name, email) )"
    );

  if (error) throw new AppError(error.message, 500);

  const doctorData = await getDoctorById(rooms[0].Doctors[0].doctor_id);

  return {
    ...rooms[0],
    doctor: doctorData,
  };
};

export const createRoom = async (room) => {
  const { data, error } = await supabase
    .from("Rooms")
    .insert(room)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

export const updateRoom = async (roomId, room) => {
  const { data, error } = await supabase
    .from("Rooms")
    .update(room)
    .eq("room_id", roomId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

export const getRoomById = async (roomId) => {
  const { data, error } = await supabase
    .from("Rooms")
    .select("*")
    .eq("room_id", roomId)
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

export const deleteRoom = async (roomId) => {
  const { data, error } = await supabase
    .from("Rooms")
    .delete()
    .eq("room_id", roomId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};



// export const getListActiveRooms = async () => {
//     const { data, error } = await supabase
//         .from('Rooms')
//         .select('*, Departments(*)')
//         .eq('is_active', true);

//     if (error) throw new AppError(error.message, 500);
//     return data;
// };

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
