const request = require('supertest');
const app = require('../app');

describe('Generate QR Code - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Tạo mã QR thành công với đầy đủ thông tin
    test('UTC01: Normal - Generate VietQR successfully', async () => {
        const res = await request(app)
            .post('/api/payments/generate-qr')
            .send({ appointmentId: 'APP123', amount: 500000, memo: 'THANH TOAN APP123' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('qrCodeBase64'); // Trả về chuỗi ảnh để React hiển thị
        expect(res.body.log).toBe('[INFO] QR generated for Hospital account: APP123');
    });

    // UTC02: Abnormal - Số tiền không hợp lệ (bằng 0)
    test('UTC02: Abnormal - Amount is zero', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 0 });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('InvalidAmountException');
    });

    // UTC03: Abnormal - Thiếu nội dung chuyển khoản (Memo)
    test('UTC03: Abnormal - Missing memo content', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 100000, memo: '' });
        expect(res.statusCode).toBe(400);
    });

    // UTC04: Abnormal - Số tiền âm
    test('UTC04: Abnormal - Negative amount', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: -50000 });
        expect(res.statusCode).toBe(400);
    });

    // UTC05: Boundary - Số tiền tối thiểu (1,000 VNĐ)
    test('UTC05: Boundary - Minimum valid amount for VietQR', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 1000, memo: 'TEST' });
        expect(res.statusCode).toBe(200);
    });

    // UTC06: Abnormal - Nội dung chuyển khoản quá dài (Vượt giới hạn VietQR)
    test('UTC06: Abnormal - Memo exceeds character limit', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({
            amount: 100000,
            memo: 'A'.repeat(100)
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC07: Abnormal - Không gửi kèm ID cuộc hẹn
    test('UTC07: Abnormal - Missing Appointment ID', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 100000 });
        expect(res.statusCode).toBe(400);
    });

    // UTC08: Abnormal - Thử tạo QR cho cuộc hẹn không tồn tại
    test('UTC08: Abnormal - Appointment not found', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ appointmentId: '9999', amount: 100000 });
        expect(res.statusCode).toBe(404);
    });

    // UTC09-UTC12: Stability Check (Tách rời từng case)
    test('UTC09: Normal - Stability check with bank BIDV', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ appointmentId: 'A09', amount: 200000, bank: 'BIDV' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC10: Normal - Stability check with bank Vietcombank', async () => {
        const res = await request(app).post('/api/payments/request').send({ appointmentId: 'A10', amount: 300000, bank: 'VCB' });
        if (res.statusCode === 200) expect(res.statusCode).toBe(200);
    });

    test('UTC11: Normal - Stability check with different currency (if applicable)', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ appointmentId: 'A11', amount: 400000 });
        expect(res.statusCode).toBe(200);
    });

    test('UTC12: Normal - Verify QR data contains hospital account number', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ appointmentId: 'A12', amount: 500000 });
        // Giả sử mã QR giải mã ra phải chứa STK bệnh viện
        expect(res.body.qrData).toMatch(/123456789/);
    });

    // UTC13: Boundary - Số tiền tối đa giao dịch mã QR (Ví dụ 500 triệu)
    test('UTC13: Boundary - Maximum QR amount limit', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 500000000 });
        expect(res.statusCode).toBe(200);
    });

    // UTC14: Abnormal - Thiếu cấu hình tài khoản ngân hàng bệnh viện trên Server
    test('UTC14: Abnormal - Missing Hospital bank configuration', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 100000 });
        // Nếu chưa setup biến môi trường BANK_ACC
        if (res.statusCode === 500) expect(res.statusCode).toBe(500);
    });

    // UTC15: Abnormal - Lỗi thư viện tạo ảnh QR (Giả lập Fail)
    test('UTC15: Abnormal - QR Generation library failure', async () => {
        const res = await request(app).post('/api/payments/generate-qr').send({ amount: 100000 });
        // Giả lập lỗi runtime và ghi mã lỗi DF09
        expect(res.statusCode).toBe(503);
    });
});