import { supabase } from '../supabaseClient.js';
import { AppError } from '../utils/app-error.js';

// ============================================================
// 1. Lấy tất cả Lab Services (filter + phân trang)
// ============================================================
export const getAllLabServices = async (query = {}) => {
    const { is_active, page = 1, limit = 20, search } = query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = supabase
        .from('LabServices')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

    if (is_active !== undefined) {
        qb = qb.eq('is_active', is_active);
    }

    if (search) {
        qb = qb.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await qb;

    if (error) throw new AppError(error.message, 500);

    return {
        lab_services: data,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            total_pages: Math.ceil(count / limit),
        },
    };
};

// ============================================================
// 2. Lấy chi tiết 1 Lab Service
// ============================================================
export const getLabServiceById = async (labServiceId) => {
    const { data, error } = await supabase
        .from('LabServices')
        .select('*')
        .eq('lab_service_id', labServiceId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new AppError('Lab service not found', 404);
        }
        throw new AppError(error.message, 500);
    }

    return data;
};

// ============================================================
// 3. Tạo Lab Service
// ============================================================
export const createLabService = async (payload) => {
    const { name, description, price, is_active } = payload;

    if (!name || !name.trim()) {
        throw new AppError('Lab service name is required', 400);
    }

    if (price === undefined || price === null || price < 0) {
        throw new AppError('A valid price is required', 400);
    }

    const insertData = {
        name: name.trim(),
        description: description || null,
        price: Number(price),
    };

    if (is_active !== undefined) {
        insertData.is_active = is_active;
    }

    const { data, error } = await supabase
        .from('LabServices')
        .insert([insertData])
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);

    return data;
};

// ============================================================
// 4. Cập nhật Lab Service
// ============================================================
export const updateLabService = async (labServiceId, updateData) => {
    const allowedFields = ['name', 'description', 'price', 'is_active'];
    const sanitized = {};

    for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
            sanitized[key] = updateData[key];
        }
    }

    if (Object.keys(sanitized).length === 0) {
        throw new AppError('No valid fields to update. Allowed: name, description, price, is_active', 400);
    }

    if (sanitized.name !== undefined && (!sanitized.name || !sanitized.name.trim())) {
        throw new AppError('Lab service name cannot be empty', 400);
    }

    if (sanitized.price !== undefined && sanitized.price < 0) {
        throw new AppError('Price must be a positive number', 400);
    }

    const { data, error } = await supabase
        .from('LabServices')
        .update(sanitized)
        .eq('lab_service_id', labServiceId)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new AppError('Lab service not found', 404);
        }
        throw new AppError(error.message, 500);
    }

    return data;
};

// ============================================================
// 5. Xóa Lab Service (soft delete — set is_active = false)
// ============================================================
export const deleteLabService = async (labServiceId) => {
    const { data, error } = await supabase
        .from('LabServices')
        .update({ is_active: false })
        .eq('lab_service_id', labServiceId)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new AppError('Lab service not found', 404);
        }
        throw new AppError(error.message, 500);
    }

    return data;
};
