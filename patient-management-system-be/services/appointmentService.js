import { supabase } from "../supabaseClient.js"
import { AppError } from "../utils/app-error.js";
import { getPriceByServiceId } from "./clinicServices.js";



// Kiểm tra ngày có đúng chuẩn YYYY-MM-DD không
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;
  const date = new Date(dateString);
  return date.getTime() === date.getTime(); // Check xem ngày có tồn tại thực tế không
};

// Kiểm tra giờ có đúng chuẩn HH:mm hoặc HH:mm:ss không
const isValidTime = (timeString) => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeString.match(regex) !== null;
};

export const getListAppointments = async (date) => {
  let query = supabase.from('Appointments').select(`
        appointment_id,
        status,
        currentSymptom,
        total_price,
        deposit_required,
        deposit_paid,
        created_at,
        DoctorSlots!inner ( slot_id, start_time, end_time, slot_date),
        Patients!inner ( patient_id, Users!inner ( full_name, email )),
        Doctors!inner ( doctor_id, Users!inner ( full_name, email ) ),
        ClinicServices!inner ( service_id, name, Departments!inner ( department_id, name ) )
      `);

  if (date) {
    query = query.eq('DoctorSlots.slot_date', date);
  }
  const { data: appointments, error } = await query;
  if (error) {
    throw new Error(`Lỗi khi lấy danh sách lịch: ${error.message}`);
  }
  // Nếu appointments là null hoặc mảng rỗng thì trả về mảng rỗng luôn, không sort
  if (!appointments || appointments.length === 0) {
    return [];
  }

  return appointments.sort((a, b) =>
    a.DoctorSlots.start_time.localeCompare(b.DoctorSlots.start_time)
  );
};

export const getListAppointmentsByCurrentUserId = async (currentUserId, { date, status } = {}) => {
  let query = supabase.from('Appointments').select(`
        appointment_id,
        status,
        currentSymptom,
        total_price,
        deposit_required,
        deposit_paid,
        created_at,
        DoctorSlots!inner ( slot_id, start_time, end_time, slot_date),
        Patients!inner ( patient_id, Users!inner ( full_name, email )),
        Doctors!inner ( doctor_id, Users!inner ( full_name, email ) ),
        ClinicServices!inner ( service_id, name, Departments!inner ( department_id, name ) )
      `);

  if (date && isValidDate(date)) {
    query = query.eq('DoctorSlots.slot_date', date);
  }
  if (status) {
    query = query.eq('status', status);
  }
  query = query.eq('Patients.patient_id', currentUserId);
  const { data: appointments, error } = await query;
  if (error) {
    throw new Error(`Lỗi khi lấy danh sách lịch: ${error.message}`);
  }
  // Nếu appointments là null hoặc mảng rỗng thì trả về mảng rỗng luôn, không sort
  if (!appointments || appointments.length === 0) {
    return [];
  }

  return appointments.sort((a, b) =>
    a.DoctorSlots.start_time.localeCompare(b.DoctorSlots.start_time)
  );
};

export const getListAppointmentsByStatus = async (status) => {
  const { data: appointment, error } = await supabase
    .from('Appointments ')
    .select(`
     appointment_id,
      status,
      DoctorSlots!inner ( slot_id, start_time, end_time, slot_date),
      Patients!inner ( patient_id, Users!inner ( full_name, email )),
      Doctors!inner ( doctor_id, Users!inner ( full_name, email ) ),
      ClinicServices!inner ( service_id, name, Departments!inner ( department_id, name ) )
    `)
    .eq('status', status)


  if (error || !appointment) {
    throw new AppError(error?.message || "Lịch khám không tồn tại", error?.statusCode || 404);
  }
  return appointment;
};

export const getListAppointmentsByAppointmentId = async (appointment_id) => {
  const { data: appointment, error } = await supabase
    .from('Appointments')
    .select(`
      appointment_id,
      status,
      Doctors!inner ( doctor_id, Users!inner ( full_name, email, phone_number ) ),
      ClinicServices!inner ( service_id, name,departments!inner ( department_id, name ) ),
      DoctorSlots!inner ( slot_id, slot_date, start_time, end_time ),
      Patients!inner ( patient_id, Users!inner ( full_name, email, phone_number ) )
    `)
    .eq('appointment_id', appointment_id)
    .single();

  if (error || !appointment) {
    throw new AppError(error?.message || "Lịch khám không tồn tại", error?.statusCode || 404);
  }
  return appointment;
};

