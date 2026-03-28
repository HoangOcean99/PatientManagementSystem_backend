import { AppError } from "../utils/app-error.js";
import ics from 'ics';
import { sendMail, sendMailWithIcal } from "../utils/mailer.js";
import { supabase } from "../supabaseClient.js";

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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase
        .from('otp_store')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose);

    const { error } = await supabase
        .from('otp_store')
        .insert({ email, otp, purpose, expires_at: expiresAt });

    if (error) throw new AppError("Failed to store OTP", 500);

    const htmlContent = otpTemplate(otp, purpose);
    const subject = purpose === 'verifyEmail'
        ? "[MedSchedule] Xác thực tài khoản mới"
        : "[MedSchedule] Đặt lại mật khẩu của bạn";
    await sendMail(email, subject, htmlContent);
};

export const verifyOtp = async (email, otp) => {
    const { data, error } = await supabase
        .from('otp_store')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) throw new AppError("OTP not found", 404);

    if (new Date(data.expires_at) < new Date()) {
        await supabase.from('otp_store').delete().eq('id', data.id);
        throw new AppError("OTP expired", 410);
    }

    if (data.otp !== otp) throw new AppError("Invalid OTP", 400);

    await supabase.from('otp_store').delete().eq('id', data.id);
    return true;
};

