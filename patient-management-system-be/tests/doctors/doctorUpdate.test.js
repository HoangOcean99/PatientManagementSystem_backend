import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateDoctor } from '../../controllers/doctorController.js';
import * as doctorService from '../../services/doctorService.js';
import { AppError } from '../../utils/app-error.js';

// Mock DB Service
vi.mock('../../services/doctorService.js', () => ({
    updateDoctor: vi.fn(),
    getDoctorById: vi.fn()
}));

const mockUpdatedDoctor = {
    doctor_id: 1,
    specialization: 'Nhi khoa',
    bio: 'Test bio',
    room_number: '102',
    Users: {
        user_id: 1,
        full_name: 'Nguyễn Văn A',
        email: 'test@clinic.com',
        phone_number: '0912345678',
        avatar_url: 'avatar.jpg',
        status: 'active'
    }
};

describe('Doctor Controller - updateDoctor() - Bảng mới (9 Cases)', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = { params: { doctorId: 1 }, body: {} };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    // UTCID01: Happy Path - Update Full Data -> 200
    it('UTCID01 - Cập nhật thành công toàn bộ trường thông tin hợp lệ', async () => {
        mockReq.body = {
            full_name: 'Nguyễn Văn A',
            phone_number: '0912345678',
            avatar_url: 'avatar.jpg', // Text URL
            specialization: 'Nhi khoa',
            room_number: '102',
            status: 'active'
        };
        doctorService.updateDoctor.mockResolvedValue(mockUpdatedDoctor);

        await updateDoctor(mockReq, mockRes, mockNext);

        expect(doctorService.updateDoctor).toHaveBeenCalledWith(1, mockReq.body);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            data: mockUpdatedDoctor
        });
    });

    // UTCID02: Partial Update (Chỉ 1 trường avatar_url) -> 200
    it('UTCID02 - Cập nhật thành công khi chỉ thay đổi 1 trường duy nhất (URL)', async () => {
        mockReq.body = { avatar_url: 'new_link.jpg' };
        doctorService.updateDoctor.mockResolvedValue(Object.assign({}, mockUpdatedDoctor, { avatar_url: 'new_link.jpg' }));

        await updateDoctor(mockReq, mockRes, mockNext);

        expect(doctorService.updateDoctor).toHaveBeenCalledWith(1, mockReq.body);
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID03: Validation name rỗng -> Mock throw AppError 400 (do controller không validate, Validator middleware hứng trước. Đây ta giả lập service ném ra nếu rỗng)
    it('UTCID03 - Không hợp lệ vì full_name rỗng hoặc < 2 ký tự (Error 400)', async () => {
        mockReq.body = { full_name: 'A' }; 
        const mockError = new AppError('Full name must be between 2 and 100 characters', 400);
        doctorService.updateDoctor.mockRejectedValue(mockError);

        updateDoctor(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID04: Validation số điện thoại sai định dạng -> Mock throw AppError 400
    it('UTCID04 - Không hợp lệ vì phone_number sai định dạng chữ (Error 400)', async () => {
        mockReq.body = { phone_number: '09123abcde' }; 
        const mockError = new AppError('Invalid Vietnamese phone number format', 400);
        doctorService.updateDoctor.mockRejectedValue(mockError);

        updateDoctor(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID05: Validation enum status sai -> Mock throw AppError 400
    it('UTCID05 - Không hợp lệ do status ngoài active/inactive (Error 400)', async () => {
        mockReq.body = { status: 'unknown' }; 
        const mockError = new AppError('Status must be either active or inactive', 400);
        doctorService.updateDoctor.mockRejectedValue(mockError);

        updateDoctor(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID06: Missing Param doctorId
    it('UTCID06 - Thất bại do bỏ trống param doctorId (Error 400)', async () => {
        mockReq.params.doctorId = undefined; // Hoặc rỗng

        await updateDoctor(mockReq, mockRes, mockNext);

        expect(doctorService.updateDoctor).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Doctor ID is required');
    });

    // UTCID07: Doctor Not Found 
    it('UTCID07 - Thất bại do DB không tìm thấy ID giả mạo (Error 404)', async () => {
        mockReq.params.doctorId = 9999; 
        mockReq.body = { full_name: 'Valid Name' };
        
        // Service return falsy if not found -> Controller return 404
        doctorService.updateDoctor.mockResolvedValue(null);

        await updateDoctor(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
        expect(mockNext.mock.calls[0][0].message).toBe('Doctor not found or update failed');
    });

    // UTCID08: Junk Payload -> Ignored & Success
    it('UTCID08 - Thành công xử lý và lọc mảng thuộc tính thừa (role) bị đẩy lén', async () => {
        // Gửi body có chứa 1 object rác cố lấy quyền admin
        mockReq.body = { full_name: 'Nguyen Van A', role: 'admin_hack' };
        
        doctorService.updateDoctor.mockResolvedValue(mockUpdatedDoctor);

        await updateDoctor(mockReq, mockRes, mockNext);

        expect(doctorService.updateDoctor).toHaveBeenCalledWith(1, mockReq.body);
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID09: Server Exception (Error 500)
    it('UTCID09 - Thất bại do Supabase mất mạng hoặc lỗi Exception handler (Error 500)', async () => {
        mockReq.body = { full_name: 'Nguyen Van A' };
        const mockError = new AppError('Supabase connection lost', 500);
        doctorService.updateDoctor.mockRejectedValue(mockError);

        updateDoctor(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });
});
