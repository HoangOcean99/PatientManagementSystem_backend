import express from "express";
import { createPatient } from "../controllers/patientController.js";
const patientRouter = express.Router();
patientRouter.post("/", createPatient);
export default patientRouter;
