import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointmentsByDoctorId } from '../controllers/doctorController.js';
import { updateDoctorValidator } from '../middlewares/doctorValidator.js';

const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail/:doctorId', getDoctorById);
router.patch('/update/:doctorId', updateDoctorValidator, updateDoctor);
router.get('/appointments/:doctorId', getAppointmentsByDoctorId);

export default router;

