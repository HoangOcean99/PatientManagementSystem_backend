import express from "express";
import {
  createPatient,
  getPatient,
  getPatientById,
  updatePatient,
  updatePatientInfo,
  deletePatient,
} from "../controllers/patientController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { requireRole } from "../middlewares/auth.js";

const patientRouter = express.Router();

// Create Patient
patientRouter.post("/", requireRole(["admin", "receptionist"]), createPatient);

// Get List Patients
patientRouter.get("/", requireRole(["admin", "doctor", "receptionist"]), getPatient);

// Get Patient by ID
patientRouter.get("/:id", getPatientById);

// Update Patient
patientRouter.put("/update", upload.single("avatar"), updatePatient);
patientRouter.put("/update-info", updatePatientInfo);

// Delete Patient
patientRouter.delete("/:id", requireRole(["admin"]), deletePatient);

export default patientRouter;
