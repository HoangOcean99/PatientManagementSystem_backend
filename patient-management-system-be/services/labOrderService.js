import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

// ============================================================
// 0. Lấy tất cả Lab Orders (filter + phân trang)
//    JOIN LabServices để lấy tên, giá xét nghiệm
// ============================================================
export const getAllLabOrders = async (query = {}) => {
    const { status, record_id, patient_id, page = 1, limit = 20 } = query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = supabase
        .from('LabOrders')
        .select(`
            *,
            LabServices (
                lab_service_id,
                name,
                description,
                price
            ),
            MedicalRecords (
                record_id,
                Appointments (
                    patient_id,
                    appointment_id,
                    DoctorSlots (slot_date),
                    Doctors (
                        Users (full_name)
                    ),
                    Patients (
                        Users (full_name, phone_number, dob, gender)
                    )
                )
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (status) {
        qb = qb.eq('status', status);
    }

    if (record_id) {
        qb = qb.eq('record_id', record_id);
    }

    if (patient_id) {
        qb = qb.eq('MedicalRecords.Appointments.patient_id', patient_id);
    }

    const { data, error, count } = await qb;

    if (error) throw new AppError(error.message, 500);

    return {
        lab_orders: data,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            total_pages: Math.ceil(count / limit),
        },
    };
};

// ============================================================
// 1. Tạo Lab Orders (BS khám gọi khi bấm "Gửi yêu cầu XN")
// ============================================================
export const createLabOrders = async (recordId, doctorId, labOrders) => {
    const { data: record, error: recordError } = await supabase
        .from('MedicalRecords')
        .select('*, Appointments!appointment_id(status, doctor_id)')
        .eq('record_id', recordId)
        .single();

    if (recordError || !record) {
        throw new AppError('Medical record not found', 404);
    }

    if (record.Appointments.doctor_id !== doctorId) {
        throw new AppError('You do not have permission to add lab orders to this record', 403);
    }

    if (record.Appointments.status !== 'in_progress') {
        throw new AppError(`Cannot add lab orders. Appointment is ${record.Appointments.status}`, 400);
    }

    if (!Array.isArray(labOrders) || labOrders.length === 0) {
        throw new AppError('At least one lab order is required', 400);
    }

    // Validate: mỗi lab order phải có lab_service_id
    const validOrders = labOrders
        .filter(l => l.lab_service_id && l.lab_service_id.trim())
        .map(l => ({
            record_id: recordId,
            lab_service_id: l.lab_service_id.trim(),
            status: 'ordered'
        }));

    if (validOrders.length === 0) {
        throw new AppError('All lab orders must have a lab_service_id', 400);
    }

    // Kiểm tra tất cả lab_service_id có tồn tại và active không
    const serviceIds = validOrders.map(o => o.lab_service_id);
    const { data: services, error: serviceError } = await supabase
        .from('LabServices')
        .select('lab_service_id')
        .in('lab_service_id', serviceIds)
        .eq('is_active', true);

    if (serviceError) throw new AppError(serviceError.message, 500);

    if (!services || services.length !== serviceIds.length) {
        const foundIds = services ? services.map(s => s.lab_service_id) : [];
        const missingIds = serviceIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Lab services not found or inactive: ${missingIds.join(', ')}`, 400);
    }

    const { data: newOrders, error: insertError } = await supabase
        .from('LabOrders')
        .insert(validOrders)
        .select(`
            *,
            LabServices (
                lab_service_id,
                name,
                description,
                price
            )
        `);

    if (insertError) throw new AppError(insertError.message, 500);

    return newOrders;
};

// ============================================================
// 2. Chi tiết 1 lab order (BS xét nghiệm xem + cập nhật)
//    JOIN LabServices để lấy thông tin dịch vụ xét nghiệm
// ============================================================
export const getLabOrderById = async (labOrderId) => {
    const { data, error } = await supabase
        .from('LabOrders')
        .select(`
            *,
            LabServices (
                lab_service_id,
                name,
                description,
                price
            ),
            MedicalRecords (
                record_id,
                symptoms,
                diagnosis,
                Appointments (
                    patient_id,
                    doctor_id,
                    appointment_id,
                    status,
                    DoctorSlots (slot_date, start_time),
                    Doctors (
                        Users (full_name)
                    ),
                    Patients (
                        patient_id,
                        allergies,
                        Users (full_name, phone_number, dob, gender)
                    )
                )
            )
        `)
        .eq('lab_order_id', labOrderId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new AppError('Lab order not found', 404);
        }
        throw new AppError(error.message, 500);
    }

    return data;
};

// ============================================================
// 3. Cập nhật lab order (BS xét nghiệm cập nhật kết quả)
//    - Cho phép update: status, result_summary, result_file_url
// ============================================================
export const updateLabOrder = async (labOrderId, updateData) => {
    // Chỉ cho phép update các field hợp lệ
    const allowedFields = ['status', 'result_summary', 'result_file_url'];
    const sanitized = {};
    for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
            sanitized[key] = updateData[key];
        }
    }

    if (Object.keys(sanitized).length === 0) {
        throw new AppError('No valid fields to update. Allowed: status, result_summary, result_file_url', 400);
    }

    // Validate status transition: ordered → processing → completed
    if (sanitized.status) {
        const validStatuses = ['ordered', 'processing', 'completed'];
        if (!validStatuses.includes(sanitized.status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        // Check current status for valid transition
        const { data: current, error: fetchError } = await supabase
            .from('LabOrders')
            .select('status')
            .eq('lab_order_id', labOrderId)
            .single();

        if (fetchError || !current) {
            throw new AppError('Lab order not found', 404);
        }

        const transitionMap = {
            ordered: ['processing'],
            processing: ['completed'],
            completed: [],
        };

        const allowed = transitionMap[current.status] || [];
        if (!allowed.includes(sanitized.status)) {
            throw new AppError(
                `Cannot transition from '${current.status}' to '${sanitized.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
                400
            );
        }
    }

    const { data, error } = await supabase
        .from('LabOrders')
        .update(sanitized)
        .eq('lab_order_id', labOrderId)
        .select(`
            *,
            LabServices (
                lab_service_id,
                name,
                description,
                price
            )
        `)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new AppError('Lab order not found', 404);
        }
        throw new AppError(error.message, 500);
    }

    return data;
};
