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
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

// 1. Action APIs
router.post('/start', requireRole(['doctor', 'admin']), startExamination);       // Bắt đầu khám (tạo record)
router.post('/complete', requireRole(['doctor', 'admin']), completeExamination); // Hoàn thành khám (khoá record)

// 2. Querying APIs
router.get('/detail/:recordId', requireRole(['doctor', 'admin', 'patient']), getMedicalRecordById);
router.get('/appointment/:appointmentId', requireRole(['doctor', 'admin', 'patient']), getMedicalRecordByAppointment);
router.get('/patient/:patientId', requireAuth, getMedicalRecordsByPatient);  // Xem toàn bộ lịch sử bệnh án

// 3. Update API
router.patch('/update/:recordId', requireRole(['doctor', 'admin']), updateMedicalRecord);

// 4. Send Email Notifications
router.post('/send-followup-reminder', requireRole(['doctor', 'admin']), sendFollowUpReminder);

export default router;
