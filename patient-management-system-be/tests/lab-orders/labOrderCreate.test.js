import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLabOrders } from '../../controllers/labOrderController.js';
import * as labOrderService from '../../services/labOrderService.js';
import { AppError } from '../../utils/app-error.js';

vi.mock('../../services/labOrderService.js', () => ({
    createLabOrders: vi.fn()
}));

const mockCreatedOrders = [
    { lab_order_id: 1, record_id: 10, test_name: 'Xét nghiệm máu', status: 'ordered' },
    { lab_order_id: 2, record_id: 10, test_name: 'Xét nghiệm nước tiểu', status: 'ordered' }
];

describe('Lab Order Controller - createLabOrders() (8 Cases)', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    // UTCID01: Happy Path - Tạo thành công -> 201
    it('UTCID01 - Tạo lab orders thành công với dữ liệu hợp lệ (Status 201)', async () => {
        mockReq.body = {
            record_id: 10,
            doctor_id: 1,
            lab_orders: [
                { test_name: 'Xét nghiệm máu' },
                { test_name: 'Xét nghiệm nước tiểu' }
            ]
        };
        labOrderService.createLabOrders.mockResolvedValue(mockCreatedOrders);

        await createLabOrders(mockReq, mockRes, mockNext);

        expect(labOrderService.createLabOrders).toHaveBeenCalledWith(10, 1, mockReq.body.lab_orders);
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Lab orders created successfully',
            data: mockCreatedOrders
        });
    });

    // UTCID02: Missing record_id -> 400
    it('UTCID02 - Thất bại do thiếu record_id (Error 400)', async () => {
        mockReq.body = { doctor_id: 1, lab_orders: [{ test_name: 'XN máu' }] };

        await createLabOrders(mockReq, mockRes, mockNext);

        expect(labOrderService.createLabOrders).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Record ID is required');
    });

    // UTCID03: Missing doctor_id -> 400
    it('UTCID03 - Thất bại do thiếu doctor_id (Error 400)', async () => {
        mockReq.body = { record_id: 10, lab_orders: [{ test_name: 'XN máu' }] };

        await createLabOrders(mockReq, mockRes, mockNext);

        expect(labOrderService.createLabOrders).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Doctor ID is required for authorization');
    });

    // UTCID04: lab_orders empty array / not array -> 400
    it('UTCID04 - Thất bại do lab_orders rỗng hoặc không phải Array (Error 400)', async () => {
        mockReq.body = { record_id: 10, doctor_id: 1, lab_orders: [] };

        await createLabOrders(mockReq, mockRes, mockNext);

        expect(labOrderService.createLabOrders).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('lab_orders array is required and must not be empty');
    });

    // UTCID05: Record not found -> 404
    it('UTCID05 - Thất bại do record_id không tồn tại trong DB (Error 404)', async () => {
        mockReq.body = { record_id: 9999, doctor_id: 1, lab_orders: [{ test_name: 'XN máu' }] };
        const mockError = new AppError('Medical record not found', 404);
        labOrderService.createLabOrders.mockRejectedValue(mockError);

        createLabOrders(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID06: Doctor has no permission -> 403
    it('UTCID06 - Thất bại do bác sĩ không có quyền tạo lab order cho record này (Error 403)', async () => {
        mockReq.body = { record_id: 10, doctor_id: 999, lab_orders: [{ test_name: 'XN máu' }] };
        const mockError = new AppError('You do not have permission to add lab orders to this record', 403);
        labOrderService.createLabOrders.mockRejectedValue(mockError);

        createLabOrders(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID07: Appointment status != in_progress -> 400
    it('UTCID07 - Thất bại do Appointment không ở trạng thái in_progress (Error 400)', async () => {
        mockReq.body = { record_id: 10, doctor_id: 1, lab_orders: [{ test_name: 'XN máu' }] };
        const mockError = new AppError('Cannot add lab orders. Appointment is completed', 400);
        labOrderService.createLabOrders.mockRejectedValue(mockError);

        createLabOrders(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID08: DB Exception -> 500
    it('UTCID08 - Thất bại do lỗi Supabase / Exception hệ thống (Error 500)', async () => {
        mockReq.body = { record_id: 10, doctor_id: 1, lab_orders: [{ test_name: 'XN máu' }] };
        const mockError = new AppError('Supabase insert failed', 500);
        labOrderService.createLabOrders.mockRejectedValue(mockError);

        createLabOrders(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });
});
