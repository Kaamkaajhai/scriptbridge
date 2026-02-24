import express from "express";
import { createContactSubmission } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", createContactSubmission);

export default router;