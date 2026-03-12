import * as doctorService from '../services/doctorService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const getAllDoctors = asyncHandler(async (req, res, next) => {
    const doctors = await doctorService.getAllDoctors();

    res.status(200).json({
        status: 'success',
        results: doctors.length,
        data: doctors
    });
});

export const getDoctorById = asyncHandler(async (req, res, next) => {
    const { doctorId } = req.params;

    if (!doctorId) {
        return next(new AppError('Doctor ID is null', 400));
    }

    const doctor = await doctorService.getDoctorById(doctorId);

    if (!doctor) {
        return next(new AppError('No doctor found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: doctor
    });
});

export const searchDoctors = asyncHandler(async (req, res, next) => {
    const { name, specialization, status } = req.query;

    const doctors = await doctorService.searchDoctors({ name, specialization, status });

    res.status(200).json({
        status: 'success',
        results: doctors.length,
        data: doctors
    });
});

export const updateDoctor = asyncHandler(async (req, res, next) => {
    // Lấy ID từ params (chuẩn RESTful: /doctors/update/:id) 
    const { doctorId } = req.params;
    const updateData = req.body;

    if (!doctorId) {
        return next(new AppError('Doctor ID is required', 400));
    }

    const updatedDoctor = await doctorService.updateDoctor(doctorId, updateData);

    if (!updatedDoctor) {
        return next(new AppError('Doctor not found or update failed', 404));
    }

    res.status(200).json({
        status: 'success',
        data: updatedDoctor
    });
});

export const createDoctorProfile = asyncHandler(async (req, res, next) => {
    const { doctorId } = req.params;
    const profileData = req.body;

    if (!doctorId) {
        return next(new AppError('Doctor ID is required', 400));
    }

    const doctor = await doctorService.createDoctorProfile(doctorId, profileData);

    res.status(201).json({
        status: 'success',
        data: doctor
    });
});

export const getAppointmentsByDoctorId = asyncHandler(async (req, res, next) => {
    const { doctorId } = req.params;
    const { date, status } = req.query; // Filter query params

    if (!doctorId) {
        return next(new AppError('Doctor ID is required', 400));
    }

    const appointments = await doctorService.getDoctorAppointmentsByDoctorId(doctorId, { date, status });

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: appointments
    });
});
