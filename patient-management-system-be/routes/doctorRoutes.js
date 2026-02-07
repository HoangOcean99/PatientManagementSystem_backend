import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail', getDoctorById);

export default router;
