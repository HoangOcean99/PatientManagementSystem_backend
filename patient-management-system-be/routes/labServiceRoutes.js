import express from 'express';
import {
    getAllLabServices,
    getLabServiceById,
    createLabService,
    updateLabService,
    deleteLabService
} from '../controllers/labServiceController.js';
import { requireRole } from '../middlewares/auth.js';

const router = express.Router();

// Lấy tất cả Lab Services (filter + phân trang)
router.get('/', getAllLabServices);

// Chi tiết 1 Lab Service
router.get('/:labServiceId', getLabServiceById);

// Tạo Lab Service
router.post('/', requireRole(['admin']), createLabService);

// Cập nhật Lab Service
router.put('/:labServiceId', requireRole(['admin']), updateLabService);

// Soft delete Lab Service
router.delete('/:labServiceId', requireRole(['admin']), deleteLabService);

export default router;
