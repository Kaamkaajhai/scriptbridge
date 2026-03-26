import User from "../models/User.js";
import CreditPackage from "../models/CreditPackage.js";
import Transaction from "../models/Transaction.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Lazy initialization of Razorpay
let razorpayInstance = null;

const CUSTOM_CREDIT_PRICE = 9;

const STANDARD_CREDIT_PLANS = [
  {
    code: "plan_50",
    name: "50 Credits",
    credits: 50,
    price: 400,
    currency: "INR",
    popular: false,
    description: "Starter pack for quick usage",
    features: ["50 credits", "Instant top-up"],
    bonusCredits: 0,
  },
  {
    code: "plan_100",
    name: "100 Credits",
    credits: 100,
    price: 749,
    currency: "INR",
    popular: true,
    description: "Best value for regular creators",
    features: ["100 credits", "Instant top-up"],
    bonusCredits: 0,
  },
  {
    code: "plan_400",
    name: "400 Credits",
    credits: 400,
    price: 2999,
    currency: "INR",
    popular: false,
    description: "Maximum savings for power users",
    features: ["400 credits", "Instant top-up"],
    bonusCredits: 0,
  },
];

const getStandardPlanByCode = (planCode) =>
  STANDARD_CREDIT_PLANS.find((plan) => plan.code === planCode);

const isValidCustomCredits = (value) =>
  Number.isInteger(value) && value >= 1 && value <= 10000;

const getBankPurchaseEligibility = (user) => {
  const reviewStatus = user?.bankDetailsReview?.status || "not_submitted";
  const hasActiveBankDetails = Boolean(user?.bankDetails?.accountNumber);
  const requiresReview = ["writer", "creator"].includes(user?.role);

  if (!requiresReview) {
    return { allowed: true, reviewStatus, message: "" };
  }

  if (reviewStatus !== "approved" || !hasActiveBankDetails) {
    if (reviewStatus === "pending") {
      return {
        allowed: false,
        reviewStatus,
        message: "Your bank details are under admin review. Credit purchase is enabled after approval.",
      };
    }
    if (reviewStatus === "rejected") {
      return {
        allowed: false,
        reviewStatus,
        message: "Your bank details review was rejected. Please update and resubmit bank details.",
      };
    }
    return {
      allowed: false,
      reviewStatus,
      message: "Please submit bank details for admin approval before buying credits.",
    };
  }

  return { allowed: true, reviewStatus, message: "" };
};

const buildPurchaseDetails = async ({ packageId, customCredits }) => {
  const parsedCustomCredits =
    customCredits === undefined ? undefined : Number(customCredits);

  if (parsedCustomCredits !== undefined) {
    if (!isValidCustomCredits(parsedCustomCredits)) {
      return { error: "Custom credits must be an integer between 1 and 10000" };
    }

    return {
      planCode: "custom",
      name: `Custom ${parsedCustomCredits} Credits`,
      credits: parsedCustomCredits,
      bonusCredits: 0,
      totalCredits: parsedCustomCredits,
      price: parsedCustomCredits * CUSTOM_CREDIT_PRICE,
      currency: "INR",
      isCustom: true,
      packageRef: null,
    };
  }

  const standardPlan = getStandardPlanByCode(packageId);
  if (standardPlan) {
    return {
      planCode: standardPlan.code,
      name: standardPlan.name,
      credits: standardPlan.credits,
      bonusCredits: standardPlan.bonusCredits || 0,
      totalCredits: standardPlan.credits + (standardPlan.bonusCredits || 0),
      price: standardPlan.price,
      currency: standardPlan.currency || "INR",
      isCustom: false,
      packageRef: null,
    };
  }

  const creditPackage = await CreditPackage.findById(packageId);
  if (!creditPackage) {
    return { error: "Credit package not found" };
  }

  return {
    planCode: creditPackage._id.toString(),
    name: creditPackage.name,
    credits: creditPackage.credits,
    bonusCredits: creditPackage.bonusCredits || 0,
    totalCredits: creditPackage.credits + (creditPackage.bonusCredits || 0),
    price: creditPackage.price,
    currency: creditPackage.currency || "INR",
    isCustom: false,
    packageRef: creditPackage._id,
  };
};

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

// Credit pricing for different services
export const CREDIT_PRICES = {
  AI_EVALUATION: 50,        // 50 credits for AI script evaluation
  AI_TRAILER: 120,          // 120 credits for AI trailer generation
  SCRIPT_ANALYSIS: 5,       // 5 credits for basic analysis
  PREMIUM_REPORT: 20,       // 20 credits for premium report
  CONSULTATION: 50,         // 50 credits for consultation booking
  AI_GRAMMAR: 5,            // 5 credits for AI grammar fix
};

