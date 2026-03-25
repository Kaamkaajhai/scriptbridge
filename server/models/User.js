import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const createSid = (prefix) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${token}`;
};

const userSchema = new mongoose.Schema({
  sid: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  pendingEmail: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["creator", "investor", "producer", "director", "actor", "reader", "writer", "industry", "professional", "admin"], required: true },
  bio: { type: String },
  skills: [String],
  profileImage: { type: String },

  // Account settings
  isPrivate: { type: Boolean, default: false },
  language: { type: String, default: "en" },
  timezone: { type: String, default: "Asia/Kolkata" },

  // Email verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },

  // Legal acceptance tracking
  privacyPolicyAccepted: { type: Boolean, default: false },
  privacyPolicyAcceptedAt: { type: Date },
  privacyPolicyVersion: { type: String },

  // Writer-specific profile fields
  writerProfile: {
    legalName: { type: String },
    representationStatus: {
      type: String,
      enum: ["unrepresented", "manager", "agent", "manager_and_agent"],
      default: "unrepresented"
    },
    agencyName: { type: String },
    wgaMember: { type: Boolean, default: false },
    // Writer's primary genres
    genres: [String],
    // Specialized tags (themes, tones, settings)
    specializedTags: [String],
    // Plan selection
    plan: { type: String, enum: ["free", "paid"], default: "free" },
    // Diversity data (optional)
    diversity: {
      gender: { type: String },
      ethnicity: { type: String },
      lgbtqStatus: { type: String },
      disabilityStatus: { type: String },
    },
    // Onboarding completion tracking
    onboardingComplete: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 }, // Track which step they're on
    writerOnboardingTermsAccepted: { type: Boolean, default: false },
    writerOnboardingTermsAcceptedAt: { type: Date },
    writerOnboardingTermsVersion: { type: String },
  },

  // Industry Professional Profile
  industryProfile: {
    subRole: {
      type: String,
      enum: ["producer", "agent", "director", "actor"],
    },
    company: { type: String },
    jobTitle: { type: String },
    imdbUrl: { type: String },
    linkedInUrl: { type: String },
    socialLinks: {
      instagram: { type: String },
      twitter: { type: String },
      website: { type: String },
      youtube: { type: String },
      facebook: { type: String },
    },
    otherUrl: { type: String },
    previousCredits: { type: String },
    investmentRange: { type: String },
    isVerified: { type: Boolean, default: false },
    // Mandates (what they're looking for)
    mandates: {
      formats: [String], // Feature Film, TV Pilot, etc.
      budgetTiers: [String], // micro, low, medium, high, blockbuster
      genres: [String], // Genres they want
      excludeGenres: [String], // Genres they don't want
      specificHooks: [String] // Diverse Voices, Female-Led, etc.
    },
    savedScripts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Script' }],
    onboardingComplete: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
  },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Smart Match preferences
  preferences: {
    genres: [String],
    budgetRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 1000000 } },
    contentTypes: [{ type: String, enum: ["movie", "tv_series", "anime", "documentary", "short_film", "web_series", "book", "startup"] }],
  },
  viewHistory: [{
    script: { type: mongoose.Schema.Types.ObjectId, ref: "Script" },
    viewedAt: { type: Date, default: Date.now },
  }],
  // Subscription & credits
  subscription: {
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    expiresAt: { type: Date },
    scriptScoreCredits: { type: Number, default: 0 },
  },
  // Actor-specific fields for Talent Attachment
  actorProfile: {
    headshot: { type: String },
    reelUrl: { type: String },
    age: { type: Number },
    gender: { type: String },
    ethnicity: { type: String },
    actingStyles: [String],
    typeCast: { type: String }, // e.g. "Rough, older, like Liam Neeson"
    availableForAuditions: { type: Boolean, default: true },
  },
  // Reader system
  scriptsRead: [{ type: mongoose.Schema.Types.ObjectId, ref: "Script" }],
  favoriteScripts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Script" }],
  // Domain Packages purchased
  domainPackages: [{
    category: { type: String },
    purchasedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  }],
  // Notifications preferences
  notificationPrefs: {
    smartMatchAlerts: { type: Boolean, default: true },
    auditionAlerts: { type: Boolean, default: true },
    holdAlerts: { type: Boolean, default: true },
    viewAlerts: { type: Boolean, default: true },
  },
  recommendationProfile: {
    detectedGenres: [String],
    preferredFormats: [String],
    preferredBudgets: [String],
    behavior: {
      genreWeights: { type: Map, of: Number, default: {} },
      tagWeights: { type: Map, of: Number, default: {} },
      formatWeights: { type: Map, of: Number, default: {} },
      budgetWeights: { type: Map, of: Number, default: {} },
      avgTimeSpentMs: { type: Number, default: 0 },
    },
    updatedAt: { type: Date },
  },
  // Financial information
  bankDetails: {
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String },
    accountType: {
      type: String,
      enum: ["checking", "savings", "business"],
      default: "checking"
    },
    swiftCode: { type: String }, // For international transfers
    iban: { type: String }, // For international transfers
    country: { type: String, default: "IN" },
    currency: { type: String, default: "INR" },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    addedAt: { type: Date }
  },
  bankDetailsReview: {
    status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    requestedDetails: {
      accountHolderName: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      routingNumber: { type: String },
      accountType: {
        type: String,
        enum: ["checking", "savings", "business"],
        default: "checking",
      },
      swiftCode: { type: String },
      iban: { type: String },
      country: { type: String, default: "IN" },
      currency: { type: String, default: "INR" },
    },
    submittedAt: { type: Date },
    dueAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminNote: { type: String },
  },
  bankDetailsSecurity: {
    invalidAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lastInvalidAttemptAt: { type: Date },
    lastInvalidReason: { type: String },
    unlockedAt: { type: Date },
    unlockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    pendingBalance: { type: Number, default: 0 }, // Funds being processed
    totalEarnings: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 }
  },
  // Credits System
  credits: {
    balance: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastPurchase: { type: Date },
    transactions: [{
      type: { type: String, enum: ["purchase", "spent", "bonus", "refund"] },
      amount: { type: Number },
      description: { type: String },
      reference: { type: String },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  // Stripe Connected Account (for payouts)
  stripeAccountId: { type: String },
  stripeCustomerId: { type: String },
  // Admin approval for investors
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },
  approvalNote: { type: String },
}, { timestamps: true });

userSchema.pre("validate", async function () {
  if (this.sid) return;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = createSid("USR");
    const exists = await this.constructor.exists({ sid: candidate });
    if (!exists) {
      this.sid = candidate;
      return;
    }
  }

  throw new Error("Unable to generate unique user SID");
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
