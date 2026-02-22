import * as appointmentService from "../services/appointmentService.js";
import asyncHandler from "../utils/async-handler.js";
import {supabase} from "../supabaseClient.js";

// Kiểm tra ngày có đúng chuẩn YYYY-MM-DD không
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;
  const date = new Date(dateString);
  return date.getTime() === date.getTime(); // Check xem ngày có tồn tại thực tế không
};

// Kiểm tra giờ có đúng chuẩn HH:mm hoặc HH:mm:ss không
const isValidTime = (timeString) => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeString.match(regex) !== null;
};

export const getListAppointments = asyncHandler(async (req, res) => {
  const response = await appointmentService.getListAppointments();
  return res.json(response);
});

export const createAppointment = async (req, res, next) => {
const { patient_id, doctor_id, service_id, appointment_date, start_time, end_time, role } = req.body;
try{
  

//Validate bắt buộc nhập
if(!patient_id || !doctor_id || !service_id || !appointment_date || !start_time || !end_time || !role) {
  const error = new Error("Vui lòng nhập đầy đủ thông tin");
  error.statusCode = 400;
  return next(error);
}

//Validate ngày tháng năm
if(!isValidDate(appointment_date)) {
  const error = new Error("Ngày tháng năm không hợp lệ");
  error.statusCode = 400;
  return next(error);
}

//Validate thời gian
if(!isValidTime(start_time) || !isValidTime(end_time)) {
  const error = new Error("Thời gian không hợp lệ");
  error.statusCode = 400;
  return next(error);
}

//Validate quyền
if(role !== "PATIENT" && role !== "ADMIN") {
  const error = new Error("Bạn không có quyền đặt lịch");
  error.statusCode = 400;
  return next(error);
}

//Check patient và doctor tồn tại trong DB chưa?
 const[patientCheck, doctorCheck] = await Promise.all([
  supabase.from('Patients').select('patient_id').eq('patient_id',patient_id).single(),
  supabase.from('Doctors').select('doctor_id').eq('doctor_id',doctor_id).single(),
 ]);
 if(patientCheck.error || doctorCheck.error) {
  const error = new Error("Patient hoặc doctor không tồn tại");
  error.statusCode = 400;
  return next(error);
 }
 
 //Check thời gian đã bị trùng chưa?
const { data: existingAppointment, error: checkError } = await supabase
  .from('Appointments')
  .select('appointment_id')
  .eq('doctor_id', doctor_id)
  .eq('appointment_date', appointment_date)
  .eq('start_time', start_time)
  .maybeSingle(); // Dùng maybeSingle: cho phép trả về 1 dòng hoặc 0 dòng đều không bị lỗi

// 1. Lỗi kết nối database (nếu có)
if (checkError) {
  return next(checkError); 
}

if (existingAppointment) {
  const error = new Error("Thời gian đã bị trùng");
  error.statusCode = 400;
  return next(error);
}
 
//Tạo lịch hẹn mới
const { data: newAppointment, error: createError } = await supabase
  .from('Appointments').insert({
    patient_id: patient_id,
    doctor_id: doctor_id, 
    service_id: service_id,
    appointment_date: appointment_date,
    start_time: start_time,
    end_time: end_time || null,
    status: "pending",
  })
  .select()
  .single();

    return res.status(201).json({
      message: "Lịch hẹn đã được tạo thành công",
      data: {
          appointment_id: newAppointment.appointment_id,
          status: newAppointment.status 
        }
    });


} catch (error) {

  return next(error);
}
}