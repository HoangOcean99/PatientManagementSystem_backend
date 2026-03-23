import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, updateDoctorInfo, getAppointmentsByDoctorId, createDoctorProfile, getDoctorByDepartmentId, getPatientById } from '../controllers/doctorController.js';
import { updateDoctorValidator, createDoctorProfileValidator } from '../middlewares/doctorValidator.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { createDoctor } from '../controllers/doctorController.js';
import { updateDoctorById } from '../controllers/doctorController.js';
import { deleteDoctorById } from '../controllers/doctorController.js';
import { requireRole } from '../middlewares/auth.js';

const doctorRouter = express.Router();

doctorRouter.post('/setup/:doctorId', requireRole(['admin']), createDoctorProfileValidator, createDoctorProfile);
doctorRouter.put('/update', requireRole(['admin', 'receptionist']), updateDoctorValidator, upload.single("avatar"), updateDoctor);
doctorRouter.put('/update-info', requireRole(['admin', 'receptionist']), updateDoctorInfo);
doctorRouter.get('/appointments/:doctorId', getAppointmentsByDoctorId);
doctorRouter.get('/patient/:patientId', getPatientById);
doctorRouter.get('/search', searchDoctors);
doctorRouter.get('/detail/:doctorId', getDoctorById);
doctorRouter.patch('/update/:doctorId', requireRole(['admin']), updateDoctorById);
doctorRouter.get('/get-doctors-by-department/:departmentId', getDoctorByDepartmentId);
doctorRouter.post('/create', requireRole(['admin']), createDoctor);
doctorRouter.delete('/delete/:doctorId', requireRole(['admin']), deleteDoctorById);
doctorRouter.get('/list', getAllDoctors);

export default doctorRouter;

