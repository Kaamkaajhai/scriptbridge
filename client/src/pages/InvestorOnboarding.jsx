import { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import OTPVerification from "../components/OTPVerification";
import {
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Users,
  AlertCircle,
  Globe,
  Briefcase,
  Instagram,
  Twitter,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


// Comprehensive email validation
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  email = email.trim().toLowerCase();
  if (email.length > 254 || email.length < 5) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false;
  if (!domain.includes('.') || domain.startsWith('-') || domain.endsWith('-') || domain.includes('..')) return false;
  const tld = domain.split('.').pop();
  return tld.length >= 2;
};

// Password validation criteria
const validatePassword = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
};

const INVESTOR_ONBOARDING_DRAFT_KEY = "sb-investor-onboarding-draft-v1";

const DEFAULT_ACCOUNT_DATA = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const DEFAULT_INVESTOR_PROFILE = {
  subRole: "",
  jobTitle: "",
  company: "",
  investmentRange: "",
  previousCredits: "",
  portfolioUrl: "",
  linkedInUrl: "",
  imdbUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  websiteUrl: "",
  bio: "",
};

const normalizeUrlInput = (value = "") => value.trim();

const isValidHttpUrl = (value = "") => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const loadInvestorOnboardingDraft = () => {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.sessionStorage.getItem(INVESTOR_ONBOARDING_DRAFT_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

const INVESTOR_TERMS_ROUTE = "/investor-terms";
const INVESTOR_TERMS_VERSION = "investor-onboarding-v2026-03-24";
const PRIVACY_POLICY_VERSION = "registration-privacy-v2026-03-24";
const REGISTRATION_PRIVACY_ROUTE = "/registration-privacy-policy";

const InvestorOnboarding = () => {
  const { join, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const initialDraftRef = useRef(loadInvestorOnboardingDraft());
  const initialDraft = initialDraftRef.current;

  const [currentStep, setCurrentStep] = useState(() => {
    const step = Number(initialDraft?.currentStep);
    return Number.isInteger(step) && step >= 1 && step <= 4 ? step : 1;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firmNameError, setFirmNameError] = useState("");
  const [roleFocusError, setRoleFocusError] = useState("");
  const [jobTitleError, setJobTitleError] = useState("");
  const [socialLinkError, setSocialLinkError] = useState("");
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(Boolean(initialDraft?.showOTPVerification));
  const [userEmail, setUserEmail] = useState(initialDraft?.userEmail || "");

  // Step 1: Account
  const [accountData, setAccountData] = useState(() => ({
    ...DEFAULT_ACCOUNT_DATA,
    ...(initialDraft?.accountData || {}),
  }));

  // Email Verification (keeping for compatibility, but using OTP now)
  const [verificationCode, setVerificationCode] = useState(initialDraft?.verificationCode || "");
  const [verificationSent, setVerificationSent] = useState(Boolean(initialDraft?.verificationSent));

  // Step 2: Investor Profile
  const [investorProfile, setInvestorProfile] = useState(() => ({
    ...DEFAULT_INVESTOR_PROFILE,
    ...(initialDraft?.investorProfile || {}),
  }));

  // Step 3: Preferences
  const [selectedGenres, setSelectedGenres] = useState(
    Array.isArray(initialDraft?.selectedGenres) ? initialDraft.selectedGenres : []
  );
  const [selectedFormats, setSelectedFormats] = useState(
    Array.isArray(initialDraft?.selectedFormats) ? initialDraft.selectedFormats : []
  );

  // Step 4: Legal
  const [agreementScrolled, setAgreementScrolled] = useState(Boolean(initialDraft?.agreementScrolled));
  const [agreementAccepted, setAgreementAccepted] = useState(Boolean(initialDraft?.agreementAccepted));
  const agreementRef = useRef(null);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const safeAccountData = {
      ...accountData,
      password: "",
      confirmPassword: "",
    };

    const draft = {
      currentStep,
      showOTPVerification,
      userEmail,
      accountData: safeAccountData,
      verificationCode,
      verificationSent,
      investorProfile,
      selectedGenres,
      selectedFormats,
      agreementScrolled,
      agreementAccepted,
    };

    window.sessionStorage.setItem(INVESTOR_ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  }, [
    accountData,
    agreementAccepted,
    agreementScrolled,
    currentStep,
    investorProfile,
    selectedFormats,
    selectedGenres,
    showOTPVerification,
    userEmail,
    verificationCode,
    verificationSent,
  ]);

  const steps = [
    { num: 1, title: "Account" },
    { num: 2, title: "Profile" },
    { num: 3, title: "Preferences" },
    { num: 4, title: "Complete" },
  ];

  const investmentRanges = [
    { value: "under_50k", label: "Under ₹50L" },
    { value: "50k_250k", label: "₹50L – ₹2Cr" },
    { value: "250k_1m", label: "₹2Cr – ₹10Cr" },
    { value: "1m_5m", label: "₹10Cr – ₹50Cr" },
    { value: "over_5m", label: "Over ₹50Cr" },
  ];

  const genreOptions = [
    "Action", "Comedy", "Drama", "Horror", "Thriller",
    "Romance", "Sci-Fi", "Fantasy", "Mystery", "Adventure",
    "Crime", "Documentary", "Historical", "Animation", "Musical",
  ];

  const formatOptions = [
    "Feature Film", "TV Series", "Limited Series", "Short Film",
    "Web Series", "Documentary", "Animation",
  ];

  const toggle = (arr, setArr, val) => {
    setArr((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  // ── Step 1: Account Creation ───────────────────────────────
  const handleAccountCreation = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    // Trim and sanitize email
    const sanitizedEmail = accountData.email.trim().toLowerCase();

    // Validate email
    if (!isValidEmail(sanitizedEmail)) {
      setEmailError("Please enter a valid email address (e.g., user@example.com)");
      return;
    }

    // Validate password
    const passwordCheck = validatePassword(accountData.password);
    if (!Object.values(passwordCheck).every(Boolean)) {
      setError("Password does not meet all requirements");
      return;
    }

    // Check password confirmation
    if (accountData.password !== accountData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await join({
        name: accountData.name,
        email: sanitizedEmail,
        password: accountData.password,
        role: "investor",
      });

      // Check if OTP verification is required
      if (response?.requiresVerification) {
        setUserEmail(sanitizedEmail);
        setShowOTPVerification(true);
      } else if (response?.token) {
        // Direct login (shouldn't happen with new flow)
        setCurrentStep(2);
      }

      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (userData) => {
    // Update auth context with user data/session.
    setUser(userData);
    if (userData?.token) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    setShowOTPVerification(false);
    setCurrentStep(2);
  };

  const handleBackToSignup = () => {
    setShowOTPVerification(false);
    setUserEmail("");
    setError("");
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/onboarding/verify-email", { code: verificationCode });
      if (res.data.success) setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Producer/Director Profile ─────────────────────
  const handleInvestorProfile = async (e) => {
    e.preventDefault();
    setFirmNameError("");
    setRoleFocusError("");
    setJobTitleError("");
    setSocialLinkError("");
    setError("");

    const sanitizedSubRole = normalizeUrlInput(investorProfile.subRole);
    if (!sanitizedSubRole) {
      setRoleFocusError("Role focus is required");
      return;
    }

    const sanitizedJobTitle = normalizeUrlInput(investorProfile.jobTitle);
    if (!sanitizedJobTitle) {
      setJobTitleError("Job title is required");
      return;
    }

    const sanitizedCompany = (investorProfile.company || "").trim();
    if (!sanitizedCompany) {
      setFirmNameError("Production house / firm name is required");
      return;
    }

    const urlFields = {
      portfolioUrl: normalizeUrlInput(investorProfile.portfolioUrl),
      linkedInUrl: normalizeUrlInput(investorProfile.linkedInUrl),
      imdbUrl: normalizeUrlInput(investorProfile.imdbUrl),
      instagramUrl: normalizeUrlInput(investorProfile.instagramUrl),
      twitterUrl: normalizeUrlInput(investorProfile.twitterUrl),
      facebookUrl: normalizeUrlInput(investorProfile.facebookUrl),
      youtubeUrl: normalizeUrlInput(investorProfile.youtubeUrl),
      websiteUrl: normalizeUrlInput(investorProfile.websiteUrl),
    };

    const invalidUrlEntries = Object.values(urlFields).filter((value) => value && !isValidHttpUrl(value));
    if (invalidUrlEntries.length > 0) {
      setSocialLinkError("Please enter valid URLs starting with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      await api.put("/users/update", {
        subRole: sanitizedSubRole,
        jobTitle: sanitizedJobTitle,
        bio: investorProfile.bio,
        company: sanitizedCompany,
        previousCredits: normalizeUrlInput(investorProfile.previousCredits),
        linkedInUrl: urlFields.linkedInUrl,
        imdbUrl: urlFields.imdbUrl,
        otherUrl: urlFields.portfolioUrl,
        socialLinks: {
          instagram: urlFields.instagramUrl,
          twitter: urlFields.twitterUrl,
          facebook: urlFields.facebookUrl,
          youtube: urlFields.youtubeUrl,
          website: urlFields.websiteUrl,
        },
        investmentRange: investorProfile.investmentRange,
      });
      setCurrentStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Preferences ────────────────────────────────────
  const handlePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put("/users/update", {
        preferredGenres: selectedGenres,
        preferredFormats: selectedFormats,
      });
      setCurrentStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Legal & Complete ───────────────────────────────
  const handleComplete = async () => {
    if (!agreementAccepted) {
      setError("Please accept the agreement to continue");
      return;
    }
    if (!privacyPolicyAccepted) {
      setError("Please accept the privacy policy to continue");
      return;
    }
    setLoading(true);
    try {
      await api.put("/users/update", {
        onboardingComplete: true,
        privacyPolicyAccepted,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(INVESTOR_ONBOARDING_DRAFT_KEY);
      }
      navigate("/?investorReview=pending", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared UI helpers ──────────────────────────────────────
  const inputClass = "w-full h-11 px-4 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/5 transition-all bg-gray-50 text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

  const ChipButton = ({ label, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active
          ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
          : "bg-white text-gray-500 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-[#1e3a5f]"
        }`}
    >
      {label}
    </button>
  );

  // Show OTP verification screen if needed
  if (showOTPVerification) {
    return (
      <OTPVerification
        email={userEmail}
        onSuccess={handleOTPSuccess}
        onBack={handleBackToSignup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f0f4ff] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center mb-1">
            <div className="w-20 h-20 bg-[#f8faff] rounded-xl flex items-center justify-center">
              <Users className="text-black" size={40} strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm text-gray-600">Producer/Director Onboarding</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${currentStep > step.num
                      ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
                      : currentStep === step.num
                        ? "bg-white border-[#1e3a5f] text-[#1e3a5f]"
                        : "bg-white border-gray-200 text-gray-300"
                    }`}
                >
                  {currentStep > step.num ? <CheckCircle size={14} /> : step.num}
                </div>
                <span className={`text-[10px] font-bold ${currentStep === step.num ? "text-[#1e3a5f]" : "text-gray-300"}`}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-14 h-0.5 mb-5 mx-1 transition-all ${currentStep > step.num ? "bg-[#1e3a5f]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Account ── */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-8 pt-7 pb-2 border-b border-gray-50">
                  <h2 className="text-xl font-black text-gray-900">Create your account</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Join as a producer/director and discover projects worth backing</p>
                </div>

                {!verificationSent ? (
                  <form onSubmit={handleAccountCreation} className="p-8 space-y-5">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={accountData.name}
                          onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                          className={`${inputClass} pl-10`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={accountData.email}
                          onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                          className={`${inputClass} pl-10`}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className={labelClass}>Password</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                          <input
                            type="password"
                            placeholder="Min. 8 chars"
                            value={accountData.password}
                            onChange={(e) => {
                              setAccountData({ ...accountData, password: e.target.value });
                              if (!showPasswordReqs) setShowPasswordReqs(true);
                            }}
                            onFocus={() => setShowPasswordReqs(true)}
                            className={`${inputClass} pl-10`}
                            required
                          />
                        </div>
                        {showPasswordReqs && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-[11px] font-semibold text-gray-600 mb-2">Password Requirements:</p>
                            <div className="space-y-1">
                              {(() => {
                                const validation = validatePassword(accountData.password);
                                return (
                                  <>
                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${validation.length ? 'text-green-600' : 'text-gray-500'}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={validation.length ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                      </svg>
                                      At least 8 characters
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${validation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={validation.uppercase ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                      </svg>
                                      One uppercase letter (A-Z)
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${validation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={validation.lowercase ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                      </svg>
                                      One lowercase letter (a-z)
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${validation.number ? 'text-green-600' : 'text-gray-500'}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={validation.number ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                      </svg>
                                      One number (0-9)
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${validation.special ? 'text-green-600' : 'text-gray-500'}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={validation.special ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                      </svg>
                                      One special character (!@#$%^&*)
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Confirm</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                          <input
                            type="password"
                            placeholder="Repeat password"
                            value={accountData.confirmPassword}
                            onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                            className={`${inputClass} pl-10`}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {emailError && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle size={15} className="text-red-400 shrink-0" />
                        <p className="text-sm font-semibold text-red-600">{emailError}</p>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle size={15} className="text-red-400 shrink-0" />
                        <p className="text-sm font-semibold text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#162d4a] transition-all disabled:opacity-60"
                    >
                      {loading ? "Creating account..." : <>Create Account <ArrowRight size={16} /></>}
                    </button>

                    <p className="text-center text-xs text-gray-400 font-medium">
                      Already have an account?{" "}
                      <a href="/login" className="text-[#1e3a5f] font-bold hover:underline">Sign in</a>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleEmailVerification} className="p-8 space-y-5">
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                      <Mail size={16} className="text-blue-500 shrink-0" />
                      <p className="text-sm font-semibold text-blue-700">Verification code sent to <span className="font-black">{accountData.email}</span></p>
                    </div>
                    <div>
                      <label className={labelClass}>Verification Code</label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className={`${inputClass} text-center text-xl font-black tracking-[0.3em]`}
                        maxLength={6}
                        required
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle size={15} className="text-red-400 shrink-0" />
                        <p className="text-sm font-semibold text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || verificationCode.length < 6}
                      className="w-full h-11 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#162d4a] transition-all disabled:opacity-60"
                    >
                      {loading ? "Verifying..." : <>Verify Email <ArrowRight size={16} /></>}
                    </button>

                    <button
                      type="button"
                      onClick={async () => { await api.post("/onboarding/send-verification").catch(() => { }); }}
                      className="w-full text-sm text-gray-400 hover:text-[#1e3a5f] font-semibold transition-colors"
                    >
                      Resend code
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── Step 2: Investor Profile ── */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-8 pt-7 pb-2 border-b border-gray-50">
                  <h2 className="text-xl font-black text-gray-900">Producer/Director profile</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Tell writers and creators about your production focus</p>
                </div>
                <form onSubmit={handleInvestorProfile} className="p-8 space-y-5">
                  <div>
                    <label className={labelClass}>Role Focus</label>
                    <div className="grid grid-cols-2 gap-2">
                      <ChipButton
                        label="Producer"
                        active={investorProfile.subRole === "producer"}
                        onClick={() => {
                          setInvestorProfile({ ...investorProfile, subRole: "producer" });
                          if (roleFocusError) setRoleFocusError("");
                        }}
                      />
                      <ChipButton
                        label="Director"
                        active={investorProfile.subRole === "director"}
                        onClick={() => {
                          setInvestorProfile({ ...investorProfile, subRole: "director" });
                          if (roleFocusError) setRoleFocusError("");
                        }}
                      />
                    </div>
                    {roleFocusError && (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{roleFocusError}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Job Title</label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                      <input
                        type="text"
                        placeholder="e.g. Creative Producer"
                        value={investorProfile.jobTitle}
                        onChange={(e) => {
                          setInvestorProfile({ ...investorProfile, jobTitle: e.target.value });
                          if (jobTitleError) setJobTitleError("");
                        }}
                        className={`${inputClass} pl-10 ${jobTitleError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                        required
                      />
                    </div>
                    {jobTitleError && (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{jobTitleError}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Production House / Firm Name</label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                      <input
                        type="text"
                        placeholder="e.g. YATU Productions"
                        value={investorProfile.company}
                        onChange={(e) => {
                          setInvestorProfile({ ...investorProfile, company: e.target.value });
                          if (firmNameError) setFirmNameError("");
                        }}
                        className={`${inputClass} pl-10 ${firmNameError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                        required
                      />
                    </div>
                    {firmNameError && (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{firmNameError}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Typical Project Budget Range</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {investmentRanges.map((r) => (
                        <ChipButton
                          key={r.value}
                          label={r.label}
                          active={investorProfile.investmentRange === r.value}
                          onClick={() => setInvestorProfile({ ...investorProfile, investmentRange: r.value })}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Portfolio / Showreel URL <span className="normal-case text-gray-300 font-medium">(optional)</span></label>
                    <div className="relative">
                      <Globe size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                      <input
                        type="url"
                        placeholder="https://yourshowreel.com"
                        value={investorProfile.portfolioUrl}
                        onChange={(e) => {
                          setInvestorProfile({ ...investorProfile, portfolioUrl: e.target.value });
                          if (socialLinkError) setSocialLinkError("");
                        }}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Online Presence <span className="normal-case text-gray-300 font-medium">(optional)</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <Globe size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/yourname"
                          value={investorProfile.linkedInUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, linkedInUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>

                      <div className="relative">
                        <FileText size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://imdb.com/name/..."
                          value={investorProfile.imdbUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, imdbUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>

                      <div className="relative">
                        <Instagram size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://instagram.com/yourhandle"
                          value={investorProfile.instagramUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, instagramUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>

                      <div className="relative">
                        <Twitter size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://x.com/yourhandle"
                          value={investorProfile.twitterUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, twitterUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>

                      <div className="relative sm:col-span-2">
                        <Globe size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://facebook.com/yourpage"
                          value={investorProfile.facebookUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, facebookUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>

                      <div className="relative sm:col-span-2">
                        <Globe size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://youtube.com/@yourchannel"
                          value={investorProfile.youtubeUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, youtubeUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>

                      <div className="relative sm:col-span-2">
                        <Globe size={15} className="absolute left-3.5 top-3.5 text-gray-300" />
                        <input
                          type="url"
                          placeholder="https://yourproductionhouse.com"
                          value={investorProfile.websiteUrl}
                          onChange={(e) => {
                            setInvestorProfile({ ...investorProfile, websiteUrl: e.target.value });
                            if (socialLinkError) setSocialLinkError("");
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    {socialLinkError ? (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{socialLinkError}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-gray-400">Add as many links as you want. Use full URLs including http:// or https://</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Notable Credits <span className="normal-case text-gray-300 font-medium">(optional)</span></label>
                    <textarea
                      rows={3}
                      placeholder="Share key projects, films, episodes, or awards"
                      value={investorProfile.previousCredits}
                      onChange={(e) => setInvestorProfile({ ...investorProfile, previousCredits: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/5 transition-all bg-gray-50 text-gray-900 placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Bio <span className="normal-case text-gray-300 font-medium">(optional)</span></label>
                    <textarea
                      rows={3}
                      placeholder="Brief background on your creative and production experience..."
                      value={investorProfile.bio}
                      onChange={(e) => setInvestorProfile({ ...investorProfile, bio: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/5 transition-all bg-gray-50 text-gray-900 placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                      <AlertCircle size={15} className="text-red-400 shrink-0" />
                      <p className="text-sm font-semibold text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setCurrentStep(1)}
                      className="h-11 px-5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm flex items-center gap-1.5 hover:border-gray-300 transition-all">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 h-11 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#162d4a] transition-all disabled:opacity-60">
                      {loading ? "Saving..." : <>Continue <ArrowRight size={16} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Step 3: Preferences ── */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-8 pt-7 pb-2 border-b border-gray-50">
                  <h2 className="text-xl font-black text-gray-900">Project preferences</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Help us match you with the right projects</p>
                </div>
                <form onSubmit={handlePreferences} className="p-8 space-y-6">
                  <div>
                    <label className={labelClass}>Preferred Genres</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {genreOptions.map((g) => (
                        <ChipButton key={g} label={g} active={selectedGenres.includes(g)} onClick={() => toggle(selectedGenres, setSelectedGenres, g)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Preferred Formats</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formatOptions.map((f) => (
                        <ChipButton key={f} label={f} active={selectedFormats.includes(f)} onClick={() => toggle(selectedFormats, setSelectedFormats, f)} />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                      <AlertCircle size={15} className="text-red-400 shrink-0" />
                      <p className="text-sm font-semibold text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCurrentStep(2)}
                      className="h-11 px-5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm flex items-center gap-1.5 hover:border-gray-300 transition-all">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 h-11 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#162d4a] transition-all disabled:opacity-60">
                      {loading ? "Saving..." : <>Continue <ArrowRight size={16} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Step 4: Legal & Complete ── */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-8 pt-7 pb-2 border-b border-gray-50">
                  <h2 className="text-xl font-black text-gray-900">Producer/Director Agreement</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Please read and accept the terms before accessing the platform</p>
                </div>
                <div className="p-8 space-y-5">
                  <div className="border border-gray-100 rounded-xl p-5 bg-gray-50 text-sm text-gray-600 space-y-3">
                    <p className="font-black text-gray-700">Investor Registration Terms and Conditions</p>
                    <p>
                      Review the full investor terms on a separate page before you complete registration.
                    </p>
                    <Link
                      to={INVESTOR_TERMS_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#162d4a] transition-all font-bold text-sm"
                    >
                      Open Terms & Conditions
                      <ArrowRight size={14} />
                    </Link>
                    <p className="text-xs text-gray-400">Terms version: {INVESTOR_TERMS_VERSION}</p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => setAgreementAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300"
                      style={{ accentColor: "#1e3a5f" }}
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      I have read and agree to the Investor Registration Terms and Conditions
                    </span>
                  </label>

                  <div className="border border-gray-100 rounded-xl p-5 bg-gray-50 text-sm text-gray-600 space-y-3">
                    <p className="font-black text-gray-700">Registration Privacy Policy</p>
                    <p>
                      Review the privacy policy that applies to both writer and investor registrations.
                    </p>
                    <Link
                      to={REGISTRATION_PRIVACY_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#162d4a] transition-all font-bold text-sm"
                    >
                      Open Privacy Policy
                      <ArrowRight size={14} />
                    </Link>
                    <p className="text-xs text-gray-400">Privacy policy version: {PRIVACY_POLICY_VERSION}</p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={privacyPolicyAccepted}
                      onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300"
                      style={{ accentColor: "#1e3a5f" }}
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      I have read and agree to the Privacy Policy
                    </span>
                  </label>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                      <AlertCircle size={15} className="text-red-400 shrink-0" />
                      <p className="text-sm font-semibold text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCurrentStep(3)}
                      className="h-11 px-5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm flex items-center gap-1.5 hover:border-gray-300 transition-all">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={!agreementAccepted || !privacyPolicyAccepted || loading}
                      className="flex-1 h-11 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#162d4a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? "Completing..." : <>
                        <TrendingUp size={16} /> Enter Platform
                      </>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InvestorOnboarding;
