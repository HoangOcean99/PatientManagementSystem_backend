import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import * as patientService from "./patientService.js";
import * as doctorService from "./doctorService.js";
import * as gmailService from "./gmailService.js";

// ============================================================
// HELPER: Smart Sync cho Prescriptions
// - Có prescription_id → UPDATE
// - Không có prescription_id → INSERT mới
// - Có trong DB nhưng không có trong danh sách gửi lên → DELETE
// ============================================================
const syncPrescriptions = async (recordId, prescriptions) => {
    // Lấy danh sách đơn thuốc hiện tại trong DB
    const { data: existingItems, error: fetchError } = await supabase
        .from('Prescriptions')
        .select('prescription_id')
        .eq('record_id', recordId);

    if (fetchError) throw new AppError(fetchError.message, 500);

    const existingIds = existingItems.map(item => item.prescription_id);
    const sentIds = prescriptions
        .filter(p => p.prescription_id)
        .map(p => p.prescription_id);

    // 1. Xác định các item cần XOÁ (có trong DB nhưng không được gửi lên)
    const idsToDelete = existingIds.filter(id => !sentIds.includes(id));

    // 2. Phân loại: INSERT (không có id) vs UPDATE (có id)
    const toInsert = prescriptions
        .filter(p => !p.prescription_id)
        .map(p => ({ ...p, record_id: recordId }));

    const toUpdate = prescriptions.filter(p => p.prescription_id);

    const promises = [];

    // Xoá
    if (idsToDelete.length > 0) {
        promises.push(
            supabase.from('Prescriptions')
                .delete()
                .in('prescription_id', idsToDelete)
        );
    }

    // Thêm mới
    if (toInsert.length > 0) {
        promises.push(
            supabase.from('Prescriptions')
                .insert(toInsert)
                .select()
        );
    }

    // Cập nhật từng item
    for (const item of toUpdate) {
        const { prescription_id, ...fields } = item;
        promises.push(
            supabase.from('Prescriptions')
                .update(fields)
                .eq('prescription_id', prescription_id)
        );
    }

    const results = await Promise.all(promises);
    for (const res of results) {
        if (res.error) throw new AppError(res.error.message, 500);
    }
};

// ============================================================
// HELPER: Smart Sync cho LabOrders
// ============================================================
const syncLabOrders = async (recordId, labOrders) => {
    const { data: existingItems, error: fetchError } = await supabase
        .from('LabOrders')
        .select('lab_order_id')
        .eq('record_id', recordId);

    if (fetchError) throw new AppError(fetchError.message, 500);

    const existingIds = existingItems.map(item => item.lab_order_id);
    const sentIds = labOrders
        .filter(l => l.lab_order_id)
        .map(l => l.lab_order_id);

    const idsToDelete = existingIds.filter(id => !sentIds.includes(id));

    const toInsert = labOrders
        .filter(l => !l.lab_order_id)
        .map(l => ({ ...l, record_id: recordId }));

    const toUpdate = labOrders.filter(l => l.lab_order_id);

    const promises = [];

    if (idsToDelete.length > 0) {
        promises.push(
            supabase.from('LabOrders')
                .delete()
                .in('lab_order_id', idsToDelete)
        );
    }

    if (toInsert.length > 0) {
        promises.push(
            supabase.from('LabOrders')
                .insert(toInsert)
                .select()
        );
    }

    for (const item of toUpdate) {
        const { lab_order_id, ...fields } = item;
        promises.push(
            supabase.from('LabOrders')
                .update(fields)
                .eq('lab_order_id', lab_order_id)
        );
    }

    const results = await Promise.all(promises);
    for (const res of results) {
        if (res.error) throw new AppError(res.error.message, 500);
    }
};

