import express from "express";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
  getCreditPackages,
  getCreditBalance,
  getCreditHistory,
  purchaseCredits,
  useCredits,
  checkCredits,
  getServicePricing,
  grantBonusCredits,
  createRazorpayOrder,
  verifyRazorpayPayment,
  validateDiscount
} from "../controllers/creditsController.js";

const router = express.Router();

// Public routes
router.get("/packages", getCreditPackages);
router.get("/pricing", getServicePricing);

// Protected routes
router.use(protect);

router.get("/balance", getCreditBalance);
router.get("/history", getCreditHistory);
router.get("/check/:amount", checkCredits);
router.post("/purchase", purchaseCredits);
router.post("/use", useCredits);
router.post("/bonus", adminOnly, grantBonusCredits);
router.post("/validate-discount", validateDiscount);

// Razorpay routes
router.post("/create-order", createRazorpayOrder);
router.post("/verify-payment", verifyRazorpayPayment);

export default router;
