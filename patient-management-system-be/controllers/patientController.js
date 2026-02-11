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
