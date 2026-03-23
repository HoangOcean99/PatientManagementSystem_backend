import express from "express";
import { getListActiveRooms  , getListInactiveRooms , getListRooms, updateStatusByDoctor } from "../controllers/roomController.js";
import { createRoom } from "../controllers/roomController.js";
import { updateRoom } from "../controllers/roomController.js";
import { deleteRoom } from "../controllers/roomController.js";
import { getRoomById } from "../controllers/roomController.js";
import { requireRole } from "../middlewares/auth.js";
const roomRouter = express.Router();

roomRouter.get('/getListActive', getListActiveRooms);  
roomRouter.get('/getListInactive', getListInactiveRooms);
roomRouter.get('/getList', getListRooms);
roomRouter.post('/create', requireRole(['admin']), createRoom);
roomRouter.put('/update/:roomId', requireRole(['admin']), updateRoom);
roomRouter.delete('/delete/:roomId', requireRole(['admin']), deleteRoom);
roomRouter.get('/getById/:roomId', getRoomById);
roomRouter.patch('/update-status-by-doctor', requireRole(['doctor', 'admin']), updateStatusByDoctor);

  export default roomRouter;  
