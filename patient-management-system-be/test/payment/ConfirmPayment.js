const request = require('supertest');
const app = require('../app');

describe('Confirm Payment (Manual) - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Kế toán xác nhận thanh toán thành công
    test('UTC01: Normal - Accountant confirms payment successfully', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY001', status: 'COMPLETED', note: 'Đã nhận đủ tiền qua VietQR' });
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toContain('[INFO] Payment confirmed by Accountant');
    });

    // UTC02: Abnormal - Xác nhận lại giao dịch đã hoàn tất
    test('UTC02: Abnormal - Confirm an already completed transaction', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'ALREADY_PAID_ID', status: 'COMPLETED' });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('InvalidStatusException');
    });

    // UTC03: Normal - Kế toán từ chối giao dịch (do sai số tiền/nội dung)
    test('UTC03: Normal - Accountant rejects payment due to mismatch', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY002', status: 'REJECTED', note: 'Sai nội dung chuyển khoản' });
        expect(res.statusCode).toBe(200);
    });

    // UTC04: Abnormal - Gửi trạng thái không hợp lệ (ngoại trừ COMPLETED/REJECTED)
    test('UTC04: Abnormal - Invalid status update string', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY001', status: 'UNKNOWN' });
        expect(res.statusCode).toBe(400);
    });

    // UTC05: Boundary - Xác nhận với ghi chú cực dài (Max 500 ký tự)
    test('UTC05: Boundary - Confirm with maximum note length', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY001', status: 'COMPLETED', note: 'X'.repeat(500) });
        expect(res.statusCode).toBe(200);
    });

    // UTC06: Abnormal - Nhân viên y tế/Bệnh nhân thử xác nhận (Không có quyền)
    test('UTC06: Abnormal - User without accountant role attempts confirmation', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer patient_token')
            .send({ paymentId: 'PAY001', status: 'COMPLETED' });
        expect(res.statusCode).toBe(403);
        expect(res.body.exception).toBe('UnauthorizedException');
    });

    // UTC07: Abnormal - ID yêu cầu thanh toán không tồn tại
    test('UTC07: Abnormal - Payment ID not found', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'NON_EXISTENT_ID', status: 'COMPLETED' });
        expect(res.statusCode).toBe(404);
    });

    // UTC08: Abnormal - Xác nhận nhưng thiếu ID giao dịch
    test('UTC08: Abnormal - Missing Payment ID in request', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ status: 'COMPLETED' });
        expect(res.statusCode).toBe(400);
    });

    // UTC09-UTC12: Stability Check (Xác nhận hàng loạt)
    test('UTC09: Normal - Stability test 1 (Approve batch)', async () => {
        const res = await request(app).post('/api/payments/confirm').set('Authorization', 'Bearer acc_tk').send({ paymentId: 'P09', status: 'COMPLETED' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC10: Normal - Stability test 2 (Approve batch)', async () => {
        const res = await request(app).post('/api/payments/confirm').set('Authorization', 'Bearer acc_tk').send({ paymentId: 'P10', status: 'COMPLETED' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC11: Normal - Stability test 3 (Approve batch)', async () => {
        const res = await request(app).post('/api/payments/confirm').set('Authorization', 'Bearer acc_tk').send({ paymentId: 'P11', status: 'COMPLETED' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC12: Normal - Stability test 4 (Approve batch)', async () => {
        const res = await request(app).post('/api/payments/confirm').set('Authorization', 'Bearer acc_tk').send({ paymentId: 'P12', status: 'COMPLETED' });
        expect(res.statusCode).toBe(200);
    });

    // UTC13: Boundary - Xác nhận thanh toán ngay sát thời điểm hết hạn lịch hẹn
    test('UTC13: Boundary - Confirm just before appointment expiration', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY_LAST_MINUTE', status: 'COMPLETED' });
        expect(res.statusCode).toBe(200);
    });

    // UTC14: Normal - Từ chối với lý do trống (Vẫn cho phép)
    test('UTC14: Normal - Reject without providing a note', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY003', status: 'REJECTED', note: '' });
        expect(res.statusCode).toBe(200);
    });

    // UTC15: Abnormal - Lỗi đồng bộ Database khi cập nhật trạng thái (Giả lập Fail)
    test('UTC15: Abnormal - Database deadlock during manual confirmation', async () => {
        const res = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', 'Bearer accountant_token')
            .send({ paymentId: 'PAY_DEADLOCK', status: 'COMPLETED' });
        // Giả lập lỗi 500 và đánh mã Defect DF10
        expect(res.statusCode).toBe(500);
        expect(res.body.log).toContain('[ERROR]');
    });
});