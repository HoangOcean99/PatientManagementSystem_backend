import * as appointmentService from "../services/appointmentService.js";
import asyncHandler from "../utils/async-handler.js";


export const getListAppointments = asyncHandler(async (req, res) => {
  const response = await appointmentService.getListAppointments();
  return res.json(response);
});

export const createAppointment = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, service_id, appointment_date, start_time, end_time, role } = req.body;

  const newAppointment = await appointmentService.createAppointment(patient_id, doctor_id, service_id, appointment_date, start_time, end_time, role);
  console.log('NEW', newAppointment);
   return res.status(201).json({
      message: "Lịch hẹn đã được tạo thành công",
      data: {
          appointment_id: newAppointment.appointment_id,
          status: newAppointment.status
        }
    });
})