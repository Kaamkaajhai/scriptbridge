import Script from "../models/Script.js";
import mongoose from "mongoose";
import ScriptOption from "../models/ScriptOption.js";
import ScriptPurchaseRequest from "../models/ScriptPurchaseRequest.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Transaction from "../models/Transaction.js";
import Invoice from "../models/Invoice.js";
import {
  sendPurchaseRequestEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseRejectedEmail,
} from "../utils/emailService.js";
import { notifyAdminWorkflowEvent } from "../utils/adminWorkflowAlerts.js";
import { generateAndSaveInvoicePdf } from "../utils/invoicePdf.js";
import { CREDIT_PRICES } from "./creditsController.js";
import { createRequire } from 'module';
import Razorpay from "razorpay";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToCloudinary } from "../config/cloudinary.js";
import {
  buildInvestorFeed,
  trackInvestorInteraction,
} from "../services/recommendationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of Razorpay
let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

const PUBLIC_SCRIPT_FILTER = {
  status: "published",
  isSold: { $ne: true },
  purchaseRequestLocked: { $ne: true },
};

const PROJECT_SPOTLIGHT_ACTIVATION_CREDITS = 310;
const PROJECT_SPOTLIGHT_EXTENSION_CREDITS = 150;
const PROJECT_SPOTLIGHT_DURATION_DAYS = 30;
const SCRIPT_UPLOAD_TERMS_VERSION = process.env.SCRIPT_UPLOAD_TERMS_VERSION || "2026-03-24";

const getInvalidRoleAgeRangeMessage = (roles = []) => {
  if (!Array.isArray(roles)) return "";

  for (let i = 0; i < roles.length; i += 1) {
    const role = roles[i] || {};
    const min = role?.ageRange?.min;
    const max = role?.ageRange?.max;

    if (min === undefined || min === null || min === "" || max === undefined || max === null || max === "") {
      continue;
    }

    const minAge = Number(min);
    const maxAge = Number(max);
    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge) || minAge >= maxAge) {
      return `Role ${i + 1}: Min age must be less than max age.`;
    }
  }

  return "";
};

const isSpotlightActive = (script, now = new Date()) => {
  const endAt = script?.promotion?.spotlightEndAt;
  return Boolean(endAt && new Date(endAt) >= now);
};

const getBlockedUserIdsForViewer = async (viewerId) => {
  if (!viewerId) return [];
  const currentUser = await User.findById(viewerId).select("blockedUsers").lean();
  const usersWhoBlockedCurrent = await User.find({ blockedUsers: viewerId }).select("_id").lean();
  return [
    ...(currentUser?.blockedUsers || []),
    ...usersWhoBlockedCurrent.map((u) => u._id),
  ];
};

