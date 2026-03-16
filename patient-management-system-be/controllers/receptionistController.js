import { assignAppointmentToRoom as assignAppointmentToRoomService } from "../services/receptionistService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";


export const assignAppointmentToRoom = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;
  const { room_id } = req.body; // Lấy room_id từ body gửi lên

  if (!room_id) {
    throw new AppError("Vui lòng cung cấp room_id trong request body.", 400);
  }

  const result = await assignAppointmentToRoomService(appointment_id, room_id);
  return res.status(200).json({
    message: "Gán bệnh nhân vào phòng thành công",
    data: result
  });
});