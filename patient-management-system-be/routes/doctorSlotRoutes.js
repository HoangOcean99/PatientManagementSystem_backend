import express from "express";
import { getListDoctorSlots } from "../controllers/doctorSlotController.js";
import { getAvailableDoctorSlotsInMonth } from "../controllers/doctorSlotController.js";
import { createDoctorSlot } from "../controllers/doctorSlotController.js";
import { getDoctorSlotById } from "../controllers/doctorSlotController.js";

const doctorSlotRouter = express.Router();
doctorSlotRouter.get('/getList', getListDoctorSlots);
doctorSlotRouter.get('/getById/:slot_id', getDoctorSlotById);
doctorSlotRouter.post('/getAvailableDoctorSlotsInMonth', getAvailableDoctorSlotsInMonth);
doctorSlotRouter.post('/create', createDoctorSlot);
export default doctorSlotRouter;

