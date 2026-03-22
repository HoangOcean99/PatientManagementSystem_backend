import * as userServices from "../services/userService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userServices.getAllUsers();

  res.status(200).json({
    success: true,
    data: users.map((user) => ({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      dob: user.dob,
      gender: user.gender,
      address: user.address,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url
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
      dob: user.dob,
      gender: user.gender,
      address: user.address,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url
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


export const updateUserProfile = async (req, res, next) => {
  try {

    const userData = req.body;
    const avatarFile = req.file || null;

    const avatarUrl = await userServices.updateUserProfile(
      userData,
      avatarFile
    );

    res.json({
      success: true,
      message: "Update profile success",
      avatar_url: avatarUrl
    });

  } catch (error) {
    next(error);
  }
};
export const getUsersByRole = asyncHandler(async (req, res) => {
  const role = req.params.role;
  const users = await userServices.getUsersByRole(role);

  res.status(200).json({
    success: true,
    data: users.map((user) => ({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      dob: user.dob,
      gender: user.gender,
      address: user.address,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url
    })),
  });
});

export const getUserByIdAndRole = asyncHandler(async (req, res) => {
  const { role, id } = req.params;

  if (!id) throw new AppError("User ID is required", 400);

  const user = await userServices.getUserByIdAndRole(id, role);

  res.status(200).json({
    success: true,
    data: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      dob: user.dob,
      gender: user.gender,
      address: user.address,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url
    },
  });
});

export const updateUserByRole = async (req, res, next) => {
  try {
    const { role, id } = req.params;
    const userData = req.body;
    const avatarFile = req.file || null;

    const avatarUrl = await userServices.updateUserByRole(
      id,
      role,
      userData,
      avatarFile
    );

    res.json({
      success: true,
      message: `${role} profile update success`,
      avatar_url: avatarUrl
    });

  } catch (error) {
    next(error);
  }
};

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  if (!userId) throw new AppError("User ID is required", 400);
  
  await userServices.deleteUser(userId);
  
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!userId) throw new AppError("User ID is required", 400);
  if (!role) throw new AppError("New role is required", 400);

  const updatedUser = await userServices.updateUserRole(userId, role);

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: updatedUser,
  });
});