export const sendAppointmentConfirmation = async (email, appointmentData) => {
    const patientName = appointmentData.Patients.Users.full_name;
    const doctorName = appointmentData.Doctors.Users.full_name;
    const serviceName = appointmentData.ClinicServices.name;
    const date = appointmentData.DoctorSlots.slot_date;
    const startTime = appointmentData.DoctorSlots.start_time;
    const endTime = appointmentData.DoctorSlots.end_time;

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

export const sendAppointmentCancellation = async (email, appointmentData) => {
    const patientName = appointmentData.Patients.Users.full_name;
    const doctorName = appointmentData.Doctors.Users.full_name;
    const serviceName = appointmentData.ClinicServices.name;
    const date = appointmentData.DoctorSlots.slot_date;
    const startTime = appointmentData.DoctorSlots.start_time;
    const endTime = appointmentData.DoctorSlots.end_time;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #ef4444; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">MedSchedule</h1>
            <p style="color: #fee2e2; margin-top: 5px; font-size: 14px;">Thông báo hủy lịch hẹn</p>
        </div>
        
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
            <p>Xin chào <b>${patientName}</b>,</p>
            <p>Chúng tôi rất tiếc phải thông báo rằng lịch hẹn của bạn đã bị do quá thời gian thanh toán.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin: 25px 0;">
                <p style="margin: 5px 0; font-size: 16px;"><b>👨‍⚕️ Bác sĩ:</b> ${doctorName}</p>
                <p style="margin: 5px 0; font-size: 16px;"><b>🩺 Dịch vụ:</b> ${serviceName}</p>
                <p style="margin: 5px 0; font-size: 16px;"><b>📅 Ngày khám:</b> ${date}</p>
                <p style="margin: 5px 0; font-size: 16px;"><b>⏰ Thời gian:</b> ${startTime} - ${endTime}</p>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">
                Nếu bạn có bất kỳ thắc mắc nào hoặc muốn đặt lại lịch, vui lòng liên hệ hotline: 0968178905 của phòng khám hoặc truy cập ứng dụng. <br>
                Chúng tôi xin lỗi vì sự bất tiện này.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 MedSchedule. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    </div>
    `;

    await sendMail(email, "[MedSchedule] Thông báo hủy lịch hẹn", htmlContent);
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

// ── Send Invoice Email ──
export const sendInvoiceEmail = async (invoiceData) => {
    const patientName = invoiceData.Patients?.Users?.full_name || 'Quý khách';
    const email = invoiceData.Patients?.Users?.email;
    if (!email) return; // Cannot send without email

    const items = invoiceData.InvoiceItems || [];
    const totalAmount = invoiceData.total_amount || 0;
    const depositPaid = invoiceData.Appointments?.deposit_paid || 0;
    const remaining = totalAmount - depositPaid;
    const invoiceIdShort = invoiceData.invoice_id.substring(0, 8).toUpperCase();

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const itemsHtml = items.map((item, idx) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.item_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.unit_price)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.quantity * item.unit_price)}</td>
        </tr>
    `).join('');

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0284c7; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">MedSchedule</h1>
            <p style="color: #e0f2fe; margin-top: 5px; font-size: 14px;">Hoá đơn điện tử / Biên lai thanh toán</p>
        </div>
        
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
            <p>Xin chào <b>${patientName}</b>,</p>
            <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ tại phòng khám. Dưới đây là chi tiết biên lai thanh toán của quý khách:</p>
            
            <div style="margin: 25px 0;">
                <p style="margin: 5px 0;"><b>Mã hoá đơn:</b> ${invoiceIdShort}</p>
                <p style="margin: 5px 0;"><b>Thời gian thanh toán:</b> ${new Date().toLocaleString('vi-VN')}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">STT</th>
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Dịch vụ/Thuốc</th>
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: center; white-space: nowrap;">SL</th>
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: right;">Đơn giá</th>
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Tổng cộng:</span>
                    <strong>${formatCurrency(totalAmount)}</strong>
                </div>
                ${depositPaid > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #15803d;">
                    <span>Đã đặt cọc:</span>
                    <span>-${formatCurrency(depositPaid)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px; color: #0284c7;">
                    <span>Thực thu:</span>
                    <span>${formatCurrency(remaining)}</span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">Kính chúc quý khách thật nhiều sức khoẻ!</p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 MedSchedule. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    </div>
    `;

    await sendMail(email, `[MedSchedule] Biên lai thanh toán #${invoiceIdShort}`, htmlContent);
};

// ── Send Follow-Up Reminder Email ──
export const sendFollowUpReminder = async ({ email, patientName, doctorName, departmentName, followUpDate }) => {
    if (!email) throw new AppError('Patient email is required', 400);
    if (!followUpDate) throw new AppError('Follow-up date is required', 400);

    // Format date to Vietnamese locale
    const formattedDate = new Date(followUpDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0284c7; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">MedSchedule</h1>
            <p style="color: #e0f2fe; margin-top: 5px; font-size: 14px;">Nhắc nhở lịch tái khám</p>
        </div>
        
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 20px; text-align: center;">📋 Thông báo lịch tái khám</h2>
            
            <p>Xin chào <b>${patientName || 'Quý khách'}</b>,</p>
            <p>Bạn có lịch yêu cầu <b>khám lại</b> theo chỉ định của bác sĩ. Vui lòng sắp xếp thời gian để đến khám đúng hẹn.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #0284c7; margin: 25px 0;">
                <p style="margin: 5px 0; font-size: 16px;"><b>📅 Ngày tái khám:</b> ${formattedDate}</p>
                ${departmentName ? `<p style="margin: 5px 0; font-size: 16px;"><b>🏥 Khoa:</b> ${departmentName}</p>` : ''}
                ${doctorName ? `<p style="margin: 5px 0; font-size: 16px;"><b>👨‍⚕️ Bác sĩ yêu cầu:</b> ${doctorName}</p>` : ''}
            
            </div>
            
            <p style="font-size: 14px; color: #64748b;">
                Vui lòng đăng nhập hệ thống MedSchedule để đặt lịch hẹn tái khám. <br>
                Nếu cần hỗ trợ, vui lòng liên hệ hotline của phòng khám.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 MedSchedule. Tất cả quyền được bảo lưu.</p>
                <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0;">Đây là email tự động, vui lòng không phản hồi.</p>
            </div>
        </div>
    </div>
    `;

    await sendMail(email, `[MedSchedule] Nhắc nhở lịch tái khám - ${formattedDate}`, htmlContent);
};
