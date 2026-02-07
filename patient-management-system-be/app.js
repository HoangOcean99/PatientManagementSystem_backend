import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import baseRouter from './routes/BaseRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import doctorRouter from './routes/doctorRoutes.js';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/base', baseRouter);
app.use('/doctor', doctorRouter);

app.use(errorHandler);

export default app;
