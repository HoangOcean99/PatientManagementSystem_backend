import * as appointmentService from "../services/appointmentService.js";
import asyncHandler from "../utils/async-handler.js";
import * as gmailService from "../services/gmailService.js";
import { checkDependentAccess } from "../middlewares/auth.js";
import { AppError } from "../utils/app-error.js";


export const getListAppointments = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const response = await appointmentService.getListAppointments(date);
  return res.json(response);
});

export const getListAppointmentsByCurrentUserId = asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  const currentUserId = req.params.currentUserId;
  const response = await appointmentService.getListAppointmentsByCurrentUserId(currentUserId, {
    date,
    status,
  });
  return res.json(response);
});

export const getListAppointmentsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const response = await appointmentService.getListAppointmentsByStatus(status);
  return res.json(response);
});

export const createAppointmentForPatient = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, service_id, slot_id, role } = req.body;
    const hasAccess = await checkDependentAccess(req.user.id, patient_id);
    if (!hasAccess) {
      return next(new AppError('You do not have permission to book for this patient', 403));
    }

    const newAppointment = await appointmentService.createAppointment(
      patient_id,
      doctor_id,
      service_id,
      slot_id,
      role
    );

    res.status(200).json({
      success: true,
      message: "Đặt lịch thành công!",
      data: newAppointment
    });
  } catch (error) {
    next(error);
  }
}

export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;

  await appointmentService.cancelAppointment(appointment_id);
  return res.status(200).json({
    message: "Hủy lịch hẹn thành công"
  });
})

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;

  // Accept common client payload variants (Postman hay frontend thường gửi khác key)
  const new_slot_id =
    req.body?.new_slot_id ??
    req.body?.newSlotId ??
    req.body?.slot_id ??
    req.body?.slotId;

  // Remove slot fields from updates to avoid accidental overwrite
  // eslint-disable-next-line no-unused-vars
  const { new_slot_id: _a, newSlotId: _b, slot_id: _c, slotId: _d, ...updates } = req.body ?? {};

  const updated = await appointmentService.rescheduleAppointment(appointment_id, new_slot_id, updates);

  return res.status(200).json({
    success: true,
    message: "Cập nhật lịch hẹn thành công",
    data: updated
  });
});

export const approveAppointment = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;
  const { deposit_paid } = req.body;

  const result = await appointmentService.approveAppointment(appointment_id, deposit_paid);

  // CHỈ GỬI MAIL NẾU TIỀN ĐÃ ĐỦ VÀ STATUS ĐÃ CHUYỂN SANG CONFIRMED
  if (result.status === 'confirmed') {
    // SỬA Ở ĐÂY: Thêm ?. vào đoạn này trong Controller
    const patientEmail = result.Patients?.Users?.email;
    if (patientEmail) {
      gmailService.sendAppointmentConfirmation(patientEmail, result);
    }
  }

  return res.status(200).json({
    message: "Xác nhận lịch khám thành công",
    data: result
  });
});

export const getListPendingAppointment = asyncHandler(async (req, res, next) => {
  try {
    const pendingAppointments = await appointmentService.getListPendingAppointment();
    return res.status(200).json({
      message: "Lấy danh sách lịch chờ duyệt thành công",
      data: pendingAppointments
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lấy danh sách lịch chờ duyệt thất bại",
      data: error.message
    });
  }
});

export const getListAppointmentsByAppointmentId = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;
  const appointment = await appointmentService.getListAppointmentsByAppointmentId(appointment_id);
  return res.status(200).json({
    message: "Lấy thông tin lịch khám theo appointment_id thành công",
    data: appointment || null
  });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;
  const { status } = req.body;
  const appointment = await appointmentService.updateAppointmentStatus(appointment_id, status);
  return res.status(200).json({
    message: "Cập nhật trạng thái lịch khám thành công",
    data: appointment
  });
});

export const getTodayCheckedInAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getTodayCheckedInAppointments();
  try {
    return res.status(200).json({
      message: "Lấy danh sách chờ điều phối hôm nay thành công",
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lấy danh sách chờ điều phối hôm nay thất bại",
      data: error.message
    });
  }
});

