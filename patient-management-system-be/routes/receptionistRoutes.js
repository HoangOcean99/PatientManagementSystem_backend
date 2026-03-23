import express from "express";
import { assignAppointmentToRoom } from "../controllers/receptionistController.js";
import { requireRole } from "../middlewares/auth.js";
const receptionistRouter = express.Router();

receptionistRouter.post("/assignAppointmentToRoom/:appointment_id", requireRole(['admin', 'receptionist']), assignAppointmentToRoom); 

export default receptionistRouter;

