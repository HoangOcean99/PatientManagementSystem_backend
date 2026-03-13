import * as roomService from "../services/roomService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getListActiveRooms = asyncHandler(async (req, res) => {
  const response = await roomService.getListActiveRooms();
  return res.json(response);
});

export const getListInactiveRooms = asyncHandler(async (req, res) => {
  const response = await roomService.getListInactiveRooms();
  return res.json(response);
});

export const getListRooms = asyncHandler(async (req, res) => {
  const response = await roomService.getListRooms();
  return res.json(response);
});

export const createRoom = asyncHandler(async (req, res) => {
  const { room } = req.body;
  const newRoom = await roomService.createRoom(room);
  return res.json(newRoom);
});

export const updateRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { room } = req.body;
  const updatedRoom = await roomService.updateRoom(roomId, room);
  return res.json(updatedRoom);
}); 

export const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const deletedRoom = await roomService.deleteRoom(roomId);
  return res.json(deletedRoom);
});

export const getRoomById = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await roomService.getRoomById(roomId);
  return res.json(room);
});