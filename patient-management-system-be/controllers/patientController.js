import asyncHandler from "../utils/async-handler.js";
import * as patientService from "../services/patientService.js";
import { AppError } from "../utils/app-error.js";
export const createPatient = asyncHandler(async (req, res) => {
  const { patient_id, dob, gender, address } = req.body;

  if (!patient_id || !dob || !gender || !address) {
    throw new AppError("Missing required fields", 400);
  }

  const newPatient = await patientService.createPatient(req.body);

  res.status(201).json({
    success: true,
    message: "Patient created successfully",
    data: newPatient,
  });
});

export const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError("Patient ID is required", 400);
  }

  const patient = await patientService.getPatientById(id);

  res.status(200).json({
    success: true,
    data: patient,
  });
});

export const getPatient = asyncHandler(async (req, res) => {
  const { keyword, gender, status, page, pageSize } = req.query;

  const result = await patientService.getPatientList({
    keyword: keyword || "",
    gender: gender || "",
    status: status || "",
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 10,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});
export const updatePatient = asyncHandler(async (req, res) => {
    const payload = req.body;
    const patientId = payload.patient_id;

    if (!patientId) {
        throw new AppError("Patient ID is required", 400);
    }

  await patientService.updatePatient(patientId, payload);
  res.status(200).json({
    success: true,
    message: "Patient updated successfully",
  });
});

export const updatePatientInfo = asyncHandler(async (req, res) => {
  const payload = req.body;
  const { id } = payload;
  
  if (!id) {
    throw new AppError("Patient ID is required", 400);
  }

  const updatedPatient = await patientService.updatePatientInfo(id, payload);
  res.status(200).json({
    success: true,
    message: "Patient info updated successfully",
    data: updatedPatient
  });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError("Patient ID is required", 400);
  }
  
  await patientService.deletePatient(id);
  
  res.status(200).json({
    success: true,
    message: "Patient deleted successfully",
  });
});
