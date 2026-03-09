import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import * as doctorService from "../services/doctorService.js";

export const getListDoctorSlots = async () => {
  const { data, error } = await supabase.from('DoctorSlots').select('*');

  // Chỉ giữ lại xử lý lỗi quan trọng
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export const getDoctorSlotById = async (slot_id) => {
  // 1. Chỉ lấy đúng 1 bản ghi từ DB (Nhanh hơn gấp trăm lần so với việc tải hết về)
  const { data, error } = await supabase
    .from('DoctorSlots')
    .select('*')
    .eq('slot_id', slot_id)
    .single();
  if (error) throw new AppError(error.message, 500);
  return data || null || undefined || [];
}

export const getAvailableDoctorSlotsInMonth = async (doctor_id, start_date, end_date) => {
  const { data: slots, error } = await supabase.from('DoctorSlots').select(
    'slot_id, slot_date, start_time, end_time, Appointments(appointment_id,status)')
    .eq('doctor_id', doctor_id)
    .gte('slot_date', start_date) // Lớn hơn hoặc bằng ngày bắt đầu
    .lte('slot_date', end_date) // Nhỏ hơn hoặc bằng ngày kết thúc
    .eq('is_booked', false);

  if (error) throw new Error(error.message);

  // Lọc ra NHỮNG SLOT TRỐNG (chưa có appointment hoặc appointment đã bị cancel)
  const avaibleSlots = slots.filter(slot => {
    // Nếu slot.Appointments không tồn tại hoặc không phải là mảng, coi như nó không có lịch hẹn nào (trả về false)
    if (!Array.isArray(slot.Appointments)) {
      return true; // Giữ lại vì nó trống (không có lịch hẹn)
    }
    const hasActiveAppointment = slot.Appointments.some(
      app => app.status === 'pending' || app.status === 'upcoming'
    );
    return !hasActiveAppointment;
  })
  // GOM NHÓM DỮ LIỆU THEO NGÀY
  const groupedSlots = avaibleSlots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = [];
    }
    acc[slot.slot_date].push({
      slot_id: slot.slot_id,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
    return acc;
  }, {})

  return groupedSlots;
}

export const getAvailableDoctorSlotsInDay = async (doctorId, date) => {
  // Tớ bổ sung thêm .eq('is_booked', false) để đảm bảo chỉ trả về slot trống
  const { data, error } = await supabase
    .from('DoctorSlots')
    .select('slot_id, slot_date, start_time, end_time')
    .eq('doctor_id', doctorId)
    .eq('slot_date', date)
    .eq('is_booked', false);

  if (error) throw new AppError(error.message, 500);
  return data;
}

export const createDoctorSlot = async (doctor_id, slot_date, start_time, end_time) => {
  const doctor = await doctorService.getDoctorById(doctor_id);
  if (!doctor) throw new AppError("Bác sĩ không tồn tại", 404);
  const { data: newDoctorSlot, error: createError } = await supabase.from('DoctorSlots')
    .insert({ doctor_id, slot_date, start_time, end_time, is_booked: false })
    .select() // Lấy dữ liệu vừa tạo
    .single();
  if (createError) throw new AppError(createError.message, 500);
  return newDoctorSlot; // Trả về dữ liệu vừa tạo
}