import express from 'express';
import {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getAllServicesByDepartment
} from '../controllers/clinicServiceController.js';
import { requireRole } from '../middlewares/auth.js';

const serviceRoutes = express.Router();
serviceRoutes.get('/getAllServices', getAllServices);
serviceRoutes.get('/getAllServicesByDepartment/:department/:is_active', getAllServicesByDepartment);
serviceRoutes.get('/getServiceById/:id', getServiceById);
serviceRoutes.post('/createService', requireRole(['admin']), createService);
serviceRoutes.put('/updateService/:id', requireRole(['admin']), updateService);
serviceRoutes.delete('/deleteService/:id', requireRole(['admin']), deleteService);

export default serviceRoutes;