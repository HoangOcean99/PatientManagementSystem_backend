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
