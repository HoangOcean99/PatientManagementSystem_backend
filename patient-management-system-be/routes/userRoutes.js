import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);

export default userRouter;
