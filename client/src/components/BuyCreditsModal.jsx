import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Crown,
  Rocket,
  Gift,
  Shield,
  CreditCard,
  ArrowRight,
  Loader2,
  AlertCircle,
  Star,
  Lock,
  RefreshCw,
  Copy,
} from "lucide-react";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";

const BuyCreditsModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode: dark } = useDarkMode();
  const { user } = useContext(AuthContext);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customPricing, setCustomPricing] = useState({
    pricePerCredit: 9,
    minCredits: 1,
    maxCredits: 10000,
  });
  const [customCredits, setCustomCredits] = useState("1");
  const [useCustomCredits, setUseCustomCredits] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [referralSummary, setReferralSummary] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralCopyFeedback, setReferralCopyFeedback] = useState("");
  
  const modalRef = useRef(null);
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isWriterUser = ["creator", "writer"].includes(normalizedRole) || Boolean(user?.writerProfile);

  // Load Razorpay SDK
  useEffect(() => {
    if (!isOpen) return;

    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[data-razorpay-sdk="true"]');
    if (existingScript) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.setAttribute("data-razorpay-sdk", "true");
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError("Failed to load payment gateway");
    document.body.appendChild(script);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      setError("");
      setSuccess(false);
      setSelectedPackage(null);
      setUseCustomCredits(false);
      setCustomCredits("1");
      setDiscountCode("");
      setDiscountApplied(null);
      setDiscountError("");
      setReferralCopyFeedback("");
    }
  }, [isOpen]);

  const fetchReferralSummary = useCallback(async () => {
    if (!isOpen || !isWriterUser) {
      setReferralSummary(null);
      setReferralError("");
      return;
    }

    try {
      setReferralLoading(true);
      setReferralError("");
      const { data } = await api.get("/auth/referral-summary");
      setReferralSummary(data || null);
    } catch {
      setReferralSummary(null);
      setReferralError("Unable to load referral details right now.");
    } finally {
      setReferralLoading(false);
    }
  }, [isOpen, isWriterUser]);

  useEffect(() => {
    fetchReferralSummary();
  }, [fetchReferralSummary]);

  // ESC to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && isOpen && !purchasing) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, purchasing, onClose]);

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) return;
    
    const parsedCustomCredits = Number(customCredits);
    const customSelected = useCustomCredits;

    if (!customSelected && !selectedPackage) {
      setDiscountError("Please select a plan first");
      return;
    }
    if (
      customSelected &&
      (!Number.isInteger(parsedCustomCredits) ||
        parsedCustomCredits < (customPricing.minCredits || 1) ||
        parsedCustomCredits > (customPricing.maxCredits || 10000))
    ) {
      setDiscountError("Invalid custom credits amount");
      return;
    }

    setDiscountLoading(true);
    setDiscountError("");
    setDiscountApplied(null);

    try {
      const { data } = await api.post("/credits/validate-discount", {
        code: discountCode,
        ...(customSelected
          ? { customCredits: parsedCustomCredits }
          : { packageId: selectedPackage._id }),
      });
      
      if (data.valid) {
        setDiscountApplied(data);
        // Clear main error if it was about the original price
        setError("");
      }
    } catch (err) {
      setDiscountError(err.response?.data?.message || "Invalid or expired discount code");
    } finally {
      setDiscountLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/credits/packages");
      const packageList = Array.isArray(data) ? data : data?.packages || [];
      const customConfig = data?.customPricing;

      setPackages(packageList);
      if (customConfig) {
        setCustomPricing(customConfig);
        setCustomCredits(String(customConfig.minCredits || 1));
      }

      // Auto-select popular package
      const popular = packageList.find((p) => p.popular);
      if (popular) setSelectedPackage(popular);
    } catch {
      setError("Failed to load credit packages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const parsedCustomCredits = Number(customCredits);
    const customSelected = useCustomCredits;

    if (!customSelected && !selectedPackage) {
      setError("Please select a credit package");
      return;
    }
    if (
      customSelected &&
      (!Number.isInteger(parsedCustomCredits) ||
        parsedCustomCredits < (customPricing.minCredits || 1) ||
        parsedCustomCredits > (customPricing.maxCredits || 10000))
    ) {
      setError(
        `Custom credits must be between ${customPricing.minCredits || 1} and ${customPricing.maxCredits || 10000}`
      );
      return;
    }
    if (!razorpayLoaded) {
      setError("Payment gateway is loading. Please wait and try again.");
      return;
    }

    try {
      setPurchasing(true);
      setError("");

      const { data: orderData } = await api.post("/credits/create-order", {
        ...(customSelected
          ? { customCredits: parsedCustomCredits }
          : { packageId: selectedPackage._id }),
        ...(discountApplied ? { discountCode: discountApplied.code } : {}),
      });

      if (orderData.directPurchase) {
        setPurchasing(false);
        setSuccess(true);
        if (onSuccess) onSuccess(orderData);
        setTimeout(() => onClose(), 2000);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Ckript",
        description: `${orderData.packageDetails.name} — ${orderData.packageDetails.totalCredits} Credits`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const { data: verifyData } = await api.post(
              "/credits/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ...(customSelected
                  ? { customCredits: parsedCustomCredits }
                  : { packageId: selectedPackage._id }),
                ...(discountApplied ? { discountCode: discountApplied.code } : {}),
              }
            );

            if (verifyData.success) {
              setSuccess(true);
              if (onSuccess) onSuccess(verifyData);
              setTimeout(() => onClose(), 2000);
            } else {
              setError("Payment verification failed. Contact support if charged.");
            }
          } catch (err) {
            setError(
              err.response?.data?.message ||
                "Payment verification failed. Contact support if charged."
            );
          } finally {
            setPurchasing(false);
          }
        },
        prefill: {},
        notes: {
          package: customSelected
            ? `Custom ${parsedCustomCredits} Credits`
            : selectedPackage.name,
          credits: orderData.packageDetails.totalCredits,
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: function () {
            setPurchasing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        setPurchasing(false);
        setError(
          response.error?.description || "Payment failed. Please try again."
        );
      });
      razorpay.open();
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const serverError = err.response?.data?.error;
      setError(serverError ? `${serverMessage || "Failed to initiate payment"}: ${serverError}` : (serverMessage || "Failed to initiate payment. Please try again."));
      setPurchasing(false);
    }
  };

  const getIcon = (name) => {
    if (name?.includes("Starter")) return Zap;
    if (name?.includes("Professional")) return TrendingUp;
    if (name?.includes("Premium")) return Crown;
    if (name?.includes("Enterprise")) return Rocket;
    return Sparkles;
  };

  const getCurrency = (c) => {
    return "₹";
  };

  const getGradient = (name) => {
    if (name?.includes("Starter"))
      return dark
        ? "from-blue-500/20 to-cyan-500/10"
        : "from-blue-50 to-cyan-50";
    if (name?.includes("Professional"))
      return dark
        ? "from-violet-500/20 to-purple-500/10"
        : "from-violet-50 to-purple-50";
    if (name?.includes("Premium"))
      return dark
        ? "from-amber-500/20 to-yellow-500/10"
        : "from-amber-50 to-yellow-50";
    if (name?.includes("Enterprise"))
      return dark
        ? "from-rose-500/20 to-pink-500/10"
        : "from-rose-50 to-pink-50";
    return dark ? "from-gray-500/20 to-gray-500/10" : "from-gray-50 to-gray-50";
  };

  const getAccent = (name) => {
    if (name?.includes("Starter"))
      return dark ? "text-cyan-400" : "text-blue-600";
    if (name?.includes("Professional"))
      return dark ? "text-violet-400" : "text-violet-600";
    if (name?.includes("Premium"))
      return dark ? "text-amber-400" : "text-amber-600";
    if (name?.includes("Enterprise"))
      return dark ? "text-rose-400" : "text-rose-600";
    return dark ? "text-blue-400" : "text-blue-600";
  };

  const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(n || 0);

  const referralCode = String(referralSummary?.referralCode || user?.referralCode || "").trim();
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fallbackReferralLink = referralCode
    ? `${fallbackOrigin}/${encodeURIComponent(referralCode)}`
    : "";
  const referralShareLink = String(referralSummary?.referralLink || "").trim() || fallbackReferralLink;

  const copyToClipboard = async (value) => {
    if (!value) return false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // Fallback below.
    }

    try {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "true");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(temp);
      return copied;
    } catch {
      return false;
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralShareLink) return;
    const copied = await copyToClipboard(referralShareLink);
    setReferralCopyFeedback(copied ? "Referral link copied" : "Copy failed. Please copy manually.");
    setTimeout(() => setReferralCopyFeedback(""), 2200);
  };

  if (!isOpen) return null;

  const parsedCustomCredits = Number(customCredits);
  const customMin = customPricing.minCredits || 1;
  const customMax = customPricing.maxCredits || 10000;
  const customUnitPrice = customPricing.pricePerCredit || 9;
  const customTotal =
    Number.isFinite(parsedCustomCredits) && parsedCustomCredits > 0
      ? parsedCustomCredits * customUnitPrice
      : 0;
  const packageGridCols =
    packages.length >= 4
      ? "lg:grid-cols-4"
      : packages.length === 3
      ? "lg:grid-cols-3"
      : "lg:grid-cols-2";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !purchasing) onClose();
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] rounded-2xl border overflow-hidden flex flex-col ${
            dark
              ? "bg-[#0c1525] border-white/[0.08]"
              : "bg-white border-gray-200"
          }`}
        >
          {/* ─── Success Overlay ────────────────────── */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-lg font-black text-white">
                    Credits Added Successfully!
                  </p>
                  <p className="text-sm text-white/60">
                    Your credits are now available to use
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Header ─────────────────────────────── */}
          <div
            className={`px-4 sm:px-6 py-4 sm:py-5 border-b flex items-start sm:items-center justify-between gap-3 shrink-0 ${
              dark
                ? "border-white/[0.06] bg-gradient-to-r from-blue-600/5 to-purple-600/5"
                : "border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/30"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  dark
                    ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                    : "bg-gradient-to-br from-blue-100 to-purple-100"
                }`}
              >
                <CreditCard
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    dark ? "text-blue-400" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <h2
                  className={`text-lg sm:text-xl font-black leading-tight ${
                    dark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Buy Credits
                </h2>
                <p
                  className={`text-[11px] sm:text-xs mt-0.5 ${
                    dark ? "text-white/40" : "text-gray-500"
                  }`}
                >
                  Choose a plan that works for you
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={purchasing}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                dark
                  ? "hover:bg-white/10 text-white/40 hover:text-white/70"
                  : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              } disabled:opacity-40`}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* ─── Content ────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2
                  className={`w-8 h-8 animate-spin ${
                    dark ? "text-white/30" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    dark ? "text-white/40" : "text-gray-500"
                  }`}
                >
                  Loading packages...
                </p>
              </div>
            ) : (
              <>
                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mb-5 px-4 py-3 rounded-xl flex items-start gap-3 ${
                        dark
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <AlertCircle
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          dark ? "text-red-400" : "text-red-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            dark ? "text-red-300" : "text-red-700"
                          }`}
                        >
                          {error}
                        </p>
                      </div>
                      <button
                        onClick={() => setError("")}
                        className={`shrink-0 ${
                          dark ? "text-red-400/60" : "text-red-400"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isWriterUser && (
                  <div
                    className={`mb-4 rounded-2xl border p-4 ${
                      dark
                        ? "border-[#1a2e48] bg-[#0d1b2e]"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className={`text-xs mt-1 ${dark ? "text-white/55" : "text-gray-500"}`}>
                          Share your referral link. If a writer signs up with your link or referral and verifies their account, both writers get 15 credits.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>
                        Referral Code
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black tracking-wider ${dark ? "bg-white/[0.06] text-white" : "bg-gray-100 text-gray-900"}`}>
                          {referralCode || "--"}
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold ${dark ? "bg-emerald-500/12 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                          Bonus: {formatNumber(referralSummary?.totalBonusCredits || 0)} credits
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyReferralLink}
                          disabled={!referralShareLink}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 ${dark ? "bg-white/[0.08] text-white hover:bg-white/[0.14]" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>
                        Referral Link
                      </p>
                      <div className={`rounded-lg border px-3 py-2 text-xs break-all ${dark ? "border-[#1a2e48] bg-white/[0.02] text-gray-300" : "border-gray-100 bg-gray-50 text-gray-700"}`}>
                        {referralLoading ? "Loading referral link..." : referralShareLink || "Referral link unavailable"}
                      </div>

                      {referralError && <p className="mt-1.5 text-xs text-red-500">{referralError}</p>}
                      {referralCopyFeedback && (
                        <p className={`mt-1.5 text-xs ${dark ? "text-emerald-300" : "text-emerald-600"}`}>
                          {referralCopyFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Package Grid */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${packageGridCols} gap-3`}>
                  {packages.map((pkg, idx) => {
                    const Icon = getIcon(pkg.name);
                    const isSelected = selectedPackage?._id === pkg._id;
                    const total = pkg.credits + (pkg.bonusCredits || 0);
                    const perCredit = (pkg.price / total).toFixed(1);
                    const sym = getCurrency(pkg.currency || "INR");

                    return (
                      <motion.div
                        key={pkg._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setUseCustomCredits(false);
                          setSelectedPackage(pkg);
                          setDiscountApplied(null);
                        }}
                        className={`relative rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? dark
                              ? "border-blue-500 bg-blue-500/[0.08] ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10"
                              : "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                            : dark
                            ? "border-white/[0.06] hover:border-white/[0.15] bg-white/[0.02]"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-md"
                        }`}
                      >
                        {/* Popular ribbon */}
                        {pkg.popular && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                            <div className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                              <Star className="w-3 h-3" />
                              Best Value
                            </div>
                          </div>
                        )}

                        <div className="p-5">
                          {/* Icon + Name */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${getGradient(
                              pkg.name
                            )}`}
                          >
                            <Icon
                              className={`w-6 h-6 ${getAccent(pkg.name)}`}
                            />
                          </div>

                          <h3
                            className={`text-base font-black mb-1 ${
                              dark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {pkg.name}
                          </h3>

                          {/* Credits count */}
                          <div className="mb-3">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={`text-2xl font-black tabular-nums ${
                                  dark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {total}
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  dark ? "text-white/40" : "text-gray-500"
                                }`}
                              >
                                credits
                              </span>
                            </div>
                            {pkg.bonusCredits > 0 && (
                              <div
                                className={`flex items-center gap-1 mt-1 text-[11px] font-bold ${
                                  dark ? "text-emerald-400" : "text-emerald-600"
                                }`}
                              >
                                <Gift className="w-3 h-3" />+
                                {pkg.bonusCredits} bonus included
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="mb-3">
                            <div className="flex items-baseline gap-1">
                              <span
                                className={`text-xl font-black ${
                                  dark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {sym}
                                {pkg.price.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-medium ${
                                dark ? "text-white/30" : "text-gray-400"
                              }`}
                            >
                              {sym}
                              {perCredit}/credit
                            </span>
                          </div>

                          {/* Features */}
                          {pkg.features?.length > 0 && (
                            <ul className="space-y-1.5 mb-3">
                              {pkg.features.slice(0, 3).map((f, i) => (
                                <li
                                  key={i}
                                  className={`flex items-start gap-2 text-[11px] leading-tight ${
                                    dark ? "text-white/50" : "text-gray-600"
                                  }`}
                                >
                                  <CheckCircle2
                                    className={`w-3.5 h-3.5 shrink-0 mt-px ${
                                      dark
                                        ? "text-emerald-400/70"
                                        : "text-emerald-500"
                                    }`}
                                  />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Custom Credits */}
                <div
                  className={`mt-4 rounded-2xl border p-4 ${
                    useCustomCredits
                      ? dark
                        ? "border-blue-500 bg-blue-500/[0.08]"
                        : "border-blue-400 bg-blue-50"
                      : dark
                      ? "border-white/[0.08] bg-white/[0.02]"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p
                        className={`text-sm font-black ${
                          dark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Custom Credits
                      </p>
                      <p
                        className={`text-xs ${
                          dark ? "text-white/45" : "text-gray-500"
                        }`}
                      >
                        1 credit = ₹{customUnitPrice}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomCredits(true);
                        setSelectedPackage(null);
                        setDiscountApplied(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        useCustomCredits
                          ? "bg-blue-600 text-white"
                          : dark
                          ? "bg-white/[0.08] text-white/70 hover:bg-white/[0.12]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Use Custom
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label
                        className={`text-[11px] font-semibold mb-1.5 block ${
                          dark ? "text-white/50" : "text-gray-600"
                        }`}
                      >
                        Credits ({customMin} - {customMax})
                      </label>
                      <input
                        type="number"
                        min={customMin}
                        max={customMax}
                        step="1"
                        value={customCredits}
                        onChange={(e) => {
                          setCustomCredits(e.target.value);
                          setUseCustomCredits(true);
                          setSelectedPackage(null);
                          setDiscountApplied(null);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold outline-none ${
                          dark
                            ? "bg-[#0f1b30] border-white/[0.12] text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-semibold mb-1.5 ${
                          dark ? "text-white/50" : "text-gray-600"
                        }`}
                      >
                        Total
                      </p>
                      <div
                        className={`h-[42px] rounded-xl px-3 flex items-center text-sm font-black ${
                          dark
                            ? "bg-white/[0.06] text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        ₹{customTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                  {[
                    { icon: Shield, text: "Secure Payment" },
                    { icon: RefreshCw, text: "Instant Credits" },
                  ].map(({ icon: TrustIcon, text }) => (
                    <div
                      key={text}
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        dark ? "text-white/30" : "text-gray-400"
                      }`}
                    >
                      <TrustIcon className="w-3.5 h-3.5" />
                      {text}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Discount Code Input Area */}
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t shrink-0 ${dark ? "border-white/[0.06] bg-black/20" : "border-gray-100 bg-white"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[11px] font-bold uppercase tracking-widest ${dark ? "text-white/45" : "text-gray-500"}`}>
                Discount Code
              </p>
              {discountApplied?.discountAmount ? (
                <span className={`text-xs font-bold ${dark ? "text-emerald-300" : "text-emerald-600"}`}>
                  Saved ₹{discountApplied.discountAmount.toLocaleString("en-IN")}
                </span>
              ) : null}
            </div>

            {!discountApplied ? (
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full">
                <input
                  type="text"
                  placeholder="Have a discount code?"
                  disabled={!selectedPackage && !useCustomCredits}
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setDiscountError("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold outline-none transition-all border ${
                    dark 
                      ? "bg-[#0b1628] border-white/[0.1] text-white focus:border-blue-500/50" 
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400"
                  } disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={handleValidateDiscount}
                  disabled={!discountCode.trim() || discountLoading || (!selectedPackage && !useCustomCredits)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    dark 
                      ? "bg-blue-600 text-white hover:bg-blue-500" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </button>
              </div>
            ) : (
              <div className={`flex items-center justify-between p-3 rounded-xl border ${dark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                       <p className={`text-sm font-bold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                        {discountApplied.code} Applied!
                      </p>
                      <p className={`text-xs font-semibold ${dark ? "text-emerald-500/80" : "text-emerald-600"}`}>
                        (-₹{discountApplied.discountAmount.toLocaleString("en-IN")})
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDiscountCode("");
                    setDiscountApplied(null);
                    setDiscountError("");
                  }}
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${dark ? "hover:bg-emerald-500/20 text-emerald-500" : "hover:bg-emerald-200 text-emerald-600"}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <AnimatePresence>
              {discountError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-xs font-semibold mt-2 ml-1 ${dark ? "text-red-400" : "text-red-500"}`}
                >
                  {discountError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Footer ─────────────────────────────── */}
          <div
            className={`px-3 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-between max-[450px]:flex-col max-[450px]:items-stretch gap-3 shrink-0 ${
              dark
                ? "border-white/[0.06] bg-white/[0.02]"
                : "border-gray-100 bg-gray-50/50"
            }`}
          >
            <div className="max-[450px]:w-full">
              {(selectedPackage || useCustomCredits) && (
                <div className="flex items-center gap-2 max-[450px]:justify-between max-[450px]:flex-wrap">
                  <div className="flex flex-col">
                    <span
                      className={`text-sm max-[340px]:text-[13px] ${
                        dark ? "text-white/40" : "text-gray-500"
                      }`}
                    >
                      Total:
                    </span>
                    {discountApplied && (
                      <span className={`text-xs line-through ${dark ? "text-gray-500" : "text-gray-400"}`}>
                        ₹{discountApplied.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-lg max-[340px]:text-base font-black tabular-nums ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ₹
                    {(discountApplied
                      ? discountApplied.finalPrice
                      : (useCustomCredits ? customTotal : selectedPackage?.price || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`text-xs max-[340px]:text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                      dark
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {useCustomCredits
                      ? `${parsedCustomCredits || 0} credits`
                      : `${
                          (selectedPackage?.credits || 0) +
                          (selectedPackage?.bonusCredits || 0)
                        } credits`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 max-[450px]:w-full">
              <button
                onClick={onClose}
                disabled={purchasing}
                className={`px-5 max-[340px]:px-3 py-2.5 rounded-xl text-sm max-[340px]:text-[13px] font-semibold transition-all max-[450px]:flex-1 ${
                  dark
                    ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.10]"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:opacity-40`}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePurchase}
                disabled={
                  purchasing ||
                  (!selectedPackage && !useCustomCredits) ||
                  (useCustomCredits &&
                    (!Number.isInteger(parsedCustomCredits) ||
                      parsedCustomCredits < customMin ||
                      parsedCustomCredits > customMax))
                }
                className="px-6 max-[340px]:px-3 py-2.5 rounded-xl text-sm max-[340px]:text-[13px] font-bold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap max-[450px]:flex-1"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Now
                    <ArrowRight className="w-4 h-4 max-[340px]:hidden" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BuyCreditsModal;
