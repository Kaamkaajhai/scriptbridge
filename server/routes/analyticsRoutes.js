import express from "express";
import { trackEvent, trackSession } from "../controllers/analyticsController.js";

const router = express.Router();

router.post("/track-event", trackEvent);
router.post("/track-session", trackSession);

export default router;
