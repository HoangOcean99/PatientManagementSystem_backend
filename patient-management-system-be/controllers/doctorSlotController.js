import * as doctorSlotService from '../services/doctorSlotService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

/**
 * GET /doctor-slots/list
 * Lấy danh sách slots (filter: doctor_id, slot_date, is_booked, date_from, date_to)
 */
export const getAllSlots = asyncHandler(async (req, res, next) => {
    const { doctor_id, slot_date, is_booked, date_from, date_to } = req.query;

    const filters = {};
    if (doctor_id) filters.doctor_id = doctor_id;
    if (slot_date) filters.slot_date = slot_date;
    if (is_booked !== undefined) filters.is_booked = is_booked === 'true';
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const slots = await doctorSlotService.getAllSlots(filters);

    res.status(200).json({
        status: 'success',
        results: slots.length,
        data: slots
    });
});

/**
 * GET /doctor-slots/detail/:slotId
 * Lấy chi tiết 1 slot theo ID
 */
export const getSlotById = asyncHandler(async (req, res, next) => {
    const { slotId } = req.params;

    if (!slotId) {
        return next(new AppError('Slot ID is required', 400));
    }

    const slot = await doctorSlotService.getSlotById(slotId);

    if (!slot) {
        return next(new AppError('Slot not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: slot
    });
});

/**
 * POST /doctor-slots/create
 * Tạo 1 slot mới (Admin only)
 * Body: { doctor_id, slot_date, start_time, end_time }
 */
export const createSlot = asyncHandler(async (req, res, next) => {
    const slotData = req.body;

    const slot = await doctorSlotService.createSlot(slotData);

    res.status(201).json({
        status: 'success',
        message: 'Slot created successfully',
        data: slot
    });
});

/**
 * POST /doctor-slots/create-bulk
 * Tạo nhiều slots cùng lúc (Admin only)
 * Body: { doctor_id, slot_date, slots: [{ start_time, end_time }, ...] }
 */
export const createBulkSlots = asyncHandler(async (req, res, next) => {
    const slotsData = req.body;

    const slots = await doctorSlotService.createBulkSlots(slotsData);

    res.status(201).json({
        status: 'success',
        message: `${slots.length} slot(s) created successfully`,
        data: slots
    });
});

/**
 * PATCH /doctor-slots/update/:slotId
 * Cập nhật 1 slot (Admin only)
 * Body: { slot_date?, start_time?, end_time? }
 */
export const updateSlot = asyncHandler(async (req, res, next) => {
    const { slotId } = req.params;
    const updateData = req.body;

    if (!slotId) {
        return next(new AppError('Slot ID is required', 400));
    }

    const slot = await doctorSlotService.updateSlot(slotId, updateData);

    res.status(200).json({
        status: 'success',
        message: 'Slot updated successfully',
        data: slot
    });
});

/**
 * DELETE /doctor-slots/delete/:slotId
 * Xóa 1 slot (Admin only)
 */
export const deleteSlot = asyncHandler(async (req, res, next) => {
    const { slotId } = req.params;

    if (!slotId) {
        return next(new AppError('Slot ID is required', 400));
    }

    await doctorSlotService.deleteSlot(slotId);

    res.status(200).json({
        status: 'success',
        message: 'Slot deleted successfully'
    });
});

/**
 * POST /doctor-slots/delete-bulk
 * Xóa nhiều slots cùng lúc (Admin only)
 * Body: { slot_ids: [uuid, uuid, ...] }
 */
export const deleteBulkSlots = asyncHandler(async (req, res, next) => {
    const { slot_ids } = req.body;

    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
        return next(new AppError('slot_ids must be a non-empty array', 400));
    }

    await doctorSlotService.deleteBulkSlots(slot_ids);

    res.status(200).json({
        status: 'success',
        message: `${slot_ids.length} slot(s) deleted successfully`
    });
});
