import express from "express";
import {
    getPatientsUnderCare,
    assignPatient,
    updateAssignment,
    dischargePatient,
} from "../controllers/doctorAssignmentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireRole(['admin', 'doctor']));

// Get patients under doctor's care
router.get("/:doctorId", requireAuth, getPatientsUnderCare);

// Assign a patient to a doctor
router.post("/:doctorId", requireAuth, assignPatient);

// Update an assignment
router.put("/:assignmentId", requireAuth, updateAssignment);

// Discharge a patient
router.patch("/:assignmentId/discharge", requireAuth, dischargePatient);

export default router;
