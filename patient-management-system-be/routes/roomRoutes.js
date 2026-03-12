import express from "express";
import { getListActiveRooms, getListInactiveRooms, getListRooms } from "../controllers/roomController.js";

const roomRouter = express.Router();

roomRouter.get('/getListActive', getListActiveRooms);
roomRouter.get('/getListInactive', getListInactiveRooms);
roomRouter.get('/getList', getListRooms);

export default roomRouter;