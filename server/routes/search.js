import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Script from "../models/Script.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @route   GET /api/search
// @desc    Search for users, posts, or scripts with optional role filter
// @access  Private
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q, type = "all", role, genre, contentType, budget, premium } = req.query;
    if (!q || !q.trim()) {
      return res.json({ users: [], scripts: [] });
    }
    const searchRegex = new RegExp(escapeRegExp(q.trim()), "i");

    const currentUser = await User.findById(req.user._id).select("blockedUsers").lean();
    const usersWhoBlockedCurrent = await User.find({ blockedUsers: req.user._id }).select("_id").lean();
    const blockedUserIds = [
      ...(currentUser?.blockedUsers || []),
      ...usersWhoBlockedCurrent.map((u) => u._id),
    ];

    let results = { users: [], scripts: [] };

    // Search users (optionally filter by role)
    if (type === "all" || type === "users" || type === "writers" || type === "investors" || type === "readers") {
      const userQuery = {
        $or: [
          { name: searchRegex },
          { sid: searchRegex },
          { bio: searchRegex },
          { skills: searchRegex },
          { "writerProfile.genres": searchRegex },
          { "writerProfile.specializedTags": searchRegex },
        ],
      };

      // Apply role filter
      if (type === "writers") {
        userQuery.role = { $in: ["writer", "creator"] };
      } else if (type === "investors") {
        userQuery.role = "investor";
      } else if (type === "readers") {
        userQuery.role = "reader";
      } else if (role) {
        userQuery.role = role;
      }

      if (blockedUserIds.length > 0) {
        userQuery._id = { $nin: blockedUserIds };
      }

      const userDocs = await User.find(userQuery)
        .select("sid name email role bio skills profileImage followers following writerProfile.genres writerProfile.wgaMember writerProfile.representationStatus")
        .limit(30)
        ;

      await Promise.all(
        userDocs.map(async (doc) => {
          if (!doc.sid) {
            await doc.save();
          }
        })
      );

      // Add computed counts
      results.users = userDocs.map((doc) => {
        const u = doc.toObject();
        return ({
        ...u,
        followerCount: u.followers?.length || 0,
        followingCount: u.following?.length || 0,
      });
      });
    }

    // Search scripts/projects
    if (type === "all" || type === "projects") {
      const scriptQuery = {
        status: "published",
        isSold: { $ne: true },
        isDeleted: { $ne: true },
        $or: [
          { purchaseRequestLocked: { $ne: true } },
          { purchaseRequestLockedBy: req.user._id },
          { creator: req.user._id },
        ],
      };
      if (q && q.trim()) {
        scriptQuery.$and = [{
          $or: [
          { title: searchRegex },
          { sid: searchRegex },
          { description: searchRegex },
          { genre: searchRegex },
          { contentType: searchRegex },
          ],
        }];
      }
      if (genre) scriptQuery.genre = genre;
      if (contentType) scriptQuery.contentType = contentType;
      if (budget) scriptQuery.budget = budget;
      if (premium === "true") scriptQuery.premium = true;
      else if (premium === "false") scriptQuery.premium = { $ne: true };
      if (blockedUserIds.length > 0) {
        scriptQuery.creator = { $nin: blockedUserIds };
      }

      const scriptDocs = await Script.find(scriptQuery)
        .populate("creator", "name profileImage role")
        .sort({ createdAt: -1 })
        .limit(30)
        ;

      await Promise.all(
        scriptDocs.map(async (doc) => {
          if (!doc.sid) {
            await doc.save();
          }
        })
      );

      // Add computed counts
      results.scripts = scriptDocs.map((doc) => {
        const s = doc.toObject();
        return ({
        ...s,
        unlockCount: s.unlockedBy?.length || 0,
        viewCount: s.views || 0,
      });
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
