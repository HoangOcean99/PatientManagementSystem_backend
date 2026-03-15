import express from 'express';
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../controllers/departmentController.js';
import { getListDepartments } from "../controllers/departmentsController.js";
import { getListServicesByDepartment } from "../controllers/departmentsController.js";

const departmentRoutes = express.Router();
departmentRoutes.get('/getAllDepartments', getAllDepartments);
departmentRoutes.get('/getDepartmentById/:id', getDepartmentById);
departmentRoutes.post('/createDepartment', createDepartment);
departmentRoutes.put('/updateDepartment/:id', updateDepartment);
departmentRoutes.delete('/deleteDepartment/:id', deleteDepartment);
departmentRoutes.get('/getList', getListDepartments);
departmentRoutes.get('/getById/:departmentId', getDepartmentById);
departmentRoutes.get('/getListServicesByDepartment/:departmentId', getListServicesByDepartment);

export default departmentRoutes;
