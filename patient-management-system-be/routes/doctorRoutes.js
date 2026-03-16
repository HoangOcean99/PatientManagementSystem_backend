import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointmentsByDoctorId, createDoctorProfile, getPatientById } from '../controllers/doctorController.js';
import { updateDoctorValidator, createDoctorProfileValidator } from '../middlewares/doctorValidator.js';

const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail/:doctorId', getDoctorById);
router.post('/setup/:doctorId', createDoctorProfileValidator, createDoctorProfile);
router.patch('/update/:doctorId', updateDoctorValidator, updateDoctor);
router.get('/appointments/:doctorId', getAppointmentsByDoctorId);
router.get('/patient/:patientId', getPatientById);

export default router;

