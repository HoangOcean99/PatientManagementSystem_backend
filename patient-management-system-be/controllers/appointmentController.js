import * as appointmentService from "../services/appointmentService.js";
import asyncHandler from "../utils/async-handler.js";

export const getListAppointments = asyncHandler(async (req, res) => {
  const response = await appointmentService.getListAppointments();
  return res.json(response);
});