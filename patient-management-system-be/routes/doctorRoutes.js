import express from 'express';
import { getAllDoctors, getDoctorById, searchDoctors, updateDoctor, getAppointments } from '../controllers/doctorController.js';
import { updateDoctorValidator } from '../middlewares/doctorValidator.js';
import { getDoctorByDepartmentId } from '../controllers/doctorController.js';
import { createDoctor } from '../controllers/doctorController.js';
import { updateDoctorById } from '../controllers/doctorController.js';
import { deleteDoctorById } from '../controllers/doctorController.js';

const doctorRouter = express.Router();

doctorRouter.get('/list', getAllDoctors);
doctorRouter.get('/search', searchDoctors);
doctorRouter.get('/detail/:doctorId', getDoctorById);
doctorRouter.patch('/update/:doctorId', updateDoctorById);
doctorRouter.get('/appointments/:doctorId', getAppointments);
doctorRouter.get('/get-doctors-by-department/:departmentId', getDoctorByDepartmentId);
doctorRouter.post('/create', createDoctor);
doctorRouter.delete('/delete/:doctorId', deleteDoctorById);

export default doctorRouter;

