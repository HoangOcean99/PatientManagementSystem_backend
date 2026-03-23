import express from "express";
import {
    getPendingDeposits,
    getPendingInvoices,
    confirmDeposit,
    payInvoice,
    getDashboardStats,
    searchApptsForDeposit
} from "../controllers/accountantController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireRole(['accountant', 'admin']));

router.get("/dashboard-stats", getDashboardStats);
router.get("/pending-deposits", getPendingDeposits);
router.get("/pending-invoices", getPendingInvoices);
router.get("/search-appts-for-deposit", searchApptsForDeposit);
router.put("/appointments/:id/deposit", confirmDeposit);
router.put("/invoices/:id/pay", payInvoice);

export default router;