// @desc    Get all credit packages
// @route   GET /api/credits/packages
// @access  Public
export const getCreditPackages = async (req, res) => {
  try {
    const packages = STANDARD_CREDIT_PLANS.map((plan) => ({
      _id: plan.code,
      name: plan.name,
      credits: plan.credits,
      price: plan.price,
      currency: plan.currency,
      discount: 0,
      popular: plan.popular,
      active: true,
      description: plan.description,
      features: plan.features,
      bonusCredits: plan.bonusCredits || 0,
    }));

    res.json({
      packages,
      customPricing: {
        pricePerCredit: CUSTOM_CREDIT_PRICE,
        minCredits: 1,
        maxCredits: 10000,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user credit balance
// @route   GET /api/credits/balance
// @access  Private
export const getCreditBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("credits role bankDetails bankDetailsReview");
    const bankEligibility = getBankPurchaseEligibility(user);
    res.json({
      balance: user.credits?.balance || 0,
      totalPurchased: user.credits?.totalPurchased || 0,
      totalSpent: user.credits?.totalSpent || 0,
      lastPurchase: user.credits?.lastPurchase,
      canPurchaseCredits: bankEligibility.allowed,
      bankReviewStatus: bankEligibility.reviewStatus,
      bankPurchaseMessage: bankEligibility.message,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get credit transaction history
// @route   GET /api/credits/history
// @access  Private
export const getCreditHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id).select("credits");
    
    const transactions = user.credits?.transactions || [];
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);
    
    res.json({
      transactions: paginatedTransactions,
      total: transactions.length,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.length / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Purchase credits
// @route   POST /api/credits/purchase
// @access  Private
export const purchaseCredits = async (req, res) => {
  try {
    const { packageId, customCredits, paymentMethod = "stripe" } = req.body;

    const purchase = await buildPurchaseDetails({ packageId, customCredits });
    if (purchase.error) {
      return res.status(400).json({ message: purchase.error });
    }
    
    const user = await User.findById(req.user._id);
    const bankEligibility = getBankPurchaseEligibility(user);
    if (!bankEligibility.allowed) {
      return res.status(403).json({ message: bankEligibility.message, bankReviewStatus: bankEligibility.reviewStatus });
    }
    
    // In a real app, this is where you'd process Stripe payment
    // For now, we'll simulate successful payment
    
    const totalCredits = purchase.totalCredits;
    const reference = `CREDIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Update user credits
    if (!user.credits) {
      user.credits = {
        balance: 0,
        totalPurchased: 0,
        totalSpent: 0,
        transactions: []
      };
    }
    
    user.credits.balance += totalCredits;
    user.credits.totalPurchased += totalCredits;
    user.credits.lastPurchase = new Date();
    user.credits.transactions.push({
      type: "purchase",
      amount: totalCredits,
      description: `Purchased ${purchase.name}`,
      reference,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: "payment",
      amount: -purchase.price,
      currency: purchase.currency,
      status: "completed",
      description: `Credit purchase: ${purchase.name} (${totalCredits} credits)`,
      reference,
      paymentMethod,
      metadata: {
        packageId: purchase.packageRef,
        planCode: purchase.planCode,
        isCustom: purchase.isCustom,
        credits: totalCredits,
        customCredits: purchase.isCustom ? purchase.credits : undefined,
      }
    });
    
    res.json({
      message: "Credits purchased successfully",
      credits: {
        balance: user.credits.balance,
        purchased: totalCredits,
        package: purchase.name
      },
      reference
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Use credits for a service
// @route   POST /api/credits/use
// @access  Private
export const useCredits = async (req, res) => {
  try {
    const { service, amount, description } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user.credits || user.credits.balance < amount) {
      return res.status(400).json({ 
        message: "Insufficient credits",
        balance: user.credits?.balance || 0,
        required: amount
      });
    }
    
    // Deduct credits
    user.credits.balance -= amount;
    user.credits.totalSpent += amount;
    user.credits.transactions.push({
      type: "spent",
      amount: -amount,
      description: description || `Used credits for ${service}`,
      reference: `USE-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date()
    });
    
    await user.save();
    
    res.json({
      message: "Credits used successfully",
      credits: {
        balance: user.credits.balance,
        spent: amount,
        service
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Check if user has enough credits
// @route   GET /api/credits/check/:amount
// @access  Private
export const checkCredits = async (req, res) => {
  try {
    const amount = parseInt(req.params.amount);
    const user = await User.findById(req.user._id).select("credits");
    
    const balance = user.credits?.balance || 0;
    const hasEnough = balance >= amount;
    
    res.json({
      hasEnough,
      balance,
      required: amount,
      shortfall: hasEnough ? 0 : amount - balance
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get service pricing
// @route   GET /api/credits/pricing
// @access  Public
export const getServicePricing = async (req, res) => {
  try {
    res.json({
      services: {
        aiEvaluation: {
          name: "AI Script Evaluation",
          credits: CREDIT_PRICES.AI_EVALUATION,
          description: "Comprehensive AI-powered script analysis with detailed feedback"
        },
        aiTrailer: {
          name: "AI Trailer Generation",
          credits: CREDIT_PRICES.AI_TRAILER,
          description: "Generate professional trailer script using AI"
        },
        scriptAnalysis: {
          name: "Basic Script Analysis",
          credits: CREDIT_PRICES.SCRIPT_ANALYSIS,
          description: "Quick script overview and genre classification"
        },
        premiumReport: {
          name: "Premium Report",
          credits: CREDIT_PRICES.PREMIUM_REPORT,
          description: "In-depth analysis with market insights and recommendations"
        },
        consultation: {
          name: "Expert Consultation",
          credits: CREDIT_PRICES.CONSULTATION,
          description: "One-on-one consultation with industry professional"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Grant bonus credits (admin only)
// @route   POST /api/credits/bonus
// @access  Private/Admin
export const grantBonusCredits = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    
    // TODO: Add admin check here
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.credits) {
      user.credits = {
        balance: 0,
        totalPurchased: 0,
        totalSpent: 0,
        transactions: []
      };
    }
    
    user.credits.balance += amount;
    user.credits.transactions.push({
      type: "bonus",
      amount,
      description: reason || "Bonus credits",
      reference: `BONUS-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date()
    });
    
    await user.save();
    
    res.json({
      message: "Bonus credits granted successfully",
      balance: user.credits.balance,
      granted: amount
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create Razorpay order for credit purchase
// @route   POST /api/credits/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        message: "Payment service is not configured on server",
        error: "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server environment"
      });
    }
    
    const { packageId, customCredits } = req.body;
    const user = await User.findById(req.user._id).select("role bankDetails bankDetailsReview");
    const bankEligibility = getBankPurchaseEligibility(user);
    if (!bankEligibility.allowed) {
      return res.status(403).json({ message: bankEligibility.message, bankReviewStatus: bankEligibility.reviewStatus });
    }

    const purchase = await buildPurchaseDetails({ packageId, customCredits });
    if (purchase.error) {
      return res.status(400).json({ message: purchase.error });
    }
    
    // Create Razorpay order
    const options = {
      amount: Math.round(purchase.price * 100), // Amount in paise (INR)
      currency: purchase.currency || "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        packageId: packageId || "custom",
        planCode: purchase.planCode,
        packageName: purchase.name,
        credits: purchase.totalCredits,
        customCredits: purchase.isCustom ? purchase.credits : undefined,
      }
    };
    
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      packageDetails: {
        name: purchase.name,
        credits: purchase.credits,
        bonusCredits: purchase.bonusCredits,
        totalCredits: purchase.totalCredits,
        price: purchase.price,
        isCustom: purchase.isCustom,
        pricePerCredit: purchase.isCustom ? CUSTOM_CREDIT_PRICE : Number((purchase.price / purchase.totalCredits).toFixed(2)),
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create payment order", error: error.message });
  }
};

// @desc    Verify Razorpay payment and credit user account
// @route   POST /api/credits/verify-payment
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      packageId,
      customCredits
    } = req.body;
    
    // Check if Razorpay key secret is available
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        message: "Payment service is not configured on server",
        error: "Missing RAZORPAY_KEY_SECRET in server environment",
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
      return res.status(400).json({ 
        message: "Payment verification failed - Invalid signature",
        success: false 
      });
    }
    
    // Payment verified successfully, credit the user
    const purchase = await buildPurchaseDetails({ packageId, customCredits });
    if (purchase.error) {
      return res.status(400).json({
        message: purchase.error,
        success: false,
      });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        success: false 
      });
    }
    const bankEligibility = getBankPurchaseEligibility(user);
    if (!bankEligibility.allowed) {
      return res.status(403).json({
        message: bankEligibility.message,
        bankReviewStatus: bankEligibility.reviewStatus,
        success: false,
      });
    }
    
    const totalCredits = purchase.totalCredits;
    const reference = `RAZORPAY-${razorpay_payment_id}`;
    
    // Initialize credits if not exists
    if (!user.credits) {
      user.credits = {
        balance: 0,
        totalPurchased: 0,
        totalSpent: 0,
        transactions: []
      };
    }
    
    // Update user credits
    user.credits.balance += totalCredits;
    user.credits.totalPurchased += totalCredits;
    user.credits.lastPurchase = new Date();
    user.credits.transactions.push({
      type: "purchase",
      amount: totalCredits,
      description: `Purchased ${purchase.name} via Razorpay`,
      reference,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: "payment",
      amount: -purchase.price,
      currency: purchase.currency || "INR",
      status: "completed",
      description: `Credit purchase: ${purchase.name} (${totalCredits} credits)`,
      reference,
      paymentMethod: "razorpay",
      metadata: {
        packageId: purchase.packageRef,
        planCode: purchase.planCode,
        isCustom: purchase.isCustom,
        credits: totalCredits,
        customCredits: purchase.isCustom ? purchase.credits : undefined,
        razorpay_order_id,
        razorpay_payment_id
      }
    });
    
    res.json({
      success: true,
      message: "Payment verified and credits added successfully",
      credits: {
        balance: user.credits.balance,
        purchased: totalCredits,
        package: purchase.name
      },
      reference
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Payment verification failed", 
      error: error.message,
      success: false 
    });
  }
};
