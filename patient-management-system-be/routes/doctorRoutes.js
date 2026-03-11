import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointments } from '../controllers/doctorController.js';
import { updateDoctorValidator } from '../middlewares/doctorValidator.js';
import { getDoctorByDepartmentId } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/list', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/detail/:doctorId', getDoctorById);
router.patch('/update/:doctorId', updateDoctorValidator, updateDoctor);
router.get('/appointments/:doctorId', getAppointments);
router.get('/get-doctors-by-department/:departmentId', getDoctorByDepartmentId);

export default router;

