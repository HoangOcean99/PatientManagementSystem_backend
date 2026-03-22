import express from "express";
import {
  getListDoctorSlots,
  getAvailableDoctorSlotsByDoctorIdAndDate,
  getAvailableDoctorSlotsByDoctorIdAndExactDate,
  createDoctorSlot,
  getDoctorSlotById,
  getAvailableDoctorSlots
} from "../controllers/doctorSlotController.js";

const doctorSlotRouter = express.Router();
doctorSlotRouter.get('/getList', getListDoctorSlots);
doctorSlotRouter.get('/getById/:slot_id', getDoctorSlotById);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndDate', getAvailableDoctorSlotsByDoctorIdAndDate);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndExactDate', getAvailableDoctorSlotsByDoctorIdAndExactDate);
doctorSlotRouter.post('/getAvailableDoctorSlots', getAvailableDoctorSlots);
doctorSlotRouter.post('/create', createDoctorSlot);
export default doctorSlotRouter;

