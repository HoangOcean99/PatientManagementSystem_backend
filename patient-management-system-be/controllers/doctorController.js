import * as doctorService from '../services/doctorService.js';
import * as patientService from '../services/patientService.js';
import asyncHandler from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const getAllDoctors = asyncHandler(async (req, res, next) => {
    const doctors = await doctorService.getAllDoctors();

    res.status(200).json({
        status: 'success',
        // results: doctors.length,
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
    const updateData = req.body;
    const avatarFile = req.file || null;

    const updatedDoctor = await doctorService.updateDoctor(updateData, avatarFile);

    if (!updatedDoctor) {
        return next(new AppError('Doctor not found or update failed', 404));
    }

    res.status(200).json({
        status: 'success',
        data: updatedDoctor
    });
});

export const updateDoctorInfo = asyncHandler(async (req, res, next) => {
    const updateData = req.body;

    const updatedDoctor = await doctorService.updateDoctorInfo(updateData);

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

export const getDoctorByDepartmentId = asyncHandler(async (req, res, next) => {
    const { departmentId } = req.params;

    const doctors = await doctorService.getDoctorByDepartmentId(departmentId);

    res.status(200).json({
        status: 'success',
        results: doctors.length,
        data: doctors
    })
});

export const getPatientById = asyncHandler(async (req, res, next) => {
    const { patientId } = req.params;

    if (!patientId) {
        return next(new AppError('Patient ID is required', 400));
    }

    const patient = await patientService.getPatientById(patientId);

    res.status(200).json({
        status: 'success',
        data: patient
    });
});

export const createDoctor = asyncHandler(async (req, res, next) => {
    const { doctor } = req.body;
    const createdDoctor = await doctorService.createDoctor(doctor);

    res.status(200).json({
        status: 'success',
        data: createdDoctor
    });
});

export const updateDoctorById = asyncHandler(async (req, res, next) => {
    const { doctorId } = req.params;
    const updateData = req.body;

    const updatedDoctor = await doctorService.updateDoctorById(doctorId, updateData);

    res.status(200).json({
        status: 'success',
        data: updatedDoctor
    });
});

export const deleteDoctorById = asyncHandler(async (req, res, next) => {
    const { doctorId } = req.params;

    const deletedDoctor = await doctorService.deleteDoctorById(doctorId);

    res.status(200).json({
        status: 'success',
        data: deletedDoctor
    });
});