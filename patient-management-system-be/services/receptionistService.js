import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const assignAppointmentToRoom = async (appointmentId, roomId) => {
  // 1. Lấy thông tin lịch hẹn với đầy đủ thông tin bác sĩ và chuyên khoa
  const { data: appointment, error: fetchApptError } = await supabase
    .from("Appointments")
    .select(`
      appointment_id,  
      status, 
      doctor_id,
      Doctors!inner (
        doctor_id,
        department_id,
        room_id
      ),
      ClinicServices!inner (
        service_id,
        Departments!inner (
          department_id
        )
      ),
      Patients!inner (Users!inner (full_name))
    `)
    .eq("appointment_id", appointmentId)
    .single();

  if (fetchApptError || !appointment) {
    throw new AppError("Không tìm thấy thông tin lịch hẹn.", 404);
  }

  // 2. Lấy thông tin phòng khám được chọn
  const { data: room, error: fetchRoomError } = await supabase
    .from("Rooms")
    .select(`
      room_id,
      department_id,
      is_active
    `)
    .eq("room_id", roomId)
    .single();

  if (fetchRoomError || !room) {
    throw new AppError("Không tìm thấy thông tin phòng khám.", 404);
  }

  // 2.1. Lấy thông tin bác sĩ được gán cho phòng này
  const { data: roomDoctors, error: fetchDoctorsError } = await supabase
    .from("Doctors")
    .select(`
      doctor_id,
      department_id,
      room_id
    `)
    .eq("room_id", roomId);

  if (fetchDoctorsError) {
    throw new AppError("Lỗi khi lấy thông tin bác sĩ của phòng.", 500);
  }

  // Kiểm tra phòng có bác sĩ được gán không
  if (!roomDoctors || roomDoctors.length === 0) {
    throw new AppError("Phòng khám này chưa được gán cho bác sĩ nào.", 400);
  }

  // 3. KIỂM TRA CÁC ĐIỀU KIỆN LOGIC
  // Điều kiện 1: Trạng thái bệnh nhân phải là checked_in
  if (appointment.status !== 'checked_in') {
    throw new AppError("Bệnh nhân chưa thực hiện check-in.", 400);
  }

  // Điều kiện 2: Phòng phải đang active
  if (!room.is_active) {
    throw new AppError("Phòng khám hiện không hoạt động.", 400);
  }

  // Điều kiện 3: Khớp Bác sĩ và Chuyên khoa (Tránh gán nhầm phòng bác sĩ khác)
  const appointmentDoctorId = appointment.Doctors?.doctor_id || appointment.doctor_id;
  // const appointmentDepartmentId = appointment.Doctors?.department_id || appointment.ClinicServices?.Departments?.department_id;

  // Kiểm tra xem bác sĩ của appointment có trong danh sách bác sĩ của phòng không
  const matchingDoctor = roomDoctors.find(doctor => doctor.doctor_id === appointmentDoctorId);

  if (!matchingDoctor) {
    throw new AppError("Bác sĩ của lịch hẹn không khớp với bác sĩ được gán cho phòng này.", 400);
  }

  // Kiểm tra department_id có khớp không
  // if (appointmentDepartmentId !== matchingDoctor.department_id || appointmentDepartmentId !== room.department_id) {
  //   throw new AppError("Chuyên khoa của phòng không khớp với lịch hẹn này.", 400);
  // }

  // 4. THỰC HIỆN CẬP NHẬT
  // Cập nhật lịch hẹn: đổi status sang 'assigned'
  // Lưu ý: Appointments không có cột room_id trong schema, chỉ cập nhật status
  const { data: updatedAppointment, error: updateApptError } = await supabase
    .from("Appointments")
    .update({
      status: 'assigned'
    })
    .eq("appointment_id", appointmentId)
    .select();

  if (updateApptError) throw new AppError("Lỗi khi cập nhật lịch hẹn.", 500);

  // Lưu ý: Rooms không có cột status trong schema
  // Nếu cần theo dõi trạng thái phòng, có thể cần thêm cột status vào Rooms table
  // hoặc sử dụng một bảng riêng để quản lý trạng thái phòng

  return updatedAppointment[0];
};