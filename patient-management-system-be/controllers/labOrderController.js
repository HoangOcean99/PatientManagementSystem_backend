import * as labOrderService from '../services/labOrderService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

// GET /lab-orders — Lấy tất cả xét nghiệm (có filter + phân trang)
export const getAllLabOrders = asyncHandler(async (req, res) => {
    const { status, record_id, patient_id, page, limit } = req.query;

    const result = await labOrderService.getAllLabOrders({
        status,
        record_id,
        patient_id,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
        status: 'success',
        results: result.lab_orders.length,
        pagination: result.pagination,
        data: result.lab_orders,
    });
});

// POST /lab-orders — BS khám tạo yêu cầu xét nghiệm
export const createLabOrders = asyncHandler(async (req, res, next) => {
    const { record_id, doctor_id, lab_orders } = req.body;

    if (!record_id) {
        return next(new AppError('Record ID is required', 400));
    }

    if (!doctor_id) {
        return next(new AppError('Doctor ID is required for authorization', 400));
    }

    if (!Array.isArray(lab_orders) || lab_orders.length === 0) {
        return next(new AppError('lab_orders array is required and must not be empty', 400));
    }

    const newOrders = await labOrderService.createLabOrders(record_id, doctor_id, lab_orders);

    res.status(201).json({
        status: 'success',
        message: 'Lab orders created successfully',
        data: newOrders
    });
});

// GET /lab-orders/today — BS xét nghiệm xem danh sách hôm nay
export const getTodayLabOrders = asyncHandler(async (req, res) => {
    const { date } = req.query; // optional: override ngày (cho testing)

    const data = await labOrderService.getTodayLabOrders(date);

    res.status(200).json({
        status: 'success',
        results: data.length,
        data
    });
});

// GET /lab-orders/:labOrderId — Chi tiết 1 xét nghiệm
export const getLabOrderById = asyncHandler(async (req, res) => {
    const { labOrderId } = req.params;

    const data = await labOrderService.getLabOrderById(labOrderId);

    res.status(200).json({
        status: 'success',
        data
    });
});

// PATCH /lab-orders/:labOrderId — BS xét nghiệm cập nhật kết quả
export const updateLabOrder = asyncHandler(async (req, res, next) => {
    const { labOrderId } = req.params;
    const updateData = req.body;

    if (!labOrderId) {
        return next(new AppError('Lab order ID is required', 400));
    }

    const data = await labOrderService.updateLabOrder(labOrderId, updateData);

    res.status(200).json({
        status: 'success',
        message: 'Lab order updated successfully',
        data
    });
});
