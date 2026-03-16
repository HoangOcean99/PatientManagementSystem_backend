import asyncHandler from "../utils/async-handler.js";
import * as invoiceService from "../services/invoiceService.js";
import { checkDependentAccess } from "../middlewares/auth.js";
import { AppError } from "../utils/app-error.js";

export const getInvoices = asyncHandler(async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) {
        throw new AppError("patient_id is required", 400);
    }

    const hasAccess = await checkDependentAccess(req.user.id, patient_id);
    if (!hasAccess) {
        throw new AppError("You do not have permission to view these invoices", 403);
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
