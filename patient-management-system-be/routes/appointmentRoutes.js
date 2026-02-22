import express from "express";
import { getListAppointments } from "../controllers/appointmentController.js";
const appointmentRouter = express.Router();

appointmentRouter.get('/getList', getListAppointments);
export default appointmentRouter;