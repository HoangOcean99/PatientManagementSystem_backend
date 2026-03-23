import express from 'express';
import {
    getListDepartments,
    getDepartmentById,
    getListServicesByDepartment,
    getAllDepartments,
    create,
    update,
    remove,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getById
} from "../controllers/departmentsController.js";

import { requireRole } from "../middlewares/auth.js";

const departmentRouter = express.Router();

departmentRouter.get('/getAllDepartments', getAllDepartments);
departmentRouter.get('/getDepartmentById/:id', getDepartmentById);
departmentRouter.post('/createDepartment', requireRole(['admin']), createDepartment);
departmentRouter.put('/updateDepartment/:id', requireRole(['admin']), updateDepartment);
departmentRouter.delete('/deleteDepartment/:id', requireRole(['admin']), deleteDepartment);

departmentRouter.get('/getList', getListDepartments);
departmentRouter.get('/getById/:id', getById);
departmentRouter.get('/getListServicesByDepartment/:departmentId', getListServicesByDepartment);
departmentRouter.post('/create', requireRole(['admin']), create);
departmentRouter.put('/update/:departmentId', requireRole(['admin']), update);
departmentRouter.delete('/delete/:departmentId', requireRole(['admin']), remove);
export default departmentRouter;
