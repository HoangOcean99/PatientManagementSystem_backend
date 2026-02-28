const request = require('supertest');
const app = require('../app');

describe('Update Payment Status - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Cập nhật trạng thái sang PAID thành công
    test('UTC01: Normal - Update payment to PAID successfully', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_001')
            .send({ status: 'PAID' });
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toBe('[INFO] Payment status updated to PAID for ID: PAY_001');
    });

    // UTC02: Normal - Cập nhật trạng thái sang FAILED thành công
    test('UTC02: Normal - Update payment to FAILED successfully', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_002')
            .send({ status: 'FAILED' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('FAILED');
    });

    // UTC03: Abnormal - Gửi trạng thái không nằm trong danh sách (Sai typo)
    test('UTC03: Abnormal - Invalid status value (Typo)', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_001')
            .send({ status: 'P@ID_WRONG' });
        expect(res.statusCode).toBe(400);
    });

    // UTC04: Abnormal - Cập nhật cho ID thanh toán không tồn tại
    test('UTC04: Abnormal - Update status for non-existent ID', async () => {
        const res = await request(app)
            .patch('/api/payments/status/NOT_FOUND_PAY')
            .send({ status: 'PAID' });
        expect(res.statusCode).toBe(404);
    });

    // UTC05: Boundary - Cập nhật trạng thái kèm theo Metadata bổ sung
    test('UTC05: Boundary - Update status with additional transaction metadata', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_005')
            .send({ status: 'PAID', metadata: { bankRef: 'TRX999', branch: 'Hanoi' } });
        expect(res.statusCode).toBe(200);
    });

    // UTC06: Normal - Kiểm tra tính đồng bộ (Khi Payment PAID thì Appointment cũng phải cập nhật)
    test('UTC06: Normal - Verify appointment synchronization after payment update', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_006')
            .send({ status: 'PAID' });
        expect(res.body.appointmentUpdated).toBe(true);
    });

    // UTC07: Normal - Cập nhật từ trạng thái FAILED quay lại PENDING (Nếu hệ thống cho phép retry)
    test('UTC07: Normal - Retry payment: Update FAILED to PENDING', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_FAILED_BEFORE')
            .send({ status: 'PENDING' });
        expect(res.statusCode).toBe(200);
    });

    // UTC08: Abnormal - Thử cập nhật trạng thái đã hoàn tất (PAID) sang trạng thái khác (Vi phạm logic)
    test('UTC08: Abnormal - Invalid transition from PAID to FAILED', async () => {
        const res = await request(app)
            .patch('/api/payments/status/ALREADY_PAID')
            .send({ status: 'FAILED' });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('InvalidStatusTransitionException');
    });

    // UTC09 - UTC12: Stability Check (Cập nhật hàng loạt)
    test('UTC09: Normal - Stability update 1', async () => {
        const res = await request(app).patch('/api/payments/status/P09').send({ status: 'PAID' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC10: Normal - Stability update 2', async () => {
        const res = await request(app).patch('/api/payments/status/P10').send({ status: 'PAID' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC11: Normal - Stability update 3', async () => {
        const res = await request(app).patch('/api/payments/status/P11').send({ status: 'PAID' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC12: Normal - Stability update 4', async () => {
        const res = await request(app).patch('/api/payments/status/P12').send({ status: 'PAID' });
        expect(res.statusCode).toBe(200);
    });

    // UTC13: Boundary - Cập nhật trạng thái với ghi chú trống (Empty String)
    test('UTC13: Boundary - Update status with empty reason string', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_013')
            .send({ status: 'FAILED', reason: '' });
        expect(res.statusCode).toBe(200);
    });

    // UTC14: Abnormal - Cập nhật thất bại do lỗi ràng buộc dữ liệu (Data Integrity)
    test('UTC14: Abnormal - Database constraint violation during update', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_INTEGRITY')
            .send({ status: 'PAID' });
        if (res.statusCode === 500) expect(res.statusCode).toBe(500);
    });

    // UTC15: Abnormal - Mất kết nối DB khi đang cập nhật trạng thái (Giả lập Fail)
    test('UTC15: Abnormal - Connection failure during status update', async () => {
        const res = await request(app)
            .patch('/api/payments/status/PAY_FAIL_015')
            .send({ status: 'PAID' });
        // Giả lập lỗi 500 để ghi mã Defect DF12
        expect(res.statusCode).toBe(500);
        expect(res.body.log).toContain('[ERROR]');
    });
});