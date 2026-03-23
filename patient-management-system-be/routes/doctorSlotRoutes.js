import express from "express";
import {
  getListDoctorSlots,
  getAvailableDoctorSlotsByDoctorIdAndDate,
  getAvailableDoctorSlotsByDoctorIdAndExactDate,
  getDoctorSlotById,
  getAvailableDoctorSlots,
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot
} from "../controllers/doctorSlotController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createSlotValidator, updateSlotValidator, deleteSlotValidator } from "../middlewares/doctorSlotValidator.js";

const doctorSlotRouter = express.Router();
doctorSlotRouter.get('/getList', getListDoctorSlots);
doctorSlotRouter.get('/getById/:slot_id', getDoctorSlotById);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndDate', getAvailableDoctorSlotsByDoctorIdAndDate);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndExactDate', getAvailableDoctorSlotsByDoctorIdAndExactDate);
doctorSlotRouter.post('/getAvailableDoctorSlots', getAvailableDoctorSlots);
// --- Public / Authenticated routes ---
doctorSlotRouter.get('/list', getAllSlots);
doctorSlotRouter.get('/detail/:slotId', getSlotById);

// --- Admin-only routes ---
doctorSlotRouter.post('/create', requireAuth, requireRole(['admin', 'doctor']), createSlotValidator, createSlot);
doctorSlotRouter.patch('/update/:slotId', requireAuth, requireRole(['admin', 'doctor']), updateSlotValidator, updateSlot);
doctorSlotRouter.delete('/delete/:slotId', requireAuth, requireRole(['admin', 'doctor']), deleteSlotValidator, deleteSlot);

export default doctorSlotRouter;

