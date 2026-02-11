import express from 'express';
import { loginLocal, registerLocal, syncUserGoogle } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const authRoutes = express.Router();
authRoutes.post('/register-local', registerLocal);
authRoutes.post('/login-local', loginLocal);
authRoutes.post('/sync-user-google', requireAuth, syncUserGoogle);

export default authRoutes;