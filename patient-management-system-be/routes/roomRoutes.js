import express from 'express';
const router = express.Router();

import { getListActiveRooms, getListInactiveRooms, getListRooms } from "../controllers/roomController.js";

router.get('/getListActive', getListActiveRooms);
router.get('/getListInactive', getListInactiveRooms);
router.get('/getList', getListRooms);

export default router;
