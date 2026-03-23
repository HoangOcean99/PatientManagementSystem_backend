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
router.get('/', requireRole(['admin', 'lab', 'doctor', 'receptionist']), getAllLabServices);

// Chi tiết 1 Lab Service
router.get('/:labServiceId', requireRole(['admin', 'lab', 'doctor', 'receptionist']), getLabServiceById);

// Tạo Lab Service
router.post('/', requireRole(['admin', 'lab']), createLabService);

// Cập nhật Lab Service
router.put('/:labServiceId', requireRole(['admin', 'lab']), updateLabService);

// Soft delete Lab Service
router.delete('/:labServiceId', requireRole(['admin', 'lab']), deleteLabService);

export default router;
