import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchDoctors } from '../../controllers/doctorController.js';
import * as doctorService from '../../services/doctorService.js';
import { AppError } from '../../utils/app-error.js';

// 1. Mock module doctorService (Phần dependency gọi DB)
vi.mock('../../services/doctorService.js', () => ({
    searchDoctors: vi.fn()
}));

const testDoctors = [
    { doctor_id: 1, specialization: 'Nội tiết', Users: { full_name: 'Nguyễn Văn A', status: 'hoạt động' } },
    { doctor_id: 2, specialization: 'Tim mạch', Users: { full_name: 'Trần Thị B', status: 'hoạt động' } }
];

describe('Doctor Controller - searchDoctors()', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        // Reset lại Request, Response, Next function cho từng test case
        mockReq = { query: {} };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    // UTCID01: Tìm với full cả 3 trường
    it('UTCID01 - Should return list when searching by Name, Specialization, and Status', async () => {
        mockReq.query = { name: 'Nguyễn Văn A', specialization: 'Nội tiết', status: 'hoạt động' };
        doctorService.searchDoctors.mockResolvedValue([testDoctors[0]]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: 'Nguyễn Văn A',
            specialization: 'Nội tiết',
            status: 'hoạt động'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            results: 1,
            data: [testDoctors[0]]
        });
    });

    // UTCID02: Không truyền trường nào (empty) -> List all
    it('UTCID02 - Should return all doctors when no query params are provided', async () => {
        mockReq.query = {};
        doctorService.searchDoctors.mockResolvedValue(testDoctors);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: undefined,
            specialization: undefined,
            status: undefined
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            results: 2,
            data: testDoctors
        });
    });

    // UTCID03: Tìm riêng rẽ bằng Name
    it('UTCID03 - Should return doctors matching the Name only', async () => {
        mockReq.query = { name: 'Nguyễn Văn A' };
        doctorService.searchDoctors.mockResolvedValue([testDoctors[0]]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: 'Nguyễn Văn A',
            specialization: undefined,
            status: undefined
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID04: Tìm riêng rẽ bằng Specialization
    it('UTCID04 - Should return doctors matching the Specialization only', async () => {
        mockReq.query = { specialization: 'Nội tiết' };
        doctorService.searchDoctors.mockResolvedValue([testDoctors[0]]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: undefined,
            specialization: 'Nội tiết',
            status: undefined
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID05: Tìm riêng rẽ bằng Status
    it('UTCID05 - Should return doctors matching the Status only', async () => {
        mockReq.query = { status: 'hoạt động' };
        doctorService.searchDoctors.mockResolvedValue(testDoctors);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: undefined,
            specialization: undefined,
            status: 'hoạt động'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID06: Nhập sai Name -> Không tìm thấy ai
    it('UTCID06 - Should return empty array when no doctors match the query', async () => {
        mockReq.query = { name: 'AbcXyz' }; // Not exist
        doctorService.searchDoctors.mockResolvedValue([]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: 'AbcXyz',
            specialization: undefined,
            status: undefined
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            results: 0,
            data: []
        });
    });


    // UTCID07: Tìm Name + Specialization
    it('UTCID07 - Should return doctors matching Name and Specialization', async () => {
        mockReq.query = { name: 'Nguyễn Văn A', specialization: 'Nội tiết' };
        doctorService.searchDoctors.mockResolvedValue([testDoctors[0]]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: 'Nguyễn Văn A',
            specialization: 'Nội tiết',
            status: undefined
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID08: Tìm Name + Status
    it('UTCID08 - Should return doctors matching Name and Status', async () => {
        mockReq.query = { name: 'Nguyễn Văn A', status: 'hoạt động' };
        doctorService.searchDoctors.mockResolvedValue([testDoctors[0]]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: 'Nguyễn Văn A',
            specialization: undefined,
            status: 'hoạt động'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID09: Tìm Specialization + Status
    it('UTCID09 - Should return doctors matching Specialization and Status', async () => {
        mockReq.query = { specialization: 'Nội tiết', status: 'hoạt động' };
        doctorService.searchDoctors.mockResolvedValue([testDoctors[0]]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: undefined,
            specialization: 'Nội tiết',
            status: 'hoạt động'
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID10: Nhập bừa Name và Spec -> Return Không tìm thấy
    it('UTCID10 - Should return empty when submitting arbitrary random Name and Spec', async () => {
        mockReq.query = { name: 'KhongTonTai', specialization: 'Nhập bừa' };
        doctorService.searchDoctors.mockResolvedValue([]);

        await searchDoctors(mockReq, mockRes, mockNext);

        expect(doctorService.searchDoctors).toHaveBeenCalledWith({
            name: 'KhongTonTai',
            specialization: 'Nhập bừa',
            status: undefined
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            results: 0,
            data: []
        });
    });

    // UTCID11: Lỗi từ tầng Service/DB (Mất kết nối server - Error 500)
    it('UTCID11 - Should pass error to next() if service throws an AppError', async () => {
        mockReq.query = { name: 'Nguyễn Văn A' };
        
        // Mô phỏng Service bắn ra lỗi giống file doctorService.js (dòng 88)
        const mockError = new AppError('Database connection error', 500);
        doctorService.searchDoctors.mockRejectedValue(mockError);

        // Do sử dụng asyncHandler không return Promise, ta không dùng await trực tiếp được
        searchDoctors(mockReq, mockRes, mockNext);

        // Chờ JS Event Loop xử lý xong Promise bị reject
        await new Promise(resolve => setTimeout(resolve, 0));

        // asyncHandler catch và truyền error cho next()
        expect(mockNext).toHaveBeenCalledWith(mockError);
        // Status không bị set bởi thành công
        expect(mockRes.status).not.toHaveBeenCalled();
    });
});
