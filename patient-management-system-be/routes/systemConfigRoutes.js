import express from 'express';
import * as systemController from '../controllers/systemConfigController.js';

const systemConfigRoutes = express.Router();

systemConfigRoutes.get('/get-config', systemController.getSystemConfig);
systemConfigRoutes.post('/update-config', systemController.updateSystemConfig);
systemConfigRoutes.get('/getAll-holidays', systemController.getAllHolidays);
systemConfigRoutes.post('/create-holidays', systemController.createHoliday);
systemConfigRoutes.delete('/delete-holidays/:id', systemController.deleteHoliday);
systemConfigRoutes.get('/check-is-holiday', systemController.checkIsHoliday);
systemConfigRoutes.get('/getInRange-holidays', systemController.getHolidaysInRange);

export default systemConfigRoutes;