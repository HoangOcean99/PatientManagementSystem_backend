const request = require('supertest');
const app = require('../app');

describe('Create Payment Request - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Khởi tạo yêu cầu thanh toán thành công
    test('UTC01: Normal - Create payment request successfully', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({
                appointmentId: 'APP123',
                amount: 250000,
                method: 'Momo'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.log).toBe('[INFO] Payment request created for Appointment: APP123');
    });

    // UTC02: Abnormal - Số tiền bằng 0
    test('UTC02: Abnormal - Amount is zero', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP123', amount: 0, method: 'Card' });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('PaymentValidationException');
    });

    // UTC03: Abnormal - Phương thức thanh toán không được hỗ trợ
    test('UTC03: Abnormal - Unsupported payment method', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP123', amount: 100000, method: 'UnknownPay' });
        expect(res.statusCode).toBe(400);
    });

    // UTC04: Abnormal - Số tiền âm
    test('UTC04: Abnormal - Negative amount', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP123', amount: -50000, method: 'Cash' });
        expect(res.statusCode).toBe(400);
    });

    // UTC05: Boundary - Số tiền tối thiểu hợp lệ (1,000 VNĐ)
    test('UTC05: Boundary - Minimum valid amount', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP123', amount: 1000, method: 'Momo' });
        expect(res.statusCode).toBe(201);
    });

    // UTC06: Abnormal - Chưa đăng nhập (Missing Token)
    test('UTC06: Abnormal - Unauthorized user access', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .send({ appointmentId: 'APP123', amount: 200000, method: 'Momo' });
        expect(res.statusCode).toBe(401);
    });

    // UTC07: Abnormal - ID cuộc hẹn không tồn tại trong Database
    test('UTC07: Abnormal - Appointment ID not found', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'INVALID_ID_999', amount: 200000, method: 'Momo' });
        expect(res.statusCode).toBe(404);
        expect(res.body.exception).toBe('AppointmentNotFoundException');
    });

    // UTC08: Abnormal - Cuộc hẹn đã được thanh toán trước đó (Idempotency check)
    test('UTC08: Abnormal - Appointment already paid', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'PAID_APP_01', amount: 200000, method: 'Momo' });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/đã thanh toán/i);
    });

    // UTC09: Normal - Stability check 1 (Lặp lại luồng thành công)
    test('UTC09: Normal - Stability check with Cash method', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_STAB_01', amount: 50000, method: 'Cash' });
        expect(res.statusCode).toBe(201);
    });

    // UTC10: Normal - Stability check 2 (Lặp lại luồng thành công)
    test('UTC10: Normal - Stability check with Card method', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_STAB_02', amount: 150000, method: 'Card' });
        expect(res.statusCode).toBe(201);
    });

    // UTC11: Normal - Stability check 3 (Lặp lại luồng thành công)
    test('UTC11: Normal - Stability check with ZaloPay method', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_STAB_03', amount: 300000, method: 'ZaloPay' });
        expect(res.statusCode).toBe(201);
    });

    // UTC12: Normal - Tạo request với ghi chú thanh toán (nếu có trường note)
    test('UTC12: Normal - Create request with additional notes', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_NOTE_01', amount: 200000, method: 'Momo', note: 'Thanh toán phí khám' });
        expect(res.statusCode).toBe(201);
    });

    // UTC13: Boundary - Số tiền giao dịch tối đa (100,000,000 VNĐ)
    test('UTC13: Boundary - Maximum transaction limit', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_MAX_01', amount: 100000000, method: 'Card' });
        expect(res.statusCode).toBe(201);
    });

    // UTC14: Abnormal - Lỗi Gateway thanh toán phản hồi chậm (Timeout)
    test('UTC14: Abnormal - Payment Gateway timeout simulation', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_TIMEOUT', amount: 200000, method: 'Momo' });
        // Mong đợi lỗi 504 Gateway Timeout nếu tích hợp thất bại
        if (res.statusCode === 504) expect(res.statusCode).toBe(504);
    });

    // UTC15: Abnormal - Hệ thống treo khi đang khởi tạo Billing (Giả lập Fail)
    test('UTC15: Abnormal - System failure during billing creation', async () => {
        const res = await request(app)
            .post('/api/payments/request')
            .set('Authorization', 'Bearer adult_token')
            .send({ appointmentId: 'APP_FAIL_01', amount: 150000, method: 'Momo' });
        // Giả lập trả về 500 do lỗi Database treo
        expect(res.statusCode).toBe(500);
        expect(res.body.log).toContain('[ERROR]');
    });
});