import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getDashboardStats, getDashboardReviews } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", protect, getDashboardStats);
router.get("/stats", protect, getDashboardStats);
router.get("/reviews", protect, getDashboardReviews);

export default router;
