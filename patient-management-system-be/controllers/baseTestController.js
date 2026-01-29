import * as baseServices from '../services/baseService.js'
import asyncHandler from '../utils/async-handler.js';

export const testBase = asyncHandler(async (req, res, next) => {
    const data = await baseServices.testBase();
    res.status(200).json(data);
});