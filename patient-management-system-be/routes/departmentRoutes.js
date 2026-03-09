import express from "express";
import { getListDepartments } from "../controllers/departmentsController.js";
import { getDepartmentById } from "../controllers/departmentsController.js";
import { getListServicesByDepartment } from "../controllers/departmentsController.js";

const departmentRouter = express.Router();
departmentRouter.get('/getList', getListDepartments);
departmentRouter.get('/getById/:departmentId', getDepartmentById);
departmentRouter.get('/getListServicesByDepartment/:departmentId', getListServicesByDepartment);

export default departmentRouter;