export const extractPdfText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file provided" });
    }

    const require = createRequire(import.meta.url);
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(req.file.buffer);

    // Quick sanitization: replace weird null bytes or excessive whitespace
    let text = data.text || "";
    // Standardize newlines
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    res.json({ text, numItems: data.numpages });
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    res.status(500).json({ message: "Failed to extract text from PDF", error: error.message });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { scriptId, title, textContent, ...otherData } = req.body;

    // If we have an ID, update the existing draft
    if (scriptId) {
      const script = await Script.findById(scriptId);
      if (!script) return res.status(404).json({ message: "Script not found" });
      if (script.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      script.title = title || script.title;
      script.textContent = textContent !== undefined ? textContent : script.textContent;
      if (otherData.logline !== undefined) script.logline = otherData.logline;
      if (otherData.synopsis !== undefined) {
        script.synopsis = otherData.synopsis;
        script.description = otherData.synopsis;
      }
      if (otherData.format !== undefined) script.format = otherData.format;
      if (otherData.pageCount !== undefined) script.pageCount = Number(otherData.pageCount) || 0;
      if (otherData.primaryGenre !== undefined) script.primaryGenre = otherData.primaryGenre;
      if (otherData.tags !== undefined) script.tags = Array.isArray(otherData.tags) ? otherData.tags : [];
      if (otherData.roles !== undefined) {
        const nextRoles = Array.isArray(otherData.roles) ? otherData.roles : [];
        const ageRangeError = getInvalidRoleAgeRangeMessage(nextRoles);
        if (ageRangeError) {
          return res.status(400).json({ message: ageRangeError });
        }
        script.roles = nextRoles;
      }
      if (otherData.classification !== undefined) {
        script.classification = {
          primaryGenre: otherData.classification?.primaryGenre ?? script.classification?.primaryGenre,
          secondaryGenre: otherData.classification?.secondaryGenre ?? script.classification?.secondaryGenre,
          tones: otherData.classification?.tones ?? script.classification?.tones ?? [],
          themes: otherData.classification?.themes ?? script.classification?.themes ?? [],
          settings: otherData.classification?.settings ?? script.classification?.settings ?? [],
        };
        script.markModified("classification");
      }

      await script.save();
      return res.json(script);
    }

    // Otherwise create a new draft
    const newDraft = await Script.create({
      creator: req.user._id,
      title: title || "Untitled Draft",
      textContent: textContent || "",
      status: "draft",
      ...otherData
    });

    res.status(201).json(newDraft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteScript = async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) return res.status(404).json({ message: "Script not found" });
    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Script.findByIdAndDelete(req.params.id);
    res.json({ message: "Script deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyDrafts = async (req, res) => {
  try {
    const drafts = await Script.find({ creator: req.user._id, status: "draft" })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyScripts = async (req, res) => {
  try {
    const scripts = await Script.find({ creator: req.user._id, status: { $ne: "draft" } })
      .sort({ createdAt: -1 })
      .select("_id title logline description synopsis genre contentType coverImage premium price views services scriptScore platformScore status adminApproved rejectionReason creator createdAt")
      .populate("creator", "name profileImage")
      .lean();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateScript = async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) return res.status(404).json({ message: "Script not found" });
    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this script" });
    }

    const {
      title, logline, format, pageCount, classification,
      scriptUrl, description, synopsis, textContent, fileUrl,
      coverImage, genre, premium, price, roles, tags, budget, holdFee, services, legal,
    } = req.body;

    if (!legal?.agreedToTerms) {
      return res.status(400).json({ message: "Script Upload Terms & Conditions acceptance is required." });
    }

    if (logline !== undefined && String(logline).trim().length > 50) {
      return res.status(400).json({ message: "Logline must be 50 characters or fewer" });
    }

    if (title) script.title = title;
    if (logline !== undefined) script.logline = logline;
    if (format) script.format = format;
    if (pageCount) script.pageCount = Number(pageCount);
    if (textContent !== undefined) script.textContent = textContent;
    if (description !== undefined) script.description = description;
    if (synopsis !== undefined) script.synopsis = synopsis;
    const realUrl = scriptUrl || fileUrl;
    if (realUrl && !realUrl.includes("placeholder-url.com")) script.fileUrl = realUrl;
    if (coverImage) script.coverImage = coverImage;
    if (premium !== undefined) script.premium = premium;
    if (price !== undefined) script.price = Number(price);
    if (roles) script.roles = roles;
    if (tags) script.tags = tags;
    if (budget) script.budget = budget;
    if (holdFee) script.holdFee = holdFee;

    if (classification) {
      const g = classification.primaryGenre || script.classification?.primaryGenre;
      script.genre = genre || g;
      script.primaryGenre = g;
      script.classification = {
        primaryGenre: classification.primaryGenre ?? script.classification?.primaryGenre,
        secondaryGenre: classification.secondaryGenre ?? script.classification?.secondaryGenre,
        tones: classification.tones ?? script.classification?.tones ?? [],
        themes: classification.themes ?? script.classification?.themes ?? [],
        settings: classification.settings ?? script.classification?.settings ?? [],
      };
      script.markModified("classification");
    } else if (genre) {
      script.genre = genre;
    }

    if (services) {
      script.services = {
        hosting: services.hosting ?? script.services?.hosting ?? true,
        evaluation: services.evaluation ?? script.services?.evaluation ?? false,
        aiTrailer: services.aiTrailer ?? script.services?.aiTrailer ?? false,
      };
      script.markModified("services");
    }

    if (legal?.agreedToTerms !== undefined) {
      script.legal = {
        agreedToTerms: legal.agreedToTerms,
        timestamp: legal.timestamp || script.legal?.timestamp || new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        termsVersion: legal.termsVersion || script.legal?.termsVersion || SCRIPT_UPLOAD_TERMS_VERSION,
      };
    }

    const wasPendingApproval = script.status === "pending_approval";
    script.status = "pending_approval";
    await script.save();

    if (!wasPendingApproval) {
      await notifyAdminWorkflowEvent({
        title: "Writer Project Submitted For Approval",
        section: "approvals",
        actorId: req.user._id,
        scriptId: script._id,
        message: `Project "${script.title}" was submitted for admin approval by ${req.user.name || "a writer"}.`,
        metadata: {
          scriptId: script._id,
          writerId: req.user._id,
          writerEmail: req.user.email || "",
          source: "update-script",
        },
      });
    }

    if (script.services?.aiTrailer && ["requested", "generating"].includes(script.trailerStatus)) {
      await notifyAdminWorkflowEvent({
        title: "AI Trailer Approval Request",
        section: "trailers",
        actorId: req.user._id,
        scriptId: script._id,
        message: `AI trailer requested for "${script.title}" and is waiting in admin queue.`,
        metadata: {
          scriptId: script._id,
          writerId: req.user._id,
          trailerStatus: script.trailerStatus,
          source: "update-script",
        },
      });
    }

    res.json(script);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadScript = async (req, res) => {
  try {
    const {
      title,
      logline,
      format,
      pageCount,
      classification,
      scriptUrl,
      services,
      legal,
      // Legacy fields for backward compatibility
      description,
      synopsis,
      fullContent,
      textContent,
      fileUrl,
      coverImage,
      genre,
      contentType,
      isPremium,
      premium,
      price,
      roles,
      tags,
      budget,
      holdFee
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (logline !== undefined && String(logline).trim().length > 50) {
      return res.status(400).json({ message: "Logline must be 50 characters or fewer" });
    }
    if (!synopsis || String(synopsis).trim().length === 0) {
      return res.status(400).json({ message: "Synopsis is required" });
    }
    if (!scriptUrl && !fileUrl && !textContent) {
      return res.status(400).json({ message: "Script file or text content is required" });
    }
    const ageRangeError = getInvalidRoleAgeRangeMessage(roles);
    if (ageRangeError) {
      return res.status(400).json({ message: ageRangeError });
    }

    const invoiceDate = new Date();
    const invoiceNumber = `INV-${invoiceDate.toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
    const isPremiumAccess = Boolean(isPremium || premium) && Number(price || 0) > 0;
    const effectivePrice = isPremiumAccess ? Number(price || 0) : 0;
    const platformFeeRate = 0.2;
    const writerEarnsPerSale = Math.round(effectivePrice * (1 - platformFeeRate) * 100) / 100;

    // Calculate credits needed for selected services
    let creditsRequired = 0;
    if (services?.evaluation) creditsRequired += CREDIT_PRICES.AI_EVALUATION;
    if (services?.aiTrailer) creditsRequired += CREDIT_PRICES.AI_TRAILER;

    const creator = await User.findById(req.user._id);
    if (!creator) {
      return res.status(404).json({ message: "User not found" });
    }
    const creditsBalanceBefore = creator.credits?.balance || 0;
    let creditsBalanceAfter = creditsBalanceBefore;

    // Check and deduct credits if services are selected
    if (creditsRequired > 0) {
      const userBalance = creator.credits?.balance || 0;

      if (userBalance < creditsRequired) {
        return res.status(402).json({
          message: `Insufficient credits. You need ${creditsRequired} credits but have ${userBalance}.`,
          requiresCredits: true,
          required: creditsRequired,
          balance: userBalance,
          shortfall: creditsRequired - userBalance
        });
      }

      // Deduct credits
      creator.credits.balance -= creditsRequired;
      creator.credits.totalSpent += creditsRequired;

      // Add transaction record for each service
      if (services?.evaluation) {
        creator.credits.transactions.push({
          type: "spent",
          amount: -CREDIT_PRICES.AI_EVALUATION,
          description: `AI Evaluation for "${title}"`,
          reference: `EVAL-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date()
        });
      }

      if (services?.aiTrailer) {
        creator.credits.transactions.push({
          type: "spent",
          amount: -CREDIT_PRICES.AI_TRAILER,
          description: `AI Trailer for "${title}"`,
          reference: `TRAILER-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date()
        });
      }

      await creator.save();
      creditsBalanceAfter = creator.credits?.balance || 0;
    }

    // Build the script document
    const scriptData = {
      creator: req.user._id,
      title,
      logline: logline ? String(logline).trim() : "",
      description: synopsis,
      synopsis: synopsis,
      fullContent,
      textContent,
      fileUrl: scriptUrl || fileUrl,
      pageCount,
      coverImage,
      genre: genre || classification?.primaryGenre,
      contentType: contentType || "movie",
      premium: isPremium || premium || false,
      price: price || 0,
      roles: roles || [],
      tags: tags || [],
      budget,
      holdFee: holdFee || 200,

      // New fields from the 5-step wizard
      format: format || "feature_film",
      primaryGenre: classification?.primaryGenre || genre,
      classification: classification ? {
        primaryGenre: classification.primaryGenre,
        secondaryGenre: classification.secondaryGenre,
        tones: classification.tones || [],
        themes: classification.themes || [],
        settings: classification.settings || []
      } : undefined,

      // Services tracking
      services: services ? {
        hosting: services.hosting !== undefined ? services.hosting : true,
        evaluation: services.evaluation || false,
        aiTrailer: services.aiTrailer || false
      } : { hosting: true, evaluation: false, aiTrailer: false },
      billing: {
        evaluationCreditsCharged: services?.evaluation ? CREDIT_PRICES.AI_EVALUATION : 0,
        aiTrailerCreditsCharged: services?.aiTrailer ? CREDIT_PRICES.AI_TRAILER : 0,
        evaluationCreditsChargedAtUpload: services?.evaluation ? CREDIT_PRICES.AI_EVALUATION : 0,
        aiTrailerCreditsChargedAtUpload: services?.aiTrailer ? CREDIT_PRICES.AI_TRAILER : 0,
        evaluationCreditsRefunded: 0,
        aiTrailerCreditsRefunded: 0,
        spotlightCreditsSpent: 0,
        lastSpotlightRefundCredits: 0,
      },
      evaluationStatus: services?.evaluation ? "requested" : "none",

      // Legal compliance
      legal: legal ? {
        agreedToTerms: legal.agreedToTerms || false,
        timestamp: legal.timestamp || new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        termsVersion: legal.termsVersion || SCRIPT_UPLOAD_TERMS_VERSION,
      } : undefined,

      // AI Trailer status initialization
      trailerStatus: services?.aiTrailer ? "generating" : "none",

      status: "pending_approval" // Requires admin approval before publishing
    };

    // If updating from a draft (if we pass draftId in the future), we could update instead of create.
    // For now, assume it's a new or finalized creation.
    const script = await Script.create(scriptData);

    await notifyAdminWorkflowEvent({
      title: "Writer Project Submitted For Approval",
      section: "approvals",
      actorId: req.user._id,
      scriptId: script._id,
      message: `Project "${script.title}" was submitted for admin approval by ${creator.name || "a writer"}.`,
      metadata: {
        scriptId: script._id,
        writerId: req.user._id,
        writerEmail: creator.email || "",
        aiTrailerRequested: Boolean(services?.aiTrailer),
        source: "upload-script",
      },
    });

    if (services?.aiTrailer) {
      await notifyAdminWorkflowEvent({
        title: "AI Trailer Approval Request",
        section: "trailers",
        actorId: req.user._id,
        scriptId: script._id,
        message: `AI trailer requested for "${script.title}" and is waiting in admin queue.`,
        metadata: {
          scriptId: script._id,
          writerId: req.user._id,
          trailerStatus: script.trailerStatus,
          source: "upload-script",
        },
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate,
      creator: req.user._id,
      creatorSid: creator?.sid || "",
      script: script._id,
      scriptSid: script?.sid || "",
      accessType: isPremiumAccess ? "premium" : "free",
      scriptPrice: effectivePrice,
      platformFeeRate,
      writerEarnsPerSale,
      services: {
        hosting: services?.hosting !== undefined ? services.hosting : true,
        evaluation: Boolean(services?.evaluation),
        aiTrailer: Boolean(services?.aiTrailer),
        trailerUpload: !services?.aiTrailer,
      },
      totalCreditsRequired: creditsRequired,
      creditsBalanceBefore,
      creditsBalanceAfter,
      rows: [
        {
          item: "Script Access Model",
          type: "Configuration",
          detail: isPremiumAccess ? `Premium access at ₹${effectivePrice}` : "Free public access",
          amountLabel: "₹0",
          amountValue: 0,
        },
        {
          item: "Publish Services",
          type: "Credit Charge",
          detail: creditsRequired > 0 ? "Paid add-ons selected" : "No paid add-ons selected",
          amountLabel: `${creditsRequired} cr`,
          amountValue: creditsRequired,
        },
        {
          item: "Writer Earnings Per Premium Sale",
          type: "Future Earnings",
          detail: isPremiumAccess ? `Buyer pays ₹${effectivePrice}, writer receives after platform fee` : "Upgrade to premium to monetize full script access",
          amountLabel: isPremiumAccess ? `₹${writerEarnsPerSale}` : "₹0",
          amountValue: writerEarnsPerSale,
        },
      ],
    });

    const generatedInvoicePdf = await generateAndSaveInvoicePdf({
      invoice,
      creatorName: creator.name,
      creatorEmail: creator.email,
      creatorSid: creator?.sid,
      scriptTitle: script.title,
      scriptSid: script?.sid,
    });
    if (generatedInvoicePdf.relativePath) {
      invoice.pdfPath = generatedInvoicePdf.relativePath;
    }
    invoice.pdfGeneratedAt = new Date();
    await invoice.save();

    // --- Async Service Processing ---
    // TODO: Implement these async workflows:

    // 1. If hosting: Start subscription timer (30 days)
    if (services?.hosting) {
      // TODO: Create/Update Subscription document
      console.log(`[SERVICE] Hosting activated for script ${script._id}`);
    }

    // 2. If evaluation: Create job ticket for Reader Portal
    if (services?.evaluation) {
      // TODO: Create evaluation job in a Queue or Job collection
      console.log(`[SERVICE] Evaluation requested for script ${script._id}`);
      // Example: await createEvaluationJob(script._id, req.user._id);
    }

    // 3. If aiTrailer: Trigger AI video generation
    if (services?.aiTrailer) {
      // TODO: Send request to AI Video API (Runway/HeyGen/OpenAI)
      console.log(`[SERVICE] AI Trailer generation started for script ${script._id}`);
      console.log(`Logline: ${logline}`);
      console.log(`Genre: ${classification?.primaryGenre}`);
      console.log(`Tones: ${classification?.tones?.join(', ')}`);

      // Example async call:
      // generateAITrailer({
      //   scriptId: script._id,
      //   logline,
      //   genre: classification.primaryGenre,
      //   tones: classification.tones
      // }).catch(err => {
      //   // Update script.trailerStatus = 'failed'
      //   console.error('AI Trailer generation failed:', err);
      // });
    }

    // Return the created script with invoice metadata
    res.status(201).json({
      ...script.toObject(),
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        pdfPath: invoice.pdfPath,
      },
    });
  } catch (error) {
    console.error("Script upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getScripts = async (req, res) => {
  try {
    const { genre, contentType, budget, sort, search, premium, minPrice, maxPrice } = req.query;
    const query = { ...PUBLIC_SCRIPT_FILTER };
    if (genre) query.genre = genre;
    if (contentType) query.contentType = contentType;
    if (budget) query.budget = budget;
    if (premium === "true") query.premium = true;
    else if (premium === "false") query.premium = { $ne: true };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), "i");
      query.$or = [
        { sid: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Use aggregation pipeline for computed sort fields (engagement, platform)
    if (sort === "engagement" || sort === "platform") {
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            unlockCount: { $size: { $ifNull: ["$unlockedBy", []] } },
            engagementScore: {
              $min: [
                100,
                {
                  $add: [
                    { $multiply: [{ $divide: [{ $ifNull: ["$views", 0] }, 500] }, 40] },
                    { $multiply: [{ $divide: [{ $size: { $ifNull: ["$unlockedBy", []] } }, 50] }, 40] },
                    {
                      $cond: [
                        { $gt: [{ $ifNull: ["$views", 0] }, 0] },
                        { $multiply: [{ $divide: [{ $size: { $ifNull: ["$unlockedBy", []] } }, { $ifNull: ["$views", 1] }] }, 100] },
                        0,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      ];

      if (sort === "platform") {
        // Platform score = weighted combo of AI score (60%) + engagement (40%)
        pipeline.push({
          $addFields: {
            platformScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$scriptScore.overall", 0] }, 0.6] },
                { $multiply: ["$engagementScore", 0.4] },
              ],
            },
          },
        });
        pipeline.push({ $sort: { platformScore: -1 } });
      } else {
        pipeline.push({ $sort: { engagementScore: -1 } });
      }

      // Populate creator
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
          pipeline: [{ $project: { name: 1, profileImage: 1, role: 1 } }],
        },
      });
      pipeline.push({ $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } });

      const scripts = await Script.aggregate(pipeline);
      // Strip full synopsis and fullContent from list view
      const sanitized = scripts.map(s => ({
        ...s,
        synopsis: s.synopsis ? s.synopsis.substring(0, 120) + (s.synopsis.length > 120 ? '...' : '') : null,
        fullContent: undefined,
      }));
      return res.json(sanitized);
    }

    let sortObj = { createdAt: -1 };
    if (sort === "views") sortObj = { views: -1 };
    if (sort === "score") sortObj = { "scriptScore.overall": -1 };
    if (sort === "price_low") sortObj = { price: 1 };
    if (sort === "price_high") sortObj = { price: -1 };

    const scripts = await Script.find(query)
      .populate("creator", "name profileImage role")
      .sort(sortObj);

    await Promise.all(
      scripts.map(async (doc) => {
        if (!doc.sid) {
          await doc.save();
        }
      })
    );

    // Strip full synopsis and fullContent from list view
    const sanitized = scripts.map(s => {
      const obj = s.toObject();
      return {
        ...obj,
        synopsis: obj.synopsis ? obj.synopsis.substring(0, 120) + (obj.synopsis.length > 120 ? '...' : '') : null,
        fullContent: undefined,
      };
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getScriptById = async (req, res) => {
  try {
    const script = await Script.findById(req.params.id)
      .populate("creator", "name profileImage role bio followers")
      .populate("heldBy", "name role");

    if (!script) return res.status(404).json({ message: "Script not found" });

    const isOwner = script.creator._id.toString() === req.user._id.toString();
    if (script.status === "draft" && !isOwner) {
      return res.status(403).json({ message: "This draft is private" });
    }

    // Block access to sold scripts — only allow creator, buyer, and admins
    const isBuyer = script.unlockedBy?.some(uid => uid.toString() === req.user._id.toString());
    const isAdmin = req.user.role === "admin";
    if (script.isSold && !isOwner && !isBuyer && !isAdmin) {
      return res.status(403).json({ message: "This script has been purchased and is no longer publicly available" });
    }

    // Block access while an investor purchase request is pending.
    // Allow creator, admin, current buyer, or the investor who owns the pending request.
    if (script.purchaseRequestLocked) {
      const lockOwnerId = script.purchaseRequestLockedBy?.toString?.() || "";
      const isLockOwner = lockOwnerId && lockOwnerId === req.user._id.toString();
      let hasMyPendingRequest = false;

      if (!isLockOwner && !isOwner && !isAdmin && !isBuyer) {
        hasMyPendingRequest = Boolean(
          await ScriptPurchaseRequest.findOne({
            script: script._id,
            investor: req.user._id,
            status: "pending",
          }).select("_id").lean()
        );
      }

      if (!isOwner && !isAdmin && !isBuyer && !isLockOwner && !hasMyPendingRequest) {
        return res.status(403).json({ message: "This script is temporarily unavailable while a purchase request is under review." });
      }
    }

    // Track view — only count views from users who are NOT the script creator
    if (!isOwner) {
      script.views += 1;
    }
    const alreadyViewed = script.viewedBy.some(v => v.user.toString() === req.user._id.toString());
    if (!alreadyViewed) {
      script.viewedBy.push({ user: req.user._id });
    }
    await script.save();

    // Update viewer's viewHistory so investor dashboard stats are accurate
    if (!isOwner) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          viewHistory: {
            $each: [{ script: script._id, viewedAt: new Date() }],
            $slice: -200, // keep last 200 entries
          },
        },
      });

      // Track recommendation interaction signals for personalized investor feed.
      trackInvestorInteraction({
        userId: req.user._id,
        scriptId: script._id,
        type: "view",
        source: "script_detail",
      }).catch(() => null);
    }

    // Check if user has unlocked this script
    const isUnlocked = script.unlockedBy.includes(req.user._id);
    const isCreator = script.creator._id.toString() === req.user._id.toString();
    const userRole = req.user.role;
    const isWriter = userRole === 'writer' || userRole === 'creator';
    const canPurchase = ['investor', 'producer', 'director', 'industry', 'professional'].includes(userRole);

    // Get audition count
    const Audition = (await import("../models/Audition.js")).default;
    const auditionCount = await Audition.countDocuments({ script: script._id });

    // Synopsis visibility: only show full synopsis if creator or unlocked by a paying user
    const synopsisTeaser = script.synopsis ? script.synopsis.substring(0, 120) + (script.synopsis.length > 120 ? '...' : '') : null;
    const isSynopsisLocked = !isCreator && !isUnlocked;

    // Check if the viewer has a pending purchase request for this script
    let myPendingRequest = null;
    if (canPurchase && !isUnlocked) {
      myPendingRequest = await ScriptPurchaseRequest.findOne({
        script: script._id,
        investor: req.user._id,
        status: "pending",
      }).lean();
    }

    // For creators, count how many pending purchase requests exist for this script
    let pendingRequestsCount = 0;
    if (isCreator) {
      pendingRequestsCount = await ScriptPurchaseRequest.countDocuments({
        script: script._id,
        status: "pending",
      });
    }

    const response = {
      ...script.toObject(),
      isUnlocked,
      isCreator,
      isSynopsisLocked,
      canPurchase,
      isWriter: isWriter && !isCreator,
      auditionCount,
      myPendingRequest,
      pendingRequestsCount,
      // Hide full synopsis unless unlocked or creator
      synopsis: (isUnlocked || isCreator) ? script.synopsis : synopsisTeaser,
      // Hide full content unless unlocked or creator
      fullContent: (isUnlocked || isCreator) ? script.fullContent : null,
      // Hide script text unless unlocked or creator
      textContent: (isUnlocked || isCreator) ? script.textContent : null,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unlockScript = async (req, res) => {
  try {
    const script = await Script.findById(req.body.scriptId);
    if (!script) return res.status(404).json({ message: "Script not found" });

    // Only investors, producers, directors, and industry professionals can unlock
    const allowedRoles = ['investor', 'producer', 'director', 'industry', 'professional'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Only investors, producers, and directors can unlock scripts. Writers cannot purchase synopsis access."
      });
    }

    // Cannot unlock own script
    if (script.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You already have access to your own script" });
    }

    if (!script.unlockedBy.includes(req.user._id)) {
      script.unlockedBy.push(req.user._id);
      script.isSold = true; // hide from all public listings once purchased
      await script.save();

      // Notify creator
      const user = await User.findById(req.user._id);
      await Notification.create({
        user: script.creator,
        type: "unlock",
        from: req.user._id,
        script: script._id,
        message: `${user.name} unlocked your script "${script.title}" for ₹${script.price}`,
      });
    }
    res.json({ message: "Script unlocked", script });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PURCHASE REQUEST WORKFLOW ────────────────────────────────────────────────

// Investor submits a purchase request for a script (funds frozen immediately)
export const requestScriptPurchase = async (req, res) => {
  try {
    const { scriptId, note } = req.body;

    const allowedRoles = ["investor", "producer", "director", "industry", "professional"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Only investors and industry professionals can request script purchases." });
    }

    const script = await Script.findById(scriptId).populate("creator", "name email");
    if (!script) return res.status(404).json({ message: "Script not found" });

    if (script.creator._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot purchase your own script." });
    }

    if (script.unlockedBy.some((uid) => uid.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "You already have access to this script." });
    }

    if (script.purchaseRequestLocked) {
      const lockOwnerId = script.purchaseRequestLockedBy?.toString?.() || "";
      if (!lockOwnerId || lockOwnerId !== req.user._id.toString()) {
        return res.status(409).json({ message: "This script is currently unavailable because a purchase request is already in progress." });
      }
    }

    // Check for existing pending request
    const existing = await ScriptPurchaseRequest.findOne({
      script: scriptId,
      investor: req.user._id,
      status: "pending",
    });
    if (existing) {
      const lockOwnerId = script.purchaseRequestLockedBy?.toString?.() || "";
      if (!script.purchaseRequestLocked || lockOwnerId !== req.user._id.toString()) {
        script.purchaseRequestLocked = true;
        script.purchaseRequestLockedBy = req.user._id;
        script.purchaseRequestLockedAt = script.purchaseRequestLockedAt || existing.createdAt || new Date();
        await script.save();
      }
      return res.status(400).json({ message: "You already have a pending purchase request for this script." });
    }

    const investor = await User.findById(req.user._id);
    const amount = Number(script.price || 0);

    let frozenAmount = 0;
    let balanceBefore = 0;
    let balanceAfter = 0;

    if (amount > 0) {
      if (!investor.wallet) {
        investor.wallet = {
          balance: 0,
          currency: "INR",
          pendingBalance: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
        };
      }

      if ((investor.wallet.balance || 0) < amount) {
        return res.status(400).json({
          message: `Insufficient wallet balance. Add ₹${amount.toLocaleString("en-IN")} to proceed with this purchase request.`,
        });
      }

      balanceBefore = investor.wallet.balance || 0;
      investor.wallet.balance = balanceBefore - amount;
      investor.wallet.pendingBalance = (investor.wallet.pendingBalance || 0) + amount;
      balanceAfter = investor.wallet.balance;
      frozenAmount = amount;
      await investor.save();
    }

    const purchaseRequest = await ScriptPurchaseRequest.create({
      script: scriptId,
      investor: req.user._id,
      writer: script.creator._id,
      amount,
      frozenAmount,
      paymentMethod: "wallet",
      paymentStatus: amount > 0 ? "escrow_held" : "pending",
      note: note || "",
    });

    if (frozenAmount > 0) {
      await Transaction.create({
        user: req.user._id,
        type: "payment",
        amount: -frozenAmount,
        currency: "INR",
        status: "pending",
        description: `Escrow hold for purchase request: "${script.title}"`,
        reference: `PRH-${Date.now()}-${purchaseRequest._id.toString().slice(-6).toUpperCase()}`,
        paymentMethod: "wallet",
        relatedScript: script._id,
        balanceBefore,
        balanceAfter,
        metadata: {
          purchaseRequestId: purchaseRequest._id.toString(),
          stage: "escrow_hold",
          writerId: script.creator._id.toString(),
          scriptId: script._id.toString(),
        },
      });
    }

    script.purchaseRequestLocked = true;
    script.purchaseRequestLockedBy = req.user._id;
    script.purchaseRequestLockedAt = new Date();
    await script.save();

    // Notify writer in-app
    await Notification.create({
      user: script.creator._id,
      type: "purchase_request",
      from: req.user._id,
      script: script._id,
      message: `${investor.name} submitted a purchase request for "${script.title}"${amount > 0 ? ` and escrowed ₹${amount}` : ""}.`,
    });

    // Email writer
    sendPurchaseRequestEmail(
      script.creator.email,
      script.creator.name,
      investor.name,
      script.title,
      amount
    ).catch((err) => console.error("[Purchase] Failed to send request email:", err.message));

    res.status(201).json({
      message: amount > 0
        ? "Purchase request submitted and payment held in escrow."
        : "Purchase request submitted successfully.",
      purchaseRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Writer approves a purchase request
export const approveScriptPurchase = async (req, res) => {
  try {
    const purchaseRequest = await ScriptPurchaseRequest.findById(req.params.id)
      .populate("script")
      .populate("investor", "name email wallet");

    if (!purchaseRequest) return res.status(404).json({ message: "Purchase request not found." });
    if (purchaseRequest.writer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script writer can approve this request." });
    }
    if (purchaseRequest.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed." });
    }

    const script = purchaseRequest.script;
    const investor = purchaseRequest.investor;
    const writer = await User.findById(req.user._id);
    const amountToRelease = Number(purchaseRequest.frozenAmount || purchaseRequest.amount || 0);
    const paymentMethod = purchaseRequest.paymentMethod || "wallet";

    const investorDoc = await User.findById(investor._id);
    if (!investorDoc) {
      return res.status(404).json({ message: "Investor account not found." });
    }

    if (!investorDoc.wallet) {
      investorDoc.wallet = {
        balance: 0,
        currency: "INR",
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
      };
    }

    if (!writer.wallet) {
      writer.wallet = {
        balance: 0,
        currency: "INR",
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
      };
    }

    if (amountToRelease > 0) {
      if (paymentMethod === "wallet") {
        if ((investorDoc.wallet.pendingBalance || 0) < amountToRelease) {
          return res.status(409).json({
            message: "Escrow amount is unavailable. Please contact support.",
          });
        }
        investorDoc.wallet.pendingBalance -= amountToRelease;
      }

      const writerBalanceBefore = writer.wallet.balance || 0;
      writer.wallet.balance = writerBalanceBefore + amountToRelease;
      writer.wallet.totalEarnings = (writer.wallet.totalEarnings || 0) + amountToRelease;

      await investorDoc.save();
      await writer.save();

      const pendingEscrowTx = await Transaction.findOne({
        user: investor._id,
        relatedScript: script._id,
        status: "pending",
        "metadata.purchaseRequestId": purchaseRequest._id.toString(),
      }).sort({ createdAt: -1 });

      if (pendingEscrowTx) {
        const existingMetadata = pendingEscrowTx.metadata instanceof Map
          ? Object.fromEntries(pendingEscrowTx.metadata)
          : (pendingEscrowTx.metadata || {});
        pendingEscrowTx.status = "completed";
        pendingEscrowTx.description = `Purchased script: "${script.title}"`;
        pendingEscrowTx.metadata = {
          ...existingMetadata,
          stage: "settled_to_writer",
          settledAt: new Date().toISOString(),
          settlementMethod: paymentMethod,
          writerId: writer._id.toString(),
        };
        await pendingEscrowTx.save();
      }

      await Transaction.create({
        user: writer._id,
        type: "credit",
        amount: amountToRelease,
        currency: "INR",
        status: "completed",
        description: `Script purchase payout: "${script.title}"`,
        reference: `PRP-${Date.now()}-${purchaseRequest._id.toString().slice(-6).toUpperCase()}`,
        paymentMethod: paymentMethod === "razorpay" ? "razorpay" : "wallet",
        relatedScript: script._id,
        balanceBefore: writerBalanceBefore,
        balanceAfter: writer.wallet.balance,
        metadata: {
          purchaseRequestId: purchaseRequest._id.toString(),
          investorId: investor._id.toString(),
          scriptId: script._id.toString(),
        },
      });
    }

    // Grant access to the script
    if (!script.unlockedBy.some((uid) => uid.toString() === investor._id.toString())) {
      script.unlockedBy.push(investor._id);
    }

    script.isSold = true;
    script.purchaseRequestLocked = false;
    script.purchaseRequestLockedBy = null;
    script.purchaseRequestLockedAt = null;
    await script.save();

    purchaseRequest.status = "approved";
    purchaseRequest.paymentStatus = amountToRelease > 0 ? "released" : purchaseRequest.paymentStatus;
    purchaseRequest.settledAt = new Date();
    await purchaseRequest.save();

    // Notify investor in-app
    await Notification.create({
      user: investor._id,
      type: "purchase_approved",
      from: req.user._id,
      script: script._id,
      message: `${writer.name} approved your purchase request for "${script.title}". You now have full access${amountToRelease > 0 ? " and escrow was released to the writer" : ""}!`,
    });

    // Email investor
    sendPurchaseApprovedEmail(
      investor.email,
      investor.name,
      writer.name,
      script.title,
      script._id.toString()
    ).catch((err) => console.error("[Purchase] Failed to send approval email:", err.message));

    res.json({
      message: "Purchase request approved. Investor now has full script access and funds were transferred to the writer.",
      purchaseRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Writer rejects a purchase request
export const rejectScriptPurchase = async (req, res) => {
  try {
    const { note } = req.body;

    const purchaseRequest = await ScriptPurchaseRequest.findById(req.params.id)
      .populate("script")
      .populate("investor", "name email wallet");

    if (!purchaseRequest) return res.status(404).json({ message: "Purchase request not found." });
    if (purchaseRequest.writer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script writer can reject this request." });
    }
    if (purchaseRequest.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed." });
    }

    const script = purchaseRequest.script;
    const investor = purchaseRequest.investor;
    const writer = await User.findById(req.user._id);
    const amountToRefund = Number(purchaseRequest.frozenAmount || purchaseRequest.amount || 0);
    const paymentMethod = purchaseRequest.paymentMethod || "wallet";
    let gatewayRefundId = "";

    if (amountToRefund > 0) {
      if (paymentMethod === "wallet") {
        const investorDoc = await User.findById(investor._id);
        if (!investorDoc) {
          return res.status(404).json({ message: "Investor account not found." });
        }

        if (!investorDoc.wallet) {
          investorDoc.wallet = {
            balance: 0,
            currency: "INR",
            pendingBalance: 0,
            totalEarnings: 0,
            totalWithdrawals: 0,
          };
        }

        const pendingBefore = investorDoc.wallet.pendingBalance || 0;
        const balanceBefore = investorDoc.wallet.balance || 0;

        investorDoc.wallet.pendingBalance = Math.max(0, pendingBefore - amountToRefund);
        investorDoc.wallet.balance = balanceBefore + amountToRefund;
        const balanceAfter = investorDoc.wallet.balance;
        await investorDoc.save();

        await Transaction.create({
          user: investor._id,
          type: "refund",
          amount: amountToRefund,
          currency: "INR",
          status: "completed",
          description: `Refund for rejected purchase request: "${script.title}"`,
          reference: `PRR-${Date.now()}-${purchaseRequest._id.toString().slice(-6).toUpperCase()}`,
          paymentMethod: "wallet",
          relatedScript: script._id,
          balanceBefore,
          balanceAfter,
          metadata: {
            purchaseRequestId: purchaseRequest._id.toString(),
            writerId: writer._id.toString(),
            scriptId: script._id.toString(),
            rejectionNote: note || "",
          },
        });
      } else if (paymentMethod === "razorpay") {
        if (!purchaseRequest.paymentGatewayPaymentId) {
          return res.status(409).json({ message: "Payment reference missing for refund. Please contact support." });
        }

        const razorpay = getRazorpay();
        const refund = await razorpay.payments.refund(purchaseRequest.paymentGatewayPaymentId, {
          amount: Math.round(amountToRefund * 100),
          notes: {
            purchaseRequestId: purchaseRequest._id.toString(),
            scriptId: script._id.toString(),
            writerId: writer._id.toString(),
          },
        });
        gatewayRefundId = refund?.id || "";

        await Transaction.create({
          user: investor._id,
          type: "refund",
          amount: amountToRefund,
          currency: "INR",
          status: "completed",
          description: `Refund to original payment method for rejected request: "${script.title}"`,
          reference: `PRR-RZP-${purchaseRequest.paymentGatewayPaymentId}`,
          paymentMethod: "razorpay",
          relatedScript: script._id,
          metadata: {
            purchaseRequestId: purchaseRequest._id.toString(),
            writerId: writer._id.toString(),
            scriptId: script._id.toString(),
            gatewayPaymentId: purchaseRequest.paymentGatewayPaymentId,
            gatewayOrderId: purchaseRequest.paymentGatewayOrderId || "",
            gatewayRefundId,
            rejectionNote: note || "",
          },
        });
      }

      const pendingEscrowTx = await Transaction.findOne({
        user: investor._id,
        relatedScript: script._id,
        status: "pending",
        "metadata.purchaseRequestId": purchaseRequest._id.toString(),
      }).sort({ createdAt: -1 });

      if (pendingEscrowTx) {
        const existingMetadata = pendingEscrowTx.metadata instanceof Map
          ? Object.fromEntries(pendingEscrowTx.metadata)
          : (pendingEscrowTx.metadata || {});
        pendingEscrowTx.status = "cancelled";
        pendingEscrowTx.description = `Escrow released back to wallet: "${script.title}"`;
        pendingEscrowTx.metadata = {
          ...existingMetadata,
          stage: "refunded_to_investor",
          refundedAt: new Date().toISOString(),
          refundMethod: paymentMethod,
          gatewayRefundId,
          rejectionNote: note || "",
        };
        await pendingEscrowTx.save();
      }
    }

    purchaseRequest.status = "rejected";
    purchaseRequest.paymentStatus = amountToRefund > 0 ? "refunded" : purchaseRequest.paymentStatus;
    purchaseRequest.settledAt = new Date();
    if (note) purchaseRequest.note = note;
    await purchaseRequest.save();

    const hasPendingRequests = await ScriptPurchaseRequest.exists({
      script: script._id,
      status: "pending",
    });

    if (!hasPendingRequests) {
      script.purchaseRequestLocked = false;
      script.purchaseRequestLockedBy = null;
      script.purchaseRequestLockedAt = null;
      await script.save();
    }

    // Notify investor in-app
    await Notification.create({
      user: investor._id,
      type: "purchase_rejected",
      from: req.user._id,
      script: script._id,
      message: `${writer.name} declined your purchase request for "${script.title}"${amountToRefund > 0 ? ` and ₹${amountToRefund} was refunded to your wallet` : ""}.`,
    });

    // Email investor
    sendPurchaseRejectedEmail(
      investor.email,
      investor.name,
      writer.name,
      script.title,
      note || ""
    ).catch((err) => console.error("[Purchase] Failed to send rejection email:", err.message));

    res.json({
      message: amountToRefund > 0
        ? "Purchase request rejected. Payment was refunded to the investor."
        : "Purchase request rejected.",
      purchaseRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get purchase requests — writers see incoming requests, investors see their own
export const getMyPurchaseRequests = async (req, res) => {
  try {
    const { role } = req.user;
    const isWriterRole = ["writer", "creator"].includes(role);
    const isInvestorRole = ["investor", "producer", "director", "industry", "professional"].includes(role);

    let requests;

    if (isWriterRole) {
      requests = await ScriptPurchaseRequest.find({ writer: req.user._id })
        .populate("script", "title price thumbnailUrl")
        .populate("investor", "name profileImage role")
        .sort({ createdAt: -1 });
    } else if (isInvestorRole) {
      requests = await ScriptPurchaseRequest.find({ investor: req.user._id })
        .populate("script", "title price thumbnailUrl creator")
        .populate("writer", "name profileImage role")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// Hold/Option a script (for producers - ₹200 default, 30 days)
export const holdScript = async (req, res) => {
  try {
    const { scriptId } = req.body;
    const script = await Script.findById(scriptId);

    if (!script) return res.status(404).json({ message: "Script not found" });
    if (script.holdStatus === "held") {
      return res.status(400).json({ message: "This script is already on hold by another party" });
    }
    if (script.holdStatus === "sold") {
      return res.status(400).json({ message: "This script has been sold" });
    }

    const user = await User.findById(req.user._id);
    if (!["investor", "producer", "director"].includes(user.role)) {
      return res.status(403).json({ message: "Only industry professionals can hold scripts" });
    }

    const fee = script.holdFee || 200;
    const platformCut = fee * 0.10; // 10% platform fee
    const creatorPayout = fee - platformCut;
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create option record
    const option = await ScriptOption.create({
      script: scriptId,
      holder: req.user._id,
      fee,
      platformCut,
      creatorPayout,
      endDate,
      status: "active",
    });

    // Update script
    script.holdStatus = "held";
    script.heldBy = req.user._id;
    script.holdStartDate = new Date();
    script.holdEndDate = endDate;
    await script.save();

    // Notify the creator
    await Notification.create({
      user: script.creator,
      type: "hold",
      from: req.user._id,
      script: script._id,
      message: `${user.name} has placed a hold on "${script.title}" for ₹${fee} (30 days). You earn ₹${creatorPayout}!`,
    });

    res.json({
      message: "Script held successfully",
      option,
      holdDetails: {
        fee,
        platformCut,
        creatorPayout,
        expiresAt: endDate,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Release a hold
export const releaseHold = async (req, res) => {
  try {
    const { scriptId } = req.body;
    const script = await Script.findById(scriptId);

    if (!script) return res.status(404).json({ message: "Script not found" });
    if (script.heldBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not holding this script" });
    }

    script.holdStatus = "available";
    script.heldBy = null;
    script.holdStartDate = null;
    script.holdEndDate = null;
    await script.save();

    // Update option
    await ScriptOption.findOneAndUpdate(
      { script: scriptId, holder: req.user._id, status: "active" },
      { status: "cancelled" }
    );

    res.json({ message: "Hold released" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get script options/holds for current user
export const getMyHolds = async (req, res) => {
  try {
    const options = await ScriptOption.find({ holder: req.user._id })
      .populate({
        path: "script",
        select: "title genre coverImage creator price trailerThumbnail",
        populate: { path: "creator", select: "name profileImage" }
      })
      .sort({ createdAt: -1 });

    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add roles to a script
export const addRoles = async (req, res) => {
  try {
    const { scriptId, roles } = req.body;
    const script = await Script.findById(scriptId);

    if (!script) return res.status(404).json({ message: "Script not found" });
    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the creator can add roles" });
    }

    script.roles.push(...roles);
    await script.save();

    res.json({ message: "Roles added", roles: script.roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reader Endpoints ───

export const getFeaturedScripts = async (req, res) => {
  try {
    const now = new Date();
    // Step 1: rank published scripts by trendScore via aggregation
    const ranked = await Script.aggregate([
      { $match: { ...PUBLIC_SCRIPT_FILTER } },
      {
        $addFields: {
          verifiedPriority: {
            $cond: [{ $eq: [{ $ifNull: ["$verifiedBadge", false] }, true] }, 1, 0],
          },
          aiTrailerPriority: {
            $cond: [{ $eq: [{ $ifNull: ["$services.aiTrailer", false] }, true] }, 1, 0],
          },
          evaluationPriority: {
            $cond: [{ $eq: [{ $ifNull: ["$services.evaluation", false] }, true] }, 1, 0],
          },
          spotlightPriority: {
            $cond: [
              {
                $and: [
                  { $ifNull: ["$promotion.spotlightActive", false] },
                  { $gte: ["$promotion.spotlightEndAt", now] },
                ],
              },
              1,
              0,
            ],
          },
          trendScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$reviewCount", 0] }, 3] },
              { $multiply: [{ $ifNull: ["$readsCount", 0] }, 2] },
              { $ifNull: ["$views", 0] },
            ],
          },
        },
      },
      { $sort: { verifiedPriority: -1, aiTrailerPriority: -1, evaluationPriority: -1, spotlightPriority: -1, trendScore: -1, rating: -1, createdAt: -1 } },
      { $limit: 12 },
      { $project: { _id: 1 } },
    ]);

    if (!ranked.length) return res.json([]);

    const ids = ranked.map((s) => s._id);

    // Step 2: fetch full documents with populated creator (preserving sort order)
    const docs = await Script.find({ _id: { $in: ids }, isSold: { $ne: true }, purchaseRequestLocked: { $ne: true } }).populate(
      "creator",
      "name profileImage role"
    );

    const idStr = (id) => id.toString();
    const docMap = Object.fromEntries(docs.map((d) => [idStr(d._id), d]));
    const ordered = ids.map((id) => docMap[idStr(id)]).filter(Boolean);

    res.json(ordered);
  } catch (error) {
    console.error("getFeaturedScripts error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getTopScripts = async (req, res) => {
  try {
    const now = new Date();
    const blockedUserIds = await getBlockedUserIdsForViewer(req.user._id);
    const sortBy = req.query.sort || "rating";
    let sortObj = { rating: -1 };
    if (sortBy === "reads") sortObj = { readsCount: -1 };
    if (sortBy === "purchases") sortObj = { "unlockedBy": -1 };
    const query = { ...PUBLIC_SCRIPT_FILTER };
    if (blockedUserIds.length > 0) {
      query.creator = { $nin: blockedUserIds };
    }
    const scripts = await Script.find(query)
      .populate("creator", "name profileImage role")
      .sort(sortObj)
      .limit(20);

    const boostedFirst = [...scripts].sort((a, b) => {
      const aVerified = a?.verifiedBadge ? 1 : 0;
      const bVerified = b?.verifiedBadge ? 1 : 0;
      if (aVerified !== bVerified) return bVerified - aVerified;

      const aTrailer = a?.services?.aiTrailer ? 1 : 0;
      const bTrailer = b?.services?.aiTrailer ? 1 : 0;
      if (aTrailer !== bTrailer) return bTrailer - aTrailer;

      const aEvaluation = a?.services?.evaluation ? 1 : 0;
      const bEvaluation = b?.services?.evaluation ? 1 : 0;
      if (aEvaluation !== bEvaluation) return bEvaluation - aEvaluation;

      const aBoost = isSpotlightActive(a, now) ? 1 : 0;
      const bBoost = isSpotlightActive(b, now) ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      return 0;
    });

    res.json(boostedFirst);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchScriptsReader = async (req, res) => {
  try {
    const { q, category, genre, page = 1, limit = 20 } = req.query;
    const query = { ...PUBLIC_SCRIPT_FILTER };
    const blockedUserIds = await getBlockedUserIdsForViewer(req.user._id);
    if (blockedUserIds.length > 0) {
      query.creator = { $nin: blockedUserIds };
    }
    if (q) {
      const regex = new RegExp(escapeRegExp(q), "i");
      query.$or = [{ sid: regex }, { title: regex }, { description: regex }, { logline: regex }, { tags: regex }];
    }
    if (category) query.contentType = category;
    if (genre) query.genre = genre;
    const total = await Script.countDocuments(query);
    const scripts = await Script.find(query)
      .populate("creator", "name profileImage role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    await Promise.all(
      scripts.map(async (doc) => {
        if (!doc.sid) {
          await doc.save();
        }
      })
    );

    res.json({ scripts, totalPages: Math.ceil(total / limit), page: parseInt(page), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLatestScripts = async (req, res) => {
  try {
    const scripts = await Script.find({ ...PUBLIC_SCRIPT_FILTER })
      .populate("creator", "name profileImage role")
      .sort({ createdAt: -1 })
      .limit(18);
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recordRead = async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) return res.status(404).json({ message: "Script not found" });
    script.readsCount = (script.readsCount || 0) + 1;
    await script.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { scriptsRead: script._id } });

    trackInvestorInteraction({
      userId: req.user._id,
      scriptId: script._id,
      type: "read",
      source: "script_reader",
    }).catch(() => null);

    res.json({ message: "Read recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.favoriteScripts.indexOf(req.params.id);
    if (idx > -1) {
      user.favoriteScripts.splice(idx, 1);
      await user.save();
      res.json({ favorited: false });
    } else {
      user.favoriteScripts.push(req.params.id);
      await user.save();

      trackInvestorInteraction({
        userId: req.user._id,
        scriptId: req.params.id,
        type: "save",
        source: "favorite_toggle",
      }).catch(() => null);

      res.json({ favorited: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const trackScriptInteraction = async (req, res) => {
  try {
    const { type, timeSpentMs, source, metadata } = req.body || {};
    const allowedTypes = new Set(["view", "like", "save", "click", "time_spent", "read"]);
    if (!allowedTypes.has(type)) {
      return res.status(400).json({ message: "Invalid interaction type" });
    }

    const script = await Script.findById(req.params.id).select("_id status");
    if (!script || script.status !== "published") {
      return res.status(404).json({ message: "Script not found" });
    }

    await trackInvestorInteraction({
      userId: req.user._id,
      scriptId: req.params.id,
      type,
      timeSpentMs: Number(timeSpentMs) > 0 ? Number(timeSpentMs) : 0,
      source: source || "client",
      metadata: metadata || {},
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const contentTypes = await Script.distinct("contentType", { ...PUBLIC_SCRIPT_FILTER });
    const genres = await Script.distinct("genre", { ...PUBLIC_SCRIPT_FILTER });
    res.json({ contentTypes: contentTypes.filter(Boolean), genres: genres.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeGenre = (value = "") => {
  const raw = String(value || "").toLowerCase().trim();
  if (!raw) return "";
  const compact = raw.replace(/[\s_]+/g, "-");
  const aliases = {
    "science-fiction": "sci-fi",
    scifi: "sci-fi",
    "sci fi": "sci-fi",
    thriller: "thriller",
    drama: "drama",
    horror: "horror",
    comedy: "comedy",
    romance: "romance",
    action: "action",
    mystery: "mystery",
    fantasy: "fantasy",
    documentary: "documentary",
    crime: "crime",
    animation: "animation",
    adventure: "adventure",
    historical: "historical",
    musical: "musical",
  };
  return aliases[compact] || compact;
};

const normalizeFormat = (value = "") => {
  const raw = String(value || "").toLowerCase().trim();
  if (!raw) return "";
  if (raw.includes("feature")) return "feature";
  if (raw.includes("short")) return "short";
  if (raw.includes("limited")) return "limited-series";
  if (raw.includes("web")) return "web-series";
  if (raw.includes("documentary")) return "documentary";
  if (raw.includes("animation")) return "animation";
  if (raw.includes("tv")) return "tv-series";
  return raw.replace(/[\s_]+/g, "-");
};

const normalizeBudgetTier = (value = "") => {
  const raw = String(value || "").toLowerCase().trim();
  if (!raw) return "";
  if (raw.includes("micro")) return "micro";
  if (raw.includes("low")) return "low";
  if (raw.includes("mid") || raw.includes("medium")) return "medium";
  if (raw.includes("high")) return "high";
  if (raw.includes("tentpole") || raw.includes("blockbuster")) return "blockbuster";
  return raw;
};

const formatMatches = (script = {}, preferred = []) => {
  if (!preferred.length) return false;
  const scriptFormats = [script?.format, script?.contentType]
    .map(normalizeFormat)
    .filter(Boolean);
  return preferred.some((f) => scriptFormats.includes(f));
};

const budgetMatches = (script = {}, preferred = []) => {
  if (!preferred.length) return false;
  const sb = normalizeBudgetTier(script?.budget || "");
  if (!sb) return false;
  return preferred.includes(sb);
};

const inferGenresFromProfileText = (text = "") => {
  const source = String(text || "").toLowerCase();
  if (!source) return [];

  const keywordMap = {
    horror: ["horror", "slasher", "supernatural", "haunted"],
    drama: ["drama", "dramatic", "family drama", "emotional"],
    thriller: ["thriller", "suspense", "psychological thriller", "crime thriller"],
    comedy: ["comedy", "comic", "satire", "humor"],
    romance: ["romance", "romantic", "love story"],
    action: ["action", "adventure action", "high-octane"],
    mystery: ["mystery", "detective", "whodunit"],
    "sci-fi": ["sci-fi", "science fiction", "scifi", "futuristic"],
    fantasy: ["fantasy", "mythic", "magic"],
    documentary: ["documentary", "docu"],
  };

  const inferred = [];
  for (const [genre, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((k) => source.includes(k))) inferred.push(genre);
  }
  return inferred;
};

const inferFormatsFromProfileText = (text = "") => {
  const source = String(text || "").toLowerCase();
  if (!source) return [];

  const inferred = [];
  if (source.includes("feature")) inferred.push("feature");
  if (source.includes("short")) inferred.push("short");
  if (source.includes("web series") || source.includes("web-series")) inferred.push("web-series");
  if (source.includes("limited series") || source.includes("limited-series")) inferred.push("limited-series");
  if (source.includes("tv") || source.includes("series")) inferred.push("tv-series");
  if (source.includes("documentary")) inferred.push("documentary");
  if (source.includes("animation") || source.includes("animated")) inferred.push("animation");
  return [...new Set(inferred)];
};

const inferBudgetsFromInvestmentRange = (range = "") => {
  const r = String(range || "").toLowerCase();
  if (!r) return [];
  if (r.includes("under_50k")) return ["micro", "low"];
  if (r.includes("50k_250k")) return ["low", "medium"];
  if (r.includes("250k_1m")) return ["medium", "high"];
  if (r.includes("1m_5m")) return ["high", "blockbuster"];
  if (r.includes("over_5m")) return ["blockbuster", "high"];
  return [];
};

const scoreScriptByInvestorProfile = (
  script,
  { preferredGenres = [], preferredFormats = [], preferredBudgets = [] } = {}
) => {
  const ordered = preferredGenres.map(normalizeGenre).filter(Boolean);
  const orderIndex = new Map(ordered.map((g, idx) => [g, idx]));

  const primary = normalizeGenre(
    script?.genre || script?.primaryGenre || script?.classification?.primaryGenre || ""
  );

  const secondary = [
    script?.classification?.secondaryGenre,
    ...(script?.subGenres || []),
    ...(script?.classification?.themes || []),
    ...(script?.classification?.tones || []),
  ]
    .map(normalizeGenre)
    .filter(Boolean);

  let score = 0;
  if (orderIndex.has(primary)) {
    score += 1000 - orderIndex.get(primary) * 40;
  }

  const bestSecondaryBoost = secondary.reduce((acc, g) => {
    if (!orderIndex.has(g)) return acc;
    const boost = 240 - orderIndex.get(g) * 20;
    return Math.max(acc, boost);
  }, 0);
  score += bestSecondaryBoost;

  score += (script?.rating || 0) * 10;
  score += Math.min(80, (script?.readsCount || 0) * 0.2);
  score += Math.min(80, (script?.views || 0) * 0.05);

  if (formatMatches(script, preferredFormats)) score += 180;
  if (budgetMatches(script, preferredBudgets)) score += 160;

  return score;
};

const rankScriptsForInvestor = (
  scripts = [],
  profileSignals = { preferredGenres: [], preferredFormats: [], preferredBudgets: [] }
) => {
  if (!Array.isArray(scripts) || scripts.length === 0) return [];
  const hasSignals =
    profileSignals?.preferredGenres?.length ||
    profileSignals?.preferredFormats?.length ||
    profileSignals?.preferredBudgets?.length;
  if (!hasSignals) return scripts;

  return scripts
    .map((script, idx) => ({
      script,
      idx,
      score: scoreScriptByInvestorProfile(script, profileSignals),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.idx - b.idx;
    })
    .map((item) => item.script);
};

// ═══════════════════════════════════════════════════════════
//  INVESTOR HOME FEED — Personalised by genre / mandate prefs
// ═══════════════════════════════════════════════════════════
export const getInvestorHomeFeed = async (req, res) => {
  try {
    const feed = await buildInvestorFeed(req.user._id);
    res.json(feed);
  } catch (error) {
    console.error("getInvestorHomeFeed error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  TOP LIST — merged Top Ranked + Featured + Trending
// ═══════════════════════════════════════════════════════════
export const getTopList = async (req, res) => {
  try {
    const now = new Date();
    const { genre, contentType, budget, sort = "platform", premium } = req.query;
    const blockedUserIds = await getBlockedUserIdsForViewer(req.user._id);
    const match = { ...PUBLIC_SCRIPT_FILTER };
    if (genre) match.genre = genre;
    if (contentType) match.contentType = contentType;
    if (budget) match.budget = budget;
    if (premium === "true") match.premium = true;
    else if (premium === "false") match.premium = { $ne: true };
    if (blockedUserIds.length > 0) {
      match.creator = { $nin: blockedUserIds };
    }

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          verifiedPriority: {
            $cond: [{ $eq: [{ $ifNull: ["$verifiedBadge", false] }, true] }, 1, 0],
          },
          aiTrailerPriority: {
            $cond: [{ $eq: [{ $ifNull: ["$services.aiTrailer", false] }, true] }, 1, 0],
          },
          evaluationPriority: {
            $cond: [{ $eq: [{ $ifNull: ["$services.evaluation", false] }, true] }, 1, 0],
          },
          spotlightPriority: {
            $cond: [
              {
                $and: [
                  { $ifNull: ["$promotion.spotlightActive", false] },
                  { $gte: ["$promotion.spotlightEndAt", now] },
                ],
              },
              1,
              0,
            ],
          },
          unlockCount: { $size: { $ifNull: ["$unlockedBy", []] } },
          trendScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$reviewCount", 0] }, 3] },
              { $multiply: [{ $ifNull: ["$readsCount", 0] }, 2] },
              { $ifNull: ["$views", 0] },
            ],
          },
          engagementScore: {
            $min: [
              100,
              {
                $add: [
                  { $multiply: [{ $divide: [{ $ifNull: ["$views", 0] }, 500] }, 40] },
                  { $multiply: [{ $divide: [{ $size: { $ifNull: ["$unlockedBy", []] } }, 50] }, 40] },
                  {
                    $cond: [
                      { $gt: [{ $ifNull: ["$views", 0] }, 0] },
                      { $multiply: [{ $divide: [{ $size: { $ifNull: ["$unlockedBy", []] } }, { $ifNull: ["$views", 1] }] }, 100] },
                      0,
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          platformScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$scriptScore.overall", 0] }, 0.6] },
              { $multiply: ["$engagementScore", 0.4] },
            ],
          },
        },
      },
    ];

    // Sort based on tab
    if (sort === "trending") pipeline.push({ $sort: { verifiedPriority: -1, aiTrailerPriority: -1, evaluationPriority: -1, spotlightPriority: -1, trendScore: -1 } });
    else if (sort === "featured") pipeline.push({ $sort: { verifiedPriority: -1, aiTrailerPriority: -1, evaluationPriority: -1, spotlightPriority: -1, engagementScore: -1, trendScore: -1 } });
    else if (sort === "score") pipeline.push({ $sort: { verifiedPriority: -1, aiTrailerPriority: -1, evaluationPriority: -1, spotlightPriority: -1, "scriptScore.overall": -1 } });
    else if (sort === "views") pipeline.push({ $sort: { verifiedPriority: -1, aiTrailerPriority: -1, evaluationPriority: -1, spotlightPriority: -1, views: -1 } });
    else pipeline.push({ $sort: { verifiedPriority: -1, aiTrailerPriority: -1, evaluationPriority: -1, spotlightPriority: -1, platformScore: -1 } }); // default: platform

    // Populate creator
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
        pipeline: [{ $project: { name: 1, profileImage: 1, role: 1 } }],
      },
    });
    pipeline.push({ $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } });

    const scripts = await Script.aggregate(pipeline);
    const sanitized = scripts.map((s) => ({
      ...s,
      synopsis: s.synopsis ? s.synopsis.substring(0, 120) + (s.synopsis.length > 120 ? "..." : "") : null,
      fullContent: undefined,
    }));
    res.json(sanitized);
  } catch (error) {
    console.error("getTopList error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  RAZORPAY PAYMENT INTEGRATION FOR SCRIPTS
// ═══════════════════════════════════════════════════════════

// @desc    Create Razorpay order for script purchase
// @route   POST /api/scripts/purchase/create-order
// @access  Private
export const createScriptPurchaseOrder = async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Payment system not configured. Please contact support.",
        error: "Razorpay credentials missing"
      });
    }

    const { scriptId } = req.body;

    const script = await Script.findById(scriptId).populate("creator", "name");
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }

    // Check if already purchased
    if (script.unlockedBy.includes(req.user._id)) {
      return res.status(400).json({ message: "You have already purchased this script" });
    }

    if (script.purchaseRequestLocked) {
      const lockOwnerId = script.purchaseRequestLockedBy?.toString?.() || "";
      if (!lockOwnerId || lockOwnerId !== req.user._id.toString()) {
        return res.status(409).json({
          message: "This script is currently locked by another investor request.",
        });
      }
    }

    const existingPendingRequest = await ScriptPurchaseRequest.findOne({
      script: scriptId,
      investor: req.user._id,
      status: "pending",
    }).select("_id");

    if (existingPendingRequest) {
      return res.status(400).json({
        message: "You already have a pending purchase request for this script.",
      });
    }

    // Check if trying to buy own script
    if (script.creator._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot purchase your own script" });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(script.price * 100), // Amount in paise (INR) or cents
      currency: "INR",
      receipt: `script_purchase_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        scriptId: scriptId,
        scriptTitle: script.title,
        creatorId: script.creator._id.toString(),
        type: "script_purchase"
      }
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      scriptDetails: {
        id: script._id,
        title: script.title,
        price: script.price,
        creator: script.creator.name
      }
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ message: "Failed to create payment order", error: error.message });
  }
};

// @desc    Activate project spotlight package for a script
// @route   POST /api/scripts/:id/activate-spotlight
// @access  Private (script owner)
export const activateProjectSpotlight = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let script;
    let user;
    let endAt;
    let isExtensionPurchase = false;
    let spotlightCreditsCharged = PROJECT_SPOTLIGHT_ACTIVATION_CREDITS;
    let refundCredits = 0;
    let refundBreakdown = { evaluation: 0, aiTrailer: 0 };
    const scriptId = req.params?.id || req.body?.scriptId || req.query?.scriptId;

    if (!scriptId) {
      return res.status(400).json({ message: "Script ID is required" });
    }

    await session.withTransaction(async () => {
      script = await Script.findById(scriptId).session(session);
      if (!script) {
        const error = new Error("Script not found");
        error.statusCode = 404;
        throw error;
      }

      if (script.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Only the script creator can activate spotlight");
        error.statusCode = 403;
        throw error;
      }

      if (script.status !== "published") {
        const error = new Error("Publish the project before activating spotlight");
        error.statusCode = 400;
        throw error;
      }

      user = await User.findById(req.user._id).session(session);
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      if (!user.credits) {
        user.credits = { balance: 0, totalPurchased: 0, totalSpent: 0, transactions: [] };
      }

      const now = new Date();

      const spotlightCurrentlyActive = isSpotlightActive(script, now);
      const spotlightCreditsRequired = spotlightCurrentlyActive
        ? PROJECT_SPOTLIGHT_EXTENSION_CREDITS
        : PROJECT_SPOTLIGHT_ACTIVATION_CREDITS;
      isExtensionPurchase = spotlightCurrentlyActive;
      spotlightCreditsCharged = spotlightCreditsRequired;

      // Prefer billing-tracked service charges, then backfill from upload invoice for older scripts.
      const currentBilling = script.billing || {};
      let evaluationCharged = Number(currentBilling.evaluationCreditsCharged || 0);
      let aiTrailerCharged = Number(currentBilling.aiTrailerCreditsCharged || 0);
      let evaluationChargedAtUpload = Number(currentBilling.evaluationCreditsChargedAtUpload || 0);
      let aiTrailerChargedAtUpload = Number(currentBilling.aiTrailerCreditsChargedAtUpload || 0);
      let evaluationRefunded = Number(currentBilling.evaluationCreditsRefunded || 0);
      let aiTrailerRefunded = Number(currentBilling.aiTrailerCreditsRefunded || 0);

      const needsUploadBackfill =
        (evaluationCharged > 0 && evaluationChargedAtUpload === 0) ||
        (aiTrailerCharged > 0 && aiTrailerChargedAtUpload === 0);

      // Backfill upload-time charge markers for legacy or partially-migrated scripts.
      if (needsUploadBackfill) {
        const uploadInvoice = await Invoice.findOne({ script: script._id, creator: req.user._id })
          .sort({ createdAt: -1 })
          .session(session)
          .lean();

        if (uploadInvoice?.services?.evaluation) {
          evaluationCharged = Math.max(evaluationCharged, CREDIT_PRICES.AI_EVALUATION);
          evaluationChargedAtUpload = CREDIT_PRICES.AI_EVALUATION;
        }
        if (uploadInvoice?.services?.aiTrailer) {
          aiTrailerCharged = Math.max(aiTrailerCharged, CREDIT_PRICES.AI_TRAILER);
          aiTrailerChargedAtUpload = CREDIT_PRICES.AI_TRAILER;
        }
      }

      const hasPaidEvaluation = evaluationCharged > 0;
      const refundableEvaluation = 0;
      const nonUploadTrailerCharged = Math.max(0, aiTrailerCharged - aiTrailerChargedAtUpload);
      const refundableTrailer = hasPaidEvaluation ? Math.max(0, nonUploadTrailerCharged - aiTrailerRefunded) : 0;
      const refundableCredits = refundableEvaluation + refundableTrailer;

      const balance = user.credits.balance || 0;
      const effectiveBalance = balance + refundableCredits;
      if (effectiveBalance < spotlightCreditsRequired) {
        const actionLabel = spotlightCurrentlyActive ? "Spotlight extension" : "Project Spotlight activation";
        const error = new Error(`Insufficient credits. ${actionLabel} requires ${spotlightCreditsRequired} credits.`);
        error.statusCode = 402;
        error.payload = {
          requiresCredits: true,
          required: spotlightCreditsRequired,
          balance: effectiveBalance,
          shortfall: spotlightCreditsRequired - effectiveBalance,
        };
        throw error;
      }

      if (refundableCredits > 0) {
        const balanceBeforeRefund = user.credits.balance || 0;
        user.credits.balance = balanceBeforeRefund + refundableCredits;
        user.credits.totalSpent = Math.max(0, (user.credits.totalSpent || 0) - refundableCredits);
        user.credits.transactions.push({
          type: "refund",
          amount: refundableCredits,
          description: `Spotlight package credit adjustment for "${script.title}"`,
          reference: `SPRF-${Date.now().toString(36).toUpperCase()}`,
          createdAt: now,
        });

        await Transaction.create([
          {
            user: req.user._id,
            type: "refund",
            amount: refundableCredits,
            currency: "INR",
            status: "completed",
            description: `Credit refund for previously paid services on "${script.title}"`,
            reference: `SPRF-TX-${Date.now().toString(36).toUpperCase()}`,
            paymentMethod: "wallet",
            relatedScript: script._id,
            balanceBefore: balanceBeforeRefund,
            balanceAfter: user.credits.balance,
            metadata: {
              package: "project_spotlight_refund",
              refundedEvaluationCredits: refundableEvaluation,
              refundedAiTrailerCredits: refundableTrailer,
            },
          },
        ], { session });

        refundCredits = refundableCredits;
        refundBreakdown = {
          evaluation: refundableEvaluation,
          aiTrailer: refundableTrailer,
        };

        evaluationRefunded += refundableEvaluation;
        aiTrailerRefunded += refundableTrailer;
      }

      const currentEnd = script.promotion?.spotlightEndAt ? new Date(script.promotion.spotlightEndAt) : null;
      const extensionStart = currentEnd && currentEnd > now ? currentEnd : now;
      endAt = new Date(extensionStart.getTime() + PROJECT_SPOTLIGHT_DURATION_DAYS * 24 * 60 * 60 * 1000);

      user.credits.balance = (user.credits.balance || 0) - spotlightCreditsRequired;
      user.credits.totalSpent = (user.credits.totalSpent || 0) + spotlightCreditsRequired;
      user.credits.transactions.push({
        type: "spent",
        amount: -spotlightCreditsRequired,
        description: `${spotlightCurrentlyActive ? "Project Spotlight extended" : "Project Spotlight activated"} for "${script.title}"`,
        reference: `SPOT-${Date.now().toString(36).toUpperCase()}`,
        createdAt: now,
      });
      await user.save({ session });

      script.premium = true;
      script.isFeatured = true;
      script.verifiedBadge = true;
      script.services = {
        hosting: true,
        evaluation: true,
        aiTrailer: true,
      };
      script.evaluationStatus = script.scriptScore?.overall ? "completed" : "requested";

      if (!script.trailerUrl && !script.uploadedTrailerUrl && !["generating", "ready"].includes(script.trailerStatus)) {
        script.trailerStatus = "requested";
      }

      const previousSpent = script.promotion?.totalSpotlightCreditsSpent || 0;
      script.promotion = {
        spotlightActive: true,
        spotlightStartAt: now,
        spotlightEndAt: endAt,
        lastSpotlightPurchaseAt: now,
        totalSpotlightCreditsSpent: previousSpent + spotlightCreditsRequired,
      };
      script.billing = {
        evaluationCreditsCharged: evaluationCharged,
        aiTrailerCreditsCharged: aiTrailerCharged,
        evaluationCreditsChargedAtUpload: evaluationChargedAtUpload,
        aiTrailerCreditsChargedAtUpload: aiTrailerChargedAtUpload,
        evaluationCreditsRefunded: evaluationRefunded,
        aiTrailerCreditsRefunded: aiTrailerRefunded,
        spotlightCreditsSpent: Number(currentBilling.spotlightCreditsSpent || 0) + spotlightCreditsRequired,
        lastSpotlightRefundCredits: refundableCredits,
        lastSpotlightActivatedAt: now,
      };
      script.markModified("services");
      script.markModified("promotion");
      script.markModified("billing");
      await script.save({ session });

      await Transaction.create([
        {
          user: req.user._id,
          type: "debit",
          amount: -spotlightCreditsRequired,
          currency: "INR",
          status: "completed",
          description: `Project Spotlight ${spotlightCurrentlyActive ? "extension" : "package"} for "${script.title}"`,
          reference: `SPTD-${Date.now().toString(36).toUpperCase()}`,
          paymentMethod: "wallet",
          relatedScript: script._id,
          metadata: {
            package: spotlightCurrentlyActive ? "project_spotlight_extension" : "project_spotlight",
            isExtension: spotlightCurrentlyActive,
            includesVerifiedBadge: true,
            includesFreeEvaluation: true,
            includesFreeAITrailer: true,
            featuredDurationDays: PROJECT_SPOTLIGHT_DURATION_DAYS,
            spotlightEndAt: endAt.toISOString(),
          },
        },
      ], { session });
    });

    await notifyAdminWorkflowEvent({
      title: isExtensionPurchase ? "Project Spotlight Extended" : "Project Spotlight Activated",
      section: "approvals",
      actorId: req.user._id,
      scriptId: script._id,
      message: `Project Spotlight ${isExtensionPurchase ? "extended" : "activated"} for "${script.title}". Featured placement is active for 1 month and verified badge remains permanent once unlocked.`,
      metadata: {
        scriptId: script._id,
        writerId: req.user._id,
        spotlightEndAt: endAt.toISOString(),
      },
    });

    res.json({
      message: isExtensionPurchase
        ? "Project Spotlight extended successfully"
        : "Project Spotlight activated successfully",
      package: {
        name: "Project Spotlight",
        isExtension: isExtensionPurchase,
        creditsCharged: spotlightCreditsCharged,
        creditsRefunded: refundCredits,
        refundBreakdown,
        spotlightEndAt: endAt,
        benefits: [
          "Verified project badge (permanent once unlocked)",
          "Free script evaluation",
          "Free AI trailer",
          "Featured and top placement for 1 month",
        ],
      },
      credits: {
        balance: user.credits.balance,
        spent: spotlightCreditsCharged,
        refunded: refundCredits,
      },
      script,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
      ...(error.payload || {}),
    });
  } finally {
    await session.endSession();
  }
};

