import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import baseRouter from "./routes/BaseRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import patientRouter from "./routes/patientRoutes.js";

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/base", baseRouter);
app.use("/patients", patientRouter);

app.use(errorHandler);

export default app;
