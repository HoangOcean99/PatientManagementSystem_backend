import express from "express";
import { createPatient, getPatient } from "../controllers/patientController.js";
// import { auth, checkRole } from "../middlewares/auth.js";

const patientRouter = express.Router();

// Create Patient
// patientRouter.post("/", auth, checkRole(["admin"]), createPatient);
patientRouter.post("/", createPatient);

// Get List Patients
// patientRouter.get("/", auth, checkRole(["admin", "doctor"]), getPatient);
patientRouter.get("/", getPatient);

export default patientRouter;
