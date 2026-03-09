import express from "express";
import { getListAppointments } from "../controllers/appointmentController.js";
import { createAppointment } from "../controllers/appointmentController.js";
const appointmentRouter = express.Router();

appointmentRouter.get('/getList', getListAppointments);
appointmentRouter.post('/create', createAppointment);
appointmentRouter.post('/update', createAppointment);
export default appointmentRouter;