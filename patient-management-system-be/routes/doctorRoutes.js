import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointmentsByDoctorId, createDoctorProfile, getDoctorByDepartmentId, getPatientById } from '../controllers/doctorController.js';
import { updateDoctorValidator, createDoctorProfileValidator } from '../middlewares/doctorValidator.js';
import { upload } from '../middlewares/uploadMiddleware.js';


const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail/:doctorId', getDoctorById);
router.post('/setup/:doctorId', createDoctorProfileValidator, createDoctorProfile);
router.put('/update', updateDoctorValidator, upload.single("avatar"), updateDoctor);
router.get('/appointments/:doctorId', getAppointmentsByDoctorId);
router.get('/get-doctors-by-department/:departmentId', getDoctorByDepartmentId);
router.get('/patient/:patientId', getPatientById);

export default router;

