import express from 'express';
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../controllers/departmentController.js';
import express from "express";
import { getListDepartments } from "../controllers/departmentsController.js";
import { getDepartmentById } from "../controllers/departmentsController.js";
import { getListServicesByDepartment } from "../controllers/departmentsController.js";

const departmentRoutes = express.Router();
departmentRoutes.get('/getAllDepartments', getAllDepartments);
departmentRoutes.get('/getDepartmentById/:id', getDepartmentById);
departmentRoutes.post('/createDepartment', createDepartment);
departmentRoutes.put('/updateDepartment/:id', updateDepartment);
departmentRoutes.delete('/deleteDepartment/:id', deleteDepartment);
const departmentRouter = express.Router();
departmentRouter.get('/getList', getListDepartments);
departmentRouter.get('/getById/:departmentId', getDepartmentById);
departmentRouter.get('/getListServicesByDepartment/:departmentId', getListServicesByDepartment);

export default departmentRouter;
