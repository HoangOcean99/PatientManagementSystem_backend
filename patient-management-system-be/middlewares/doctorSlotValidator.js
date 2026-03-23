import { body, param, validationResult } from 'express-validator';
import { AppError } from '../utils/app-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return next(new AppError(errorMessages, 400));
    }
    next();
};

/**
 * Validator cho tạo 1 slot
 */
export const createSlotValidator = [

    body('slot_date')
        .notEmpty().withMessage('Slot date is required')
        .isDate().withMessage('Slot date must be a valid date (YYYY-MM-DD)'),

    body('start_time')
        .notEmpty().withMessage('Start time is required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Start time must be in HH:MM or HH:MM:SS format'),

    body('end_time')
        .notEmpty().withMessage('End time is required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('End time must be in HH:MM or HH:MM:SS format'),

    validate
];

/**
 * Validator cho tạo nhiều slots (bulk)
 */
export const createBulkSlotsValidator = [
    body('doctor_id')
        .notEmpty().withMessage('Doctor ID is required')
        .isUUID().withMessage('Doctor ID must be a valid UUID'),

    body('slot_date')
        .notEmpty().withMessage('Slot date is required')
        .isDate().withMessage('Slot date must be a valid date (YYYY-MM-DD)'),

    body('slots')
        .isArray({ min: 1 }).withMessage('Slots must be a non-empty array'),

    body('slots.*.start_time')
        .notEmpty().withMessage('Start time is required for each slot')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Start time must be in HH:MM or HH:MM:SS format'),

    body('slots.*.end_time')
        .notEmpty().withMessage('End time is required for each slot')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('End time must be in HH:MM or HH:MM:SS format'),

    validate
];

/**
 * Validator cho update slot
 */
export const updateSlotValidator = [
    param('slotId')
        .isUUID().withMessage('Slot ID must be a valid UUID'),

    body('slot_date')
        .optional()
        .isDate().withMessage('Slot date must be a valid date (YYYY-MM-DD)'),

    body('start_time')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Start time must be in HH:MM or HH:MM:SS format'),

    body('end_time')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('End time must be in HH:MM or HH:MM:SS format'),

    validate
];

/**
 * Validator cho xoá slot
 */
export const deleteSlotValidator = [
    param('slotId')
        .isUUID().withMessage('Slot ID must be a valid UUID'),

    validate
];

/**
 * Validator cho xoá nhiều slots (bulk)
 */
export const deleteBulkSlotsValidator = [
    body('slot_ids')
        .isArray({ min: 1 }).withMessage('slot_ids must be a non-empty array'),

    body('slot_ids.*')
        .isUUID().withMessage('Each slot_id must be a valid UUID'),

    validate
];
