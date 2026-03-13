import asyncHandler from '../utils/async-handler.js';
import * as userService from '../services/userService.js';
import { AppError } from '../utils/app-error.js';

export const createUser = asyncHandler(async (req, res) => {
    const { user } = req.body;
    const createdUser = await userService.createUser(user);
    res.status(200).json({
        status: 'success',
        data: createdUser
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { user } = req.body;
    const updatedUser = await userService.updateUser(userId, user);
    res.status(200).json({
        status: 'success',
        data: updatedUser
    });
});

export const getListUsers = asyncHandler(async (req, res) => {
    const users = await userService.getListUsers();
    res.status(200).json({
        status: 'success',
        data: users
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    res.status(200).json({
        status: 'success',
        data: user
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await userService.deleteUser(userId);
    res.status(200).json({
        status: 'success',
        data: user
    });
});