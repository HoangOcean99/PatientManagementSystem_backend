import * as labServiceService from '../services/labServiceService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

// GET /lab-services — Lấy tất cả Lab Services
export const getAllLabServices = asyncHandler(async (req, res) => {
    const { is_active, page, limit, search } = req.query;

    const result = await labServiceService.getAllLabServices({
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
    });

    res.status(200).json({
        status: 'success',
        results: result.lab_services.length,
        pagination: result.pagination,
        data: result.lab_services,
    });
});

// GET /lab-services/:labServiceId — Chi tiết 1 Lab Service
export const getLabServiceById = asyncHandler(async (req, res) => {
    const { labServiceId } = req.params;

    const data = await labServiceService.getLabServiceById(labServiceId);

    res.status(200).json({
        status: 'success',
        data,
    });
});

// POST /lab-services — Tạo Lab Service
export const createLabService = asyncHandler(async (req, res) => {
    const data = await labServiceService.createLabService(req.body);

    res.status(201).json({
        status: 'success',
        message: 'Lab service created successfully',
        data,
    });
});

// PUT /lab-services/:labServiceId — Cập nhật Lab Service
export const updateLabService = asyncHandler(async (req, res) => {
    const { labServiceId } = req.params;

    const data = await labServiceService.updateLabService(labServiceId, req.body);

    res.status(200).json({
        status: 'success',
        message: 'Lab service updated successfully',
        data,
    });
});

// DELETE /lab-services/:labServiceId — Xóa Lab Service (soft delete)
export const deleteLabService = asyncHandler(async (req, res) => {
    const { labServiceId } = req.params;

    const data = await labServiceService.deleteLabService(labServiceId);

    res.status(200).json({
        status: 'success',
        message: 'Lab service deactivated successfully',
        data,
    });
});
