import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointmentsByDoctorId, createDoctorProfile, getDoctorByDepartmentId, getPatientById } from '../controllers/doctorController.js';
import { updateDoctorValidator, createDoctorProfileValidator } from '../middlewares/doctorValidator.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { createDoctor } from '../controllers/doctorController.js';
import { updateDoctorById } from '../controllers/doctorController.js';
import { deleteDoctorById } from '../controllers/doctorController.js';

const doctorRouter = express.Router();

doctorRouter.post('/setup/:doctorId', createDoctorProfileValidator, createDoctorProfile);
doctorRouter.put('/update', updateDoctorValidator, upload.single("avatar"), updateDoctor);
doctorRouter.get('/appointments/:doctorId', getAppointmentsByDoctorId);
doctorRouter.get('/patient/:patientId', getPatientById);
doctorRouter.get('/search', searchDoctors);
doctorRouter.get('/detail/:doctorId', getDoctorById);
doctorRouter.patch('/update/:doctorId', updateDoctorById);
doctorRouter.get('/get-doctors-by-department/:departmentId', getDoctorByDepartmentId);
doctorRouter.post('/create', createDoctor);
doctorRouter.delete('/delete/:doctorId', deleteDoctorById);
doctorRouter.get('/list', getAllDoctors);

export default doctorRouter;

