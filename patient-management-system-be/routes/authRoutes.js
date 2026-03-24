import express from 'express';
import { requestForgetPassword, requestRegister, resetPassword, signOut, syncUserGoogle, verifyAndCreateUser, verifyResetOtp } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

const authRoutes = express.Router();
authRoutes.post('/request-register', requestRegister);
authRoutes.post('/verify-and-create', verifyAndCreateUser)
authRoutes.post('/sync-user-google', requireAuth, syncUserGoogle);
authRoutes.post('/request-forget-password', requestForgetPassword);
authRoutes.post('/verify-reset-otp', verifyResetOtp);
authRoutes.post('/reset-password', resetPassword);
authRoutes.post('/sign-out', requireAuth, signOut);



export default authRoutes;