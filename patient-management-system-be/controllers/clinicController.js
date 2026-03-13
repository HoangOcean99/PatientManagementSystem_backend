import * as clinicServicesService from "../services/clinicServices.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getListClinicServices = asyncHandler(async (req, res) => {
  const clinicServices = await clinicServicesService.getListClinicServices();
  res.status(200).json(clinicServices);
});

export const getClinicServiceById = asyncHandler(async (req, res) => {
  const { service_id } = req.params;
  const clinicService = await clinicServicesService.getClinicServiceById(service_id);
  res.status(200).json(clinicService);
});

export const getPriceByServiceId = asyncHandler(async (req, res) => {
  const { service_id } = req.params;
  const price = await clinicServicesService.getPriceByServiceId(service_id);  
  res.status(200).json(price);
});

const clinicServicesController = {
  getListClinicServices,
  getClinicServiceById,
  getPriceByServiceId,
}; 
 
export const getClinicServicesByDepartmentId = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const clinicServices = await clinicServicesService.getClinicServicesByDepartmentId(departmentId);
  res.status(200).json(clinicServices);
});
 
export const createClinicService = asyncHandler(async (req, res) => {
  const { service } = req.body;
  const clinicService = await clinicServicesService.createClinicService(service);
  res.status(200).json(clinicService);
});

export const updateClinicService = asyncHandler(async (req, res) => {
  const { service_id } = req.params;
  const { service } = req.body;
  const clinicService = await clinicServicesService.updateClinicService(service_id, service);
  res.status(200).json(clinicService);
});

export const deleteClinicService = asyncHandler(async (req, res) => {
  const { service_id } = req.params;
  const clinicService = await clinicServicesService.deleteClinicService(service_id);
  res.status(200).json(clinicService);
});
export default clinicServicesController; 