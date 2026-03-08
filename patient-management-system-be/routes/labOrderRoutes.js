import express from 'express';
import {
    getAllLabOrders,
    createLabOrders,
    getLabOrderById,
    updateLabOrder
} from '../controllers/labOrderController.js';

const router = express.Router();

// 0. Lấy tất cả xét nghiệm (filter + phân trang)
router.get('/', getAllLabOrders);

// 1. BS khám — tạo yêu cầu xét nghiệm
router.post('/', createLabOrders);

// 2. BS xét nghiệm — chi tiết + cập nhật 1 xét nghiệm
router.get('/:labOrderId', getLabOrderById);
router.patch('/:labOrderId', updateLabOrder);

export default router;
