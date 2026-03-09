import express from "express";
import { getListAppointments } from "../controllers/appointmentController.js";
import { createAppointmentForPatient } from "../controllers/appointmentController.js";
import { cancelAppointment } from "../controllers/appointmentController.js";
import { approveAppointment } from "../controllers/appointmentController.js";
import { getListPendingAppointment } from "../controllers/appointmentController.js";
import { rescheduleAppointment } from "../controllers/appointmentController.js";
import { getListAppointmentsByAppointmentId } from "../controllers/appointmentController.js";
const appointmentRouter = express.Router();

appointmentRouter.get('/getList', getListAppointments);
appointmentRouter.get('/getList/:appointment_id', getListAppointmentsByAppointmentId);
appointmentRouter.post('/create', createAppointmentForPatient);
appointmentRouter.post('/reschedule/:appointment_id', rescheduleAppointment);
appointmentRouter.patch('/cancel/:appointment_id', cancelAppointment);
appointmentRouter.put('/approve/:appointment_id', approveAppointment);
appointmentRouter.get('/pending', getListPendingAppointment);
export default appointmentRouter; 