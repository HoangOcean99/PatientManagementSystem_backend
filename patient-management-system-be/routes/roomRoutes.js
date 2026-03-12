import express from 'express';
const router = express.Router();

import express from "express";
import { getListActiveRooms, getListInactiveRooms, getListRooms } from "../controllers/roomController.js";

roomRouter.get('/getListActive', getListActiveRooms);
roomRouter.get('/getListInactive', getListInactiveRooms);
roomRouter.get('/getList', getListRooms);

export default roomRouter;
