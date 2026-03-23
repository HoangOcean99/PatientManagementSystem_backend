import express from 'express';
import * as systemController from '../controllers/systemConfigController.js';
import { requireRole } from '../middlewares/auth.js';

const systemConfigRoutes = express.Router();

systemConfigRoutes.get('/get-config', systemController.getSystemConfig);
systemConfigRoutes.post('/update-config', requireRole(['admin']), systemController.updateSystemConfig);
systemConfigRoutes.get('/getAll-holidays', systemController.getAllHolidays);
systemConfigRoutes.post('/create-holidays', requireRole(['admin']), systemController.createHoliday);
systemConfigRoutes.delete('/delete-holidays/:id', requireRole(['admin']), systemController.deleteHoliday);
systemConfigRoutes.get('/check-is-holiday', systemController.checkIsHoliday);
systemConfigRoutes.get('/getInRange-holidays', systemController.getHolidaysInRange);

export default systemConfigRoutes;