const request = require('supertest');
const app = require('../../services/authService.js');
const nock = require('nock');

describe('Register Adult with Google - 15 Test Cases (UTC01-UTC15)', () => {

    const mockGoogle = (status, body) => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).reply(status, body);
    };

    // UTC01: Normal - Luồng đăng ký mới thành công mỹ mãn
    test('UTC01: Normal - New account registration success', async () => {
        mockGoogle(200, { email: 'duong01@gmail.com', name: 'Dương 01' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk01' });
        expect(res.statusCode).toBe(201);
        expect(res.body.log).toBe('[INFO] User registered via Google: duong01@gmail.com');
    });

    // UTC02: Abnormal - Tài khoản Google đã từng đăng ký trong DB (Trùng Email)
    test('UTC02: Abnormal - Email already exists', async () => {
        mockGoogle(200, { email: 'existing@gmail.com' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk02' });
        expect(res.statusCode).toBe(409);
        expect(res.body.exception).toBe('UserAlreadyExistsException');
    });

    // UTC03: Abnormal - Người dùng nhấn "Hủy/Deny" trên pop-up Google
    test('UTC03: Abnormal - User cancelled at consent screen', async () => {
        const res = await request(app).post('/api/auth/google').send({ error: 'access_denied' });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Lỗi: User Cancelled');
    });

    // UTC04: Abnormal - Mất kết nối mạng khi đang xác thực (Network Error)
    test('UTC04: Abnormal - Network Error/Google unreachable', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).replyWithError('Network Error');
        const res = await request(app).post('/api/auth/google').send({ token: 'tk04' });
        expect(res.statusCode).toBe(503);
        expect(res.body.message).toBe('Lỗi: Mất kết nối (Network Error)');
    });

    // UTC05: Boundary - Email đạt ngưỡng giới hạn tối đa (50 ký tự)
    test('UTC05: Boundary - Max length email (50 chars)', async () => {
        const longEmail = "a".repeat(40) + "@gmail.com"; // Đúng 50 ký tự
        mockGoogle(200, { email: longEmail });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk05' });
        expect(res.statusCode).toBe(201);
    });

    // UTC06: Abnormal - Token gửi lên bị sai hoặc hết hạn (401)
    test('UTC06: Abnormal - Token expired or invalid', async () => {
        mockGoogle(401, { error: 'invalid_token' });
        const res = await request(app).post('/api/auth/google').send({ token: 'expired_tk' });
        expect(res.statusCode).toBe(401);
        expect(res.body.exception).toBe('OAuthException');
    });

    // UTC07: Abnormal - Tài khoản Google bị phía Google khóa/vô hiệu hóa
    test('UTC07: Abnormal - Google account is disabled', async () => {
        mockGoogle(403, { error: 'account_disabled' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk07' });
        expect(res.statusCode).toBe(401);
        expect(res.body.log).toBe('[ERROR] Google Auth failed: Invalid Grant');
    });

    // UTC08: Abnormal - Không gửi Token (Trường hợp gọi API trực tiếp không qua UI)
    test('UTC08: Abnormal - No token provided (Missing input)', async () => {
        const res = await request(app).post('/api/auth/google').send({});
        expect(res.statusCode).toBe(400);
    });

    // UTC09: Normal - Đăng ký thành công và kiểm tra chuyển hướng (Redirect)
    test('UTC09: Normal - Register success and redirect to dashboard', async () => {
        mockGoogle(200, { email: 'user09@gmail.com' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk09' });
        expect(res.statusCode).toBe(201);
        expect(res.body.redirect).toBe('/dashboard');
    });

    // UTC10: Abnormal - Quyền truy cập bị từ chối (Missing Scopes/No Profile)
    test('UTC10: Abnormal - Missing mandatory profile scopes', async () => {
        mockGoogle(200, { email: 'user10@gmail.com' }); // Thiếu name/picture từ payload
        const res = await request(app).post('/api/auth/google').send({ token: 'tk10' });
        expect(res.statusCode).toBe(201); // Hệ thống vẫn linh hoạt tạo nhưng dùng email thay tên
    });

    // UTC11: Normal - Test đăng ký với tài khoản Google Education (.edu)
    test('UTC11: Normal - Google Education account registration', async () => {
        mockGoogle(200, { email: 'student@university.edu.vn' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk11' });
        expect(res.statusCode).toBe(201);
    });

    // UTC12: Abnormal - Kết nối mạng chậm (Request Timeout)
    test('UTC12: Abnormal - Network timeout during authentication', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).delay(10000).reply(200);
        const res = await request(app).post('/api/auth/google').send({ token: 'tk12' });
        expect(res.statusCode).toBe(504); // Gateway Timeout
    });

    // UTC13: Normal - Đăng ký lại tài khoản đã xóa (Re-registration)
    test('UTC13: Normal - Re-registering a previously deleted email', async () => {
        mockGoogle(200, { email: 're_register@gmail.com' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk13' });
        expect(res.statusCode).toBe(201);
    });

    // UTC14: Boundary - Email có độ dài ngắn nhất hợp lệ (5 ký tự: a@b.c)
    test('UTC14: Boundary - Minimum valid email length (5 chars)', async () => {
        mockGoogle(200, { email: 'a@b.c' });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk14' });
        expect(res.statusCode).toBe(201);
    });

    // UTC15: Abnormal - Token hợp lệ nhưng email chưa được Verify phía Google
    test('UTC15: Abnormal - Google email not verified', async () => {
        mockGoogle(200, { email: 'unverified@gmail.com', email_verified: false });
        const res = await request(app).post('/api/auth/google').send({ token: 'tk15' });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Lỗi: Quyền truy cập bị từ chối');
    });

});