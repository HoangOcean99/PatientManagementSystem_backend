import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';

import authRouter from './routes/authRoutes.js';
import gmailRouter from './routes/gmailRoutes.js';
import doctorRouter from './routes/doctorRoutes.js';
import patientRouter from "./routes/patientRoutes.js";
import userRouter from "./routes/userRoutes.js";
import medicalRecordRouter from './routes/medicalRecordRoutes.js';
import labOrderRouter from './routes/labOrderRoutes.js';
import appointmentRouter from './routes/appointmentRoutes.js';

import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

app.options('*', cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/doctor', doctorRouter);
app.use('/auth', authRouter);
app.use('/gmail', gmailRouter);
app.use("/patients", patientRouter);
app.use('/appointment', appointmentRouter);
app.use("/users", userRouter);
app.use('/medical-record', medicalRecordRouter);
app.use('/lab-orders', labOrderRouter);

app.use(errorHandler);

export default app;