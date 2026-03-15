import express from 'express';
import { getAllSlots, getSlotById, createSlot, createBulkSlots, updateSlot, deleteSlot, deleteBulkSlots } from '../controllers/doctorSlotController.js';
import { createSlotValidator, createBulkSlotsValidator, updateSlotValidator, deleteSlotValidator, deleteBulkSlotsValidator } from '../middlewares/doctorSlotValidator.js';
import { requireAuth } from '../middlewares/auth.js';
import { getListDoctorSlots, getAvailableDoctorSlotsByDoctorIdAndDate, createDoctorSlot, getDoctorSlotById } from "../controllers/doctorSlotController.js";
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



router.get('/getList', getListDoctorSlots);
router.get('/getById/:slot_id', getDoctorSlotById);
router.post('/getAvailableDoctorSlotsByDoctorIdAndDate', getAvailableDoctorSlotsByDoctorIdAndDate);
router.post('/create', createDoctorSlot);
export default router;