export const getUnassignedAppointment = async (date) => {
  let query = supabase
    .from('Appointments')
    .select(`
      appointment_id,
      status,
      DoctorSlots!inner ( start_time, slot_date ),
      Patients!inner ( Users!inner ( full_name, phone_number ) ),
      ClinicServices!inner ( name, Departments!inner ( name ) )
    `)
    .eq('status', 'checked_in')
    .is('doctor_id', null);
  if (date) {
    query = query.eq('DoctorSlots.slot_date', date);
  }
  const { data, error } = await query;
  if (error) {
    throw new AppError(error.message, error.statusCode);
  }
  return data.sort((a, b) =>
    a.DoctorSlots.start_time.localeCompare(b.DoctorSlots.start_time)
  );
}

export const createAppointment = async (patient_id, doctor_id, service_id, slot_id, current_symptom) => {
  // 1. Kiểm tra slot xem còn trống không (Sử dụng slot_id truyền vào)
  const { data: slot, error: slotError } = await supabase
    .from('DoctorSlots')
    .select('is_booked')
    .eq('slot_id', slot_id)
    .single();

  if (slotError || !slot) throw new AppError("Khung giờ này không tồn tại", 404);
  if (slot.is_booked) throw new AppError("Khung giờ này đã có người đặt rồi cậu ơi!", 400);

  // 2. Lấy thông tin giá dịch vụ từ bảng ClinicServices (bảng dịch vụ khám bệnh)
  const { data: service, error: serviceError } = await supabase
    .from('ClinicServices')
    .select('*') // Lấy toàn bộ thông tin, tránh lỗi nếu thiếu cột mới
    .eq('service_id', service_id.trim())
    .single();

  // Nếu Supabase trả về lỗi (sai tên cột, sai bảng, v.v.) thì log rõ ràng để dễ debug
  if (serviceError) {
    console.error('Lỗi khi lấy dịch vụ từ ClinicServices:', serviceError.message);
    throw new AppError(`Lỗi hệ thống khi lấy thông tin dịch vụ: ${serviceError.message}`, 500);
  }

  // Không có bản ghi nào khớp service_id
  if (!service) {
    throw new AppError("Dịch vụ này không tồn tại!", 404);
  }

  // 3. Tính toán tổng tiền và tiền cọc dựa trên giá dịch vụ
  const total_price = service.price;
  // Nếu DB chưa có cột deposit_required thì mặc định = 0
  const deposit_required = service.price * 0.3;
  // 4. Tạo bản ghi Appointment
  const { data: newAppointment, error: createError } = await supabase
    .from('Appointments')
    .insert({
      patient_id,
      doctor_id,
      service_id,
      slot_id: slot_id, // Lưu ý: slot_id ở đây là biến tham số
      status: "pending",
      currentSymptom: current_symptom,
      total_price: total_price,
      deposit_required: deposit_required,
      deposit_paid: 0,
    })
    .select()
    .single();

  if (createError) throw new AppError(`Lỗi Database: ${createError.message}`, 500);

  // 3. Khóa Slot (Update is_booked = true)
  const { error: updateError } = await supabase
    .from('DoctorSlots')
    .update({ is_booked: true })
    .eq('slot_id', slot_id);

  if (updateError) {
    // Nếu khóa thất bại, xóa luôn appointment vừa tạo 
    await supabase.from('Appointments').delete().eq('appointment_id', newAppointment.appointment_id);
    throw new AppError("Lỗi hệ thống khi khóa khung giờ, hãy thử lại nhé", 500);
  }

  return newAppointment;
};

