import express from 'express';
import {
    createLabOrders,
    getTodayLabOrders,
    getLabOrderById,
    updateLabOrder
} from '../controllers/labOrderController.js';

const router = express.Router();

// 1. BS khám — tạo yêu cầu xét nghiệm
router.post('/', createLabOrders);

// 2. BS xét nghiệm — danh sách cuộc hẹn có XN hôm nay
router.get('/today', getTodayLabOrders);

// 3. BS xét nghiệm — chi tiết + cập nhật 1 xét nghiệm
router.get('/:labOrderId', getLabOrderById);
router.patch('/:labOrderId', updateLabOrder);

export default router;
