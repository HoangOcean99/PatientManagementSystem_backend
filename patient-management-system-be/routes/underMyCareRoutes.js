import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
    addDependent,
    getDependents,
    getDependentDetail,
    updateDependent,
    removeDependent,
    generateShareCode,
    linkDependent,
} from "../controllers/underMyCareController.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ── CRUD ──
router.get("/", getDependents);
router.post("/", addDependent);

// Share code routes (must be BEFORE /:relationshipId to avoid conflict)
router.post("/share-code", generateShareCode);
router.post("/link", linkDependent);

// Parameterized routes
router.get("/:relationshipId", getDependentDetail);
router.patch("/:relationshipId", updateDependent);
router.delete("/:relationshipId", removeDependent);

export default router;
