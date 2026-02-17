import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUserProfile, updateUserProfile, followUser, unfollowUser, uploadProfileImage, upload } from "../controllers/userController.js";

const router = express.Router();

router.get("/:id", protect, getUserProfile);
router.put("/update", protect, updateUserProfile);
router.post("/upload-image", protect, upload.single("profileImage"), uploadProfileImage);
router.post("/follow", protect, followUser);
router.post("/unfollow", protect, unfollowUser);

export default router;
