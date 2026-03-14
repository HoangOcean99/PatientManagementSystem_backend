import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);
userRouter.delete("/:id", deleteUser);

export default userRouter;
