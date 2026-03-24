import express from "express";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
    getStats,
    getUsers,
    getScripts,
    getAIUsageScripts,
    getEvaluationPurchases,
    getInvestorPurchases,
    getInvoices,
    getPayments,
    getAIScores,
    getPlatformScores,
    getReaderScores,
    getPendingScripts,
    approveScript,
    rejectScript,
    scoreScript,
    getTrailerRequests,
    approveTrailer,
    loginAsUser,
    getScriptDetail,
    getPendingInvestors,
    approveInvestor,
    rejectInvestor,
    getAdminAlertSummary,
} from "../controllers/adminController.js";
import { getContactSubmissions } from "../controllers/contactController.js";

const router = express.Router();

// All routes require auth + admin
router.use(protect, adminOnly);

// Dashboard
router.get("/stats", getStats);
router.get("/alerts/summary", getAdminAlertSummary);

// Users
router.get("/users", getUsers);

// Scripts
router.get("/scripts", getScripts);
router.get("/scripts/ai-usage", getAIUsageScripts);
router.get("/scripts/evaluation-purchases", getEvaluationPurchases);
router.get("/scripts/investor-purchases", getInvestorPurchases);
router.get("/scripts/pending", getPendingScripts);
router.get("/scripts/trailer-requests", getTrailerRequests);
router.get("/scripts/:id", getScriptDetail);
router.put("/scripts/:id/approve", approveScript);
router.put("/scripts/:id/reject", rejectScript);
router.put("/scripts/:id/score", scoreScript);
router.put("/scripts/:id/trailer-approve", approveTrailer);

// Payments
router.get("/payments", getPayments);
router.get("/invoices", getInvoices);

// Scores
router.get("/scores/ai", getAIScores);
router.get("/scores/platform", getPlatformScores);
router.get("/scores/reader", getReaderScores);

// Impersonation
router.post("/login-as/:userId", loginAsUser);

// Investor Approval
router.get("/investors/pending", getPendingInvestors);
router.put("/investors/:id/approve", approveInvestor);
router.put("/investors/:id/reject", rejectInvestor);

// Contact Queries
router.get("/queries", getContactSubmissions);

export default router;