export const rescheduleAppointment = async (appointment_id, new_slot_id, updates) => {
  try {
    const normalizedNewSlotId =
      typeof new_slot_id === "string" ? new_slot_id.trim() : new_slot_id;

    if (!normalizedNewSlotId) {
      throw new AppError("Thiếu new_slot_id (slot_id khung giờ mới)", 400);
    }

    //lấy thông tin
    const { data: appointment, error: fetchError } = await supabase
      .from('Appointments')
      .select('status, slot_id')
      .eq('appointment_id', appointment_id)
      .single();

    if (fetchError || !appointment) throw new AppError('Lịch khám không tồn tại', 404);

    // Kiểm tra slot mới
    const { data: newSlot, error: slotCheckError } = await supabase
      .from('DoctorSlots')
      .select('is_booked')
      .eq('slot_id', normalizedNewSlotId)
      .single();

    if (slotCheckError || !newSlot) {
      // Log rõ để debug trường hợp gửi sai key/kiểu dữ liệu
      console.error("rescheduleAppointment: slotCheckError=", slotCheckError, {
        appointment_id,
        new_slot_id: normalizedNewSlotId,
      });
      throw new AppError('Khung giờ mới không tồn tại', 404);
    }
    if (newSlot.is_booked) throw new AppError('Khung giờ mới đã có người đặt', 400);

    //Đặt giữ slot mới trước (tránh giải phóng slot cũ rồi update Appointment bị fail)
    const { data: bookedRows, error: bookNewSlotError } = await supabase
      .from('DoctorSlots')
      .update({ is_booked: true })
      .eq('slot_id', normalizedNewSlotId)
      .eq('is_booked', false)
      .select('slot_id');

    if (bookNewSlotError) {
      throw new AppError(`Lỗi hệ thống khi giữ khung giờ mới: ${bookNewSlotError.message}`, 500);
    }
    if (!bookedRows || bookedRows.length === 0) {
      throw new AppError('Khung giờ mới đã có người đặt', 400);
    }

    // 4. Reschedule chỉ nên đổi slot (và status). 
    const allowedExtraFields = ['doctor_id'];
    const safeExtraUpdates = {};
    if (updates && typeof updates === 'object') {
      for (const key of allowedExtraFields) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          safeExtraUpdates[key] = updates[key];
        }
      }
    }

    // 5. Cập nhật lịch
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('Appointments')
      .update({
        ...safeExtraUpdates,
        slot_id: normalizedNewSlotId,
        status: 'pending'

      })
      .eq('appointment_id', appointment_id)
      .select()
      .single();

    if (updateError) {
      // Rollback slot mới nếu update Appointment fail
      await supabase
        .from('DoctorSlots')
        .update({ is_booked: false })
        .eq('slot_id', normalizedNewSlotId)

      // Nếu lỗi do gửi field không tồn tại (schema cache), trả về message dễ hiểu hơn
      if (String(updateError.message || '').includes("Could not find the") && String(updateError.message || '').includes("in the schema cache")) {
        throw new AppError(`Dữ liệu gửi lên có field không hợp lệ: ${updateError.message}`, 400);
      }
      throw new AppError(`Lỗi cập nhật lịch: ${updateError.message}`, 500);
    }

    // 6. Giải phóng slot cũ sau khi update Appointment thành công
    if (appointment.slot_id) {
      const { error: freeOldSlotError } = await supabase
        .from('DoctorSlots')
        .update({ is_booked: false })
        .eq('slot_id', appointment.slot_id);

      if (freeOldSlotError) {
        // Không fail toàn bộ, nhưng log để xử lý dữ liệu lệch nếu có
        console.error("rescheduleAppointment: freeOldSlotError=", freeOldSlotError, {
          appointment_id,
          old_slot_id: appointment.slot_id,
          new_slot_id: normalizedNewSlotId,
        });
      }
    }

    return updatedAppointment;

  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw new AppError(`Lỗi code/hệ thống: ${error.message}`, 500);
  }
}

export const cancelAppointment = async (appointment_id) => {
  // Lấy thông tin lịch hiện tại
  const { data: appt, error: fetchError } = await supabase
    .from('Appointments')
    .select('status, slot_id, patient_id')
    .eq('appointment_id', appointment_id)
    .single();

  if (fetchError || !appt) throw new AppError('Không tìm thấy lịch khám', 404);

  if (['cancelled', 'completed'].includes(appt.status)) {
    throw new AppError('Lịch này đã bị hủy hoặc đã hoàn thành', 400);
  }


  const { error: cancelError } = await supabase
    .from('Appointments')
    .update({ status: 'cancelled' })
    .eq('appointment_id', appointment_id);

  if (cancelError) throw new AppError('Lỗi khi hủy lịch', 500);

  // Giải phóng slot trống cho người khác đặt
  if (appt.slot_id) {
    await supabase.from('DoctorSlots').update({ is_booked: false }).eq('slot_id', appt.slot_id);
  }
  return { message: "Hủy lịch thành công, đã giải phóng khung giờ." };
};


