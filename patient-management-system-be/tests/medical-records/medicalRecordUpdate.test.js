import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateMedicalRecord } from '../../controllers/medicalRecordController.js';
import * as medicalRecordService from '../../services/medicalRecordService.js';
import { AppError } from '../../utils/app-error.js';

vi.mock('../../services/medicalRecordService.js', () => ({
    updateMedicalRecord: vi.fn(),
    getMedicalRecordById: vi.fn()
}));

const mockUpdatedRecord = {
    record_id: 10,
    appointment_id: 5,
    doctor_id: 1,
    patient_id: 2,
    symptoms: 'Đau đầu, sốt',
    diagnosis: 'Cảm cúm',
    doctor_notes: 'Nghỉ ngơi 3 ngày',
    Prescriptions: [],
    LabOrders: []
};

describe('Medical Record Controller - updateMedicalRecord() (8 Cases)', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = { params: { recordId: 10 }, body: { doctor_id: 1 } };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    // UTCID01: Happy Path - Update diagnosis, symptoms -> 200
    it('UTCID01 - Cập nhật thành công trường chính (diagnosis, symptoms)', async () => {
        mockReq.body = { doctor_id: 1, diagnosis: 'Cảm cúm', symptoms: 'Đau đầu, sốt' };
        medicalRecordService.updateMedicalRecord.mockResolvedValue(mockUpdatedRecord);

        await updateMedicalRecord(mockReq, mockRes, mockNext);

        expect(medicalRecordService.updateMedicalRecord).toHaveBeenCalledWith(
            10,
            { diagnosis: 'Cảm cúm', symptoms: 'Đau đầu, sốt' },
            1
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'success',
            data: mockUpdatedRecord
        });
    });

    // UTCID02: Happy Path - Update kèm prescriptions array -> 200
    it('UTCID02 - Cập nhật thành công kèm sync đơn thuốc (prescriptions)', async () => {
        mockReq.body = {
            doctor_id: 1,
            prescriptions: [{ medicine_name: 'Paracetamol', dosage: '500mg', quantity: 10 }]
        };
        medicalRecordService.updateMedicalRecord.mockResolvedValue({
            ...mockUpdatedRecord,
            Prescriptions: [{ prescription_id: 1, medicine_name: 'Paracetamol' }]
        });

        await updateMedicalRecord(mockReq, mockRes, mockNext);

        expect(medicalRecordService.updateMedicalRecord).toHaveBeenCalledWith(
            10,
            { prescriptions: mockReq.body.prescriptions },
            1
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    // UTCID03: Missing recordId param -> 400
    it('UTCID03 - Thất bại do bỏ trống param recordId (Error 400)', async () => {
        mockReq.params.recordId = undefined;

        await updateMedicalRecord(mockReq, mockRes, mockNext);

        expect(medicalRecordService.updateMedicalRecord).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Record ID is required');
    });

    // UTCID04: Missing doctor_id in body -> 400
    it('UTCID04 - Thất bại do bỏ trống doctor_id trong body (Error 400)', async () => {
        mockReq.body = { diagnosis: 'Test' }; // no doctor_id

        await updateMedicalRecord(mockReq, mockRes, mockNext);

        expect(medicalRecordService.updateMedicalRecord).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        expect(mockNext.mock.calls[0][0].message).toBe('Doctor ID is required for authorization');
    });

    // UTCID05: Record not found -> 404
    it('UTCID05 - Thất bại do record không tồn tại trong DB (Error 404)', async () => {
        mockReq.body = { doctor_id: 1, diagnosis: 'Test' };
        const mockError = new AppError('Medical record not found', 404);
        medicalRecordService.updateMedicalRecord.mockRejectedValue(mockError);

        updateMedicalRecord(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID06: Doctor does not have permission -> 403
    it('UTCID06 - Thất bại do doctor_id không có quyền sửa record này (Error 403)', async () => {
        mockReq.body = { doctor_id: 999, diagnosis: 'Test' };
        const mockError = new AppError('You do not have permission to edit this record', 403);
        medicalRecordService.updateMedicalRecord.mockRejectedValue(mockError);

        updateMedicalRecord(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID07: Appointment status != in_progress -> 400
    it('UTCID07 - Thất bại do Appointment không ở trạng thái in_progress (Error 400)', async () => {
        mockReq.body = { doctor_id: 1, diagnosis: 'Test' };
        const mockError = new AppError('Cannot modify record. Appointment is completed', 400);
        medicalRecordService.updateMedicalRecord.mockRejectedValue(mockError);

        updateMedicalRecord(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    // UTCID08: DB Exception -> 500
    it('UTCID08 - Thất bại do lỗi Supabase / Exception hệ thống (Error 500)', async () => {
        mockReq.body = { doctor_id: 1, diagnosis: 'Test' };
        const mockError = new AppError('Supabase connection lost', 500);
        medicalRecordService.updateMedicalRecord.mockRejectedValue(mockError);

        updateMedicalRecord(mockReq, mockRes, mockNext);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });
});
