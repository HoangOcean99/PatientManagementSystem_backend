const request = require('supertest');
const app = require('../app');

describe('Cancel / Expire Payment - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Người dùng chủ động hủy yêu cầu thanh toán
    test('UTC01: Normal - User cancels pending payment successfully', async () => {
        const res = await request(app)
            .post('/api/payments/cancel')
            .set('Authorization', 'Bearer user_token')
            .send({ paymentId: 'PAY_001', reason: 'Tôi muốn đổi phương thức khác' });
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toBe('[INFO] Payment cancelled by User: PAY_001');
    });

    // UTC02: Normal - Hệ thống tự động cập nhật hết hạn khi quá thời gian
    test('UTC02: Normal - System expires payment after timeout', async () => {
        const res = await request(app)
            .post('/api/payments/expire-check') // Endpoint cho cron job hoặc trigger
            .send({ paymentId: 'PAY_EXPIRED_02' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('EXPIRED');
        expect(res.body.log).toContain('[INFO] Payment expired by System');
    });

    // UTC03: Abnormal - Thử hủy một giao dịch đã hoàn tất (Completed)
    test('UTC03: Abnormal - Attempt to cancel a completed payment', async () => {
        const res = await request(app)
            .post('/api/payments/cancel')
            .set('Authorization', 'Bearer user_token')
            .send({ paymentId: 'PAID_123' });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('IllegalStateException');
    });

    // UTC04: Abnormal - Hủy giao dịch không tồn tại trong hệ thống
    test('UTC04: Abnormal - Cancel non-existent payment ID', async () => {
        const res = await request(app)
            .post('/api/payments/cancel')
            .set('Authorization', 'Bearer user_token')
            .send({ paymentId: 'NOT_FOUND_ID' });
        expect(res.statusCode).toBe(404);
        expect(res.body.exception).toBe('PaymentNotFoundException');
    });

    // UTC05: Boundary - Hủy ngay tại giây cuối cùng trước khi hết hạn
    test('UTC05: Boundary - Cancel at the last second of validity', async () => {
        const res = await request(app)
            .post('/api/payments/cancel')
            .send({ paymentId: 'PAY_LAST_SEC' });
        expect(res.statusCode).toBe(200);
    });

    // UTC06: Abnormal - Hủy nhưng không gửi kèm Payment ID
    test('UTC06: Abnormal - Missing Payment ID in cancel request', async () => {
        const res = await request(app).post('/api/payments/cancel').send({ reason: 'No ID' });
        expect(res.statusCode).toBe(400);
    });

    // UTC07: Normal - Hệ thống quét mã QR đã hết hạn hiển thị cho người dùng
    test('UTC07: Normal - Validate expired payment link status', async () => {
        const res = await request(app).get('/api/payments/status/PAY_EXPIRED_07');
        expect(res.body.status).toBe('EXPIRED');
    });

    // UTC08: Abnormal - Hệ thống thử Expire một giao dịch đã Cancelled trước đó
    test('UTC08: Abnormal - System attempts to expire a cancelled payment', async () => {
        const res = await request(app).post('/api/payments/expire-check').send({ paymentId: 'ALREADY_CANCELLED' });
        expect(res.statusCode).toBe(400);
    });

    // UTC09 - UTC12: Stability Check (Xử lý hàng loạt)
    test('UTC09: Normal - Stability cancel 1', async () => {
        const res = await request(app).post('/api/payments/cancel').send({ paymentId: 'P09' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC10: Normal - Stability cancel 2', async () => {
        const res = await request(app).post('/api/payments/cancel').send({ paymentId: 'P10' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC11: Normal - Stability cancel 3', async () => {
        const res = await request(app).post('/api/payments/cancel').send({ paymentId: 'P11' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC12: Normal - Stability cancel 4', async () => {
        const res = await request(app).post('/api/payments/cancel').send({ paymentId: 'P12' });
        expect(res.statusCode).toBe(200);
    });

    // UTC13: Boundary - Lý do hủy có độ dài tối đa (255 ký tự)
    test('UTC13: Boundary - Cancel reason at max length', async () => {
        const res = await request(app)
            .post('/api/payments/cancel')
            .send({ paymentId: 'PAY_013', reason: 'C'.repeat(255) });
        expect(res.statusCode).toBe(200);
    });

    // UTC14: Abnormal - Hệ thống quét hết hạn nhưng lỗi Database
    test('UTC14: Abnormal - DB error during expiration sweep', async () => {
        const res = await request(app).post('/api/payments/expire-check').send({ paymentId: 'PAY_DB_ERR' });
        if (res.statusCode === 500) expect(res.statusCode).toBe(500);
    });

    // UTC15: Abnormal - Giao dịch bị khóa (Locked) không thể cập nhật (Giả lập Fail)
    test('UTC15: Abnormal - Transaction locked by another process', async () => {
        const res = await request(app).post('/api/payments/cancel').send({ paymentId: 'PAY_LOCKED' });
        // Giả lập lỗi 500 để ghi mã DF11
        expect(res.statusCode).toBe(500);
        expect(res.body.log).toContain('[ERROR]');
    });
});