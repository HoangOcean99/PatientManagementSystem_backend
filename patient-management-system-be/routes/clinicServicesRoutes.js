import express from 'express';
import {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getAllServicesByDepartment
} from '../controllers/clinicServiceController.js';

const serviceRoutes = express.Router();
serviceRoutes.get('/getAllServices', getAllServices);
serviceRoutes.get('/getAllServicesByDepartment/:department/:is_active', getAllServicesByDepartment);
serviceRoutes.get('/getServiceById/:id', getServiceById);
serviceRoutes.post('/createService', createService);
serviceRoutes.put('/updateService/:id', updateService);
serviceRoutes.delete('/deleteService/:id', deleteService);

export default serviceRoutes;