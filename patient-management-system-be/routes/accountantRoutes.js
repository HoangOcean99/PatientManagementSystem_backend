import express from "express";
import {
    getPendingDeposits,
    getPendingInvoices,
    confirmDeposit,
    payInvoice,
    getDashboardStats,
    searchApptsForDeposit
} from "../controllers/accountantController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Có thể thêm middleware bảo vệ route bằng role 'accountant' hoặc 'admin'
// router.use(requireAuth, requireRole(['accountant', 'admin', 'staff']));

router.get("/dashboard-stats", getDashboardStats);
router.get("/pending-deposits", getPendingDeposits);
router.get("/pending-invoices", getPendingInvoices);
router.get("/search-appts-for-deposit", searchApptsForDeposit);
router.put("/appointments/:id/deposit", confirmDeposit);
router.put("/invoices/:id/pay", payInvoice);

export default router;
