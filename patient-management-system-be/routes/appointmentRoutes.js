import express from "express";
import { 
  getListAppointmentsByAppointmentId, 
  getListAppointmentsByStatus, 
  createAppointmentForPatient,
  getListAppointments,
  cancelAppointment,
  approveAppointment,
  getListPendingAppointment,
  rescheduleAppointment 
} from "../controllers/appointmentController.js";
import { requireAuth } from "../middlewares/auth.js";

const appointmentRouter = express.Router();

appointmentRouter.get('/getList', getListAppointments);
appointmentRouter.get('/getList/:appointment_id', getListAppointmentsByAppointmentId);
appointmentRouter.get('/getListByStatus/:status', getListAppointmentsByStatus);
appointmentRouter.post('/create', requireAuth, createAppointmentForPatient);
appointmentRouter.post('/reschedule/:appointment_id', rescheduleAppointment);
appointmentRouter.patch('/cancel/:appointment_id', cancelAppointment);
appointmentRouter.put('/approve/:appointment_id', approveAppointment);
appointmentRouter.get('/pending', getListPendingAppointment);
export default appointmentRouter; 