// @desc    Verify Razorpay payment and unlock script
// @route   POST /api/scripts/purchase/verify-payment
// @access  Private
export const verifyScriptPurchase = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      scriptId
    } = req.body;

    console.log("Script purchase verification:", { razorpay_order_id, razorpay_payment_id, scriptId });

    // Check if Razorpay key secret is available
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET not found in environment");
      return res.status(500).json({
        message: "Payment system not configured",
        success: false
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error("Signature verification failed");
      return res.status(400).json({
        message: "Payment verification failed - Invalid signature",
        success: false
      });
    }

    // Payment verified successfully, create escrowed purchase request for writer approval
    const script = await Script.findById(scriptId).populate("creator", "name email");
    if (!script) {
      console.error("Script not found:", scriptId);
      return res.status(404).json({
        message: "Script not found",
        success: false
      });
    }

    // Check if already unlocked
    if (script.unlockedBy.includes(req.user._id)) {
      return res.status(400).json({
        message: "Script already purchased",
        success: false
      });
    }

    const lockOwnerId = script.purchaseRequestLockedBy?.toString?.() || "";
    if (script.purchaseRequestLocked && lockOwnerId !== req.user._id.toString()) {
      return res.status(409).json({
        message: "This script is currently locked by another investor request.",
        success: false,
      });
    }

    let purchaseRequest = await ScriptPurchaseRequest.findOne({
      script: script._id,
      investor: req.user._id,
      status: "pending",
    });

    if (purchaseRequest && purchaseRequest.paymentStatus === "escrow_held") {
      return res.json({
        success: true,
        message: "Payment already verified. Waiting for writer approval.",
        purchaseRequestId: purchaseRequest._id,
      });
    }

    const amount = Number(script.price || 0);

    if (!purchaseRequest) {
      purchaseRequest = await ScriptPurchaseRequest.create({
        script: script._id,
        investor: req.user._id,
        writer: script.creator._id,
        amount,
        frozenAmount: amount,
        paymentMethod: "razorpay",
        paymentStatus: amount > 0 ? "escrow_held" : "pending",
        paymentGatewayOrderId: razorpay_order_id,
        paymentGatewayPaymentId: razorpay_payment_id,
        paymentGatewaySignature: razorpay_signature,
      });
    } else {
      purchaseRequest.amount = amount;
      purchaseRequest.frozenAmount = amount;
      purchaseRequest.paymentMethod = "razorpay";
      purchaseRequest.paymentStatus = amount > 0 ? "escrow_held" : "pending";
      purchaseRequest.paymentGatewayOrderId = razorpay_order_id;
      purchaseRequest.paymentGatewayPaymentId = razorpay_payment_id;
      purchaseRequest.paymentGatewaySignature = razorpay_signature;
      await purchaseRequest.save();
    }

    const holdReference = `PRH-RZP-${razorpay_payment_id}`;
    const existingHoldTx = await Transaction.findOne({ reference: holdReference });
    if (!existingHoldTx && amount > 0) {
      await Transaction.create({
        user: req.user._id,
        type: "payment",
        amount: -amount,
        currency: "INR",
        status: "pending",
        description: `Escrow hold for purchase request: "${script.title}"`,
        reference: holdReference,
        paymentMethod: "razorpay",
        relatedScript: script._id,
        metadata: {
          purchaseRequestId: purchaseRequest._id.toString(),
          stage: "escrow_hold",
          writerId: script.creator._id.toString(),
          scriptId: script._id.toString(),
          razorpay_order_id,
          razorpay_payment_id,
        },
      });
    }

    script.purchaseRequestLocked = true;
    script.purchaseRequestLockedBy = req.user._id;
    script.purchaseRequestLockedAt = new Date();
    await script.save();

    const investor = await User.findById(req.user._id).select("name email");

    await Notification.create({
      user: script.creator._id,
      type: "purchase_request",
      from: req.user._id,
      script: script._id,
      message: `${investor?.name || "An investor"} submitted a paid purchase request for "${script.title}". ₹${amount.toLocaleString("en-IN")} is held in escrow pending your approval.`,
    });

    sendPurchaseRequestEmail(
      script.creator.email,
      script.creator.name,
      investor?.name || "Investor",
      script.title,
      amount
    ).catch((err) => console.error("[Purchase] Failed to send request email:", err.message));
    
    console.log("Script purchase payment escrowed:", { scriptId, buyerId: req.user._id, amount });

    res.json({
      success: true,
      message: "Payment received and held in escrow. Request sent to writer for approval.",
      purchaseRequest: {
        id: purchaseRequest._id,
        status: purchaseRequest.status,
        paymentStatus: purchaseRequest.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Script purchase verification error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message,
      success: false
    });
  }
};

