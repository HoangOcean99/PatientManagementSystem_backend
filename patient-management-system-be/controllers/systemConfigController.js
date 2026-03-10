import * as scheduleServices from '../services/systemConfigsService.js';
import asyncHandler from '../utils/async-handler.js';


export const getSystemConfig = asyncHandler(async (req, res, next) => {
    const data = await scheduleServices.getSystemConfig();
    res.status(200).json(data);
});


export const updateSystemConfig = asyncHandler(async (req, res, next) => {
    const { key, newValue } = req.body;
    const data = await scheduleServices.updateSystemConfig(key, newValue);
    res.status(200).json({
        message: 'Cập nhật cấu hình thành công',
        data
    });
});


export const getAllHolidays = asyncHandler(async (req, res, next) => {
    const data = await scheduleServices.getAllHolidays();
    res.status(200).json(data);
});


export const createHoliday = asyncHandler(async (req, res, next) => {
    const holidayData = req.body;
    const data = await scheduleServices.createHoliday(holidayData);
    res.status(201).json({
        message: 'Thêm ngày lễ thành công',
        data
    });
});


export const deleteHoliday = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    await scheduleServices.deleteHoliday(id);
    res.status(200).json({
        message: 'Xóa ngày lễ thành công'
    });
});

export const checkIsHoliday = asyncHandler(async (req, res, next) => {
    const { date } = req.query;
    const isHoliday = await scheduleServices.checkIsHoliday(date);
    res.status(200).json({
        date,
        isHoliday
    });
});

export const getHolidaysInRange = asyncHandler(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    const data = await scheduleServices.getHolidaysInRange(startDate, endDate);
    res.status(200).json(data);
});