import express from "express";
import { getClinicServicesByDepartmentId } from "../controllers/clinicController.js";
import { getListClinicServices } from "../controllers/clinicController.js";
import { getClinicServiceById } from "../controllers/clinicController.js";
import { getPriceByServiceId } from "../controllers/clinicController.js";
import { createClinicService } from "../controllers/clinicController.js";
import { updateClinicService } from "../controllers/clinicController.js";
import { deleteClinicService } from "../controllers/clinicController.js";
import { requireRole } from "../middlewares/auth.js";

const clinicServicesRouter = express.Router();
clinicServicesRouter.get('/getList', getListClinicServices);
clinicServicesRouter.get('/getById/:service_id', getClinicServiceById);
clinicServicesRouter.get('/getPriceByServiceId/:service_id', getPriceByServiceId);
clinicServicesRouter.get('/getByDepartmentId/:departmentId', getClinicServicesByDepartmentId);
clinicServicesRouter.post('/create', requireRole(['admin']), createClinicService);  
clinicServicesRouter.put('/update/:service_id', requireRole(['admin']), updateClinicService);
clinicServicesRouter.delete('/delete/:service_id', requireRole(['admin']), deleteClinicService);

export default clinicServicesRouter;    