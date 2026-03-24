import User from "../models/User.js";
import Post from "../models/Post.js";
import Script from "../models/Script.js";
import Notification from "../models/Notification.js";
import { sendOTPEmail, sendEmailChangeOTPToCompany } from "../utils/emailService.js";
import { generateOTP, generateOTPExpiry, isOTPExpired } from "../utils/otpHelper.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRITER_REPRESENTATION_STATUSES = ["unrepresented", "manager", "agent", "manager_and_agent"];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : value);

const normalizeStringArray = (value, maxItems) => {
  if (!Array.isArray(value)) return [];
  const unique = [];
  for (const item of value) {
    const normalized = normalizeString(item);
    if (!normalized) continue;
    if (!unique.includes(normalized)) unique.push(normalized);
    if (maxItems && unique.length >= maxItems) break;
  }
  return unique;
};

const sanitizeBankPayload = (bankDetails) => {
  if (!bankDetails || typeof bankDetails !== "object") return null;

  const clean = {
    accountHolderName: normalizeString(bankDetails.accountHolderName) || "",
    bankName: normalizeString(bankDetails.bankName) || "",
    accountNumber: typeof bankDetails.accountNumber === "string"
      ? bankDetails.accountNumber.replace(/\s+/g, "")
      : "",
    routingNumber: typeof bankDetails.routingNumber === "string"
      ? bankDetails.routingNumber.replace(/\s+/g, "")
      : "",
    accountType: normalizeString(bankDetails.accountType) || "checking",
    swiftCode: normalizeString(bankDetails.swiftCode)?.toUpperCase() || "",
    iban: normalizeString(bankDetails.iban)?.toUpperCase() || "",
    country: (normalizeString(bankDetails.country) || "IN").toUpperCase(),
    currency: (normalizeString(bankDetails.currency) || "INR").toUpperCase(),
  };

  // Do not allow masked values to overwrite real account number.
  if (clean.accountNumber.startsWith("****")) {
    clean.accountNumber = undefined;
  }

  return clean;
};

