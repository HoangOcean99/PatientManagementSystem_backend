import express from 'express';
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

const router = express.Router();

// --- Public / Authenticated routes ---
router.get('/list', getAllSlots);
router.get('/detail/:slotId', getSlotById);

// --- Admin-only routes ---
router.post('/create', requireAuth, createSlotValidator, createSlot);
router.post('/create-bulk', requireAuth, createBulkSlotsValidator, createBulkSlots);
router.patch('/update/:slotId', requireAuth, updateSlotValidator, updateSlot);
router.delete('/delete/:slotId', requireAuth, deleteSlotValidator, deleteSlot);
router.post('/delete-bulk', requireAuth, deleteBulkSlotsValidator, deleteBulkSlots);

export default router;

import { getListDoctorSlots } from "../controllers/doctorSlotController.js";
import { getAvailableDoctorSlotsByDoctorIdAndDate } from "../controllers/doctorSlotController.js";
import { createDoctorSlot } from "../controllers/doctorSlotController.js";
import { getDoctorSlotById } from "../controllers/doctorSlotController.js";

const doctorSlotRouter = express.Router();
doctorSlotRouter.get('/getList', getListDoctorSlots);
doctorSlotRouter.get('/getById/:slot_id', getDoctorSlotById);
doctorSlotRouter.post('/getAvailableDoctorSlotsByDoctorIdAndDate', getAvailableDoctorSlotsByDoctorIdAndDate);
doctorSlotRouter.post('/create', createDoctorSlot);
export default doctorSlotRouter;

