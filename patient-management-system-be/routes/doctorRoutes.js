import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail', getDoctorById);
router.patch('/update/:doctorId', updateDoctor);

export default router;
