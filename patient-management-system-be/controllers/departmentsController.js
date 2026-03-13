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

export const createDepartment = asyncHandler(async (req, res) => {
    const { department } = req.body;
    const newDepartment = await departmentsService.createDepartment(department);
    res.status(200).json(newDepartment);
});

export const updateDepartment = asyncHandler(async (req, res) => {
    const { departmentId } = req.params;
    const { department } = req.body;
    const updatedDepartment = await departmentsService.updateDepartment(departmentId, department);
    res.status(200).json(updatedDepartment);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
    const { departmentId } = req.params;
    const deletedDepartment = await departmentsService.deleteDepartment(departmentId);
    res.status(200).json(deletedDepartment);
});
