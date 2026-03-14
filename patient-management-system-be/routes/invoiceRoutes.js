import express from "express";
import { getInvoices, getInvoiceById, createInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);

export default router;
