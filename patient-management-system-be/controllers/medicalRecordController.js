import * as medicalRecordService from '../services/medicalRecordService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const startExamination = asyncHandler(async (req, res, next) => {
    // Trong thực tế doctor_id sẽ lấy từ token (req.user.id), 
    // ở đây dùng body tạm thời cho việc test API
    const { appointment_id, doctor_id, patient_id } = req.body;
    
    if (!appointment_id || !doctor_id || !patient_id) {
        return next(new AppError('Missing appointment_id, doctor_id, or patient_id', 400));
    }

    const newRecord = await medicalRecordService.startExamination(appointment_id, doctor_id, patient_id);

    res.status(200).json({
        status: 'success',
        message: 'Examination started, medical record initialized',
        data: newRecord
    });
});

export const updateMedicalRecord = asyncHandler(async (req, res, next) => {
    const { recordId } = req.query;
    // Tương tự, doctor_id nên lấy từ token
    const { doctor_id, ...updateData } = req.body;

    if (!recordId) {
        return next(new AppError('Record ID is required', 400));
    }
    
    if (!doctor_id) {
        return next(new AppError('Doctor ID is required for authorization', 400));
    }

    const updatedRecord = await medicalRecordService.updateMedicalRecord(recordId, updateData, doctor_id);

    res.status(200).json({
        status: 'success',
        data: updatedRecord
    });
});

export const completeExamination = asyncHandler(async (req, res, next) => {
    const { recordId } = req.query;
    const { doctor_id } = req.body; // mock user token

    if (!recordId) {
        return next(new AppError('Record ID is required', 400));
    }
    
    if (!doctor_id) {
        return next(new AppError('Doctor ID is required for authorization', 400));
    }

    const result = await medicalRecordService.completeExamination(recordId, doctor_id);

    res.status(200).json({
        status: 'success',
        message: result.message
    });
});

export const getMedicalRecordById = asyncHandler(async (req, res, next) => {
    const { recordId } = req.query;

    if (!recordId) {
        return next(new AppError('Record ID is required', 400));
    }

    const record = await medicalRecordService.getMedicalRecordById(recordId);

    if (!record) {
        return next(new AppError('No record found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: record
    });
});

export const getMedicalRecordByAppointment = asyncHandler(async (req, res, next) => {
    const { appointmentId } = req.query;

    if (!appointmentId) {
        return next(new AppError('Appointment ID is required', 400));
    }

    const record = await medicalRecordService.getMedicalRecordByAppointment(appointmentId);

    res.status(200).json({
        status: 'success',
        data: record || null
    });
});

export const getMedicalRecordsByPatient = asyncHandler(async (req, res, next) => {
    const { patientId } = req.query;

    if (!patientId) {
        return next(new AppError('Patient ID is required', 400));
    }

    const records = await medicalRecordService.getMedicalRecordsByPatient(patientId);

    res.status(200).json({
        status: 'success',
        results: records.length,
        data: records
    });
});
