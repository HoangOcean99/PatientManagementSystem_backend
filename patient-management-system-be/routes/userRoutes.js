import express from 'express';
import { createUser } from '../controllers/userController.js';
import { updateUser } from '../controllers/userController.js';
import { getListUsers } from '../controllers/userController.js';
import { getUserById } from '../controllers/userController.js';
import { deleteUser } from '../controllers/userController.js';

const userRouter = express.Router();
userRouter.post('/create', createUser);
userRouter.put('/update/:userId', updateUser);
userRouter.get('/list', getListUsers);
userRouter.get('/:userId', getUserById);
userRouter.delete('/:userId', deleteUser);
export default userRouter;