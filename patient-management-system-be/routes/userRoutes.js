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
import { requireRole } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/getAllUsers", requireRole(['admin']), getAllUsers);
userRouter.get("/getUserById/:id", getUserById);
userRouter.post("/", requireRole(['admin']), createUser);
userRouter.put("/updateUser", upload.single("avatar"), updateUserProfile);
userRouter.delete("/:id", requireRole(['admin']), deleteUser);

userRouter.get("/role/:role", requireRole(['admin']), getUsersByRole);
userRouter.get("/role/:role/:id", requireRole(['admin']), getUserByIdAndRole);
userRouter.put("/role/:role/:id", requireRole(['admin']), upload.single("avatar"), updateUserByRole);

userRouter.put("/:id/role", requireRole(['admin']), updateUserRole);

export default userRouter;
