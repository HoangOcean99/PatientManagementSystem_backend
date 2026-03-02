import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import baseRouter from './routes/BaseRoutes.js';
import authRouter from './routes/authRoutes.js';
import gmailRouter from './routes/gmailRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import doctorRouter from './routes/doctorRoutes.js';
import patientRouter from "./routes/patientRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cors from 'cors';


import appointmentRouter from './routes/appointmentRoutes.js';
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/base', baseRouter);
app.use('/doctor', doctorRouter);
app.use('/auth', authRouter);
app.use('/gmail', gmailRouter);
app.use("/patients", patientRouter);
app.use('/appointment', appointmentRouter);
app.use("/users", userRouter);
app.use(errorHandler);

export default app;
