import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointments } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail/:doctorId', getDoctorById);
router.patch('/update/:doctorId', updateDoctor);
router.get('/appointments/:doctorId', getAppointments);

export default router;
