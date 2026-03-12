import { supabase } from '../supabaseClient.js';
import { AppError } from '../utils/app-error.js';

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
 * Tạo nhiều slots cùng lúc (bulk create)
 */
export const createBulkSlots = async (slotsData) => {
    const { doctor_id, slot_date, slots } = slotsData;

    // Validate doctor tồn tại
    const { data: doctor, error: doctorError } = await supabase
        .from('Doctors')
        .select('doctor_id')
        .eq('doctor_id', doctor_id)
        .single();

    if (doctorError || !doctor) {
        throw new AppError('Doctor not found', 404);
    }

    // Validate từng slot
    for (const slot of slots) {
        if (parseTime(slot.start_time) >= parseTime(slot.end_time)) {
            throw new AppError(`Start time (${slot.start_time}) must be before end time (${slot.end_time})`, 400);
        }
    }

    // Kiểm tra overlap giữa các slot mới với nhau
    for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
            if (parseTime(slots[i].start_time) < parseTime(slots[j].end_time) && parseTime(slots[i].end_time) > parseTime(slots[j].start_time)) {
                throw new AppError(`Slots overlap: ${slots[i].start_time}-${slots[i].end_time} and ${slots[j].start_time}-${slots[j].end_time}`, 400);
            }
        }
    }

    // Kiểm tra overlap với slots đã tồn tại
    const { data: existingSlots } = await supabase
        .from('DoctorSlots')
        .select('slot_id, start_time, end_time')
        .eq('doctor_id', doctor_id)
        .eq('slot_date', slot_date);

    if (existingSlots && existingSlots.length > 0) {
        for (const newSlot of slots) {
            const hasOverlap = existingSlots.some(existing =>
                (parseTime(newSlot.start_time) < parseTime(existing.end_time) && parseTime(newSlot.end_time) > parseTime(existing.start_time))
            );
            if (hasOverlap) {
                throw new AppError(`Slot ${newSlot.start_time}-${newSlot.end_time} overlaps with an existing slot`, 409);
            }
        }
    }

    const insertData = slots.map(slot => ({
        doctor_id,
        slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
    }));

    const { data, error } = await supabase
        .from('DoctorSlots')
        .insert(insertData)
        .select();

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

/**
 * Xoá nhiều slots cùng lúc (bulk delete)
 */
export const deleteBulkSlots = async (slotIds) => {
    // Kiểm tra xem có slot nào đã book không
    const { data: bookedSlots, error: checkError } = await supabase
        .from('DoctorSlots')
        .select('slot_id')
        .in('slot_id', slotIds)
        .eq('is_booked', true);

    if (checkError) throw new AppError(checkError.message, 500);

    if (bookedSlots && bookedSlots.length > 0) {
        throw new AppError(`Cannot delete ${bookedSlots.length} booked slot(s). Please cancel the appointments first.`, 400);
    }

    const { error } = await supabase
        .from('DoctorSlots')
        .delete()
        .in('slot_id', slotIds);

    if (error) throw new AppError(error.message, 500);
    return true;
};
