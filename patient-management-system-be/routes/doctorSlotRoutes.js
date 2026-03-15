import express from "express";
import { getListDoctorSlots } from "../controllers/doctorSlotController.js";
import { getAvailableDoctorSlotsByDoctorIdAndDate } from "../controllers/doctorSlotController.js";
import { createDoctorSlot } from "../controllers/doctorSlotController.js";
import { getDoctorSlotById } from "../controllers/doctorSlotController.js";
import { getAvailableDoctorSlotsByDate } from "../controllers/doctorSlotController.js";


const doctorSlotRouter = express.Router();
doctorSlotRouter.get('/getList', getListDoctorSlots);
doctorSlotRouter.get('/getById/:slot_id', getDoctorSlotById);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndDate', getAvailableDoctorSlotsByDoctorIdAndDate);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDate', getAvailableDoctorSlotsByDate);
doctorSlotRouter.post('/create', createDoctorSlot);
export default doctorSlotRouter;

