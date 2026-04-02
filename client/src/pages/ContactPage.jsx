import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, CheckCircle2, MessageSquare, Briefcase, HelpCircle, PhoneCall, Clock3 } from "lucide-react";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";
import { useDarkMode } from "../context/DarkModeContext";

const contactReasons = [
  { value: "doubt", label: "Question or Clarification", icon: HelpCircle },
  { value: "team", label: "Work With Us", icon: Briefcase },
  { value: "general", label: "General Feedback", icon: MessageSquare },
  { value: "email", label: "Direct Email Request", icon: Mail },
  { value: "other", label: "Other", icon: MessageSquare },
];

const ContactPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [form, setForm] = useState({ reason: "", otherReason: "", name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const theme = {
    page: isDarkMode ? "bg-[#060d16] text-white" : "bg-[#f4f7fb] text-gray-900",
    panel: isDarkMode
      ? "bg-[#0c1624] border-[#1d2e43]"
      : "bg-white border-gray-200 shadow-[0_14px_40px_rgba(15,23,42,0.08)]",
    input: isDarkMode
      ? "bg-[#08121e] border-[#24384f] text-white placeholder:text-[#50627a]"
      : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400",
    subtle: isDarkMode ? "text-[#8896a7]" : "text-gray-600",
    headingSubtle: isDarkMode ? "text-[#6b7a8d]" : "text-gray-500",
    card: isDarkMode
      ? "bg-[#0a1523] border-[#1f3349]"
      : "bg-[#f8fbff] border-gray-200",
    cardActive: isDarkMode ? "bg-[#11243a] border-[#396087] text-white" : "bg-[#edf5ff] border-[#a8c5e9] text-[#183a62]",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError("");
    setForm((prev) => {
      if (name === "reason") {
        return {
          ...prev,
          reason: value,
          otherReason: value === "other" ? prev.otherReason : "",
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.reason === "other" && !String(form.otherReason || "").trim()) {
      setError("Please tell us what 'Other' means.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/contact", form);
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <nav className="fixed top-0 w-full z-50 bg-[#080e18]/90 backdrop-blur-sm border-b border-[#151f2e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
          <Link to="/" className="inline-flex items-center" aria-label="Go to landing page">
            <BrandLogo className="h-8 sm:h-10 w-auto" />
          </Link>

          <button
            type="button"
            onClick={handleBack}
            className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium text-[#8896a7] hover:text-white transition-colors whitespace-nowrap"
          >
            Back
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mb-7 sm:mb-9"
        >
          <p className={`text-xs font-bold tracking-[0.16em] uppercase mb-2 ${theme.headingSubtle}`}>Contact</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Talk to the Ckript Team</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 sm:gap-7">
          <section className="space-y-4">
            <div className={`rounded-2xl border px-4 py-4 ${theme.card}`}>
              <p className={`text-[11px] uppercase tracking-[0.14em] font-bold mb-3 ${theme.headingSubtle}`}>Direct Contact</p>

              <div className="space-y-3">
                <a
                  href="mailto:info.ckript@gmail.com"
                  className={`flex items-center gap-2.5 text-sm font-semibold rounded-lg px-2.5 py-2 border transition-colors ${isDarkMode ? "border-[#24374d] hover:bg-white/[0.03]" : "border-gray-200 hover:bg-white"}`}
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="break-all">info.ckript@gmail.com</span>
                </a>

                <a
                  href="tel:+917986950853"
                  className={`flex items-center gap-2.5 text-sm font-semibold rounded-lg px-2.5 py-2 border transition-colors ${isDarkMode ? "border-[#24374d] hover:bg-white/[0.03]" : "border-gray-200 hover:bg-white"}`}
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>+91 7986950853</span>
                </a>

                <div className={`flex items-center gap-2.5 text-xs rounded-lg px-2.5 py-2 border ${isDarkMode ? "border-[#24374d] text-[#8ea1b8]" : "border-gray-200 text-gray-600"}`}>
                  <Clock3 className="w-4 h-4 shrink-0" />
                  <span>Mon to Sat, 10:00 AM to 7:00 PM IST</span>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-2.5 ${theme.card}`}>
              <p className={`text-[11px] uppercase tracking-[0.14em] font-bold px-2 py-1 mb-1 ${theme.headingSubtle}`}>Choose Topic</p>
              <div className="space-y-2">
                {contactReasons.map(({ value, label, icon: Icon }) => {
                  const active = form.reason === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((prev) => ({
                        ...prev,
                        reason: value,
                        otherReason: value === "other" ? prev.otherReason : "",
                      }))}
                      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors flex items-center gap-2.5 ${active ? theme.cardActive : theme.card}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-7 ${theme.panel}`}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="contact-success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-[360px] flex flex-col items-center justify-center text-center"
                >
                  <div className={`w-14 h-14 rounded-2xl mb-4 flex items-center justify-center ${isDarkMode ? "bg-emerald-500/12" : "bg-emerald-50"}`}>
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Message sent</h2>
                  <p className={`text-sm max-w-sm ${theme.subtle}`}>
                    Thank you for reaching out. Our team will review your request and get back to you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ reason: "", otherReason: "", name: "", email: "", message: "" });
                    }}
                    className={`mt-5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${isDarkMode ? "border-[#2a4159] hover:bg-[#102237]" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="contact-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-transparent sm:border-b-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Send a Message</h2>
                    <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${theme.headingSubtle}`}>Secure Contact Form</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-1 block">
                      <span className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme.headingSubtle}`}>Full name</span>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3f74aa]/35 ${theme.input}`}
                        placeholder="Jane Doe"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme.headingSubtle}`}>Email address</span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3f74aa]/35 ${theme.input}`}
                        placeholder="jane@example.com"
                      />
                    </label>
                  </div>

                  <label className="space-y-1 block">
                    <span className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme.headingSubtle}`}>Reason</span>
                    <select
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      required
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3f74aa]/35 ${theme.input}`}
                    >
                      <option value="" disabled>
                        Select a reason
                      </option>
                      {contactReasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {form.reason === "other" && (
                    <label className="space-y-1 block">
                      <span className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme.headingSubtle}`}>What is Other?</span>
                      <input
                        name="otherReason"
                        value={form.otherReason}
                        onChange={handleChange}
                        required
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3f74aa]/35 ${theme.input}`}
                        placeholder="Please specify your topic"
                      />
                    </label>
                  )}

                  <label className="space-y-1 block">
                    <span className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme.headingSubtle}`}>Message</span>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[#3f74aa]/35 ${theme.input}`}
                      placeholder="Tell us your question, issue, or request"
                    />
                  </label>

                  {error && (
                    <div className={`rounded-lg border px-3.5 py-2.5 text-sm ${isDarkMode ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#234a78] text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" />
                        </svg>
                        Sending
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-[#151f2e] bg-[#080e18]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[#4a5a6e] text-center sm:text-left">&copy; 2026 Ckript. Connecting brilliant ideas with brilliant people.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm text-[#4a5a6e]">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">T and C</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
