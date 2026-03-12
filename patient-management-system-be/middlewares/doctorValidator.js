import { body, validationResult } from 'express-validator';
import { AppError } from '../utils/app-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return next(new AppError(errorMessages, 400));
    }
    next();
};

export const updateDoctorValidator = [
    body('full_name')
        .optional()
        .trim()
        .notEmpty().withMessage('Full name cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
    
    body('phone_number')
        .optional()
        .trim()
        .matches(/^(0[3|5|7|8|9])([0-9]{8})$/).withMessage('Invalid Vietnamese phone number format'),
    
    body('specialization')
        .optional()
        .trim()
        .notEmpty().withMessage('Specialization cannot be empty'),
    
    body('room_id')
        .optional()
        .isUUID().withMessage('Room ID must be a valid UUID'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    
    validate
];

export const createDoctorProfileValidator = [
    body('specialization')
        .trim()
        .notEmpty().withMessage('Specialization is required'),

    body('department_id')
        .notEmpty().withMessage('Department ID is required')
        .isUUID().withMessage('Department ID must be a valid UUID'),

    body('room_id')
        .optional()
        .isUUID().withMessage('Room ID must be a valid UUID'),

    body('bio')
        .optional()
        .trim(),

    validate
];
