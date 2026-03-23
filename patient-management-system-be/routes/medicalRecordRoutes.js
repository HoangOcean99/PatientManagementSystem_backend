import express from 'express';
import {
    startExamination,
    completeExamination,
    getMedicalRecordById,
    getMedicalRecordByAppointment,
    getMedicalRecordsByPatient,
    updateMedicalRecord,
    sendFollowUpReminder
} from '../controllers/medicalRecordController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// 1. Action APIs
router.post('/start', startExamination);       // Bắt đầu khám (tạo record)
router.post('/complete', completeExamination); // Hoàn thành khám (khoá record)

// 2. Querying APIs
router.get('/detail/:recordId', getMedicalRecordById);
router.get('/appointment/:appointmentId', getMedicalRecordByAppointment);
router.get('/patient/:patientId', requireAuth, getMedicalRecordsByPatient);  // Xem toàn bộ lịch sử bệnh án

// 3. Update API
router.patch('/update/:recordId', updateMedicalRecord);

// 4. Send Email Notifications
router.post('/send-followup-reminder', sendFollowUpReminder);

export default router;
