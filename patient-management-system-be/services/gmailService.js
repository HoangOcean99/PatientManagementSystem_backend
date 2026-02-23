import { AppError } from "../utils/app-error.js";
import { sendMail } from "../utils/mailer.js";

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
