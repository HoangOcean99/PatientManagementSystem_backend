import * as roomService from "../services/roomService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getListActiveRooms = asyncHandler(async (req, res) => {
    const response = await roomService.getListActiveRooms();
    return res.json(response);
});

export const updateStatusByDoctor = asyncHandler(async (req, res, next) => {
    const { doctor_id, status } = req.body;

    if (!doctor_id || !status) {
        return next(new AppError('Missing doctor_id or status', 400));
    }

    const updatedRoom = await roomService.updateStatusByDoctor(doctor_id, status);

    res.status(200).json({
        status: 'success',
        message: `Room status updated to ${status}`,
        data: updatedRoom
    });
});