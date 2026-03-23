import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import asyncHandler from '../utils/async-handler.js';
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

// Lấy các slot trống theo đúng bác sĩ và ngày chỉ định
// - Chỉ lấy slot chưa book (is_booked = false)
// - Loại bỏ slot đã trôi giờ (so với thời điểm hiện tại)
// - Loại bỏ slot có Appointment đang pending / upcoming
export const getAvailableDoctorSlotsByDoctorIdAndExactDate = async (doctor_id, date) => {
    const { data: slots, error } = await supabase
        .from('DoctorSlots')
        .select('slot_id, slot_date, start_time, end_time, Appointments(appointment_id, status), Users (full_name)')
        .eq('doctor_id', doctor_id)
        .eq('slot_date', date)
        .eq('is_booked', false)
        .order('start_time', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    if (!slots || slots.length === 0) return [];

    const now = new Date();

    const availableSlots = slots.filter(slot => {
        // Bỏ các slot đã trôi giờ trong ngày hiện tại
        const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`);
        if (slotDateTime < now) return false;

        // Chuẩn hóa mảng Appointments
        const appointments = Array.isArray(slot.Appointments)
            ? slot.Appointments
            : (slot.Appointments ? [slot.Appointments] : []);

        // Nếu có appointment pending hoặc upcoming thì coi như slot không còn trống
        const hasActiveAppointment = appointments.some(
            app => app && (app.status === 'pending' || app.status === 'upcoming')
        );

        return !hasActiveAppointment;
    });

    // Trả về danh sách slot phẳng để FE dễ render
    return availableSlots.map(slot => ({
        slot_id: slot.slot_id,
        slot_date: slot.slot_date,
        start_time: slot.start_time?.substring(0, 5) || slot.start_time,
        end_time: slot.end_time?.substring(0, 5) || slot.end_time
    }));
};

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

export const getAvailableDoctorSlots = async (department_id) => {
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
        .eq('is_booked', false)
        .eq('Doctors.department_id', department_id.department_id)
        .order('start_time', { ascending: true });

    if (error) { console.log(error); throw new AppError(error.message, 500); }
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


const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
};


export const getAllSlots = async (filters = {}) => {
    let query = supabase
        .from('DoctorSlots')
        .select(`
            *,
            Doctors (
                doctor_id,
                specialization,
                Users (
                    full_name,
                    email
                ),
                Departments (
                    department_id,
                    name
                )
            )
        `);

    if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.slot_date) {
        query = query.eq('slot_date', filters.slot_date);
    }

    if (filters.is_booked !== undefined) {
        query = query.eq('is_booked', filters.is_booked);
    }

    if (filters.date_from) {
        query = query.gte('slot_date', filters.date_from);
    }

    if (filters.date_to) {
        query = query.lte('slot_date', filters.date_to);
    }

    query = query
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    return data;
};

/**
 * Lấy slot theo ID
 */
export const getSlotById = async (slotId) => {
    const { data, error } = await supabase
        .from('DoctorSlots')
        .select(`
            *,
            Doctors (
                doctor_id,
                specialization,
                Users (
                    full_name,
                    email
                ),
                Departments (
                    department_id,
                    name
                )
            )
        `)
        .eq('slot_id', slotId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new AppError(error.message, 500);
    }
    return data;
};

/**
 * Tạo một slot mới
 */
export const createSlot = async (slotData) => {
    const { doctor_id, slot_date, start_time, end_time } = slotData;

    // Validate doctor tồn tại
    const { data: doctor, error: doctorError } = await supabase
        .from('Doctors')
        .select('doctor_id')
        .eq('doctor_id', doctor_id)
        .single();

    if (doctorError || !doctor) {
        throw new AppError('Doctor not found', 404);
    }

    // Validate thời gian: start_time phải trước end_time
    if (parseTime(start_time) >= parseTime(end_time)) {
        throw new AppError('Start time must be before end time', 400);
    }

    // Kiểm tra trùng slot (unique constraint: doctor_id + slot_date + start_time)
    const { data: existingSlot } = await supabase
        .from('DoctorSlots')
        .select('slot_id')
        .eq('doctor_id', doctor_id)
        .eq('slot_date', slot_date)
        .eq('start_time', start_time)
        .single();

    if (existingSlot) {
        throw new AppError('A slot already exists for this doctor at the same date and start time', 409);
    }

    // Kiểm tra slot bị overlap với slot khác của cùng doctor trong ngày
    const { data: overlappingSlots } = await supabase
        .from('DoctorSlots')
        .select('slot_id, start_time, end_time')
        .eq('doctor_id', doctor_id)
        .eq('slot_date', slot_date);

    if (overlappingSlots && overlappingSlots.length > 0) {
        const hasOverlap = overlappingSlots.some(existing =>
            (parseTime(start_time) < parseTime(existing.end_time) && parseTime(end_time) > parseTime(existing.start_time))
        );
        if (hasOverlap) {
            throw new AppError('This slot overlaps with an existing slot for this doctor', 409);
        }
    }

    const { data, error } = await supabase
        .from('DoctorSlots')
        .insert([{ doctor_id, slot_date, start_time, end_time }])
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};


/**
 * Cập nhật slot (chỉ cho phép sửa khi slot chưa được book)
 */
export const updateSlot = async (slotId, updateData) => {
    // Lấy slot hiện tại
    const existingSlot = await getSlotById(slotId);
    if (!existingSlot) {
        throw new AppError('Slot not found', 404);
    }

    // Không cho sửa slot đã được book
    if (existingSlot.is_booked) {
        throw new AppError('Cannot update a booked slot. Please cancel the appointment first.', 400);
    }

    const { slot_date, start_time, end_time } = updateData;
    const updates = {};

    if (slot_date !== undefined) updates.slot_date = slot_date;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;

    if (Object.keys(updates).length === 0) {
        throw new AppError('No valid fields to update', 400);
    }

    // Giá trị cuối cùng để validate
    const finalDate = updates.slot_date || existingSlot.slot_date;
    const finalStart = updates.start_time || existingSlot.start_time;
    const finalEnd = updates.end_time || existingSlot.end_time;

    if (parseTime(finalStart) >= parseTime(finalEnd)) {
        throw new AppError('Start time must be before end time', 400);
    }

    // Kiểm tra overlap với slot khác (trừ chính nó)
    const { data: otherSlots } = await supabase
        .from('DoctorSlots')
        .select('slot_id, start_time, end_time')
        .eq('doctor_id', existingSlot.doctor_id)
        .eq('slot_date', finalDate)
        .neq('slot_id', slotId);

    if (otherSlots && otherSlots.length > 0) {
        const hasOverlap = otherSlots.some(other =>
            (parseTime(finalStart) < parseTime(other.end_time) && parseTime(finalEnd) > parseTime(other.start_time))
        );
        if (hasOverlap) {
            throw new AppError('Updated slot overlaps with an existing slot', 409);
        }
    }

    const { data, error } = await supabase
        .from('DoctorSlots')
        .update(updates)
        .eq('slot_id', slotId)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};

/**
 * Xóa slot (chỉ cho phép xoá khi slot chưa được book)
 */
export const deleteSlot = async (slotId) => {
    const existingSlot = await getSlotById(slotId);
    if (!existingSlot) {
        throw new AppError('Slot not found', 404);
    }

    if (existingSlot.is_booked) {
        throw new AppError('Cannot delete a booked slot. Please cancel the appointment first.', 400);
    }

    const { error } = await supabase
        .from('DoctorSlots')
        .delete()
        .eq('slot_id', slotId);

    if (error) throw new AppError(error.message, 500);
    return true;
};




