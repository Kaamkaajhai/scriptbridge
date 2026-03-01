import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
	generateTrailer,
	getTrailerStatus,
	generateScriptScore,
	correctScriptText,
} from "../controllers/aiController.js";

const router = express.Router();

// AI Trailer
router.post("/generate-trailer", protect, generateTrailer);
router.get("/trailer-status/:scriptId", protect, getTrailerStatus);

// Script Score
router.post("/script-score", protect, generateScriptScore);

// Script grammar correction
router.post("/correct-script-text", protect, correctScriptText);

export default router;
