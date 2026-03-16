import express from "express";
import { getListDepartments } from "../controllers/departmentsController.js";
import { getDepartmentById } from "../controllers/departmentsController.js";
import { getListServicesByDepartment } from "../controllers/departmentsController.js";
import { createDepartment } from "../controllers/departmentsController.js";
import { updateDepartment } from "../controllers/departmentsController.js";
import { deleteDepartment } from "../controllers/departmentsController.js";
import {
    getAllDepartments,
    // getListServicesByDepartment,
    // getListDepartments
} from '../controllers/departmentController.js';

const departmentRoutes = express.Router();
departmentRoutes.get('/getAllDepartments', getAllDepartments);
departmentRoutes.get('/getDepartmentById/:id', getDepartmentById);
departmentRoutes.post('/createDepartment', createDepartment);
departmentRoutes.put('/updateDepartment/:id', updateDepartment);
departmentRoutes.delete('/deleteDepartment/:id', deleteDepartment);

// departmentRouter.get('/getList', getListDepartments);
departmentRoutes.get('/getById/:departmentId', getDepartmentById);
departmentRoutes.get('/getListServicesByDepartment/:departmentId', getListServicesByDepartment);
departmentRoutes.post('/create', createDepartment);
departmentRoutes.put('/update/:departmentId', updateDepartment);
departmentRoutes.delete('/delete/:departmentId', deleteDepartment);
export default departmentRoutes;
