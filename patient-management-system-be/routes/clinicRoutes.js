import express from "express";
import { getClinicServicesByDepartmentId } from "../controllers/clinicController.js";
import { getListClinicServices } from "../controllers/clinicController.js";
import { getClinicServiceById } from "../controllers/clinicController.js";
import { getPriceByServiceId } from "../controllers/clinicController.js";

const clinicServicesRouter = express.Router();
clinicServicesRouter.get('/getList', getListClinicServices);
clinicServicesRouter.get('/getById/:service_id', getClinicServiceById);
clinicServicesRouter.get('/getPriceByServiceId/:service_id', getPriceByServiceId);
clinicServicesRouter.get('/getByDepartmentId/:departmentId', getClinicServicesByDepartmentId);

export default clinicServicesRouter;    