import express from 'express';
import { registerLocal } from '../controllers/authController.js';

const authRoutes = express.Router();
authRoutes.post('/register-local', registerLocal);

export default authRoutes;