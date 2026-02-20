import * as authService from '../services/authService.js';
import { AppError } from '../utils/app-error.js';
import asyncHandler from '../utils/async-handler.js';

export const requestRegister = asyncHandler(async (req, res) => {
    const { username, emailParent } = req.body;

    if (!username || !emailParent) throw new AppError('Username and emailParent are required', 400);

    const data = await authService.requestRegister(username, emailParent);

    res.status(200).json({
        success: true,
        data: data
    });
});
export const verifyAndCreateUser = asyncHandler(async (req, res) => {
    const { username, password, emailParent, relationship, idParent, otp } = req.body;

    if (!username || !password || !emailParent || !relationship || !idParent || !otp) throw new AppError('Username, emailParent, relationship, idParent, otp, and password are required', 400);

    const data = await authService.verifyAndCreateUser(username, password, emailParent, relationship, idParent, otp);

    res.status(201).json({
        success: true,
        data: data
    });
});

export const loginLocal = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) throw new AppError('Username and password are required', 400);

    const data = await authService.loginLocal(username, password);

    res.status(200).json({
        success: true,
        user: data
    });
});

export const syncUserGoogle = asyncHandler(async (req, res) => {
    const data = await authService.syncUserGoogle(req.user);
    res.status(200).json({
        success: true,
        user: data
    });
});

export const requestForgetPassword = asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) throw new AppError('Username are required', 400);

    const data = await authService.requestForgetPassword(username);
    res.status(200).json({
        success: true,
        data: data
    });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
    const { username, emailParent, otp } = req.body;
    if (!username || !emailParent || !otp) throw new AppError('Username, emailParent, and otp are required', 400);

    const data = await authService.verifyResetOtp(username, emailParent, otp);
    res.status(200).json({
        success: true,
        data: data
    });
});
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw new AppError('Token and newPassword are required', 400);

    const data = await authService.resetPassword(token, newPassword);
    res.status(200).json({
        success: true,
        data: data
    });
});