import express from "express";
import { getListAppointments } from "../controllers/appointmentController.js";
import { createAppointment } from "../controllers/appointmentController.js";
import { requireAuth } from "../middlewares/auth.js";
import { checkDependentAccess } from "../middlewares/familyAccess.js";
const appointmentRouter = express.Router();

appointmentRouter.get('/getList', getListAppointments);
appointmentRouter.post('/create', requireAuth, checkDependentAccess, createAppointment);
appointmentRouter.post('/update', requireAuth, checkDependentAccess, createAppointment);
export default appointmentRouter;