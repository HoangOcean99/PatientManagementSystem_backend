import express from 'express';
import {
    getListActiveRooms
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/getListActive', getListActiveRooms);

export default router;