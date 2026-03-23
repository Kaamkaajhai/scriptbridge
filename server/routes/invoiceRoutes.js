import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getInvoicePdf } from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/:id/pdf", protect, getInvoicePdf);

export default router;
