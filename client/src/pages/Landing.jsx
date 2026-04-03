import { lazy, Suspense, useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Film, Zap, Users, TrendingUp, ChevronRight, Mail, Send, Briefcase, HelpCircle, MessageSquare, CheckCircle, PenLine, BookOpen, ArrowRight, Clock3, XCircle } from "lucide-react";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";
import { AuthContext } from "../context/AuthContext";
import homeImg1 from "../assets/home-img1.jpeg";
import homeImg2 from "../assets/home-img2.jpeg";
import homeImg3 from "../assets/home-img3.jpeg";

const FeaturesShowcase = lazy(() => import("../components/FeaturesShowcase"));

const contactReasons = [
  { value: "doubt", label: "I have a question / doubt", icon: HelpCircle },
  { value: "team", label: "I want to join the team", icon: Briefcase },
  { value: "general", label: "General enquiry / feedback", icon: MessageSquare },
  { value: "email", label: "Just send an email", icon: Mail },
];

/* ─────────────────────────────────────────────
   Contact Section
   ───────────────────────────────────────────── */
const ContactSection = () => {
  const [form, setForm] = useState({ reason: "", name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    if (submitError) setSubmitError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    try {
      await api.post("/contact", form);
      setLoading(false);
      setSubmitted(true);
    } catch (error) {
      setLoading(false);
      setSubmitError(error?.response?.data?.message || "Failed to send message. Please try again.");
    }
  };

  return (
    <section className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 bg-[#080e18]">
      <div className="max-w-5xl mx-auto">
        {/* Header — left-aligned */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-gray-400 text-sm font-semibold tracking-wide uppercase mb-3">Get in touch</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            We'd love to hear from you
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-10 items-start">
          {/* Left — reason cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-3"
          >
            {contactReasons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, reason: value }))}
                className={`flex items-center gap-4 px-5 py-4 rounded-lg border text-left transition-colors duration-150
                  ${form.reason === value
                    ? "bg-gray-400/8 border-gray-400/25 text-white"
                    : "bg-[#0d1520] border-[#1c2a3a] text-[#8896a7] hover:border-[#2a3a4e]"
                  }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${form.reason === value ? "text-gray-400" : "text-[#4a5a6e]"}`} />
                <span className="text-sm font-medium">{label}</span>
                {form.reason === value && (
                  <CheckCircle className="w-4 h-4 text-gray-400 ml-auto shrink-0" />
                )}
              </button>
            ))}

            <div className="mt-3 px-4 sm:px-5 py-4 rounded-lg bg-[#0d1520] border border-[#1c2a3a]">
              <p className="text-[11px] text-[#4a5a6e] uppercase tracking-widest mb-1">Or email us directly</p>
              <a href="mailto:info.ckript@gmail.com" className="text-gray-400 text-sm font-medium hover:underline break-all">
                info.ckript@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white border border-[#d8e2ee] rounded-xl p-5 sm:p-7 shadow-[0_12px_28px_rgba(8,22,42,0.08)]">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-10 sm:py-14 gap-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#eef5ff] flex items-center justify-center mb-1">
                      <CheckCircle className="w-7 h-7 text-[#2f5f90]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0f2745]">Message Sent!</h3>
                    <p className="text-[#5f748d] text-sm max-w-xs">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setSubmitError("");
                        setForm({ reason: "", name: "", email: "", message: "" });
                      }}
                      className="mt-3 px-5 py-2 rounded-lg border border-[#d4deea] text-[#5f748d] text-sm hover:text-[#0f2745] hover:border-[#b7c9dc] transition-colors"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#5f748d]">Full Name</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Jane Doe"
                          className="bg-[#f8fbff] border border-[#d4deea] rounded-lg px-4 py-2.5 text-[#0f2745] text-sm placeholder-[#8298b3] focus:outline-none focus:border-[#8fb0d3] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#5f748d]">Email Address</label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="jane@example.com"
                          className="bg-[#f8fbff] border border-[#d4deea] rounded-lg px-4 py-2.5 text-[#0f2745] text-sm placeholder-[#8298b3] focus:outline-none focus:border-[#8fb0d3] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#5f748d]">Reason for Contact</label>
                      <select
                        name="reason"
                        value={form.reason}
                        onChange={handleChange}
                        required
                        className="bg-[#f8fbff] border border-[#d4deea] rounded-lg px-4 py-2.5 text-sm text-[#0f2745] focus:outline-none focus:border-[#8fb0d3] transition-colors appearance-none"
                      >
                        <option value="" disabled className="text-[#8298b3]">Select a reason…</option>
                        {contactReasons.map(({ value, label }) => (
                          <option key={value} value={value} className="bg-white text-[#0f2745]">{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#5f748d]">Your Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Tell us what's on your mind…"
                        className="bg-[#f8fbff] border border-[#d4deea] rounded-lg px-4 py-2.5 text-[#0f2745] text-sm placeholder-[#8298b3] resize-none focus:outline-none focus:border-[#8fb0d3] transition-colors"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white hover:bg-gray-200 font-semibold text-[#080e18] text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Send Message
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────── */
const Landing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showInvestorReviewPopup, setShowInvestorReviewPopup] = useState(false);
  const [activeProcessStep, setActiveProcessStep] = useState(0);
  const { user } = useContext(AuthContext);

  const reviewStatus = useMemo(() => {
    const value = (searchParams.get("investorReview") || "").toLowerCase();
    if (value === "pending" || value === "rejected") return value;
    return "";
  }, [searchParams]);

  const rejectedNote = useMemo(() => {
    return searchParams.get("note") || "";
  }, [searchParams]);

  useEffect(() => {
    if (reviewStatus) {
      setShowInvestorReviewPopup(true);
    }
  }, [reviewStatus]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveProcessStep((prev) => (prev + 1) % 4);
    }, 2200);

    return () => clearInterval(intervalId);
  }, []);

  const closeInvestorReviewPopup = () => {
    setShowInvestorReviewPopup(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("investorReview");
    nextParams.delete("note");
    setSearchParams(nextParams, { replace: true });
  };

  const processSteps = [
    {
      step: "01",
      stage: "Submission",
      title: "Upload Your Script",
      desc: "Present your concept with a concise summary, key details, and genre metadata.",
      shortDesc: "Share your concept with key details and genre.",
      note: "Clear start",
      icon: PenLine
    },
    {
      step: "02",
      stage: "AI Visualization",
      title: "AI Creates Trailer",
      desc: "Generate a sharp 30-second visual trailer that communicates tone and premise quickly.",
      shortDesc: "Generate a quick visual trailer for tone and premise.",
      note: "Quick clarity",
      icon: Film
    },
    {
      step: "03",
      stage: "Matching",
      title: "Get Smart Matched",
      desc: "Our algorithm prioritizes relevant producers and investors based on creative fit.",
      shortDesc: "Get matched with relevant producers and investors.",
      note: "Right-fit discovery",
      icon: Users
    },
    {
      step: "04",
      stage: "Monetization",
      title: "Unlock & Earn",
      desc: "Buyers unlock full scripts, and creators receive fast, transparent payouts.",
      shortDesc: "Buyers unlock scripts and creators receive payouts.",
      note: "Transparent payout",
      icon: TrendingUp
    }
  ];

  const desktopProcessPositions = [
    "left-0 top-1/2 -translate-y-1/2",
    "left-1/2 top-0 -translate-x-1/2",
    "right-0 top-1/2 -translate-y-1/2",
    "left-1/2 bottom-0 -translate-x-1/2",
  ];

  const renderProcessCard = (item, index, extraClassName = "", variant = "default") => {
    const isActive = index === activeProcessStep;
    const compact = variant === "compact";
    const descText = compact ? (item.shortDesc || item.desc) : item.desc;

    return (
      <motion.article
        key={item.step}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        onClick={() => setActiveProcessStep(index)}
        className={`group relative overflow-hidden cursor-pointer transition-all duration-300 ${compact ? "rounded-xl p-3.5" : "rounded-2xl p-5 sm:p-6"} ${isActive
          ? "border border-[#b8cde4] bg-white shadow-[0_14px_34px_rgba(8,22,42,0.14)]"
          : "border border-[#d9e4f2] bg-white hover:border-[#b8cde4] hover:bg-[#f9fbff]"
        } ${extraClassName}`}
      >
        <div className={`absolute inset-x-0 top-0 h-0.5 ${isActive ? "bg-[#7ea5cc]" : "bg-transparent"}`} />

        <div className={`flex items-center justify-between ${compact ? "mb-3" : "mb-5"}`}>
          <span className={`${compact ? "text-xl" : "text-2xl"} font-bold leading-none ${isActive ? "text-[#1e3a5f]" : "text-[#7d93ad]"}`}>{item.step}</span>
          <span className={`inline-flex items-center rounded-full ${compact ? "px-2.5 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"} font-semibold tracking-[0.12em] uppercase ${isActive
            ? "border border-[#b9cfe6] bg-[#f1f6fc] text-[#365b84]"
            : "border border-[#d3dfed] bg-[#f8fbff] text-[#6d85a0]"
          }`}>
            {item.stage}
          </span>
        </div>

        <div className={`${compact ? "w-8 h-8 mb-3" : "w-10 h-10 mb-4"} rounded-lg flex items-center justify-center ${isActive
          ? "border border-[#b9cfe6] bg-[#eef4fb]"
          : "border border-[#d3dfed] bg-[#f8fbff]"
        }`}>
          <item.icon className={`${compact ? "w-4 h-4" : "w-5 h-5"} ${isActive ? "text-[#355b85]" : "text-[#6f88a5]"}`} />
        </div>

        <h3 className={`${compact ? "text-base mb-1.5" : "text-lg mb-2"} font-bold text-[#0f2745] tracking-tight`}>{item.title}</h3>
        <p className={`${compact ? "text-xs" : "text-sm"} text-[#5e748d] leading-relaxed`}>{descText}</p>

        {!compact && (
          <div className="mt-4 pt-4 border-t border-[#dce5f0]">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5f7893]">
              <Clock3 className="w-3.5 h-3.5" />
              {item.note}
            </p>
          </div>
        )}
      </motion.article>
    );
  };

  return (
    <div className="bg-[#080e18] text-white overflow-x-hidden">

      <AnimatePresence>
        {showInvestorReviewPopup && reviewStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-5"
            onClick={closeInvestorReviewPopup}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md rounded-2xl border border-[#1c2a3a] bg-[#0d1520] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${reviewStatus === "pending" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  {reviewStatus === "pending" ? (
                    <Clock3 className="w-5 h-5 text-amber-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <button onClick={closeInvestorReviewPopup} className="text-[#4a5a6e] hover:text-[#8896a7] text-sm">Close</button>
              </div>

              <h3 className="mt-4 text-xl font-bold text-white">
                {reviewStatus === "pending" ? "Investor Profile Under Review" : "Investor Profile Not Approved"}
              </h3>

              {reviewStatus === "pending" ? (
                <p className="mt-2 text-sm text-[#8896a7] leading-relaxed">
                  Your profile has been submitted for admin review. Please wait 2-3 days.
                  Once approved, you will receive an email and can log in.
                </p>
              ) : (
                <p className="mt-2 text-sm text-[#8896a7] leading-relaxed">
                  Your investor profile was rejected.
                  {rejectedNote ? ` Reason: ${rejectedNote}` : " Please contact support for next steps."}
                </p>
              )}

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <a href="mailto:info.ckript@gmail.com" className="text-xs font-semibold text-[#8896a7] hover:text-white transition-colors break-all">
                  Contact: info.ckript@gmail.com
                </a>
                <Link to="/login" className="w-full sm:w-auto text-center px-4 py-2 rounded-lg bg-white text-[#080e18] text-xs font-bold hover:bg-gray-200 transition-colors" onClick={closeInvestorReviewPopup}>
                  Open Login
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#080e18]/90 backdrop-blur-sm border-b border-[#151f2e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
          <BrandLogo className="h-8 sm:h-10 w-auto" />
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link to="/profile" className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium text-[#8896a7] hover:text-white transition-colors whitespace-nowrap">
                  Profile
                </Link>
                <Link
                  to={user?.role === "reader" ? "/reader" : "/dashboard"}
                  className="px-3 sm:px-5 py-2 bg-white hover:bg-gray-200 text-[#080e18] rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  {user?.role === "reader" ? "Reader Home" : "Dashboard"}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium text-[#8896a7] hover:text-white transition-colors whitespace-nowrap">
                  Sign In
                </Link>
                <Link to="/join" className="px-3 sm:px-5 py-2 bg-white hover:bg-gray-200 text-[#080e18] rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 min-h-[76vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={homeImg1}
            alt="Landing visual showcase"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050c18]/92 via-[#07111f]/85 to-[#07111f]/62" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050c18]/70 via-transparent to-[#050c18]/25" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="max-w-3xl pt-10 sm:pt-14 md:pt-24">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-gray-300 text-sm font-semibold tracking-wide uppercase mb-5"
            >
              The Future of Script Discovery
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 sm:mb-6 tracking-tight text-white"
            >
              Your Ideas Deserve
              <br />
              <span className="text-gray-300">More Than Rejection</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-[#d1d8e2] leading-relaxed mb-8 sm:mb-10 max-w-xl"
            >
              Ckript connects brilliant creators with producers, directors, and investors who are actively searching for your next big idea. Publish, visualize, and monetize your scripts like never before.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link
                to="/writer-onboarding"
                className="w-full sm:w-auto justify-center px-7 py-3.5 bg-white hover:bg-gray-200 text-[#080e18] rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
              >
                Sign Up as Creator
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/producer-director-onboarding"
                className="w-full sm:w-auto text-center px-7 py-3.5 bg-transparent border border-[#8896a7]/45 hover:border-[#c5ceda]/70 text-[#e5ebf4] hover:text-white rounded-lg font-semibold text-sm transition-colors backdrop-blur-[2px]"
              >
                Sign Up as Producer
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Credit Coupon Promotion ── */}
      <section className="px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-2xl border border-[#3a5f86] bg-[linear-gradient(120deg,#0a1a2f_0%,#133257_46%,#22527f_100%)] p-4 sm:p-5 md:p-6 shadow-[0_16px_34px_rgba(4,14,30,0.42)]"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(166,211,255,0.28)_0%,rgba(166,211,255,0)_72%)]" />
              <div className="absolute -bottom-24 left-8 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(77,138,203,0.30)_0%,rgba(77,138,203,0)_74%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_58%)]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.12em] uppercase border border-[#4e78a8] bg-[#0d2139] text-[#cfe1f6]">
                  Limited Credit Offer
                </p>
                <h3 className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Use One-Time Coupon Code <span className="text-[#d9eaff]">WRITECOUPON</span>
                </h3>
                <p className="mt-1.5 text-sm sm:text-base text-[#b8cbe1]">
                  Get <span className="font-semibold text-white">Rs 1,200 discount</span> on credits for <span className="font-semibold text-white">AI trailer generation</span> and <span className="font-semibold text-white">script evaluations</span>.
                </p>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#3e6087] bg-[#0f2641] text-xs font-semibold text-[#c4d8ef]">
                    <Film className="w-3.5 h-3.5 text-[#9fc1e4]" />
                    AI Trailer Credits
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#3e6087] bg-[#0f2641] text-xs font-semibold text-[#c4d8ef]">
                    <BookOpen className="w-3.5 h-3.5 text-[#9fc1e4]" />
                    Evaluation Credits
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className="inline-flex items-center px-4 py-2 rounded-xl border border-[#5f86b3] bg-[#0c223a] text-[#dbe9f8] text-sm font-black tracking-[0.16em]">
                  WRITECOUPON
                </span>
                <Link
                  to={user ? "/dashboard?openCredits=1" : "/join"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0a1525] transition-colors hover:bg-gray-200"
                >
                  {user ? "Open Credits" : "Claim Credits"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Problem & Solution ── */}
      <section className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 bg-[#0a1221]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-8 sm:mb-9 rounded-3xl overflow-hidden border border-[#1f3148] bg-[#0d1520]"
          >
            <div className="relative">
              <img
                src={homeImg2}
                alt="Problem section visual"
                className="w-full h-60 sm:h-72 lg:h-80 object-cover"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1221]/82 via-[#0a1221]/58 to-[#0a1221]/42" />

              <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6">
                <div className="text-center max-w-3xl">
                  <p className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#c3d0e1] mb-2">
                    Industry Friction
                  </p>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    The Problem We Solve
                  </h2>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Two problem cards */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6 md:gap-6 mb-6 sm:mb-7 md:mb-8 md:relative md:z-40">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-[#d7e1ee] bg-white p-5 sm:p-6 flex flex-col h-full md:relative md:z-40 shadow-[0_8px_24px_rgba(12,34,58,0.08)]"
            >
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#edf4fd] border border-[#cdddef] flex items-center justify-center shrink-0">
                  <PenLine className="w-[17px] h-[17px] text-[#2f5f90]" />
                </div>
                <div>

                  <h3 className="text-xl sm:text-[1.4rem] font-bold text-[#0f2745] tracking-tight">For Creators</h3>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  "Brilliant ideas stuck without capital or connections",
                  "No path to reach producers, directors, and investors",
                  "Endless rejection from traditional gatekeepers",
                  "Stories remain dormant and undiscovered forever",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-[0.98rem] text-[#4f647c] leading-snug">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#7d97b8] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/writer-onboarding"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#244a78]"
              >
                Start as Creator
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-[#d7e1ee] bg-white p-5 sm:p-6 flex flex-col h-full md:relative md:z-40 shadow-[0_8px_24px_rgba(12,34,58,0.08)]"
            >
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#edf4fd] border border-[#cdddef] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-[17px] h-[17px] text-[#2f5f90]" />
                </div>
                <div>

                  <h3 className="text-xl sm:text-[1.4rem] font-bold text-[#0f2745] tracking-tight">For Industry Professionals</h3>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  "Drowning in unfiltered submissions with no smart search",
                  "Impossible to find fresh, genre-specific content fast",
                  "No way to preview talent before committing resources",
                  "Expensive, slow, and painfully manual discovery process",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-[0.98rem] text-[#4f647c] leading-snug">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#7d97b8] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/producer-director-onboarding"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#244a78]"
              >
                Start as Industry Professional
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Solution card — full width, different visual weight */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative z-20 mt-2 sm:mt-3 md:mt-2 lg:mt-3 md:mx-10 lg:mx-16 rounded-2xl overflow-hidden border border-[#d7e1ee] bg-white p-5 sm:p-7 md:pt-12 shadow-[0_14px_32px_rgba(8,22,42,0.12)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9db8d6] to-transparent" />

            <div className="grid md:grid-cols-[auto_1fr] gap-6 sm:gap-7 items-start">
              <div className="w-12 h-12 rounded-xl bg-[#edf4fd] border border-[#ccddf0] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#355b85]" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-[1.85rem] font-bold text-[#0f2745] mb-3 tracking-tight">The Ckript Solution</h3>
                <p className="text-[#4f647c] text-sm sm:text-base leading-relaxed mb-5 max-w-3xl">
                  Ckript eliminates friction between creative talent and industry decision-makers.
                  Scripts come to life through{" "}
                  <span className="text-[#0f2745] font-semibold">AI-generated visual trailers</span>, surface to the right buyers via{" "}
                  <span className="text-[#0f2745] font-semibold">intelligent algorithmic matching</span>, accelerating every stage of production.
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: <Zap className="w-3.5 h-3.5" />, label: "AI-Powered Matching" },
                    { icon: <Film className="w-3.5 h-3.5" />, label: "Visual Script Previews" },
                    { icon: <Users className="w-3.5 h-3.5" />, label: "Direct Industry Access" },
                    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Real-time Analytics" },
                  ].map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d5e0ed] bg-[#f8fbff] text-xs font-medium text-[#4f647c]">
                      <span className="text-[#6786aa]">{f.icon}</span>
                      {f.label}
                    </span>
                  ))}
                </div>

                <Link
                  to="/join"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#244a78]"
                >
                  Get Started on Ckript
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Showcase ── */}
      <Suspense fallback={<section className="py-20 px-6 bg-[#080e18]" aria-label="Loading features" />}>
        <FeaturesShowcase />
      </Suspense>

      {/* ── How it Works ── */}
      <section className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 border-y border-[#152a42] bg-[linear-gradient(180deg,#0b1422_0%,#0d1829_100%)]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-[#9fb2cb] text-sm font-semibold tracking-wide uppercase mb-3">Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              How It Works in 4 Simple Steps
            </h2>
          </motion.div>

          <div className="mt-10 sm:mt-12">
            <div className="hidden xl:block relative h-[760px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] rounded-2xl overflow-hidden border border-[#223c57] bg-[#0f1d30] shadow-[0_16px_38px_rgba(4,12,24,0.34)]"
              >
                <img
                  src={homeImg3}
                  alt="How it works visual"
                  className="w-full h-[360px] object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081120]/58 via-transparent to-transparent" />
                <p className="absolute left-1/2 -translate-x-1/2 bottom-4 rounded-full border border-[#2a435f] bg-[#0b182a]/90 px-3 py-1 text-[11px] font-semibold text-[#b7c8dc] whitespace-nowrap">
                  Structured flow, step by step
                </p>
              </motion.div>

              {processSteps.map((item, index) => (
                <div
                  key={item.step}
                  className={`absolute ${desktopProcessPositions[index]} ${index === 1 || index === 3 ? "w-[340px]" : "w-[320px]"}`}
                >
                  {renderProcessCard(item, index)}
                </div>
              ))}
            </div>

            <div className="hidden md:block xl:hidden relative h-[620px] lg:h-[700px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] lg:w-[520px] rounded-2xl overflow-hidden border border-[#223c57] bg-[#0f1d30] shadow-[0_16px_38px_rgba(4,12,24,0.34)]"
              >
                <img
                  src={homeImg3}
                  alt="How it works visual"
                  className="w-full h-[250px] lg:h-[310px] object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081120]/58 via-transparent to-transparent" />
              </motion.div>

              {processSteps.map((item, index) => (
                <div
                  key={item.step}
                  className={`absolute ${desktopProcessPositions[index]} ${index === 1 || index === 3 ? "w-[300px] lg:w-[320px]" : "w-[230px] lg:w-[260px]"}`}
                >
                  {renderProcessCard(item, index)}
                </div>
              ))}
            </div>

            <div className="hidden min-[400px]:max-[767px]:block relative h-[560px] min-[640px]:h-[620px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] min-[640px]:w-[360px] rounded-xl overflow-hidden border border-[#223c57] bg-[#0f1d30] shadow-[0_14px_28px_rgba(4,12,24,0.32)]"
              >
                <img
                  src={homeImg3}
                  alt="How it works visual"
                  className="w-full h-[190px] min-[640px]:h-[220px] object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081120]/58 via-transparent to-transparent" />
              </motion.div>

              {processSteps.map((item, index) => (
                <div
                  key={item.step}
                  className={`absolute ${desktopProcessPositions[index]} ${index === 1 || index === 3 ? "w-[250px] min-[640px]:w-[280px]" : "w-[180px] min-[640px]:w-[220px]"}`}
                >
                  {renderProcessCard(item, index, "", "compact")}
                </div>
              ))}
            </div>

            <div className="max-[399px]:block hidden space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border border-[#223c57] bg-[#0f1d30] shadow-[0_16px_38px_rgba(4,12,24,0.34)]"
              >
                <img
                  src={homeImg3}
                  alt="How it works visual"
                  className="w-full h-56 sm:h-64 object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081120]/58 via-transparent to-transparent" />
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-4">
                {processSteps.map((item, index) => renderProcessCard(item, index))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-[#151f2e]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[#4a5a6e] text-center sm:text-left">&copy; 2026 Ckript. Connecting brilliant ideas with brilliant people.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm text-[#4a5a6e]">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <a href="https://www.linkedin.com/company/ckript/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
