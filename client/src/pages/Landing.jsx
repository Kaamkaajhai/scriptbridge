import { lazy, Suspense, useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  Film,
  Users,
  TrendingUp,
  Mail,
  Send,
  Briefcase,
  HelpCircle,
  MessageSquare,
  CheckCircle,
  PenLine,
  ArrowRight,
  Clock3,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";
import MarketingHeader from "../components/MarketingHeader";
import { AuthContext } from "../context/AuthContext";
import homeImg1 from "../assets/home-img1.jpeg";
import homeImg2 from "../assets/home-img2.jpeg";
import homeImg3 from "../assets/home-img3.jpeg";

const FeaturesShowcase = lazy(() => import("../components/FeaturesShowcase"));

/* ─────────────────────────────────────────────
   Fonts — Fraunces (display) + Inter (body)
   ───────────────────────────────────────────── */
const FontInjection = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,700&family=Inter:wght@300;400;500;600;700&display=swap');

    .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
    .font-body    { font-family: 'Inter', system-ui, sans-serif; }

    .grain::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.06;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    @keyframes marquee {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .marquee-track { animation: marquee 9s linear infinite; }

    @keyframes soft-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.7; transform: scale(1.05); }
    }
    .soft-pulse { animation: soft-pulse 2.5s ease-in-out infinite; }
  `}</style>
);

const contactReasons = [
  { value: "doubt",   label: "I have a question",       icon: HelpCircle },
  { value: "team",    label: "I want to join the team", icon: Briefcase },
  { value: "general", label: "General feedback",        icon: MessageSquare },
  { value: "email",   label: "Just say hello",          icon: Mail },
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
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 bg-[#F8FAFC] overflow-hidden">
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 sm:mb-16 max-w-2xl"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-5">
            Contact
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] leading-[1.05] tracking-tight">
            We'd love to hear<br />
            <em className="font-medium">from you.</em>
          </h2>
          <p className="font-body text-[#6B7280] text-base sm:text-lg mt-5 leading-relaxed">
            Got a question? An idea? A complaint? A coffee recommendation? Drop us a line —
            we read everything.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Left — reason cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-2.5"
          >
            {contactReasons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, reason: value }))}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200
                  ${form.reason === value
                    ? "border-[#6366F1] bg-white text-[#111827] shadow-[0_8px_24px_rgba(79,70,229,0.12)]"
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]"
                  }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  form.reason === value ? "bg-[#6366F1] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-body text-sm font-medium">{label}</span>
                {form.reason === value && (
                  <CheckCircle className="w-4 h-4 text-[#6366F1] ml-auto shrink-0" />
                )}
              </button>
            ))}

            <div className="mt-4 px-5 py-4 rounded-2xl bg-white border border-[#E5E7EB]">
              <p className="font-body text-xs text-[#6B7280] mb-1">Or email us directly</p>
              <a
                href="mailto:info.ckript@gmail.com"
                className="font-display text-lg text-[#111827] hover:underline transition-colors break-all"
              >
                info.ckript@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(17,24,39,0.08)] border border-[#E5E7EB]">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-12 gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-[#111827]" />
                    </div>
                    <h3 className="font-display text-3xl text-[#111827]">
                      Message <em>sent.</em>
                    </h3>
                    <p className="font-body text-[#6B7280] text-sm max-w-xs">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setSubmitError("");
                        setForm({ reason: "", name: "", email: "", message: "" });
                      }}
                      className="mt-3 font-body text-sm font-medium text-[#111827] underline underline-offset-4 decoration-[#9CA3AF] hover:decoration-[#111827]"
                    >
                      Send another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="font-body text-xs font-semibold text-[#111827]">
                          Your name
                        </label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Jane Doe"
                          className="bg-[#F3F4F6] border-2 border-transparent rounded-xl px-4 py-3 font-body text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-body text-xs font-semibold text-[#111827]">
                          Your email
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="jane@example.com"
                          className="bg-[#F3F4F6] border-2 border-transparent rounded-xl px-4 py-3 font-body text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-body text-xs font-semibold text-[#111827]">
                        What's this about?
                      </label>
                      <select
                        name="reason"
                        value={form.reason}
                        onChange={handleChange}
                        required
                        className="bg-[#F3F4F6] border-2 border-transparent rounded-xl px-4 py-3 font-body text-[#111827] text-sm focus:outline-none focus:border-[#111827] focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Pick a topic…</option>
                        {contactReasons.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-body text-xs font-semibold text-[#111827]">
                        Your message
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tell us what's on your mind…"
                        className="bg-[#F3F4F6] border-2 border-transparent rounded-xl px-4 py-3 font-body text-[#111827] text-sm placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:border-[#111827] focus:bg-white transition-all"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] font-body font-semibold text-white text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
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
                          Send message
                          <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
    }, 2800);
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
      title: "Upload your script",
      desc: "Share your concept, your logline, your fire. A few clicks and you're in.",
      icon: PenLine,
    },
    {
      step: "02",
      title: "AI cuts your trailer",
      desc: "A 30-second visual taste of your story — tone, mood, world — rendered while you wait.",
      icon: Film,
    },
    {
      step: "03",
      title: "Get matched, not lost",
      desc: "Industry professionals and investors find you based on what they're actually looking for.",
      icon: Users,
    },
    {
      step: "04",
      title: "Unlock & earn",
      desc: "Buyers unlock your full script. You get paid. No middlemen, no waiting around.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="font-body bg-[#0F172A] text-[#F9FAFB] overflow-x-hidden">
      <FontInjection />

      {/* ══════════════════════════════════════
          INVESTOR REVIEW POPUP
          ══════════════════════════════════════ */}
      <AnimatePresence>
        {showInvestorReviewPopup && reviewStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center px-5"
            onClick={closeInvestorReviewPopup}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-md bg-[#1F2937] rounded-3xl p-8 shadow-2xl border border-[#374151]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeInvestorReviewPopup}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#CBD5E1] transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-white/10">
                {reviewStatus === "pending" ? (
                  <Clock3 className="w-6 h-6 text-[#F9FAFB]" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-300" />
                )}
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-[#F9FAFB] leading-tight mb-3">
                {reviewStatus === "pending" ? (
                  <>Your profile is <em>under review</em></>
                ) : (
                  <>Profile not <em className="text-red-300">approved</em></>
                )}
              </h3>

              <p className="font-body text-sm text-[#CBD5E1] leading-relaxed mb-6">
                {reviewStatus === "pending"
                  ? "Our team is reviewing your investor profile. Expect a decision within 2–3 days — we'll email you the moment it's approved."
                  : rejectedNote
                    ? `Your investor profile was not approved. Reason: ${rejectedNote}`
                    : "Your investor profile was not approved. Reach out and we'll walk you through next steps."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-[#374151]">
                <a
                  href="mailto:info.ckript@gmail.com"
                  className="font-body text-xs font-medium text-[#CBD5E1] hover:text-white transition-colors break-all"
                >
                  info.ckript@gmail.com
                </a>
                <Link
                  to="/login"
                  onClick={closeInvestorReviewPopup}
                  className="sm:ml-auto bg-[#6366F1] text-white font-body text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-[#4F46E5] transition-colors text-center"
                >
                  Open Login →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          NAVIGATION
          ══════════════════════════════════════ */}
      <MarketingHeader />

      {/* ══════════════════════════════════════
          HERO — simple, left-aligned, big headline
          ══════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden grain pt-28 pb-20">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={homeImg1}
            alt=""
            className="w-full h-full object-cover opacity-40"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-[#0F172A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="max-w-5xl">

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.05 }}
                className="font-display text-[#F9FAFB] mb-8"
                style={{
                  fontSize: 'clamp(2.75rem, 7.5vw, 7.5rem)',
                  lineHeight: '0.95',
                  letterSpacing: '-0.035em',
                  fontWeight: 600,
                }}
              >
                Your Ideas<br />
                Deserve <em className="italic" style={{ fontWeight: 600 }}>More</em><br />
                Than Rejection.
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="font-body text-[#CBD5E1] leading-relaxed max-w-2xl mb-10"
                style={{ fontSize: 'clamp(1rem, 1.3vw, 1.2rem)' }}
              >
                Ckript is where writers meet the people who actually finance films.
                Upload your script, watch AI cut your trailer, get matched with industry professionals
                and investors looking for stories like yours.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  to="/writer-onboarding"
                  className="group flex items-center justify-center gap-2 bg-[#6366F1] text-white font-body text-sm font-semibold px-8 py-4 rounded-full hover:bg-[#4F46E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(79,70,229,0.4)]"
                >
                  I'm a writer
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/producer-director-onboarding"
                  className="group flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-[#F8FAFC] font-body text-sm font-semibold px-8 py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
                >
                  I'm an Industry Professional
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      {/* ══════════════════════════════════════
          MARQUEE — dark transition strip
          ══════════════════════════════════════ */}
      <div className="relative bg-[#0F172A] text-[#CBD5E1] py-5 overflow-hidden border-t border-b border-white/10">
        <div className="flex whitespace-nowrap marquee-track">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-10 pr-10">
              {[
                "Now casting untold stories",
                "✦",
                "From the page to the screen",
                "✦",
                "Writers, industry professionals, investors",
                "✦",
                "Every great film began as a script",
                "✦",
                "Your story deserves an audience",
                "✦",
              ].map((item, i) => (
                <span
                  key={`${groupIdx}-${i}`}
                  className="font-display text-xl italic font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          THE PROBLEM — light section
          ══════════════════════════════════════ */}
      <section className="relative pt-24 pb-10 sm:pt-32 sm:pb-14 px-4 sm:px-8 bg-[#F8FAFC] overflow-hidden">
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20 max-w-3xl"
          >
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-5">
              The problem
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] leading-[1.05] tracking-tight font-medium">
              The film industry is <em>broken</em><br />
              on both sides of the page.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Writers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-[#6366F1]/35 shadow-[0_10px_30px_rgba(17,24,39,0.05)] hover:border-[#6366F1]/60 hover:shadow-[0_20px_50px_rgba(17,24,39,0.10)] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-6">
                <PenLine className="w-5 h-5 text-[#111827]" />
              </div>

              <p className="font-body text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
                If you're a writer
              </p>
              <h3 className="font-display text-3xl sm:text-4xl text-[#111827] mb-6 leading-tight font-medium">
                Brilliant pages,<br />
                <em className="text-[#6B7280]">no audience.</em>
              </h3>

              <ul className="space-y-3 mb-8">
                {[
                  "Your script sits in a drawer or an inbox nobody opens",
                  "Gatekeepers say \"pass\" without reading past page three",
                  "No real way to reach industry professionals who'd actually fund you",
                  "Your best story ages while you wait for permission",
                ].map((line, i) => (
                  <li key={i} className="flex gap-3 font-body text-sm sm:text-base text-[#6B7280] leading-relaxed">
                    <span className="text-[#9CA3AF] shrink-0 mt-0.5">→</span>
                    {line}
                  </li>
                ))}
              </ul>

              <Link
                to="/writer-onboarding"
                className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-[#111827] border-b border-[#111827] pb-1 hover:gap-3 transition-all"
              >
                Start as a writer
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Industry */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-[#6366F1]/35 shadow-[0_10px_30px_rgba(17,24,39,0.05)] hover:border-[#6366F1]/60 hover:shadow-[0_20px_50px_rgba(17,24,39,0.10)] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-6">
                <TrendingUp className="w-5 h-5 text-[#111827]" />
              </div>

              <p className="font-body text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
                If you're in the industry
              </p>
              <h3 className="font-display text-3xl sm:text-4xl text-[#111827] mb-6 leading-tight font-medium">
                Too much noise,<br />
                <em className="text-[#6B7280]">too little signal.</em>
              </h3>

              <ul className="space-y-3 mb-8">
                {[
                  "Thousands of unfiltered submissions, no way to find the gems",
                  "No preview of tone or vision before reading 110 pages",
                  "Discovery is slow, expensive, and built on who-you-know",
                  "The next big film is out there — and you're missing it",
                ].map((line, i) => (
                  <li key={i} className="flex gap-3 font-body text-sm sm:text-base text-[#6B7280] leading-relaxed">
                    <span className="text-[#9CA3AF] shrink-0 mt-0.5">→</span>
                    {line}
                  </li>
                ))}
              </ul>

              <Link
                to="/producer-director-onboarding"
                className="group inline-flex items-center gap-2 font-body text-sm font-semibold text-[#111827] border-b border-[#111827] pb-1 hover:gap-3 transition-all"
              >
                Start as an Industry Professional
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mt-16 sm:mt-20 max-w-5xl mx-auto text-center overflow-hidden rounded-3xl border border-white/20 shadow-[0_20px_60px_rgba(15,23,42,0.35)]"
          >
            <img
              src={homeImg2}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-[#111827]/50 to-[#0F172A]/70" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 sm:px-10 sm:py-24">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-white mb-4 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">
                Enter Ckript
              </p>
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-white italic leading-relaxed font-medium [text-shadow:0_2px_14px_rgba(0,0,0,0.65)]">
                "We cut the gatekeepers and the fog. Writers get seen. Industry professionals get clarity. Everyone gets back to making films."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES SHOWCASE
          ══════════════════════════════════════ */}
      <Suspense
        fallback={
          <section className="py-20 px-6 bg-[#F8FAFC]" aria-label="Loading features">
            <div className="max-w-7xl mx-auto">
              <div className="font-body text-sm text-[#6B7280]">Loading features…</div>
            </div>
          </section>
        }
      >
        <FeaturesShowcase />
      </Suspense>

      {/* ══════════════════════════════════════
          HOW IT WORKS — dark with cinematic background
          ══════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-8 bg-[#0F172A] grain overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={homeImg2}
            alt=""
            className="w-full h-full object-cover opacity-40"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#0F172A]/55 to-[#0F172A]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/85 via-[#0F172A]/30 to-[#0F172A]/85" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20 max-w-3xl"
          >
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-5">
              How it works
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#F9FAFB] leading-[1.05] tracking-tight font-medium">
              Four steps. <em>One story.</em>
            </h2>
            <p className="font-body text-base sm:text-lg text-[#CBD5E1] mt-5 max-w-xl leading-relaxed">
              From the first line on the page to the moment you get paid — here's how Ckript
              takes your script from idea to industry.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {processSteps.map((item, index) => {
              const isActive = index === activeProcessStep;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setActiveProcessStep(index)}
                  className={`group relative text-left p-7 rounded-3xl border backdrop-blur-md transition-all duration-500 ${
                    isActive
                      ? "bg-white/10 border-[#6366F1]/60 shadow-[0_20px_50px_rgba(79,70,229,0.25)]"
                      : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-8">
                    <span
                      className={`font-display text-6xl leading-none font-medium transition-colors duration-500 ${
                        isActive ? "text-[#A5B4FC]" : "text-white/20"
                      }`}
                    >
                      {item.step}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? "bg-[#6366F1] text-white"
                          : "bg-white/10 text-[#CBD5E1] group-hover:bg-white/15"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-display text-2xl text-[#F9FAFB] mb-3 leading-tight font-medium">
                    {item.title}
                  </h3>
                  <p className="font-body text-sm text-[#CBD5E1] leading-relaxed">
                    {item.desc}
                  </p>

                  <div
                    className={`absolute bottom-0 left-7 right-7 h-0.5 bg-[#6366F1] rounded-full transition-all duration-500 ${
                      isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    }`}
                  />
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 sm:mt-20 text-center"
          >
            <Link
              to="/join"
              className="group inline-flex items-center gap-2 bg-[#6366F1] text-white font-body text-sm font-semibold px-8 py-4 rounded-full hover:bg-[#4F46E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(79,70,229,0.4)]"
            >
              Start your story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTACT
          ══════════════════════════════════════ */}
      <ContactSection />

      {/* ══════════════════════════════════════
          FOOTER
          ══════════════════════════════════════ */}
      <footer className="relative bg-[#0F172A] border-t border-white/10 py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-7 w-auto" />
              <span className="font-body text-xs text-[#94A3B8]">
                © 2026 Ckript. All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 font-body text-sm text-[#94A3B8]">
              <Link to="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <a
                href="https://www.linkedin.com/company/ckript/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;