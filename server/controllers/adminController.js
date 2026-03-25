import User from "../models/User.js";
import Script from "../models/Script.js";
import Transaction from "../models/Transaction.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import ContactSubmission from "../models/ContactSubmission.js";
import jwt from "jsonwebtoken";
import { sendInvestorApprovalEmail, sendInvestorRejectionEmail } from "../utils/emailService.js";

const buildChatId = (idA, idB) => {
    const sorted = [idA.toString(), idB.toString()].sort();
    return `${sorted[0]}_${sorted[1]}`;
};

const maskAccountNumber = (accountNumber = "") => {
    if (!accountNumber) return "";
    return `****${String(accountNumber).slice(-4)}`;
};

// ─── Dashboard Stats ───
export const getStats = async (req, res) => {
    try {
        const [totalUsers, totalScripts, totalInvestors, totalWriters, totalReaders, pendingApprovals, totalTransactions] = await Promise.all([
            User.countDocuments({ role: { $ne: "admin" } }),
            Script.countDocuments(),
            User.countDocuments({ role: "investor" }),
            User.countDocuments({ role: { $in: ["writer", "creator"] } }),
            User.countDocuments({ role: "reader" }),
            Script.countDocuments({ status: "pending_approval" }),
            Transaction.countDocuments({ status: "completed" }),
        ]);

        const revenueResult = await Transaction.aggregate([
            { $match: { status: "completed", type: { $in: ["credit", "payment"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        res.json({
            totalUsers,
            totalScripts,
            totalInvestors,
            totalWriters,
            totalReaders,
            pendingApprovals,
            totalTransactions,
            totalRevenue,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── User Lists by Role ───
export const getUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const filter = { role: { $ne: "admin" } };
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { sid: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── All Scripts ───
export const getScripts = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { sid: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
                { genre: { $regex: search, $options: "i" } },
            ];
        }
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        await Promise.all(
            scripts
                .filter((script) => !script.sid)
                .map(async (script) => {
                    script.markModified("sid");
                    await script.save();
                })
        );
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Scripts Using AI ───
export const getAIUsageScripts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = {
            $or: [
                { "services.evaluation": true },
                { "services.aiTrailer": true },
                { "scriptScore.overall": { $exists: true, $ne: null } },
            ],
        };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Evaluation Purchases ───
export const getEvaluationPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = { "services.evaluation": true };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Investor Purchases ───
export const getInvestorPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const scripts = await Script.find({ unlockedBy: { $exists: true, $not: { $size: 0 } } })
            .populate("creator", "name email role profileImage")
            .populate("unlockedBy", "name email role profileImage")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Script.countDocuments({ unlockedBy: { $exists: true, $not: { $size: 0 } } });
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Payments Data ───
export const getPayments = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        const total = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .populate("user", "name email role profileImage")
            .populate("relatedScript", "title")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ transactions, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Invoices ───
export const getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const pipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "creator",
                    foreignField: "_id",
                    as: "creator",
                },
            },
            { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "scripts",
                    localField: "script",
                    foreignField: "_id",
                    as: "script",
                },
            },
            { $unwind: { path: "$script", preserveNullAndEmptyArrays: true } },
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { invoiceNumber: { $regex: search, $options: "i" } },
                        { "creator.name": { $regex: search, $options: "i" } },
                        { "script.title": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }

        pipeline.push(
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    rows: [
                        { $skip: skip },
                        { $limit: Number(limit) },
                        {
                            $project: {
                                invoiceNumber: 1,
                                invoiceDate: 1,
                                accessType: 1,
                                scriptPrice: 1,
                                platformFeeRate: 1,
                                writerEarnsPerSale: 1,
                                services: 1,
                                totalCreditsRequired: 1,
                                creditsBalanceBefore: 1,
                                creditsBalanceAfter: 1,
                                creatorSid: 1,
                                scriptSid: 1,
                                rows: 1,
                                pdfPath: 1,
                                createdAt: 1,
                                creator: {
                                    _id: "$creator._id",
                                    sid: "$creator.sid",
                                    name: "$creator.name",
                                    email: "$creator.email",
                                    role: "$creator.role",
                                },
                                script: {
                                    _id: "$script._id",
                                    sid: "$script.sid",
                                    title: "$script.title",
                                },
                            },
                        },
                    ],
                    meta: [{ $count: "total" }],
                },
            }
        );

        const [result] = await Invoice.aggregate(pipeline);
        const invoices = result?.rows || [];
        const total = result?.meta?.[0]?.total || 0;

        res.json({ invoices, total, page: Number(page), totalPages: Math.max(1, Math.ceil(total / Number(limit))) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Score Lists ───
export const getAIScores = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = { "scriptScore.overall": { $exists: true, $ne: null } };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ "scriptScore.overall": -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPlatformScores = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = { "platformScore.overall": { $exists: true, $ne: null } };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .populate("platformScore.scoredBy", "name")
            .sort({ "platformScore.overall": -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReaderScores = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = { rating: { $gt: 0 }, reviewCount: { $gt: 0 } };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ rating: -1, reviewCount: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Script Approval ───
export const getPendingScripts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = { status: "pending_approval" };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveScript = async (req, res) => {
    try {
        const script = await Script.findById(req.params.id);
        if (!script) return res.status(404).json({ message: "Script not found" });

        const spotlightChargedAtUpload = Number(script.billing?.spotlightCreditsChargedAtUpload || 0);
        const shouldAutoActivateSpotlight = Boolean(
            !script.promotion?.spotlightActive &&
            (
                (script.services?.spotlight && script.promotion?.pendingSpotlightActivation) ||
                spotlightChargedAtUpload > 0
            )
        );

        script.status = "published";
        script.adminApproved = true;
        script.rejectionReason = undefined;

        if (shouldAutoActivateSpotlight) {
            const now = new Date();
            script.premium = true;
            script.isFeatured = true;
            script.verifiedBadge = true;
            script.services = {
                hosting: true,
                evaluation: true,
                aiTrailer: true,
                spotlight: true,
            };
            script.evaluationStatus = script.scriptScore?.overall ? "completed" : "requested";
            if (!script.trailerUrl && !script.uploadedTrailerUrl && !["generating", "ready"].includes(script.trailerStatus)) {
                script.trailerStatus = "requested";
            }
            const previousSpent = Number(script.promotion?.totalSpotlightCreditsSpent || 0);
            const spentAtUpload = spotlightChargedAtUpload;
            script.promotion = {
                spotlightActive: true,
                pendingSpotlightActivation: false,
                spotlightStartAt: now,
                spotlightEndAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                lastSpotlightPurchaseAt: now,
                totalSpotlightCreditsSpent: previousSpent || spentAtUpload,
            };
            script.billing = {
                ...(script.billing || {}),
                spotlightCreditsSpent: Math.max(Number(script.billing?.spotlightCreditsSpent || 0), spentAtUpload || 310),
                lastSpotlightActivatedAt: now,
            };
            script.markModified("services");
            script.markModified("promotion");
            script.markModified("billing");
        }

        await script.save();

        // Notify the writer
        await Notification.create({
            user: script.creator,
            type: "script_approved",
            script: script._id,
            message: shouldAutoActivateSpotlight
                ? `Your project "${script.title}" has been approved and is now live. Spotlight purchased at upload is now active for 1 month.`
                : `Your project "${script.title}" has been approved and is now live on the platform.`,
        });

        res.json({ message: "Script approved and published", script });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectScript = async (req, res) => {
    try {
        const { reason } = req.body;
        const script = await Script.findById(req.params.id);
        if (!script) return res.status(404).json({ message: "Script not found" });
        script.status = "rejected";
        script.adminApproved = false;
        if (reason) script.rejectionReason = reason;
        await script.save();

        // Notify the writer
        await Notification.create({
            user: script.creator,
            type: "script_rejected",
            script: script._id,
            message: `Your project "${script.title}" was not approved.${ reason ? ` Reason: ${reason}` : " Please review and resubmit." }`,
        });

        res.json({ message: "Script rejected", script, reason });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Platform Scoring ───
export const scoreScript = async (req, res) => {
    try {
        const { content, trailer, title, synopsis, tags, feedback, strengths, weaknesses, prospects } = req.body;
        const script = await Script.findById(req.params.id);
        if (!script) return res.status(404).json({ message: "Script not found" });

        const scores = [content, trailer, title, synopsis, tags].filter((s) => s != null);
        const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        script.platformScore = {
            overall,
            content: content || 0,
            trailer: trailer || 0,
            title: title || 0,
            synopsis: synopsis || 0,
            tags: tags || 0,
            feedback: feedback || "",
            strengths: strengths || "",
            weaknesses: weaknesses || "",
            prospects: prospects || "",
            scoredBy: req.user._id,
            scoredAt: new Date(),
        };
        await script.save();
        res.json({ message: "Platform score saved", script });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── AI Trailer Requests ───
export const getTrailerRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = {
            "services.aiTrailer": true,
            trailerStatus: { $in: ["requested", "generating"] },
        };
        const total = await Script.countDocuments(filter);
        const scripts = await Script.find(filter)
            .populate("creator", "name email role profileImage")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ scripts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveTrailer = async (req, res) => {
    try {
        const { trailerUrl, trailerThumbnail, caption } = req.body || {};

        if (!trailerUrl) {
            return res.status(400).json({ message: "trailerUrl is required" });
        }

        const script = await Script.findById(req.params.id).populate("creator", "_id");
        if (!script) return res.status(404).json({ message: "Script not found" });

        script.trailerUrl = trailerUrl;
        if (trailerThumbnail) script.trailerThumbnail = trailerThumbnail;
        script.trailerSource = "ai";
        script.trailerStatus = "ready";
        script.trailerWriterFeedback = {
            status: "pending",
            note: "",
            updatedAt: new Date(),
        };
        await script.save();

        const writerId = script.creator?._id || script.creator;

        await Notification.create({
            user: writerId,
            type: "trailer_ready",
            from: req.user._id,
            script: script._id,
            message: `Your AI trailer for "${script.title}" is ready. Check messages to view it.`,
        });

        await Message.create({
            chatId: buildChatId(req.user._id, writerId),
            sender: req.user._id,
            receiver: writerId,
            script: script._id,
            text: caption?.trim() || `Your AI trailer for "${script.title}" is ready.`,
            fileUrl: trailerUrl,
            fileType: "video",
            fileName: `${script.title} - AI Trailer`,
        });

        res.json({ message: "Trailer approved and sent to writer via message", script });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Login As User (Impersonation) ───
export const loginAsUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const expiresIn = "2h";
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });
        const decoded = jwt.decode(token);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
            expiresAt: decoded.exp * 1000,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get Single Script Detail (for admin review) ───
export const getScriptDetail = async (req, res) => {
    try {
        const script = await Script.findById(req.params.id)
            .populate("creator", "name email role profileImage bio")
            .populate("unlockedBy", "name email role")
            .populate("platformScore.scoredBy", "name");
        if (!script) return res.status(404).json({ message: "Script not found" });
        res.json(script);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Investor Approval ───
export const getPendingInvestors = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const filter = { role: "investor", approvalStatus: "pending" };
        const total = await User.countDocuments(filter);
        const investors = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ investors, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveInvestor = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: "investor" });
        if (!user) return res.status(404).json({ message: "Investor not found" });
        user.approvalStatus = "approved";
        user.approvalNote = undefined;
        await user.save();

        // Send approval email
        sendInvestorApprovalEmail(user.email, user.name).catch((err) =>
            console.error("Failed to send investor approval email:", err.message)
        );

        // Create in-app notification
        await Notification.create({
            user: user._id,
            type: "investor_approved",
            message: "Your investor account has been approved! You can now log in and start exploring investment opportunities.",
        });

        res.json({ message: "Investor approved successfully", user: { _id: user._id, name: user.name, email: user.email, approvalStatus: user.approvalStatus } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectInvestor = async (req, res) => {
    try {
        const { note } = req.body;
        const user = await User.findOne({ _id: req.params.id, role: "investor" });
        if (!user) return res.status(404).json({ message: "Investor not found" });
        user.approvalStatus = "rejected";
        if (note) user.approvalNote = note;
        await user.save();

        sendInvestorRejectionEmail(user.email, user.name, note || user.approvalNote || "").catch((err) =>
            console.error("Failed to send investor rejection email:", err.message)
        );

        res.json({ message: "Investor rejected", user: { _id: user._id, name: user.name, email: user.email, approvalStatus: user.approvalStatus } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Bank Details Review ───
export const getBankDetailReviews = async (req, res) => {
    try {
        const { status = "pending", page = 1, limit = 20, search = "" } = req.query;
        const filter = {
            role: { $in: ["writer", "creator"] },
        };

        if (status && status !== "all") {
            filter.$or = [
                {
                    "bankDetailsReview.status": status,
                    "bankDetailsReview.requestedDetails.accountNumber": { $exists: true, $ne: "" },
                },
                { "bankDetailsSecurity.isLocked": true },
            ];
        } else {
            filter.$or = [
                { "bankDetailsReview.requestedDetails.accountNumber": { $exists: true, $ne: "" } },
                { "bankDetailsSecurity.invalidAttempts": { $gt: 0 } },
                { "bankDetailsSecurity.isLocked": true },
            ];
        }

        if (search) {
            const searchFilter = [
                { sid: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { "bankDetailsReview.requestedDetails.bankName": { $regex: search, $options: "i" } },
            ];
            filter.$and = [{ $or: searchFilter }];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("sid name email role bankDetails bankDetailsReview bankDetailsSecurity")
            .sort({ "bankDetailsReview.submittedAt": 1, createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const reviews = users.map((user) => {
            const requested = user?.bankDetailsReview?.requestedDetails || {};
            const active = user?.bankDetails || {};
            return {
                _id: user._id,
                sid: user.sid,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user?.bankDetailsReview?.status || "not_submitted",
                submittedAt: user?.bankDetailsReview?.submittedAt,
                dueAt: user?.bankDetailsReview?.dueAt,
                reviewedAt: user?.bankDetailsReview?.reviewedAt,
                adminNote: user?.bankDetailsReview?.adminNote || "",
                bankSecurity: {
                    invalidAttempts: Number(user?.bankDetailsSecurity?.invalidAttempts || 0),
                    isLocked: Boolean(user?.bankDetailsSecurity?.isLocked),
                    lockedAt: user?.bankDetailsSecurity?.lockedAt,
                    lastInvalidAttemptAt: user?.bankDetailsSecurity?.lastInvalidAttemptAt,
                    lastInvalidReason: user?.bankDetailsSecurity?.lastInvalidReason || "",
                },
                requestedDetails: {
                    ...requested,
                    accountNumber: requested.accountNumber || "",
                    maskedAccountNumber: maskAccountNumber(requested.accountNumber),
                },
                activeDetails: active?.accountNumber
                    ? {
                        ...active,
                        accountNumber: active.accountNumber,
                        maskedAccountNumber: maskAccountNumber(active.accountNumber),
                    }
                    : null,
            };
        });

        res.json({ reviews, total, page: Number(page), totalPages: Math.max(1, Math.ceil(total / Number(limit))) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveBankDetailReview = async (req, res) => {
    try {
        const { note } = req.body || {};
        const user = await User.findOne({ _id: req.params.id, role: { $in: ["writer", "creator"] } });
        if (!user) return res.status(404).json({ message: "Writer not found" });

        const requested = user?.bankDetailsReview?.requestedDetails;
        if (!requested?.accountNumber || user?.bankDetailsReview?.status !== "pending") {
            return res.status(400).json({ message: "No pending bank details review found" });
        }

        user.bankDetails = {
            accountHolderName: requested.accountHolderName,
            bankName: requested.bankName,
            accountNumber: requested.accountNumber,
            routingNumber: requested.routingNumber,
            accountType: requested.accountType || "checking",
            swiftCode: requested.swiftCode,
            iban: requested.iban,
            country: requested.country || "IN",
            currency: requested.country === "IN" ? "INR" : (requested.currency || "INR"),
            isVerified: true,
            verifiedAt: new Date(),
            addedAt: user.bankDetails?.addedAt || user?.bankDetailsReview?.submittedAt || new Date(),
        };

        user.bankDetailsReview.status = "approved";
        user.bankDetailsReview.reviewedAt = new Date();
        user.bankDetailsReview.reviewedBy = req.user._id;
        user.bankDetailsReview.adminNote = note ? String(note).trim() : "Approved";

        await user.save();
        res.json({ message: "Bank details approved and activated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectBankDetailReview = async (req, res) => {
    try {
        const { note } = req.body || {};
        const user = await User.findOne({ _id: req.params.id, role: { $in: ["writer", "creator"] } });
        if (!user) return res.status(404).json({ message: "Writer not found" });

        if (user?.bankDetailsReview?.status !== "pending") {
            return res.status(400).json({ message: "No pending bank details review found" });
        }

        user.bankDetailsReview.status = "rejected";
        user.bankDetailsReview.reviewedAt = new Date();
        user.bankDetailsReview.reviewedBy = req.user._id;
        user.bankDetailsReview.adminNote = note ? String(note).trim() : "Rejected by admin";

        await user.save();
        res.json({ message: "Bank details request rejected" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const unblockBankDetailUpdates = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: { $in: ["writer", "creator"] } });
        if (!user) return res.status(404).json({ message: "Writer not found" });

        if (!user.bankDetailsSecurity) {
            user.bankDetailsSecurity = {};
        }

        user.bankDetailsSecurity.invalidAttempts = 0;
        user.bankDetailsSecurity.isLocked = false;
        user.bankDetailsSecurity.lockedAt = undefined;
        user.bankDetailsSecurity.lastInvalidAttemptAt = undefined;
        user.bankDetailsSecurity.lastInvalidReason = "";
        user.bankDetailsSecurity.unlockedAt = new Date();
        user.bankDetailsSecurity.unlockedBy = req.user._id;

        await user.save();
        res.json({ message: "Bank detail update lock removed. User can submit details again." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin Alerts Summary (for sidebar badges + popup polling) ───
export const getAdminAlertSummary = async (req, res) => {
    try {
        const [
            totalInvestors,
            totalWriters,
            totalReaders,
            totalScripts,
            aiUsage,
            evaluations,
            investorPurchases,
            invoices,
            payments,
            aiScores,
            platformScores,
            readerScores,
            approvals,
            trailers,
            pendingInvestors,
            pendingBankReviews,
            lockedBankUsers,
            queries,
        ] = await Promise.all([
            User.countDocuments({ role: "investor" }),
            User.countDocuments({ role: { $in: ["writer", "creator"] } }),
            User.countDocuments({ role: "reader" }),
            Script.countDocuments(),
            Script.countDocuments({
                $or: [
                    { "services.evaluation": true },
                    { "services.aiTrailer": true },
                    { "scriptScore.overall": { $exists: true, $ne: null } },
                ],
            }),
            Script.countDocuments({ "services.evaluation": true }),
            Script.countDocuments({ unlockedBy: { $exists: true, $not: { $size: 0 } } }),
            Invoice.countDocuments(),
            Transaction.countDocuments(),
            Script.countDocuments({ "scriptScore.overall": { $exists: true, $ne: null } }),
            Script.countDocuments({ "platformScore.overall": { $exists: true, $ne: null } }),
            Script.countDocuments({ rating: { $gt: 0 }, reviewCount: { $gt: 0 } }),
            Script.countDocuments({ status: "pending_approval" }),
            Script.countDocuments({
                "services.aiTrailer": true,
                trailerStatus: { $in: ["requested", "generating"] },
            }),
            User.countDocuments({ role: "investor", approvalStatus: "pending" }),
            User.countDocuments({ role: { $in: ["writer", "creator"] }, "bankDetailsReview.status": "pending" }),
            User.countDocuments({ role: { $in: ["writer", "creator"] }, "bankDetailsSecurity.isLocked": true }),
            ContactSubmission.countDocuments(),
        ]);

        const bankReviewAlerts = pendingBankReviews + lockedBankUsers;

        res.json({
            overview: approvals + trailers + pendingInvestors + bankReviewAlerts + queries,
            investors: totalInvestors,
            writers: totalWriters,
            readers: totalReaders,
            projects: totalScripts,
            "ai-usage": aiUsage,
            evaluations,
            "investor-purchases": investorPurchases,
            invoices,
            payments,
            scores: aiScores + platformScores + readerScores,
            approvals,
            trailers,
            "pending-investors": pendingInvestors,
            "bank-reviews": bankReviewAlerts,
            queries,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
