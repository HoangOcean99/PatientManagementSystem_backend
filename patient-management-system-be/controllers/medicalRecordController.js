import * as medicalRecordService from '../services/medicalRecordService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { checkDependentAccess } from '../middlewares/auth.js';

export const startExamination = asyncHandler(async (req, res, next) => {
    const { appointment_id, doctor_id } = req.body;

    if (!appointment_id) {
        return next(new AppError('Appointment ID is required', 400));
    }

    if (!doctor_id) {
        return next(new AppError('Doctor ID is required', 400));
    }

    const newRecord = await medicalRecordService.startExamination(appointment_id, doctor_id);

    res.status(200).json({
        status: 'success',
        message: 'Examination started, medical record initialized',
        data: newRecord
    });
});

export const updateMedicalRecord = asyncHandler(async (req, res, next) => {
    const { recordId } = req.params;
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
    const { record_id, doctor_id, invoiceData } = req.body;

    if (!record_id) {
        return next(new AppError('Record ID is required', 400));
    }

    if (!doctor_id) {
        return next(new AppError('Doctor ID is required for authorization', 400));
    }

    const result = await medicalRecordService.completeExamination(record_id, doctor_id, invoiceData);

    res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.invoice
    });
});

export const getMedicalRecordById = asyncHandler(async (req, res, next) => {
    const { recordId } = req.params;

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
    const { appointmentId } = req.params;

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
    try {
        const { patientId } = req.params;

        if (!patientId) {
            return next(new AppError('Patient ID is required', 400));
        }

        if (!req.user || !req.user.id) {
            return res.status(500).json({ message: "req.user.id is missing. Make sure requireAuth middleware is applied to the route." });
        }


        const records = await medicalRecordService.getMedicalRecordsByPatient(patientId);

        res.status(200).json({
            status: 'success',
            results: records?.length || 0,
            data: records
        });
    } catch (err) {
        console.error("GET_MEDICAL_RECORDS_ERR:", err);
        return res.status(500).json({
            message: "DEBUG_500: " + err.message,
            stack: err.stack
        });
    }
});

export const sendFollowUpReminder = asyncHandler(async (req, res, next) => {
    const { patient_id, doctor_id, follow_up_date } = req.body;

    if (!patient_id || !doctor_id || !follow_up_date) {
        return next(new AppError('patient_id, doctor_id and follow_up_date are required', 400));
    }

    const result = await medicalRecordService.sendFollowUpReminder(patient_id, doctor_id, follow_up_date);

    res.status(200).json({
        status: 'success',
        message: result.message
    });
});

