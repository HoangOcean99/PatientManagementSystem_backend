import { AppError } from "../utils/app-error.js";
import { sendMail } from "../utils/mailer.js";

const otpStore = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendOtp = async (email) => {
    if (!email) throw new AppError("Email is required", 500);

    const otp = generateOTP();

    otpStore.set(email, {
        otp,
        expire: Date.now() + 5 * 60 * 1000,
    });

    await sendMail(
        email,
        "Your OTP Code",
        `Your OTP is: ${otp}`
    );
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
};
