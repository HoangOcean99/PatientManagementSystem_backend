import express from 'express';
import { loginLocal, requestForgetPassword, requestRegister, resetPassword, syncUserGoogle, verifyAndCreateUser, verifyResetOtp } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const authRoutes = express.Router();
authRoutes.post('/request-register', requestRegister);
authRoutes.post('/verify-and-create', verifyAndCreateUser)
authRoutes.post('/login-local', loginLocal);
authRoutes.post('/sync-user-google', requireAuth, syncUserGoogle);
authRoutes.post('/request-forget-password', requestForgetPassword);
authRoutes.post('/verify-reset-otp', verifyResetOtp);
authRoutes.post('/reset-password', resetPassword);


export default authRoutes;