import asyncHandler from "../utils/async-handler.js";
import * as accountantService from "../services/accountantService.js";
import { AppError } from "../utils/app-error.js";

export const getPendingDeposits = asyncHandler(async (req, res) => {
    const deposits = await accountantService.getPendingDeposits();
    res.json({ data: deposits });
});

export const getPendingInvoices = asyncHandler(async (req, res) => {
    const invoices = await accountantService.getPendingInvoices();
    res.json({ data: invoices });
});

export const confirmDeposit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    const data = await accountantService.confirmDeposit(id, amount);
    res.json({ message: "Xác nhận thu cọc thành công", data });
});

export const payInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { payment_method } = req.body;
    const data = await accountantService.payInvoice(id, payment_method);
    res.json({ message: "Xác nhận thanh toán hóa đơn thành công", data });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
    const data = await accountantService.getDashboardData();
    res.json({ data });
});

export const searchApptsForDeposit = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const data = await accountantService.searchAppointmentsForDeposit(query);
    res.json({ data });
});
