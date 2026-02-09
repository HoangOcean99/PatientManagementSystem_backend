import * as authService from '../services/authService.js';
import { AppError } from '../utils/app-error.js';
import asyncHandler from '../utils/async-handler.js';

export const registerLocal = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) throw new AppError('Username and password are required', 400);

    const data = await authService.registerLocal(username, password);

    res.status(201).json({
        success: true,
        user: {
            id: data.user.id,
            username,
        },
    });
});
export const loginLocal = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) throw new AppError('Username and password are required', 400);

    const data = await authService.loginLocal(username, password);

    res.status(200).json({
        success: true,
        user: {
            id: data.user.id,
            username,
        },
    });
});

export const syncUserGoogle = asyncHandler(async (req, res) => {
  const data = await authService.syncUserGoogle(req.user);
  res.status(200).json({
    success: true,
    user: data
  });
});

