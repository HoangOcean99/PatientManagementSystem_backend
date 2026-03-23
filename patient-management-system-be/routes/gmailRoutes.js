import express from "express";
import { sendOtp, verifyOtp } from "../controllers/gmailController.js";
import { sendAppointmentConfirmation } from "../controllers/gmailController.js";
const gmailRouter = express.Router();

gmailRouter.post("/send", sendOtp);
gmailRouter.post("/verify", verifyOtp);
gmailRouter.post("/appointment-confirmation", sendAppointmentConfirmation);

export default gmailRouter;
 