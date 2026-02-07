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
    const { doctorId } = req.query;

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