export const getListPendingAppointment = async () => {
  const { data: PendingAppointment, error } = await supabase
    .from('Appointments')
    .select(`
    appointment_id,
    status,
    total_price,
    deposit_required,
    deposit_paid,
    created_at,
    Patients!inner ( patient_id, Users!inner(full_name, email, phone_number) ),
    Doctors!inner ( doctor_id, Users!inner(full_name) ),
    ClinicServices!inner ( name ),
    DoctorSlots!inner ( slot_date, start_time, end_time )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(`Lỗi lấy lịch chờ duyệt: ${error.message}`, 500);
  return PendingAppointment;
}

export const approveAppointment = async (appointment_id, deposit_paid, currentUser) => {

  const { data: currentAppt, error } = await supabase
    .from('Appointments')
    .select('deposit_required, status')
    .eq('appointment_id', appointment_id)
    .single()

  if (error || !currentAppt) throw new AppError('Lịch khám không tồn tại', 404);
  if (currentAppt.status !== 'pending') throw new AppError('Lịch này không ở trạng thái chờ duyệt', 400);

  // 3. Tính toán tổng tiền và tiền cọc dựa trên giá dịch vụ
  const total_price = currentAppt.total_price ?? 0;
  // Nếu DB chưa có cột deposit_required thì mặc định = 0
  const deposit_required = currentAppt.deposit_required ?? 0;

  // 2. Logic: Đủ cọc (>= deposit_required) mới chuyển status, nếu thiếu vẫn giữ pending
  const newStatus = deposit_paid >= deposit_required ? 'confirmed' : 'pending';

  // 3. Cập nhật Database
  const { data: updatedAppt, error: updateError } = await supabase
    .from('Appointments')
    .update({
      deposit_paid: deposit_paid,
      status: newStatus
    })
    .eq('appointment_id', appointment_id)
    .select(` 
      appointment_id, status,deposit_required, deposit_paid,
      Patients!inner ( Users!inner(full_name, email) ),
      Doctors!inner ( Users!inner(full_name) ),
      ClinicServices!inner ( name ),
      DoctorSlots!inner ( slot_date, start_time, end_time )
    `)
    .single();

  if (updateError) {
    console.error("Lỗi supabase trả về:", updateError);
    throw new AppError(`Cập nhật thất bại: ${updateError.message}`, 400);
  }

  return updatedAppt;
};

export const updateAppointmentStatus = async (appointment_id, status) => {
  const { data: appointment, error: fetchError } = await supabase
    .from('Appointments')
    .update({ status: status })
    .eq('appointment_id', appointment_id)
    .select()
    .single();

  if (fetchError || !appointment) throw new AppError('Lịch khám không tồn tại', 404);
  return appointment;
}


export const getTodayCheckedInAppointments = async () => {
  // 1. Lấy ngày hôm nay chuẩn YYYY-MM-DD
  const today = new Date();
  const dateString = today.toLocaleDateString('en-CA');

  // 2. Query Supabase
  const { data: checkedInAppointments, error } = await supabase
    .from('Appointments') // Nhớ check xem bảng tên là Appointments hay appointments
    .select(`
      appointment_id,
      status,
      created_at,
      Patients ( patient_id, Users ( full_name, avatar_url ) ),
      Doctors ( doctor_id, Users ( full_name, email ) ),
      ClinicServices ( name, Departments ( department_id, name ) ),
      DoctorSlots!inner ( start_time, end_time, slot_date ) 
    `)
    .in('status', ['checked_in', 'assigned'])
    // Thử comment dòng ngày tháng này lại xem API có chạy được không đã:
    // .eq('DoctorSlots.slot_date', dateString) 
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(`Lỗi lấy danh sách điều phối: ${error.message}`, 500);
  }

  return checkedInAppointments;
};