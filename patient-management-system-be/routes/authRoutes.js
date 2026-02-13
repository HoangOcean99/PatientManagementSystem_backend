import express from 'express';
import { loginLocal, requestRegister, syncUserGoogle, verifyAndCreateUser } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const authRoutes = express.Router();
authRoutes.post('/request-register', requestRegister);
authRoutes.post('/verify-and-create', verifyAndCreateUser)
authRoutes.post('/login-local', loginLocal);
authRoutes.post('/sync-user-google', requireAuth, syncUserGoogle);

export default authRoutes;