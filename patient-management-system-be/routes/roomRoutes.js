import express from "express";
import { getListActiveRooms  , getListInactiveRooms , getListRooms, updateStatusByDoctor } from "../controllers/roomController.js";
import { createRoom } from "../controllers/roomController.js";
import { updateRoom } from "../controllers/roomController.js";
import { deleteRoom } from "../controllers/roomController.js";
import { getRoomById } from "../controllers/roomController.js";
const roomRouter = express.Router();

roomRouter.get('/getListActive', getListActiveRooms);  
roomRouter.get('/getListInactive', getListInactiveRooms);
roomRouter.get('/getList', getListRooms);
roomRouter.post('/create', createRoom);
roomRouter.put('/update/:roomId', updateRoom);
roomRouter.delete('/delete/:roomId', deleteRoom);
roomRouter.get('/getById/:roomId', getRoomById);
roomRouter.patch('/update-status-by-doctor', updateStatusByDoctor);

  export default roomRouter;  
