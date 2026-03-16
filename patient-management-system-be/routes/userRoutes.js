import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUserProfile,
  deleteUser,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const userRouter = express.Router();

userRouter.get("/getAllUsers", getAllUsers);
userRouter.get("/getUserById/:id", getUserById);
userRouter.post("/", createUser);
userRouter.put("/updateUser", upload.single("avatar"), updateUserProfile);
userRouter.delete("/:id", deleteUser);

export default userRouter;
