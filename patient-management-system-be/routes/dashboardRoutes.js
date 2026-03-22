import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { getAdminStats } from '../controllers/dashboardController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin', requireAuth, requireRole(['admin']), getAdminStats);

export default dashboardRouter;
