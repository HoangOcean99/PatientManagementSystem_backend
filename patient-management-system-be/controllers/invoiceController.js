import asyncHandler from "../utils/async-handler.js";
import * as invoiceService from "../services/invoiceService.js";

export const getInvoices = asyncHandler(async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) {
        return res.status(400).json({ message: "patient_id is required" });
    }
    const data = await invoiceService.getInvoicesByPatient(patient_id);
    res.json({ data });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await invoiceService.getInvoiceById(id);
    res.json({ data });
});

export const createInvoice = asyncHandler(async (req, res) => {
    const data = await invoiceService.createInvoice(req.body);
    res.status(201).json({ data });
});
