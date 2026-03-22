import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUserProfile,
  deleteUser,
  getUsersByRole,
  getUserByIdAndRole,
  updateUserByRole,
  updateUserRole,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const userRouter = express.Router();

userRouter.get("/getAllUsers", getAllUsers);
userRouter.get("/getUserById/:id", getUserById);
userRouter.post("/", createUser);
userRouter.put("/updateUser", upload.single("avatar"), updateUserProfile);
userRouter.delete("/:id", deleteUser);

userRouter.get("/role/:role", getUsersByRole);
userRouter.get("/role/:role/:id", getUserByIdAndRole);
userRouter.put("/role/:role/:id", upload.single("avatar"), updateUserByRole);

userRouter.put("/:id/role", updateUserRole);

export default userRouter;
