import express from 'express';
import {
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../controllers/departmentController.js';
import { 
    getListDepartments, 
    getDepartmentById, 
    getListServicesByDepartment 
} from "../controllers/departmentsController.js";

const departmentRouter = express.Router();

departmentRouter.get('/getAllDepartments', getAllDepartments);
departmentRouter.get('/getDepartmentById/:id', getDepartmentById);
departmentRouter.post('/createDepartment', createDepartment);
departmentRouter.put('/updateDepartment/:id', updateDepartment);
departmentRouter.delete('/deleteDepartment/:id', deleteDepartment);

departmentRouter.get('/getList', getListDepartments);
departmentRouter.get('/getById/:departmentId', getDepartmentById);
departmentRouter.get('/getListServicesByDepartment/:departmentId', getListServicesByDepartment);

export default departmentRouter;
