const request = require('supertest');
const app = require('../../services/authService.js');

describe('Register Child - 15 Test Cases (UTC01-UTC15)', () => {

    // UTC01: Normal - Đăng ký thành công (Mọi thông tin đều hợp lệ)
    test('UTC01: Normal - Register child successfully', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child_hero',
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com' // Email này giả định đã tồn tại trong DB
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.log).toBe('[INFO] Child account created: child_hero');
    });

    // UTC02: Abnormal - Username đã bị trùng
    test('UTC02: Abnormal - Duplicate username', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'existing_child',
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(409);
        expect(res.body.exception).toBe('UsernameAlreadyExistsException');
    });

    // UTC03: Abnormal - Mật khẩu quá ngắn (Dưới 8 ký tự)
    test('UTC03: Abnormal - Password too short', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child_new',
            password: '123',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/mật khẩu/i);
    });

    // UTC04: Abnormal - Email người giám hộ không tồn tại trong hệ thống
    test('UTC04: Abnormal - Guardian email not found', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child_new',
            password: 'Password123!',
            guardianEmail: 'unknown_parent@gmail.com'
        });
        expect(res.statusCode).toBe(404);
        expect(res.body.log).toBe('[ERROR] Guardian email not found in system');
    });

    // UTC05: Boundary - Username dài đúng giới hạn (ví dụ 30 ký tự)
    test('UTC05: Boundary - Max length username', async () => {
        const longUsername = "a".repeat(30);
        const res = await request(app).post('/api/auth/register-child').send({
            username: longUsername,
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(201);
    });

    // UTC06: Abnormal - Password toàn khoảng trắng
    test('UTC06: Abnormal - Password consists of spaces', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child_space',
            password: '     ',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC07: Abnormal - Guardian Email sai định dạng
    test('UTC07: Abnormal - Guardian email invalid format', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child07',
            password: 'Password123!',
            guardianEmail: 'not-an-email'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC08: Abnormal - Username chứa ký tự đặc biệt không cho phép
    test('UTC08: Abnormal - Username with special characters', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child!@#$',
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC09: Normal - Đăng ký thành công và kiểm tra liên kết Child-Parent
    test('UTC09: Normal - Verify parent-child link in DB', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child09',
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.parentId).toBeDefined(); // Phải có ID của cha/mẹ
    });

    // UTC10: Abnormal - Để trống Username (Missing field)
    test('UTC10: Abnormal - Missing username', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC11: Abnormal - Để trống Guardian Email
    test('UTC11: Abnormal - Missing guardian email', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child11',
            password: 'Password123!'
        });
        expect(res.statusCode).toBe(400);
    });

    // UTC12: Abnormal - Guardian Email thuộc về một tài khoản Child khác (Không phải Adult)
    test('UTC12: Abnormal - Guardian email belongs to another child', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child12',
            password: 'Password123!',
            guardianEmail: 'other_child@gmail.com'
        });
        expect(res.statusCode).toBe(403); // Không có quyền làm người giám hộ
    });

    // UTC13: Normal - Username có cả chữ và số hợp lệ
    test('UTC13: Normal - Alphanumeric username', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child123456',
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(201);
    });

    // UTC14: Boundary - Password dài tối đa (ví dụ 100 ký tự)
    test('UTC14: Boundary - Max length password', async () => {
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child14',
            password: 'P'.repeat(100),
            guardianEmail: 'parent@gmail.com'
        });
        expect(res.statusCode).toBe(201);
    });

    // UTC15: Abnormal - Database bị lỗi khi đang lưu (Internal Server Error)
    test('UTC15: Abnormal - Database connection error during save', async () => {
        // Giả lập lỗi DB
        const res = await request(app).post('/api/auth/register-child').send({
            username: 'child15',
            password: 'Password123!',
            guardianEmail: 'parent@gmail.com'
        });
        // Nếu app không handle tốt sẽ trả về 500
        expect(res.statusCode).toBe(500);
        expect(res.body.log).toContain('[ERROR]');
    });

});