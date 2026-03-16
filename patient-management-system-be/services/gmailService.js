import { AppError } from "../utils/app-error.js";
import ics from 'ics';
import { sendMail, sendMailWithIcal } from "../utils/mailer.js";

const otpStore = new Map();
const otpTemplate = (otp, purpose = "resetPassword") => {
    const configs = {
        resetPassword: {
            title: "Thiết lập lại mật khẩu",
            message: "Bạn đã yêu cầu thiết lập lại mật khẩu cho tài khoản MedSchedule. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình:",
        },
        verifyEmail: {
            title: "Xác nhận đăng ký tài khoản",
            message: "Chào mừng bạn đến với MedSchedule! Để hoàn tất việc đăng ký, vui lòng nhập mã xác thực (OTP) dưới đây:",
        }
    };

    const config = configs[purpose] || configs.resetPassword;

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0284c7; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">MedSchedule</h1>
            <p style="color: #e0f2fe; margin-top: 5px; font-size: 14px;">Hệ thống quản lý và đăng kí lịch hẹn trực tuyến</p>
        </div>
        
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 20px; text-align: center;">${config.title}</h2>
            
            <p>Xin chào,</p>
            <p>${config.message}</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; padding: 20px 40px; background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px;">
                    <span style="font-family: 'Courier New', Courier, monospace; color: #0284c7; font-size: 36px; font-weight: bold; letter-spacing: 8px;">
                        ${otp}
                    </span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
                Mã này sẽ hết hạn sau <b style="color: #ef4444;">5 phút</b>.<br>
                Vì lý do an toàn, tuyệt đối không chia sẻ mã này cho bất kỳ ai.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                    © 2026 MedSchedule. Tất cả quyền được bảo lưu.
                </p>
                <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0;">
                    Đây là email tự động, vui lòng không phản hồi.
                </p>
            </div>
        </div>
    </div>
    `;
};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendOtp = async (email, purpose) => {
    if (!email) throw new AppError("Email is required", 500);

    const otp = generateOTP();

    otpStore.set(email, {
        otp,
        expire: Date.now() + 5 * 60 * 1000,
    });
    // Trường hợp 1: Quên mật khẩu
    const htmlContent = otpTemplate(otp, purpose);
    const subject = purpose === 'verifyEmail' ? "[MedSchedule] Xác thực tài khoản mới" : "[MedSchedule] Đặt lại mật khẩu của bạn"
    await sendMail(email, subject, htmlContent);
};

export const verifyOtp = async (email, otp) => {
    const data = otpStore.get(email);
    if (!data) throw new AppError("OTP not found", 404);
    if (Date.now() > data.expire) {
        otpStore.delete(email);
        throw new AppError("OTP expired", 410);
    }
    if (data.otp !== otp) {
        throw new AppError("Invalid OTP", 400);
    }
    otpStore.delete(email);
    return true;
};

// ... (code sendOtp, verifyOtp của cậu ở trên) ...

export const sendAppointmentConfirmation = async (email, appointmentData) => {
    // 1. Lấy dữ liệu trực tiếp từ object appointmentData (từ Controller truyền sang)
    const patientName = appointmentData.Patients.Users.full_name;
    const doctorName = appointmentData.Doctors.Users.full_name;
    const serviceName = appointmentData.ClinicServices.name;
    const date = appointmentData.DoctorSlots.slot_date; // Định dạng "YYYY-MM-DD"
    const startTime = appointmentData.DoctorSlots.start_time; // Định dạng "HH:mm:ss"
    const endTime = appointmentData.DoctorSlots.end_time; // Định dạng "HH:mm:ss"

    // 2. Chuyển đổi chuỗi ngày giờ thành mảng số nguyên cho thư viện ics: [Năm, Tháng, Ngày, Giờ, Phút]
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // 3. Cấu hình file sự kiện Google Calendar
    const event = {
        start: [year, month, day, startHour, startMinute],
        end: [year, month, day, endHour, endMinute],
        title: `Lịch khám tại MedSchedule`,
        description: `Bác sĩ: ${doctorName}\nDịch vụ: ${serviceName}\nGhi chú: ${appointmentData.notes || 'Không có'}`,
        location: 'Phòng khám MedSchedule',
        status: 'CONFIRMED',
        organizer: { name: 'MedSchedule', email: process.env.EMAIL_USER },
    };

    // 4. Tạo mã nội dung file .ics
    const { error, value: icsContent } = ics.createEvent(event);
    if (error) throw new Error('Lỗi tạo sự kiện lịch: ' + error.message);

    // 5. Tạo giao diện HTML cho Email
    const time = `${startTime} - ${endTime}`;
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0284c7; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">MedSchedule</h1>
            <p style="color: #e0f2fe; margin-top: 5px; font-size: 14px;">Xác nhận lịch hẹn thành công</p>
        </div>
        
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
            <p>Xin chào <b>${patientName}</b>,</p>
            <p>Hệ thống đã nhận đủ tiền cọc. Lịch khám của cậu đã được xác nhận thành công!</p>
            <p>Thông tin sự kiện đã được đính kèm để cậu lưu trực tiếp vào Google Calendar.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #0284c7; margin: 25px 0;">
                <p style="margin: 5px 0; font-size: 16px;"><b>👨‍⚕️ Bác sĩ:</b> ${doctorName}</p>
                <p style="margin: 5px 0; font-size: 16px;"><b>🩺 Dịch vụ:</b> ${serviceName}</p>
                <p style="margin: 5px 0; font-size: 16px;"><b>📅 Ngày khám:</b> ${date}</p>
                <p style="margin: 5px 0; font-size: 16px;"><b>⏰ Thời gian:</b> ${time}</p>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">
                Vui lòng đến trước giờ hẹn 10 phút để làm thủ tục. <br>
                Nếu cần hỗ trợ, vui lòng liên hệ hotline của phòng khám.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 MedSchedule. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    </div>
    `;

    // 6. Gửi mail đi cùng file ics
    await sendMailWithIcal(email, "[MedSchedule] Xác nhận lịch hẹn thành công", htmlContent, icsContent);
};

// ── Send Family Invitation Email ──
export const sendFamilyInvitationEmail = async (targetEmail, inviterName, code) => {
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0284c7; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">MedSchedule</h1>
            <p style="color: #e0f2fe; margin-top: 5px; font-size: 14px;">Lời mời liên kết gia đình</p>
        </div>
        
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 20px; text-align: center;">Lời mời liên kết gia đình</h2>
            
            <p>Xin chào,</p>
            <p><b>${inviterName}</b> đã gửi lời mời liên kết tài khoản gia đình trên hệ thống MedSchedule.</p>
            <p>Vui lòng sử dụng mã dưới đây để chấp nhận lời mời:</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; padding: 20px 40px; background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px;">
                    <span style="font-family: 'Courier New', Courier, monospace; color: #0284c7; font-size: 36px; font-weight: bold; letter-spacing: 8px;">
                        ${code}
                    </span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
                Mã này sẽ hết hạn sau <b style="color: #ef4444;">24 giờ</b>.<br>
                Vì lý do an toàn, tuyệt đối không chia sẻ mã này cho bất kỳ ai.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 MedSchedule. Tất cả quyền được bảo lưu.</p>
                <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0;">Đây là email tự động, vui lòng không phản hồi.</p>
            </div>
        </div>
    </div>
    `;

    await sendMail(targetEmail, "[MedSchedule] Lời mời liên kết gia đình", htmlContent);
}; 