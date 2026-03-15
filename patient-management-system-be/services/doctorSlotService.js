import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import * as doctorService from "../services/doctorService.js";
import * as appointmentService from "../services/appointmentService.js";

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

export const getAvailableDoctorSlotsByDoctorIdAndDate = async (doctor_id, start_date, end_date) => {
  // 1. Lấy thời điểm hiện tại để lọc bỏ các slot trong quá khứ (ngay cả khi trong cùng ngày)
  const now = new Date().toISOString();

  const { data: slots, error } = await supabase
    .from('DoctorSlots')
    .select('slot_id, slot_date, start_time, end_time, Appointments(appointment_id, status)')
    .eq('doctor_id', doctor_id)
    .gte('slot_date', start_date)
    .lte('slot_date', end_date)
    .eq('is_booked', false)
    // Tối ưu 1: Sắp xếp ngay từ DB giúp Frontend không cần sort lại
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);

  const availableSlots = slots.filter(slot => {
    // Tối ưu 2: Lọc bỏ slot nếu giờ bắt đầu đã trôi qua (so với thời điểm hiện tại)
    const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`);
    if (slotDateTime < new Date()) return false;

    // Tối ưu 3: Xử lý quan hệ 1-nhiều hoặc 1-1 của Appointments một cách an toàn
    const appointments = Array.isArray(slot.Appointments)
      ? slot.Appointments
      : (slot.Appointments ? [slot.Appointments] : []);

    const hasActiveAppointment = appointments.some(
      app => app.status === 'pending' || app.status === 'upcoming'
    );

    return !hasActiveAppointment;
  });

  // Tối ưu 4: Dùng reduce để gom nhóm (giữ nguyên logic cũ nhưng chạy trên data đã sạch)
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const dateKey = slot.slot_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push({
      slot_id: slot.slot_id,
      // Format lại giờ chỉ lấy HH:mm cho gọn UI (ví dụ "08:30")
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5)
    });
    return acc;
  }, {});

  return groupedSlots;
};

export const getAvailableDoctorSlotsInDay = async (doctorId, date) => {
  //.eq('is_booked', false) để đảm bảo chỉ trả về slot trống
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
  return newDoctorSlot;
}

export const getAvailableDoctorSlotsByDate = async (department_id, date) => {
  const { data: slots, error } = await supabase
    .from('DoctorSlots')
    .select(`
      slot_id,
      slot_date,
      start_time,
      end_time,
      doctor_id,
      Appointments(appointment_id, status),
      Doctors!inner (
        doctor_id,
        department_id,
        Users (full_name)
      )
    `)
    .eq('slot_date', date)
    .eq('is_booked', false)
    .eq('Doctors.department_id', department_id)
    .order('start_time', { ascending: true });

  if (error) throw new AppError(error.message, 500);
  if (!slots || slots.length === 0) return [];

  const now = new Date();
  const availableSlots = slots.filter(slot => {
    // Lọc bỏ slot đã trôi giờ
    const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`);
    if (slotDateTime < now) return false;

    // Lọc bỏ slot có Appointment pending/confirmed
    const appointments = Array.isArray(slot.Appointments)
      ? slot.Appointments
      : (slot.Appointments ? [slot.Appointments] : []);

    // Kiểm tra nếu có appointment với status pending hoặc confirmed thì slot không available
    const hasActiveAppointment = appointments.some(
      app => app && (app.status === 'pending' || app.status === 'confirmed')
    );

    return !hasActiveAppointment;
  });

  return availableSlots.map(slot => ({
    slot_id: slot.slot_id,
    slot_date: slot.slot_date,
    start_time: slot.start_time?.substring(0, 5) || slot.start_time,
    end_time: slot.end_time?.substring(0, 5) || slot.end_time,
    doctor_id: slot.doctor_id,
    Doctors: slot.Doctors
  }));
} 