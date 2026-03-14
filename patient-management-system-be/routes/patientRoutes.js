import express from "express";
import {
  createPatient,
  getPatient,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
// import { auth, checkRole } from "../middlewares/auth.js";

const patientRouter = express.Router();

// Create Patient
// patientRouter.post("/", auth, checkRole(["admin"]), createPatient);
patientRouter.post("/", createPatient);

// Get List Patients
// patientRouter.get("/", auth, checkRole(["admin", "doctor"]), getPatient);
patientRouter.get("/", getPatient);

// Get Patient by ID
patientRouter.get("/:id", getPatientById);

// Update Patient
// patientRouter.put("/:id", auth, checkRole(["admin"]), updatePatient);
patientRouter.put("/update", upload.single("avatar"), updatePatient);

// Delete Patient
patientRouter.delete("/:id", deletePatient);

export default patientRouter;
