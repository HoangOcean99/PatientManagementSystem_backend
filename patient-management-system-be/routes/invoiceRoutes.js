import express from "express";
import { getInvoices, getInvoiceById, createInvoice, payInvoice } from "../controllers/invoiceController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireAuth, getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.post("/:id/pay", requireAuth, payInvoice);

export default router;