// Multer config for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "profiles"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"), false);
  }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export const getWriters = async (req, res) => {
  try {
    const { sort, genre, search } = req.query;

    const currentUser = await User.findById(req.user._id).select("blockedUsers").lean();
    const usersWhoBlockedCurrent = await User.find({ blockedUsers: req.user._id }).select("_id").lean();
    const blockedUserIds = [
      ...(currentUser?.blockedUsers || []),
      ...usersWhoBlockedCurrent.map((u) => u._id),
    ];

    // Base match: include both writer and creator accounts
    const matchStage = { role: { $in: ["writer", "creator"] } };

    if (blockedUserIds.length > 0) {
      matchStage._id = { $nin: blockedUserIds };
    }

    // Name search (case-insensitive)
    if (search && search.trim()) {
      matchStage.name = { $regex: search.trim(), $options: "i" };
    }

    // Genre filter early (before lookup) when writerProfile.genres exists on the user doc
    if (genre && genre !== "All") {
      matchStage["writerProfile.genres"] = genre;
    }

    const pipeline = [
      { $match: matchStage },
      // Strip sensitive / heavy fields before the lookup so less data travels
      {
        $project: {
          password: 0,
          emailVerificationToken: 0,
          emailVerificationExpires: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0,
        },
      },
      // Pipeline-form lookup: only pull the three fields we actually need from each script
      {
        $lookup: {
          from: "scripts",
          let: { uid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$creator", "$$uid"] }, isSold: { $ne: true } } },
            {
              $project: {
                views: 1,
                "scriptScore.overall": 1,
                unlockedByCount: { $size: { $ifNull: ["$unlockedBy", []] } },
              },
            },
          ],
          as: "scripts",
        },
      },
      {
        $addFields: {
          scriptCount: { $size: "$scripts" },
          totalViews: { $sum: "$scripts.views" },
          avgScore: {
            $let: {
              vars: {
                scored: {
                  $filter: { input: "$scripts", as: "s", cond: { $gt: ["$$s.scriptScore.overall", 0] } },
                },
              },
              in: {
                $cond: [
                  { $gt: [{ $size: "$$scored" }, 0] },
                  { $avg: "$$scored.scriptScore.overall" },
                  0,
                ],
              },
            },
          },
          totalUnlocks: { $sum: "$scripts.unlockedByCount" },
          followerCount: { $size: { $ifNull: ["$followers", []] } },
        },
      },
      { $project: { scripts: 0 } },
    ];

    // Sort options
    if (sort === "score") {
      pipeline.push({ $sort: { avgScore: -1, followerCount: -1 } });
    } else if (sort === "views") {
      pipeline.push({ $sort: { totalViews: -1 } });
    } else if (sort === "followers") {
      pipeline.push({ $sort: { followerCount: -1 } });
    } else if (sort === "scripts") {
      pipeline.push({ $sort: { scriptCount: -1 } });
    } else {
      // Default: combined reputation (avgScore * 0.5 + totalViews/100 * 0.3 + followerCount * 0.2)
      pipeline.push({
        $addFields: {
          reputation: {
            $add: [
              { $multiply: [{ $ifNull: ["$avgScore", 0] }, 0.5] },
              { $multiply: [{ $divide: [{ $ifNull: ["$totalViews", 0] }, 100] }, 0.3] },
              { $multiply: [{ $ifNull: ["$followerCount", 0] }, 0.2] },
            ],
          },
        },
      });
      pipeline.push({ $sort: { reputation: -1 } });
    }

    // Cap results – 100 writers is more than enough for the browse page
    pipeline.push({ $limit: 100 });

    const writers = await User.aggregate(pipeline);
    res.json(writers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const isOwnProfile = req.user?._id?.toString() === req.params.id.toString();

    let userQuery = User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name profileImage")
      .populate("following", "name profileImage");

    if (isOwnProfile) {
      userQuery = userQuery.populate("blockedUsers", "name profileImage role");
    }

    const user = await userQuery;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let blockedByCurrent = false;
    let blockedByProfile = false;

    if (!isOwnProfile) {
      const currentUser = await User.findById(req.user._id).select("blockedUsers");
      blockedByCurrent = currentUser?.blockedUsers?.some((uid) => uid.toString() === req.params.id.toString()) || false;
      blockedByProfile = user?.blockedUsers?.some((uid) => uid.toString() === req.user._id.toString()) || false;

      if (blockedByProfile) {
        return res.status(403).json({
          message: "This user has blocked you.",
          blocked: true,
          blockedByCurrent,
          blockedByProfile,
        });
      }
    }

    const posts = await Post.find({ user: req.params.id })
      .populate("user", "name profileImage role")
      .sort({ createdAt: -1 });

    const scriptQuery = isOwnProfile
      ? { creator: req.params.id }
      : {
          creator: req.params.id,
          status: { $ne: "draft" },
          purchaseRequestLocked: { $ne: true },
        };

    const scripts = await Script.find(scriptQuery)
      .populate("creator", "name profileImage role")
      .sort({ createdAt: -1 });

    // Fetch scripts purchased by this user (only for own profile or investor/producer viewing)
    const isPro = ["investor", "producer", "director"].includes(user.role);
    let purchasedScripts = [];
    if (isOwnProfile && isPro) {
      purchasedScripts = await Script.find({ unlockedBy: req.params.id })
        .populate("creator", "name profileImage role")
        .select("_id title genre format price coverImage creator premium createdAt logline unlockedBy")
        .sort({ createdAt: -1 });
    }

    let bookmarkedScripts = [];
    if (isOwnProfile && Array.isArray(user.favoriteScripts) && user.favoriteScripts.length > 0) {
      bookmarkedScripts = await Script.find({
        _id: { $in: user.favoriteScripts },
        status: "published",
        $or: [
          { purchaseRequestLocked: { $ne: true } },
          { purchaseRequestLockedBy: req.user._id },
        ],
      })
        .populate("creator", "name profileImage role")
        .sort({ updatedAt: -1 });
    }

    // Sanitize bank details - only show to own profile
    const userObj = user.toObject();
    if (!isOwnProfile && userObj.bankDetails) {
      delete userObj.bankDetails;
      delete userObj.pendingEmail;
    } else if (isOwnProfile && userObj.bankDetails && userObj.bankDetails.accountNumber) {
      // Sanitize account number even for own profile (for security)
      userObj.bankDetails.accountNumber = '****' + userObj.bankDetails.accountNumber.slice(-4);
    }

    userObj.blockedByCurrent = blockedByCurrent;
    userObj.blockedByProfile = blockedByProfile;

    res.json({ user: userObj, posts, scripts, purchasedScripts, bookmarkedScripts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const {
      name, bio, skills, profileImage, coverImage, writerProfile,
      removeProfileImage, removeCoverImage,
      // Investor / industry preference fields (from onboarding Step 3)
      preferredGenres, preferredBudgets, preferredFormats,
      // Reader preferences (genres + contentTypes)
      preferences,
      // onboarding completion
      onboardingComplete,
      // investor profile fields
      subRole, company, jobTitle, imdbUrl, linkedInUrl, otherUrl, previousCredits, investmentRange,
      // bank details
      bankDetails,
      // notification preferences
      notificationPrefs,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

<<<<<<< HEAD
    user.name = name || user.name;
    user.bio = bio !== undefined ? bio : user.bio;
    user.skills = skills || user.skills;
    if (removeProfileImage) user.profileImage = "";
    else if (profileImage !== undefined) user.profileImage = profileImage;

    if (removeCoverImage) user.coverImage = "";
    else if (coverImage !== undefined) user.coverImage = coverImage;
=======
    user.name = normalizeString(name) || user.name;
    user.bio = bio !== undefined ? normalizeString(bio) : user.bio;
    if (skills !== undefined) {
      user.skills = normalizeStringArray(skills, 25);
    }
    user.profileImage = normalizeString(profileImage) || user.profileImage;
>>>>>>> origin/master

    // Investor / industry preference genres — save to mandates AND preferences
    if (preferredGenres !== undefined) {
      if (!user.preferences) user.preferences = {};
      user.preferences.genres = preferredGenres;
      user.markModified("preferences");
      // Also persist to mandates so getInvestorFeed can read from industryProfile
      if (!user.industryProfile) user.industryProfile = {};
      if (!user.industryProfile.mandates) user.industryProfile.mandates = {};
      user.industryProfile.mandates.genres = preferredGenres;
      user.markModified("industryProfile");
    }

    // Reader / generic preferences (genres + contentTypes)
    if (preferences !== undefined) {
      if (!user.preferences) user.preferences = {};
      if (preferences.genres !== undefined) user.preferences.genres = preferences.genres;
      if (preferences.contentTypes !== undefined) user.preferences.contentTypes = preferences.contentTypes;
      user.markModified("preferences");
    }
    if (preferredBudgets !== undefined) {
      if (!user.industryProfile) user.industryProfile = {};
      if (!user.industryProfile.mandates) user.industryProfile.mandates = {};
      user.industryProfile.mandates.budgetTiers = preferredBudgets;
      user.markModified("industryProfile");
    }
    if (preferredFormats !== undefined) {
      // Store in mandates.formats (no enum restriction); skip preferences.contentTypes
      // because that field has a strict enum incompatible with onboarding format strings
      if (!user.industryProfile) user.industryProfile = {};
      if (!user.industryProfile.mandates) user.industryProfile.mandates = {};
      user.industryProfile.mandates.formats = preferredFormats;
      user.markModified("industryProfile");
    }

    // Investor profile fields
    if (subRole !== undefined || company !== undefined || jobTitle !== undefined || imdbUrl !== undefined || linkedInUrl !== undefined || otherUrl !== undefined || previousCredits !== undefined || investmentRange !== undefined) {
      if (!user.industryProfile) user.industryProfile = {};
      if (subRole !== undefined) user.industryProfile.subRole = normalizeString(subRole);
      if (company !== undefined) user.industryProfile.company = normalizeString(company);
      if (jobTitle !== undefined) user.industryProfile.jobTitle = normalizeString(jobTitle);
      if (imdbUrl !== undefined) user.industryProfile.imdbUrl = normalizeString(imdbUrl);
      if (linkedInUrl !== undefined) user.industryProfile.linkedInUrl = normalizeString(linkedInUrl);
      if (otherUrl !== undefined) user.industryProfile.otherUrl = normalizeString(otherUrl);
      if (previousCredits !== undefined) user.industryProfile.previousCredits = normalizeString(previousCredits);
      if (investmentRange !== undefined) user.industryProfile.investmentRange = normalizeString(investmentRange);
      user.markModified("industryProfile");
    }

    // Onboarding completion
    if (onboardingComplete !== undefined) {
      if (user.role === "writer") {
        if (!user.writerProfile) user.writerProfile = {};
        user.writerProfile.onboardingComplete = onboardingComplete;
        user.markModified("writerProfile");
      } else {
        if (!user.industryProfile) user.industryProfile = {};
        user.industryProfile.onboardingComplete = onboardingComplete;
        user.markModified("industryProfile");
      }
    }

    // Writer-specific fields
    if (writerProfile) {
      if (!user.writerProfile) user.writerProfile = {};
      if (writerProfile.representationStatus !== undefined) {
        const representationStatus = normalizeString(writerProfile.representationStatus);
        if (!WRITER_REPRESENTATION_STATUSES.includes(representationStatus)) {
          return res.status(400).json({ message: "Invalid representation status" });
        }
        user.writerProfile.representationStatus = representationStatus;
      }
      if (writerProfile.agencyName !== undefined) {
        user.writerProfile.agencyName = normalizeString(writerProfile.agencyName) || "";
      }
      if (writerProfile.wgaMember !== undefined) {
        user.writerProfile.wgaMember = writerProfile.wgaMember;
      }
      if (writerProfile.genres !== undefined) {
        user.writerProfile.genres = normalizeStringArray(writerProfile.genres, 12);
      }
      if (writerProfile.specializedTags !== undefined) {
        user.writerProfile.specializedTags = normalizeStringArray(writerProfile.specializedTags, 5);
      }
      if (writerProfile.diversity !== undefined) {
        if (!user.writerProfile.diversity) user.writerProfile.diversity = {};
        if (writerProfile.diversity.gender !== undefined) {
          user.writerProfile.diversity.gender = normalizeString(writerProfile.diversity.gender);
        }
        if (writerProfile.diversity.ethnicity !== undefined) {
          user.writerProfile.diversity.ethnicity = normalizeString(writerProfile.diversity.ethnicity);
        }
      }

      const currentStatus = user.writerProfile.representationStatus || "unrepresented";
      if (["agent", "manager", "manager_and_agent"].includes(currentStatus) && !user.writerProfile.agencyName) {
        return res.status(400).json({ message: "Agency name is required for represented writers" });
      }

      user.markModified("writerProfile");
    }

    // Bank details
    if (bankDetails) {
      const sanitizedBankDetails = sanitizeBankPayload(bankDetails);
      if (!user.bankDetails) user.bankDetails = {};
      if (sanitizedBankDetails.accountHolderName !== undefined) {
        user.bankDetails.accountHolderName = sanitizedBankDetails.accountHolderName;
      }
      if (sanitizedBankDetails.bankName !== undefined) {
        user.bankDetails.bankName = sanitizedBankDetails.bankName;
      }
      if (sanitizedBankDetails.accountNumber !== undefined) {
        user.bankDetails.accountNumber = sanitizedBankDetails.accountNumber;
      }
      if (sanitizedBankDetails.routingNumber !== undefined) {
        user.bankDetails.routingNumber = sanitizedBankDetails.routingNumber;
      }
      if (sanitizedBankDetails.accountType !== undefined) {
        user.bankDetails.accountType = sanitizedBankDetails.accountType;
      }
      if (sanitizedBankDetails.swiftCode !== undefined) {
        user.bankDetails.swiftCode = sanitizedBankDetails.swiftCode;
      }
      if (sanitizedBankDetails.iban !== undefined) {
        user.bankDetails.iban = sanitizedBankDetails.iban;
      }
      if (sanitizedBankDetails.country !== undefined) {
        user.bankDetails.country = sanitizedBankDetails.country;
      }
      if (sanitizedBankDetails.currency !== undefined) {
        user.bankDetails.currency = sanitizedBankDetails.currency;
      }

      if (user.bankDetails.country === "IN" && user.bankDetails.currency !== "INR") {
        user.bankDetails.currency = "INR";
      }

      // Set addedAt if this is the first time adding bank details
      if (!user.bankDetails.addedAt) {
        user.bankDetails.addedAt = new Date();
      }
      // Reset verification when details change
      user.bankDetails.isVerified = false;
    }

    // Notification preferences
    if (notificationPrefs) {
      if (!user.notificationPrefs) user.notificationPrefs = {};
      if (notificationPrefs.smartMatchAlerts !== undefined) user.notificationPrefs.smartMatchAlerts = notificationPrefs.smartMatchAlerts;
      if (notificationPrefs.auditionAlerts !== undefined) user.notificationPrefs.auditionAlerts = notificationPrefs.auditionAlerts;
      if (notificationPrefs.holdAlerts !== undefined) user.notificationPrefs.holdAlerts = notificationPrefs.holdAlerts;
      if (notificationPrefs.viewAlerts !== undefined) user.notificationPrefs.viewAlerts = notificationPrefs.viewAlerts;
      user.markModified("notificationPrefs");
    }

    await user.save();

    // Sanitize bank details for response (hide full account number)
    let sanitizedBankDetails = null;
    if (user.bankDetails && user.bankDetails.accountNumber) {
      sanitizedBankDetails = {
        ...user.bankDetails.toObject(),
        accountNumber: '****' + user.bankDetails.accountNumber.slice(-4)
      };
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      skills: user.skills,
      profileImage: user.profileImage || "",
      coverImage: user.coverImage || "",
      writerProfile: user.writerProfile,
      industryProfile: user.industryProfile,
      preferences: user.preferences,
      notificationPrefs: user.notificationPrefs,
      bankDetails: sanitizedBankDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.body.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentBlockedTarget = currentUser.blockedUsers?.some(
      (id) => id.toString() === req.body.userId
    );
    const targetBlockedCurrent = userToFollow.blockedUsers?.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (currentBlockedTarget || targetBlockedCurrent) {
      return res.status(403).json({ message: "Follow action is not allowed for blocked users" });
    }

    if (currentUser.following.includes(req.body.userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    currentUser.following.push(req.body.userId);
    userToFollow.followers.push(req.user._id);

    await currentUser.save();
    await userToFollow.save();

    // Send notification to the followed user
    await Notification.create({
      user: req.body.userId,
      type: "follow",
      from: req.user._id,
      message: "started following you",
    });

    res.json({ message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    const target = req.body?.target === "coverImage" ? "coverImage" : "profileImage";
    user[target] = imageUrl;
    await user.save();

    res.json({ [target]: imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.body.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.body.userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const userToBlock = await User.findById(userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToBlock) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyBlocked = currentUser.blockedUsers?.some((id) => id.toString() === userId);
    if (!alreadyBlocked) {
      currentUser.blockedUsers.push(userId);
    }

    // Remove follow relationship in both directions on block.
    currentUser.following = (currentUser.following || []).filter((id) => id.toString() !== userId);
    currentUser.followers = (currentUser.followers || []).filter((id) => id.toString() !== userId);
    userToBlock.following = (userToBlock.following || []).filter((id) => id.toString() !== req.user._id.toString());
    userToBlock.followers = (userToBlock.followers || []).filter((id) => id.toString() !== req.user._id.toString());

    await currentUser.save();
    await userToBlock.save();

    return res.json({ message: "User blocked successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const currentUser = await User.findById(req.user._id);
    currentUser.blockedUsers = (currentUser.blockedUsers || []).filter((id) => id.toString() !== userId);
    await currentUser.save();

    return res.json({ message: "User unblocked successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .select("blockedUsers")
      .populate("blockedUsers", "name profileImage role");

    return res.json(currentUser?.blockedUsers || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the savedScripts from industryProfile
    const savedScriptIds = user.industryProfile?.savedScripts || [];

    // Populate the script details
    const scripts = await Script.find({ _id: { $in: savedScriptIds } })
      .populate("creator", "name profileImage")
      .sort({ createdAt: -1 });

    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const { scriptId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize savedScripts if it doesn't exist
    if (!user.industryProfile) {
      user.industryProfile = {};
    }
    if (!user.industryProfile.savedScripts) {
      user.industryProfile.savedScripts = [];
    }

    // Check if already in watchlist
    if (user.industryProfile.savedScripts.includes(scriptId)) {
      return res.status(400).json({ message: "Script already in watchlist" });
    }

    user.industryProfile.savedScripts.push(scriptId);
    await user.save();

    res.json({ message: "Script added to watchlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const { scriptId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.industryProfile?.savedScripts) {
      return res.status(400).json({ message: "Watchlist is empty" });
    }

    user.industryProfile.savedScripts = user.industryProfile.savedScripts.filter(
      (id) => id.toString() !== scriptId
    );
    await user.save();

    res.json({ message: "Script removed from watchlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ──────── SETTINGS ────────

export const updateSettings = async (req, res) => {
  try {
    const { notificationPrefs, isPrivate, language, timezone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (notificationPrefs !== undefined) {
      if (!user.notificationPrefs) user.notificationPrefs = {};
      if (notificationPrefs.smartMatchAlerts !== undefined) user.notificationPrefs.smartMatchAlerts = notificationPrefs.smartMatchAlerts;
      if (notificationPrefs.auditionAlerts !== undefined) user.notificationPrefs.auditionAlerts = notificationPrefs.auditionAlerts;
      if (notificationPrefs.holdAlerts !== undefined) user.notificationPrefs.holdAlerts = notificationPrefs.holdAlerts;
      if (notificationPrefs.viewAlerts !== undefined) user.notificationPrefs.viewAlerts = notificationPrefs.viewAlerts;
      user.markModified("notificationPrefs");
    }

    if (isPrivate !== undefined) user.isPrivate = isPrivate;
    if (language !== undefined) user.language = language;
    if (timezone !== undefined) user.timezone = timezone;

    await user.save();
    res.json({ message: "Settings updated", user: { isPrivate: user.isPrivate, language: user.language, timezone: user.timezone, notificationPrefs: user.notificationPrefs } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Current and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changeEmail = async (req, res) => {
  try {
    const { password, newEmail } = req.body;
    if (!password || !newEmail) return res.status(400).json({ message: "Password and new email are required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Password is incorrect" });

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (normalizedEmail === user.email) {
      return res.status(400).json({ message: "New email must be different from current email" });
    }

    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existing) return res.status(409).json({ message: "Email is already in use" });

    const existingPending = await User.findOne({ pendingEmail: normalizedEmail, _id: { $ne: user._id } });
    if (existingPending) return res.status(409).json({ message: "Email is already pending verification for another user" });

    const otp = generateOTP();

    const emailResult = await sendOTPEmail(normalizedEmail, user.name, otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: emailResult.error || "Failed to send verification code" });
    }

    // Internal copy for compliance/audit visibility. Do not block user flow if this fails.
    await sendEmailChangeOTPToCompany({
      userName: user.name,
      currentEmail: user.email,
      newEmail: normalizedEmail,
      otp,
      trigger: "changeEmail",
    });

    // Keep current email active until OTP verification succeeds.
    user.pendingEmail = normalizedEmail;
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = generateOTPExpiry();
    await user.save();
    res.json({
      message: "Verification code sent to new email. Current email remains active until verification.",
      email: user.email,
      pendingEmail: user.pendingEmail,
      requiresVerification: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendEmailVerificationCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const targetEmail = user.pendingEmail || user.email;
    if (!user.pendingEmail && user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = generateOTPExpiry();
    await user.save();

    const emailResult = await sendOTPEmail(targetEmail, user.name, otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: emailResult.error || "Failed to send verification code" });
    }

    // If user is verifying a pending email change, send a company copy as well.
    if (user.pendingEmail) {
      await sendEmailChangeOTPToCompany({
        userName: user.name,
        currentEmail: user.email,
        newEmail: user.pendingEmail,
        otp,
        trigger: "resendEmailVerificationCode",
      });
    }

    res.json({ message: `Verification code sent to ${targetEmail}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmailVerificationCode = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "Verification code is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.emailVerificationToken) return res.status(400).json({ message: "No verification code found. Please resend code." });
    if (isOTPExpired(user.emailVerificationExpires)) return res.status(400).json({ message: "Verification code expired. Please resend code." });
    if (String(user.emailVerificationToken) !== String(otp).trim()) return res.status(400).json({ message: "Invalid verification code" });

    if (user.pendingEmail) {
      const emailOwner = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } });
      if (emailOwner) {
        return res.status(409).json({ message: "Pending email is already used by another account" });
      }

      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully", emailVerified: true, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmationText } = req.body || {};

    if (confirmationText !== "DELETE") {
      return res.status(400).json({ message: "Invalid deletion confirmation" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    await Promise.all([
      Post.deleteMany({ user: req.user._id }),
      Script.deleteMany({ creator: req.user._id }),
      Notification.deleteMany({ $or: [{ user: req.user._id }, { from: req.user._id }] }),
    ]);

    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
