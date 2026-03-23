import * as gmailService from '../services/gmailService.js'


export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    await gmailService.sendOtp(email);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    await gmailService.verifyOtp(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendAppointmentConfirmation = async (req, res, next) => { 
  try {
    const { email, appointmentData } = req.body;
    await gmailService.sendAppointmentConfirmation(email, appointmentData);

    return res.status(200).json({
      message: "Xác nhận lịch khám thành công",
      data: appointmentData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};