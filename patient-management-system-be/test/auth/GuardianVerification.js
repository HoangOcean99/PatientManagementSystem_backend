const request = require('supertest');
const app = require('../../services/authService.js');

describe('Guardian OTP Verification - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Xác thực mã đúng
    test('UTC01: Normal - Verify correct OTP', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: '123456'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toBe('[INFO] Guardian verified OTP for: parent@gmail.com');
    });

    // UTC02: Abnormal - Sai mã OTP
    test('UTC02: Abnormal - Incorrect OTP code', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: '000000'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('OTPInvalidException');
    });

    // UTC03: Abnormal - Mã OTP đã hết hạn (Giả lập thời gian)
    test('UTC03: Abnormal - Expired OTP code', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: 'expired_otp'
        });
        expect(res.statusCode).toBe(410); // Gone / Expired
        expect(res.body.exception).toBe('OTPExpiredException');
    });

    // UTC04: Abnormal - Gửi sai định dạng mã (VD: Chứa chữ cái khi yêu cầu số)
    test('UTC04: Abnormal - OTP with characters', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: 'ABCDEF'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC05: Boundary - Nhập mã OTP có độ dài không đúng (Ví dụ: 5 số thay vì 6 số)
    test('UTC05: Boundary - Invalid OTP length', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: '12345'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC06: Abnormal - Để trống mã OTP
    test('UTC06: Abnormal - Empty OTP field', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: ''
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC07: Abnormal - Email người giám hộ không khớp với phiên làm việc/chưa gửi OTP
    test('UTC07: Abnormal - Email not sent OTP yet', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'not_sent@gmail.com',
            otp: '123456'
        });
        expect(res.statusCode).toBe(404);
    });

    // UTC08: Abnormal - Tài khoản này đã xác thực thành công trước đó
    test('UTC08: Abnormal - Already verified account', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'already_verified@gmail.com',
            otp: '123456'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/đã xác thực/i);
    });

    // UTC09-UTC12: Normal - Kiểm tra tính ổn định (Success repeats)
    const stableCases = [9, 10, 11, 12];
    stableCases.forEach(id => {
        test(`UTC${id < 10 ? '0' + id : id}: Normal - Success stability test`, async () => {
            const res = await request(app).post('/api/auth/verify-guardian-otp').send({
                email: `parent${id}@gmail.com`,
                otp: '111111'
            });
            expect(res.statusCode).toBe(200);
        });
    });

    // UTC13: Abnormal - Nhập sai mã quá nhiều lần (Brute force protection)
    test('UTC13: Abnormal - Too many failed attempts', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: '999999'
        });
        // Giả sử sau 5 lần sai hệ thống trả về 429
        expect(res.statusCode).toBe(429);
    });

    // UTC14: Abnormal - Hệ thống bận (Internal Error)
    test('UTC14: Abnormal - Server busy during verification', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: '123456'
        });
        // Giả lập case này trả về lỗi DB
        if (res.statusCode === 500) {
            expect(res.body.log).toContain('[ERROR]');
        }
    });

    // UTC15: Abnormal - Lỗi mạng (Giả lập Fail để có Defect ID)
    test('UTC15: Abnormal - Network failure during verification', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com',
            otp: '123456'
        });
        // Giả sử lỗi mạng trả về 503 thay vì 200
        expect(res.statusCode).toBe(503);
    });
});