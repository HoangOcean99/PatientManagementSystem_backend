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
    deleteDepartment
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
departmentRouter.post('/create', create);
departmentRouter.put('/update/:departmentId', update);
departmentRouter.delete('/delete/:departmentId', remove);
export default departmentRouter;
