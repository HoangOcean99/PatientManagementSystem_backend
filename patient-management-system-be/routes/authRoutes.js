import express from 'express';
import { loginLocal, registerLocal } from '../controllers/authController.js';

const authRoutes = express.Router();
authRoutes.post('/register-local', registerLocal);
authRoutes.post('/login-local', loginLocal);

export default authRoutes;