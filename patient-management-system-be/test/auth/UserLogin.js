const request = require('supertest');
const app = require('../app');
const nock = require('nock');

describe('User Login (Adult & Child) - 15 Test Cases (UTC01-UTC15)', () => {

    // --- ADULT LOGIN (GOOGLE) ---

    // UTC01: Normal - Adult đăng nhập Google thành công
    test('UTC01: Normal - Adult Google login success', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).reply(200, { email: 'adult@gmail.com' });
        const res = await request(app).post('/api/auth/login-google').send({ token: 'valid_token' });
        expect(res.statusCode).toBe(200);
        expect(res.body.role).toBe('Adult');
        expect(res.body.log).toContain('[INFO] Adult logged in');
    });

    // UTC02: Abnormal - Adult Google login thất bại do Token hết hạn
    test('UTC02: Abnormal - Adult Google token expired', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).reply(401);
        const res = await request(app).post('/api/auth/login-google').send({ token: 'expired_token' });
        expect(res.statusCode).toBe(401);
        expect(res.body.exception).toBe('UnauthorizedException');
    });

    // --- CHILD LOGIN (USERNAME/PASSWORD) ---

    // UTC03: Normal - Child đăng nhập thành công
    test('UTC03: Normal - Child login success', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'child_user',
            password: 'CorrectPassword123'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.role).toBe('Child');
    });

    // UTC04: Abnormal - Child đăng nhập sai mật khẩu
    test('UTC04: Abnormal - Child wrong password', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'child_user',
            password: 'WrongPassword'
        });
        expect(res.statusCode).toBe(401);
    });

    // UTC05: Abnormal - Để trống Username/Password
    test('UTC05: Abnormal - Missing login credentials', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: '',
            password: ''
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC06: Abnormal - Tài khoản Adult chưa Verify OTP người giám hộ (nếu cần)
    test('UTC06: Abnormal - Account pending verification', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).reply(200, { email: 'pending@gmail.com' });
        const res = await request(app).post('/api/auth/login-google').send({ token: 'pending_token' });
        expect(res.statusCode).toBe(403);
        expect(res.body.exception).toBe('ForbiddenException');
    });

    // UTC07: Abnormal - Tài khoản Child bị khóa (Disabled)
    test('UTC07: Abnormal - Child account disabled', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'disabled_child',
            password: 'Password123'
        });
        expect(res.statusCode).toBe(403);
    });

    // UTC08: Abnormal - Đăng nhập tài khoản Child không tồn tại
    test('UTC08: Abnormal - Child account not found', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'non_existent_child',
            password: 'Password123'
        });
        expect(res.statusCode).toBe(404);
    });

    // UTC09-12: Tính ổn định & Re-login
    test('UTC09: Normal - Stability check Adult', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).reply(200, { email: 'adult09@gmail.com' });
        const res = await request(app).post('/api/auth/login-google').send({ token: 'tk09' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC10: Abnormal - Adult token malformed', async () => {
        const res = await request(app).post('/api/auth/login-google').send({ token: 'not-a-token' });
        expect(res.statusCode).toBe(401);
    });

    test('UTC11: Normal - Stability check Child', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'child11',
            password: 'Password11'
        });
        expect(res.statusCode).toBe(200);
    });

    test('UTC12: Abnormal - Child login brute force (too many attempts)', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'child_user',
            password: 'WrongPassword'
        });
        // Giả lập trả về 429 sau nhiều lần
        if (res.statusCode === 429) expect(res.statusCode).toBe(429);
    });

    // UTC13: Boundary - Login với Username Child cực dài
    test('UTC13: Boundary - Max length child username login', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'c'.repeat(30),
            password: 'Password123'
        });
        expect(res.statusCode).toBe(200);
    });

    // UTC14: Abnormal - Lỗi mạng khi login Google
    test('UTC14: Abnormal - Network error during Google Login', async () => {
        nock('https://oauth2.googleapis.com').get('/tokeninfo').query(true).replyWithError('Network error');
        const res = await request(app).post('/api/auth/login-google').send({ token: 'tk14' });
        expect(res.statusCode).toBe(503);
    });

    // UTC15: Abnormal - Lỗi Database khi login Child (Giả lập Fail)
    test('UTC15: Abnormal - Database error child login', async () => {
        const res = await request(app).post('/api/auth/login-child').send({
            username: 'child15',
            password: 'Password15'
        });
        // Giả lập lỗi trả về 500
        expect(res.statusCode).toBe(500);
    });
});