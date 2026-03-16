import express from 'express';
import { getListDoctorSlots } from "../controllers/doctorSlotController.js";
import { getAvailableDoctorSlotsByDoctorIdAndDate } from "../controllers/doctorSlotController.js";
import { createDoctorSlot } from "../controllers/doctorSlotController.js";
import { getDoctorSlotById } from "../controllers/doctorSlotController.js";
import {
    getAllSlots,
    getSlotById,
    createSlot,
    createBulkSlots,
    updateSlot,
    deleteSlot,
    deleteBulkSlots
} from '../controllers/doctorSlotController.js';
import {
    createSlotValidator,
    createBulkSlotsValidator,
    updateSlotValidator,
    deleteSlotValidator,
    deleteBulkSlotsValidator
} from '../middlewares/doctorSlotValidator.js';
import { requireAuth } from '../middlewares/auth.js';

const doctorSlotRouter = express.Router();
doctorSlotRouter.get('/getList', getListDoctorSlots);
doctorSlotRouter.get('/getById/:slot_id', getDoctorSlotById);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndDate', getAvailableDoctorSlotsByDoctorIdAndDate);
doctorSlotRouter.post('/create', createDoctorSlot);

// --- Public / Authenticated routes ---
doctorSlotRouter.get('/list', getAllSlots);
doctorSlotRouter.get('/detail/:slotId', getSlotById);

// --- Admin-only routes ---
doctorSlotRouter.post('/create', requireAuth, createSlotValidator, createSlot);
doctorSlotRouter.post('/create-bulk', requireAuth, createBulkSlotsValidator, createBulkSlots);
doctorSlotRouter.patch('/update/:slotId', requireAuth, updateSlotValidator, updateSlot);
doctorSlotRouter.delete('/delete/:slotId', requireAuth, deleteSlotValidator, deleteSlot);
doctorSlotRouter.post('/delete-bulk', requireAuth, deleteBulkSlotsValidator, deleteBulkSlots);

export default doctorSlotRouter;
