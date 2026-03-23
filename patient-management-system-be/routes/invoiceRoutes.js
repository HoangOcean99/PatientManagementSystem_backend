import express from "express";
import { getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus, payInvoice } from "../controllers/invoiceController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireRole(['accountant', 'admin', 'receptionist', 'patient']));

router.get("/", requireAuth, getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.put("/:id/status", updateInvoiceStatus);
router.post("/:id/pay", requireAuth, payInvoice);

export default router;