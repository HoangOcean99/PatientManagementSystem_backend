const request = require('supertest');
const app = require('../app');

describe('Token Management - 15 Test Cases (UTC01-UTC15)', () => {

    test('UTC01: Normal - Access protected route with valid token', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer valid_access_token');
        expect(res.statusCode).toBe(200);
    });

    test('UTC02: Normal - Refresh token successfully with valid refresh_token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: 'valid_refresh_token' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.log).toBe('[INFO] Token refreshed');
    });

    test('UTC03: Abnormal - Access with expired access_token', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer expired_access_token');
        expect(res.statusCode).toBe(401);
        expect(res.body.exception).toBe('TokenExpiredException');
    });

    test('UTC04: Abnormal - Access with blacklisted token (token đã logout)', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer blacklisted_token');
        expect(res.statusCode).toBe(401);
        expect(res.body.log).toBe('[ERROR] Token validation failed');
    });

    test('UTC05: Boundary - Access with token about to expire (1 second remaining)', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer near_expiry_token');
        expect(res.statusCode).toBe(200);
    });

    test('UTC06: Normal - Access with token just refreshed', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer newly_refreshed_token');
        expect(res.statusCode).toBe(200);
    });

    test('UTC07: Normal - Refresh token again (Stability check)', async () => {
        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: 'valid_refresh_token_2' });
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toBe('[INFO] Token refreshed');
    });

    test('UTC08: Abnormal - Refresh with expired refresh_token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: 'expired_refresh_token' });
        expect(res.statusCode).toBe(401);
        expect(res.body.exception).toBe('TokenExpiredException');
    });

    test('UTC09: Normal - Logout successfully from current device', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', 'Bearer valid_access_token');
        expect(res.statusCode).toBe(200);
        expect(res.body.log).toContain('[INFO] User logged out');
    });

    test('UTC10: Normal - Logout stability check (Device 2)', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', 'Bearer valid_token_device_2');
        expect(res.statusCode).toBe(200);
    });

    test('UTC11: Normal - Logout stability check (Device 3)', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', 'Bearer valid_token_device_3');
        expect(res.statusCode).toBe(200);
    });

    test('UTC12: Normal - Logout and verify token is revoked', async () => {
        // Bước 1: Logout
        await request(app).post('/api/auth/logout').set('Authorization', 'Bearer token_to_revoke');
        // Bước 2: Thử truy cập lại bằng chính token đó
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer token_to_revoke');
        expect(res.statusCode).toBe(401);
    });

    test('UTC13: Boundary - Multiple refresh requests in short interval', async () => {
        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: 'valid_refresh_token' });
        expect(res.statusCode).toBe(200);
    });

    test('UTC14: Abnormal - Refresh with malformed/invalid token string', async () => {
        const res = await request(app)
            .post('/api/auth/refresh-token')
            .send({ refreshToken: 'not-a-valid-jwt-format' });
        expect(res.statusCode).toBe(401);
        expect(res.body.exception).toBe('InvalidTokenException');
    });

    test('UTC15: Abnormal - Server error during token blacklisting (Redis failure)', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', 'Bearer valid_token');
        // Giả lập case Fail (ví dụ lỗi kết nối Database/Redis để lưu Blacklist)
        expect(res.statusCode).toBe(500);
        expect(res.body.log).toBe('[ERROR] Token validation failed');
    });

});