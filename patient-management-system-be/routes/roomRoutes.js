import express from 'express';
import {
    getListActiveRooms,
    updateStatusByDoctor
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/getListActive', getListActiveRooms);
router.patch('/update-status-by-doctor', updateStatusByDoctor);

export default router;
