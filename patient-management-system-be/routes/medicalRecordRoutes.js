import express from 'express';
import { 
    startExamination, 
    completeExamination,
    getMedicalRecordById, 
    getMedicalRecordByAppointment, 
    getMedicalRecordsByPatient, 
    updateMedicalRecord 
} from '../controllers/medicalRecordController.js';

const router = express.Router();

// 1. Action APIs
router.post('/start', startExamination);       // Bắt đầu khám (tạo record)
router.post('/complete', completeExamination); // Hoàn thành khám (khoá record)

// 2. Querying APIs
router.get('/detail', getMedicalRecordById);
router.get('/appointment', getMedicalRecordByAppointment);
router.get('/patient', getMedicalRecordsByPatient);  // Xem toàn bộ lịch sử bệnh án

// 3. Update API
router.patch('/update', updateMedicalRecord);

export default router;
