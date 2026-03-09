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