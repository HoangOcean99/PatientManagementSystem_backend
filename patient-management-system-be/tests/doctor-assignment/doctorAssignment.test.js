import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPatientsUnderCare, assignPatient, updateAssignment, dischargePatient } from '../../controllers/doctorAssignmentController.js';
import * as doctorAssignmentService from '../../services/doctorAssignmentService.js';
import { AppError } from '../../utils/app-error.js';

// Mock the service
vi.mock('../../services/doctorAssignmentService.js', () => ({
    getPatientsUnderCare: vi.fn(),
    assignPatient: vi.fn(),
    updateAssignment: vi.fn(),
    dischargePatient: vi.fn(),
}));

describe('Under My Care Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            params: {},
            query: {},
            body: {},
            user: { id: 'user-123' } // Tạm mock user ID
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    describe('getPatientsUnderCare()', () => {
        it('should return list of patients successfully', async () => {
            mockReq.params.doctorId = 'doc-1';
            mockReq.query = { status: 'active', careType: 'primary', page: 1, pageSize: 10 };

            const mockData = {
                data: [{ assignment_id: '1', patient_id: 'pat-1' }],
                pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }
            };
            doctorAssignmentService.getPatientsUnderCare.mockResolvedValue(mockData);

            await getPatientsUnderCare(mockReq, mockRes, mockNext);

            expect(doctorAssignmentService.getPatientsUnderCare).toHaveBeenCalledWith('doc-1', expect.objectContaining({
                status: 'active',
                careType: 'primary'
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                ...mockData
            });
        });

        it('should throw error if doctorId is missing', async () => {
            await getPatientsUnderCare(mockReq, mockRes, mockNext);

            // Because it's wrapped in asyncHandler, it passes error to next
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            expect(mockNext.mock.calls[0][0].message).toBe("Doctor ID is required");
        });
    });

    describe('assignPatient()', () => {
        it('should assign patient successfully', async () => {
            mockReq.params.doctorId = 'doc-1';
            mockReq.body = { patient_id: 'pat-1', care_type: 'primary', notes: 'Test note' };

            const mockReturn = { assignment_id: '1', doctor_id: 'doc-1', patient_id: 'pat-1' };
            doctorAssignmentService.assignPatient.mockResolvedValue(mockReturn);

            await assignPatient(mockReq, mockRes, mockNext);

            expect(doctorAssignmentService.assignPatient).toHaveBeenCalledWith(
                'doc-1', 'pat-1', 'user-123', 'primary', 'Test note'
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Patient assigned successfully',
                data: mockReturn
            });
        });
    });

    describe('updateAssignment()', () => {
        it('should update assignment successfully', async () => {
            mockReq.params.assignmentId = 'assign-1';
            mockReq.body = { notes: 'Updated notes' };

            const mockReturn = { assignment_id: 'assign-1', notes: 'Updated notes' };
            doctorAssignmentService.updateAssignment.mockResolvedValue(mockReturn);

            await updateAssignment(mockReq, mockRes, mockNext);

            expect(doctorAssignmentService.updateAssignment).toHaveBeenCalledWith('assign-1', mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Assignment updated successfully',
                data: mockReturn
            });
        });
    });

    describe('dischargePatient()', () => {
        it('should discharge patient successfully', async () => {
            mockReq.params.assignmentId = 'assign-1';

            const mockReturn = { assignment_id: 'assign-1', status: 'discharged' };
            doctorAssignmentService.dischargePatient.mockResolvedValue(mockReturn);

            await dischargePatient(mockReq, mockRes, mockNext);

            expect(doctorAssignmentService.dischargePatient).toHaveBeenCalledWith('assign-1');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Patient discharged successfully',
                data: mockReturn
            });
        });
    });
});
