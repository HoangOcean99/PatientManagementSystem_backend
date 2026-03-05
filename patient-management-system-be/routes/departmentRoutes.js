import express from 'express';
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../controllers/departmentController.js';

const departmentRoutes = express.Router();
departmentRoutes.get('/getAllDepartments', getAllDepartments);
departmentRoutes.get('/getDepartmentById/:id', getDepartmentById);
departmentRoutes.post('/createDepartment', createDepartment);
departmentRoutes.put('/updateDepartment/:id', updateDepartment);
departmentRoutes.delete('/deleteDepartment/:id', deleteDepartment);

export default departmentRoutes;