import express from 'express';
import {
    getAllLabServices,
    getLabServiceById,
    createLabService,
    updateLabService,
    deleteLabService
} from '../controllers/labServiceController.js';

const router = express.Router();

// Lấy tất cả Lab Services (filter + phân trang)
router.get('/', getAllLabServices);

// Chi tiết 1 Lab Service
router.get('/:labServiceId', getLabServiceById);

// Tạo Lab Service
router.post('/', createLabService);

// Cập nhật Lab Service
router.put('/:labServiceId', updateLabService);

// Soft delete Lab Service
router.delete('/:labServiceId', deleteLabService);

export default router;