// @desc    Create Razorpay order for script hold/option
// @route   POST /api/scripts/hold/create-order
// @access  Private
export const createScriptHoldOrder = async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Payment system not configured. Please contact support.",
        error: "Razorpay credentials missing"
      });
    }

    const { scriptId } = req.body;

    const script = await Script.findById(scriptId).populate("creator", "name");
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }

    // Check if already held
    if (script.holdStatus === "held") {
      return res.status(400).json({ message: "This script is already on hold by another party" });
    }
    if (script.holdStatus === "sold") {
      return res.status(400).json({ message: "This script has been sold" });
    }

    const user = await User.findById(req.user._id);
    if (!["investor", "producer", "director"].includes(user.role)) {
      return res.status(403).json({ message: "Only industry professionals can hold scripts" });
    }

    const holdFee = script.holdFee || 200;

    // Create Razorpay order
    const options = {
      amount: Math.round(holdFee * 100), // Amount in paise (INR) or cents
      currency: "INR",
      receipt: `script_hold_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        scriptId: scriptId,
        scriptTitle: script.title,
        creatorId: script.creator._id.toString(),
        holdFee: holdFee,
        type: "script_hold"
      }
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      scriptDetails: {
        id: script._id,
        title: script.title,
        holdFee: holdFee,
        creator: script.creator.name
      }
    });
  } catch (error) {
    console.error("Razorpay hold order creation error:", error);
    res.status(500).json({ message: "Failed to create payment order", error: error.message });
  }
};

// @desc    Verify Razorpay payment and place hold on script
// @route   POST /api/scripts/hold/verify-payment
// @access  Private
export const verifyScriptHold = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      scriptId
    } = req.body;

    console.log("Script hold verification:", { razorpay_order_id, razorpay_payment_id, scriptId });

    // Check if Razorpay key secret is available
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET not found in environment");
      return res.status(500).json({
        message: "Payment system not configured",
        success: false
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error("Signature verification failed");
      return res.status(400).json({
        message: "Payment verification failed - Invalid signature",
        success: false
      });
    }

    // Payment verified successfully, place hold on script
    const script = await Script.findById(scriptId).populate("creator", "name email");
    if (!script) {
      console.error("Script not found:", scriptId);
      return res.status(404).json({
        message: "Script not found",
        success: false
      });
    }

    // Double-check hold status
    if (script.holdStatus === "held") {
      return res.status(400).json({
        message: "Script is already held",
        success: false
      });
    }

    const user = await User.findById(req.user._id);
    const fee = script.holdFee || 200;
    const platformCut = fee * 0.10; // 10% platform fee
    const creatorPayout = fee - platformCut;
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create option record
    const option = await ScriptOption.create({
      script: scriptId,
      holder: req.user._id,
      fee,
      platformCut,
      creatorPayout,
      endDate,
      status: "active",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    // Update script
    script.holdStatus = "held";
    script.heldBy = req.user._id;
    script.holdStartDate = new Date();
    script.holdEndDate = endDate;
    await script.save();

    const reference = `SCRIPT-HOLD-${razorpay_payment_id}`;

    // Create transaction record for holder (payment)
    await Transaction.create({
      user: req.user._id,
      type: "payment",
      amount: -fee,
      currency: "INR",
      status: "completed",
      description: `Placed hold on script: "${script.title}" (30 days)`,
      reference,
      paymentMethod: "razorpay",
      relatedScript: script._id,
      metadata: {
        razorpay_order_id,
        razorpay_payment_id,
        holdEndDate: endDate,
        platformCut,
        creatorPayout
      }
    });

    // Credit the creator
    const creator = await User.findById(script.creator._id);
    if (!creator.wallet) {
      creator.wallet = { balance: 0, totalEarnings: 0 };
    }
    creator.wallet.balance += creatorPayout;
    creator.wallet.totalEarnings += creatorPayout;
    await creator.save();

    // Create transaction record for creator (earnings)
    await Transaction.create({
      user: creator._id,
      type: "credit",
      amount: creatorPayout,
      currency: "INR",
      status: "completed",
      description: `Earned from script hold: "${script.title}"`,
      reference: `SCRIPT-HOLD-EARNING-${razorpay_payment_id}`,
      paymentMethod: "razorpay",
      relatedScript: script._id,
      metadata: {
        holderId: req.user._id.toString(),
        platformCut,
        originalAmount: fee,
        holdEndDate: endDate
      }
    });

    // Notify the creator
    await Notification.create({
      user: script.creator._id,
      type: "hold",
      from: req.user._id,
      script: script._id,
      message: `${user.name} has placed a hold on "${script.title}" for ₹${fee} (30 days). You earn ₹${creatorPayout.toFixed(2)}!`,
    });

    console.log("Script hold completed:", { scriptId, holderId: req.user._id, fee });

    res.json({
      success: true,
      message: "Hold placed successfully!",
      option,
      holdDetails: {
        fee,
        platformCut,
        creatorPayout,
        expiresAt: endDate,
      },
      transaction: {
        reference,
        amount: fee
      }
    });
  } catch (error) {
    console.error("Script hold verification error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message,
      success: false
    });
  }
};

// ── Multer Configuration for Thumbnail & Trailer Uploads (Memory Storage → Cloudinary) ──

// File filters
const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"), false);
  }
};

const videoFileFilter = (req, file, cb) => {
  const allowed = ["video/mp4", "video/mpeg", "video/quicktime", "video/webm", "video/x-m4v"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4, MPEG, MOV, M4V and WebM videos are allowed"), false);
  }
};

// Export multer upload instances (memory storage for Cloudinary)
export const uploadThumbnail = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadTrailer = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ── Upload Thumbnail Controller (Cloudinary) ──
export const uploadScriptThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No thumbnail file provided" });
    }

    const scriptId = req.params.id;
    const script = await Script.findById(scriptId);

    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }

    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script creator can upload a thumbnail" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "scriptbridge/thumbnails",
      resource_type: "image",
      public_id: `thumb-${scriptId}-${Date.now()}`,
    });

    const thumbnailUrl = result.secure_url;
    script.coverImage = thumbnailUrl;
    await script.save();

    res.json({
      message: "Thumbnail uploaded successfully",
      thumbnailUrl,
      script
    });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Upload Trailer Controller (Cloudinary) ──
export const uploadScriptTrailer = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No trailer file provided" });
    }

    const scriptId = req.params.id;
    const script = await Script.findById(scriptId);

    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }

    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script creator can upload a trailer" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "scriptbridge/trailers",
      resource_type: "video",
      public_id: `trailer-${scriptId}-${Date.now()}`,
    });

    const trailerUrl = result.secure_url;
    script.uploadedTrailerUrl = trailerUrl;
    script.trailerSource = "uploaded";
    script.trailerStatus = "ready";
    script.trailerWriterFeedback = {
      status: "approved",
      note: "",
      updatedAt: new Date(),
    };
    await script.save();

    res.json({
      message: "Trailer uploaded successfully (free)",
      trailerUrl,
      trailerSource: "uploaded",
      script
    });
  } catch (error) {
    console.error("Trailer upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Writer Requests AI Trailer from Platform ──
export const requestScriptAITrailer = async (req, res) => {
  try {
    const scriptId = req.params.id;
    const { note } = req.body || {};

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }

    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script creator can request an AI trailer" });
    }

    if (script.trailerStatus === "ready" && script.trailerUrl) {
      return res.status(400).json({ message: "AI trailer is already ready for this script" });
    }

    script.services = {
      hosting: script.services?.hosting ?? true,
      evaluation: script.services?.evaluation ?? false,
      aiTrailer: true,
    };
    script.trailerStatus = "requested";
    script.trailerWriterFeedback = {
      status: "pending",
      note: note?.trim() || "",
      updatedAt: new Date(),
    };
    await script.save();

    await notifyAdminWorkflowEvent({
      title: "AI Trailer Approval Request",
      section: "trailers",
      actorId: req.user._id,
      scriptId: script._id,
      message: `AI trailer requested by writer for "${script.title}"${note ? `. Note: ${note}` : ""}`,
      metadata: {
        scriptId: script._id,
        writerId: req.user._id,
        writerNote: note?.trim() || "",
      },
    });

    res.json({
      message: "AI trailer request submitted to platform",
      script,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Writer Feedback for Platform AI Trailer ──
export const submitTrailerFeedback = async (req, res) => {
  try {
    const scriptId = req.params.id;
    const { action, note } = req.body || {};

    if (!["approved", "revision_requested"].includes(action)) {
      return res.status(400).json({ message: "action must be approved or revision_requested" });
    }

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }

    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script creator can submit trailer feedback" });
    }

    if (!script.trailerUrl) {
      return res.status(400).json({ message: "No AI trailer available for feedback" });
    }

    script.trailerWriterFeedback = {
      status: action,
      note: note?.trim() || "",
      updatedAt: new Date(),
    };

    if (action === "revision_requested") {
      script.trailerStatus = "requested";
    } else {
      script.trailerStatus = "ready";
    }

    await script.save();

    if (action === "revision_requested") {
      await notifyAdminWorkflowEvent({
        title: "AI Trailer Revision Requested",
        section: "trailers",
        actorId: req.user._id,
        scriptId: script._id,
        message: `Writer requested a better AI trailer version for "${script.title}"${note?.trim() ? `. Note: ${note.trim()}` : ""}`,
        metadata: {
          scriptId: script._id,
          writerId: req.user._id,
          writerNote: note?.trim() || "",
        },
      });
    }

    res.json({
      message:
        action === "approved"
          ? "Trailer marked as approved"
          : "Trailer revision request submitted",
      script,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