// ============================================================
// 1. Gọi khi Bác sĩ ấn "Bắt đầu khám"
// ============================================================
export const startExamination = async (appointmentId, doctorId) => {
    const { data: appointment, error: apptError } = await supabase
        .from('Appointments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

    if (apptError || !appointment) {
        throw new AppError('Appointment not found', 404);
    }

    if (appointment.doctor_id !== doctorId) {
        throw new AppError('You are not assigned to this appointment', 403);
    }

    if (appointment.status !== 'assigned') {
        throw new AppError(`Cannot start examination. Current status is ${appointment.status}, expected 'assigned'`, 400);
    }

    // Kiểm tra đã có MedicalRecord cho appointment này chưa
    const { data: existingRecord } = await supabase
        .from('MedicalRecords')
        .select('record_id')
        .eq('appointment_id', appointmentId)
        .single();

    if (existingRecord) {
        throw new AppError('A medical record already exists for this appointment', 409);
    }

    const { error: updateApptError } = await supabase
        .from('Appointments')
        .update({ status: 'in_progress' })
        .eq('appointment_id', appointmentId);

    if (updateApptError) throw new AppError(updateApptError.message, 500);

    const { data: newRecord, error: recordError } = await supabase
        .from('MedicalRecords')
        .insert([{
            appointment_id: appointmentId,
            diagnosis: ''
        }])
        .select()
        .single();

    if (recordError) throw new AppError(recordError.message, 500);

    return newRecord;
};

// ============================================================
// 2. Lấy chi tiết Medical Record (kèm Prescriptions + LabOrders)
// ============================================================
export const getMedicalRecordById = async (recordId) => {
    const { data, error } = await supabase
        .from('MedicalRecords')
        .select(`
            *,
            Appointments (
                status,
                DoctorSlots (slot_date, start_time),
                Doctors (
                    specialization,
                    Users (full_name)
                ),
                Patients (
                    Users (full_name, phone_number)
                )
            ),
            Prescriptions (*),
            LabOrders (
                *,
                LabServices (
                    lab_service_id,
                    name,
                    description,
                    price
                )
            )
        `)
        .eq('record_id', recordId)
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};

export const getMedicalRecordByAppointment = async (appointmentId) => {
    const { data, error } = await supabase
        .from('MedicalRecords')
        .select(`
            *,
            Prescriptions (*),
            LabOrders (
                *,
                LabServices (
                    lab_service_id,
                    name,
                    description,
                    price
                )
            )
        `)
        .eq('appointment_id', appointmentId)
        .single();

    if (error && error.code !== 'PGRST116') throw new AppError(error.message, 500);
    return data;
};

export const getMedicalRecordsByPatient = async (patientId) => {
    const { data, error } = await supabase
        .from('MedicalRecords')
        .select(`
            *,
            Appointments!inner (
                patient_id,
                status,
                DoctorSlots (slot_date, start_time),
                Doctors (
                    Users (full_name)
                ),
                Patients (
                    *,
                    Users (*)
                )
            ),
            Prescriptions (*),
            LabOrders (
                *,
                LabServices (
                    lab_service_id,
                    name,
                    description,
                    price
                )
            )
        `)
        .eq('Appointments.patient_id', patientId)
        .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
};

// ============================================================
// 3. Cập nhật Medical Record + Sync Prescriptions & LabOrders
// ============================================================
export const updateMedicalRecord = async (recordId, updateData, doctorId) => {
    // Kiểm tra Record và Appointment đi kèm
    const { data: record, error: recordError } = await supabase
        .from('MedicalRecords')
        .select('*, Appointments!appointment_id(status, doctor_id)')
        .eq('record_id', recordId)
        .single();

    if (recordError || !record) {
        throw new AppError('Medical record not found', 404);
    }

    // Kiểm tra quyền: lấy doctor_id từ Appointments
    if (record.Appointments.doctor_id !== doctorId) {
        throw new AppError('You do not have permission to edit this record', 403);
    }

    if (record.Appointments.status !== 'in_progress') {
        throw new AppError(`Cannot modify record. Appointment is ${record.Appointments.status}`, 400);
    }

    // Tách prescriptions ra khỏi dữ liệu chính
    // Lab orders KHÔNG được sync ở đây — dùng endpoint riêng POST /lab-orders
    const { prescriptions, lab_orders, ...recordFields } = updateData;

    // Update các trường chính của MedicalRecord (symptoms, diagnosis, doctor_notes)
    if (Object.keys(recordFields).length > 0) {
        const { error } = await supabase
            .from('MedicalRecords')
            .update(recordFields)
            .eq('record_id', recordId);

        if (error) throw new AppError(error.message, 500);
    }

    // Sync đơn thuốc nếu được gửi lên
    if (prescriptions !== undefined) {
        await syncPrescriptions(recordId, prescriptions);
    }

    // Trả về dữ liệu mới nhất kèm child data
    return await getMedicalRecordById(recordId);
};

// ============================================================
// 4. Hoàn thành khám
// ============================================================
export const completeExamination = async (recordId, doctorId) => {
    const { data: record, error: recordError } = await supabase
        .from('MedicalRecords')
        .select('*, Appointments!appointment_id(status, doctor_id)')
        .eq('record_id', recordId)
        .single();

    if (recordError || !record) {
        throw new AppError('Medical record not found', 404);
    }

    // Kiểm tra quyền: lấy doctor_id từ Appointments
    if (record.Appointments.doctor_id !== doctorId) {
        throw new AppError('You do not have permission to complete this examination', 403);
    }

    if (record.Appointments.status !== 'in_progress') {
        throw new AppError(`Cannot complete examination. Appointment is ${record.Appointments.status}`, 400);
    }

    if (!record.diagnosis || record.diagnosis.trim() === '') {
        throw new AppError('Diagnosis is required to complete the examination', 400);
    }

    const { error: updateApptError } = await supabase
        .from('Appointments')
        .update({ status: 'completed' })
        .eq('appointment_id', record.appointment_id);

    if (updateApptError) throw new AppError(updateApptError.message, 500);

    return { message: 'Examination completed successfully' };
};

// ============================================================
// 5. Gửi email nhắc nhở tái khám
// ============================================================
export const sendFollowUpReminder = async (patientId, doctorId, followUpDate) => {
    // Lấy thông tin bệnh nhân từ patientService
    const patient = await patientService.getPatientById(patientId);
    const email = patient.Users?.email;
    const patientName = patient.Users?.full_name;

    if (!email) {
        throw new AppError('Patient does not have an email address', 400);
    }

    // Lấy thông tin bác sĩ + khoa từ doctorService
    const doctor = await doctorService.getDoctorById(doctorId);
    const doctorName = doctor.Users?.full_name;
    const departmentName = doctor.Departments?.name;

    // Gửi email qua gmailService
    await gmailService.sendFollowUpReminder({
        email,
        patientName,
        doctorName,
        departmentName,
        followUpDate,
    });

    return { message: 'Follow-up reminder email sent successfully' };
};
