import * as doctorSlotService from "../services/doctorSlotService.js";
import * as doctorService from "../services/doctorService.js";
import { AppError } from "../utils/app-error.js";

export const getListDoctorSlots = async (req, res) => {
    const doctorSlots = await doctorSlotService.getListDoctorSlots();
    res.status(200).json(doctorSlots);
}

export const getDoctorSlotById = async (req, res) => {
    const doctorSlot = await doctorSlotService.getDoctorSlotById(req.params.slot_id);
    res.status(200).json(doctorSlot);
}  

export const getAvailableDoctorSlotsInMonth = async (req, res, next) => {
    try {
        const { doctor_id, start_date, end_date } = req.body;

        // Kiểm tra xem dữ liệu có đầy đủ không
        if (!doctor_id || !start_date || !end_date) {
            return res.status(400).json({ message: "Thiếu thông tin doctor_id, start_date hoặc end_date!" });
        }

        const availableDoctorSlots = await doctorSlotService.getAvailableDoctorSlotsInMonth(doctor_id, start_date, end_date);

        res.status(200).json({
            success: true,
            data: availableDoctorSlots
        });
    } catch (error) {
        // Chuyển lỗi sang cho middleware xử lý lỗi (nếu cậu có cài đặt)
        // hoặc phản hồi trực tiếp lỗi về client
        console.error("Lỗi Controller:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra", error: error.message });
    }
}

export const createDoctorSlot = async (req, res, next) => {
    try {
        const { doctor_id, slot_date, start_time, end_time } = req.body; // Cần dòng này!

        // Cậu đã có logic check bác sĩ ở đây rồi thì cứ giữ nguyên
        const doctor = await doctorService.getDoctorById(doctor_id);
        if (!doctor) throw new AppError("Bác sĩ không tồn tại", 404);

        const newDoctorSlot = await doctorSlotService.createDoctorSlot(doctor_id, slot_date, start_time, end_time);

        res.status(200).json({
            success: true,
            message: "Tạo khung giờ thành công",
            data: newDoctorSlot 
        });
    } catch (error) {
        next(error); // Chuyển lỗi sang middleware xử lý lỗi
    }
}