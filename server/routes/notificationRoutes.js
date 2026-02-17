import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  deleteNotification,
  clearAll,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/mark-all-read", protect, markAllRead);
router.put("/:id/read", protect, markOneRead);
router.delete("/:id", protect, deleteNotification);
router.delete("/", protect, clearAll);

export default router;
