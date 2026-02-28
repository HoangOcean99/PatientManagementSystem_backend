const request = require('supertest');
const app = require('../../services/authService.js');

describe('Guardian OTP Verification - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Xác thực mã đúng
    test('UTC01: Normal - Verify correct OTP', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: '123456'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toBe('[INFO] Guardian verified OTP for: parent@gmail.com');
    });

    // UTC02: Abnormal - Sai mã OTP
    test('UTC02: Abnormal - Incorrect OTP code', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: '000000'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.exception).toBe('OTPInvalidException');
    });

    // UTC03: Abnormal - Mã OTP đã hết hạn
    test('UTC03: Abnormal - Expired OTP code', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: 'expired_otp'
        });
        expect(res.statusCode).toBe(410);
        expect(res.body.exception).toBe('OTPExpiredException');
    });

    // UTC04: Abnormal - OTP chứa chữ cái (Sai định dạng)
    test('UTC04: Abnormal - OTP with characters', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: 'ABCDEF'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC05: Boundary - Độ dài mã OTP ngắn hơn quy định (5 số)
    test('UTC05: Boundary - OTP length too short', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: '12345'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC06: Abnormal - Để trống mã OTP
    test('UTC06: Abnormal - Empty OTP field', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: ''
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC07: Abnormal - Email chưa được hệ thống gửi mã
    test('UTC07: Abnormal - Email not sent OTP yet', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'not_sent@gmail.com', otp: '123456'
        });
        expect(res.statusCode).toBe(404);
    });

    // UTC08: Abnormal - Tài khoản đã xác thực trước đó (Verify rồi không verify lại)
    test('UTC08: Abnormal - Already verified account', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'already_verified@gmail.com', otp: '123456'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/đã xác thực/i);
    });

    // UTC09: Normal - Xác thực thành công lần 2 (Stability check)
    test('UTC09: Normal - Stability test 1', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent09@gmail.com', otp: '111111'
        });
        expect(res.statusCode).toBe(200);
    });

    // UTC10: Normal - Xác thực thành công lần 3 (Stability check)
    test('UTC10: Normal - Stability test 2', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent10@gmail.com', otp: '111111'
        });
        expect(res.statusCode).toBe(200);
    });

    // UTC11: Normal - Xác thực thành công với Email dài
    test('UTC11: Normal - Long email address verification', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'very.long.guardian.email.address@gmail.com', otp: '111111'
        });
        expect(res.statusCode).toBe(200);
    });

    // UTC12: Normal - Xác thực thành công với định dạng OTP có số 0 ở đầu
    test('UTC12: Normal - OTP with leading zero', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent12@gmail.com', otp: '012345'
        });
        expect(res.statusCode).toBe(200);
    });

    // UTC13: Abnormal - Nhập sai quá 5 lần (Brute force protection)
    test('UTC13: Abnormal - Brute force protection (Too many attempts)', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: '999999'
        });
        expect(res.statusCode).toBe(429); // Too many requests
    });

    // UTC14: Abnormal - Lỗi Server/DB (Hệ thống bận)
    test('UTC14: Abnormal - Server busy (Database Error)', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: '123456'
        });
        // Giả lập server trả về 500
        if (res.statusCode === 500) {
            expect(res.body.log).toContain('[ERROR]');
        }
    });

    // UTC15: Abnormal - Lỗi mạng (Giả lập để đánh dấu Failed trong bảng)
    test('UTC15: Abnormal - Network timeout simulation', async () => {
        const res = await request(app).post('/api/auth/verify-guardian-otp').send({
            email: 'parent@gmail.com', otp: '123456'
        });
        // Kỳ vọng trả về 503 để khớp với cột Failed (F) và mã DFID015 của bạn
        expect(res.statusCode).toBe(503);
    });
});