import express from "express";
import { assignAppointmentToRoom } from "../controllers/receptionistController.js";
const receptionistRouter = express.Router();

receptionistRouter.post("/assignAppointmentToRoom/:appointment_id", assignAppointmentToRoom); 

export default receptionistRouter;

