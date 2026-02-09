import * as userServices from "../services/userService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userServices.getAllUsers();

  res.status(200).json({
    success: true,
    data: users.map((u) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
    })),
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!userId) throw new AppError("User ID is required", 400);

  const user = await userServices.getUserById(userId);

  res.status(200).json({
    success: true,
    data: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    },
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const allowedRoles = ["admin", "doctor", "patient"];
  const { full_name, email, role } = req.body;

  if (!full_name) throw new AppError("Full name required", 400);
  if (!allowedRoles.includes(role)) throw new AppError("Invalid role", 400);

  const newUser = await userServices.createUser(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {
      user_id: newUser.user_id,
      full_name: newUser.full_name,
      role: newUser.role,
      status: newUser.status,
    },
  });
});
