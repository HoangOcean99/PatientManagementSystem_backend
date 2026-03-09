import express from "express";
import clinicServicesController from "../controllers/clinicController.js";

const clinicServicesRouter = express.Router();
clinicServicesRouter.get('/getList', clinicServicesController.getListClinicServices);
clinicServicesRouter.get('/getById/:service_id', clinicServicesController.getClinicServiceById);
clinicServicesRouter.get('/getPriceByServiceId/:service_id', clinicServicesController.getPriceByServiceId);

export default clinicServicesRouter;    