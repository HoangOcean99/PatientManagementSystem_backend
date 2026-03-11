import * as departmentsService from "../services/departmentsService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";


export const getListDepartments = asyncHandler(async (req, res) => {
    const departments = await departmentsService.getListDepartments();
    res.status(200).json(departments);
});

export const getDepartmentById = asyncHandler(async (req, res) => {
    const { departmentId } = req.params;
    const department = await departmentsService.getDepartmentById(departmentId);
    res.status(200).json(department);
});

export const getListServicesByDepartment = asyncHandler(async (req, res) => { 
    const { departmentId } = req.params;
    const services = await departmentsService.getListServicesByDepartment(departmentId);
    res.status(200).json(services);
}); 
