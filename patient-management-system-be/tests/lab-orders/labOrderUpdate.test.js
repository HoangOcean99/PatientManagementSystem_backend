import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateLabOrder } from '../../controllers/labOrderController.js';
import * as labOrderService from '../../services/labOrderService.js';
import { AppError } from '../../utils/app-error.js';

vi.mock('../../services/labOrderService.js', () => ({
    updateLabOrder: vi.fn()
}));

const mockUpdatedOrder = {
    lab_order_id: 1,
    record_id: 10,
    test_name: 'Xét nghiệm máu',
    status: 'processing',
    result_summary: null,
    result_file_url: null
};

describe('Lab Order Controller - updateLabOrder() (8 Cases)', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = { params: { labOrderId: 1 }, body: {} };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    // UTCID01: Happy Path - status ordered -> processing -> 200
    it('UTCID01 - Cập nhật thành công status ordered → processing (Status 200)', async () => {
        mockReq.body = { status: 'processing' };
        labOrderService.updateLabOrder.mockResolvedValue(mockUpdatedOrder);

        await updateLabOrder(mockReq, mockRes, mockNext);

        expect(labOrderService.updateLabOrder).toHaveBeenCalledWith(1, { status: 'processing' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Lab order updated successfully',
            data: mockUpdatedOrder
        });
    });

    // UTCID02: Happy Path - Chỉ update result_summary (no status change) -> 200
    it('UTCID02 - Cập nhật thành công chỉ result_summary không đổi status (Status 200)', async () => {
        mockReq.body = { result_summary: 'Kết quả bình thường' };
        labOrderService.updateLabOrder.mockResolvedValue({
            ...mockUpdatedOrder,
            result_summary: 'Kết quả bình thường'
        });

        await updateLabOrder(mockReq, mockRes, mockNext);

        expect(labOrderService.updateLabOrder).toHaveBeenCalledWith(1, { result_summary: 'Kết quả bình thường' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID03: Invalid status transition ordered -> completed -> 400
    it('UTCID03 - Thất bại do chuyển trạng thái sai ordered → completed (Error 400)', async () => {
        mockReq.body = { status: 'completed' };
        const mockError = new AppError("Cannot transition from 'ordered' to 'completed'. Allowed: processing", 400);
        labOrderService.updateLabOrder.mockRejectedValue(mockError);

        updateLabOrder(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID04: No valid fields (e.g. test_name, record_id) -> 400
    it('UTCID04 - Thất bại do gửi field không hợp lệ (test_name, record_id) (Error 400)', async () => {
        mockReq.body = { test_name: 'Hack', record_id: 999 };
        const mockError = new AppError('No valid fields to update. Allowed: status, result_summary, result_file_url', 400);
        labOrderService.updateLabOrder.mockRejectedValue(mockError);

        updateLabOrder(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID05: Invalid status enum value -> 400
    it('UTCID05 - Thất bại do status ngoài enum cho phép (Error 400)', async () => {
        mockReq.body = { status: 'cancelled' };
        const mockError = new AppError('Invalid status. Must be one of: ordered, processing, completed', 400);
        labOrderService.updateLabOrder.mockRejectedValue(mockError);

        updateLabOrder(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID06: Lab order not found -> 404
    it('UTCID06 - Thất bại do labOrderId không tồn tại trong DB (Error 404)', async () => {
        mockReq.params.labOrderId = 9999;
        mockReq.body = { status: 'processing' };
        const mockError = new AppError('Lab order not found', 404);
        labOrderService.updateLabOrder.mockRejectedValue(mockError);

        updateLabOrder(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID07: Missing labOrderId param -> 400
    it('UTCID07 - Thất bại do bỏ trống param labOrderId (Error 400)', async () => {
        mockReq.params.labOrderId = undefined;

        await updateLabOrder(mockReq, mockRes, mockNext);

        expect(labOrderService.updateLabOrder).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Lab order ID is required');
    });

    // UTCID08: DB Exception -> 500
    it('UTCID08 - Thất bại do lỗi Supabase / Exception hệ thống (Error 500)', async () => {
        mockReq.body = { status: 'processing' };
        const mockError = new AppError('Supabase update failed', 500);
        labOrderService.updateLabOrder.mockRejectedValue(mockError);

        updateLabOrder(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });
});
