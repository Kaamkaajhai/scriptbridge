import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  sendPitch,
  getPitchesForInvestor,
  updatePitchStatus
} from "../controllers/scriptPitchController.js";

const router = express.Router();

router.post("/send", protect, sendPitch);
router.get("/investor", protect, getPitchesForInvestor);
router.put("/:pitchId/status", protect, updatePitchStatus);

export default router;