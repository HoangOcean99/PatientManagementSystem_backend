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

export const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, payment_method } = req.body;
    const data = await invoiceService.updateInvoiceStatus(id, status, payment_method);
    res.json({ message: "Cập nhật trạng thái hóa đơn thành công", data });
});

export const payInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate access implicitly by finding invoice then matching patient, or simply perform it directly
    const invoice = await invoiceService.getInvoiceById(id);
    if (!invoice) {
        throw new AppError("Invoice not found", 404);
    }

    const hasAccess = await checkDependentAccess(req.user.id, invoice.patient_id);
    if (!hasAccess) {
        throw new AppError("You do not have permission to pay this invoice", 403);
    }

    const data = await invoiceService.markInvoiceAsPaid(id);
    res.json({ message: "Payment successful", data });
});
