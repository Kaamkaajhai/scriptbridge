import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, CheckCircle2, MessageSquare, Briefcase, HelpCircle } from "lucide-react";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";
import { useDarkMode } from "../context/DarkModeContext";

const contactReasons = [
  { value: "doubt", label: "Question or Clarification", icon: HelpCircle },
  { value: "team", label: "Work With Us", icon: Briefcase },
  { value: "general", label: "General Feedback", icon: MessageSquare },
  { value: "email", label: "Direct Email Request", icon: Mail },
];

const ContactPage = () => {
  const { isDarkMode } = useDarkMode();
  const [form, setForm] = useState({ reason: "", name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const theme = {
    page: isDarkMode ? "bg-[#070e18] text-white" : "bg-[#f5f8fc] text-gray-900",
    panel: isDarkMode
      ? "bg-[#0d1520] border-[#1c2a3a]"
      : "bg-white border-gray-200 shadow-[0_12px_35px_rgba(15,23,42,0.08)]",
    input: isDarkMode
      ? "bg-[#08111c] border-[#223449] text-white placeholder:text-[#4a5a6e]"
      : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400",
    subtle: isDarkMode ? "text-[#8896a7]" : "text-gray-600",
    headingSubtle: isDarkMode ? "text-[#6b7a8d]" : "text-gray-500",
    card: isDarkMode
      ? "bg-[#0b1320] border-[#1a2a3a] hover:border-[#2a3d52]"
      : "bg-[#f8fbff] border-gray-200 hover:border-gray-300",
    cardActive: isDarkMode ? "bg-[#111f32] border-[#365478] text-white" : "bg-[#eef6ff] border-[#aac6ea] text-[#183a62]",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <header className={`sticky top-0 z-20 border-b backdrop-blur-sm ${isDarkMode ? "bg-[#070e18]/92 border-[#162435]" : "bg-white/92 border-gray-200"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center" aria-label="Go to home">
            <BrandLogo className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/terms"
              className={`text-xs sm:text-sm font-semibold transition-colors ${isDarkMode ? "text-[#8da4bf] hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              T and C
            </Link>
            <Link
              to="/privacy"
              className={`text-xs sm:text-sm font-semibold transition-colors ${isDarkMode ? "text-[#8da4bf] hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              Privacy
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mb-8"
        >
          <p className={`text-xs font-bold tracking-[0.16em] uppercase mb-2 ${theme.headingSubtle}`}>Contact</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Talk to the Ckript Team</h1>
          <p className={`mt-2 text-sm sm:text-base max-w-2xl ${theme.subtle}`}>
            Have a platform question, support issue, or business query? Send a message and we will respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          <section className="lg:col-span-2 space-y-3">
            {contactReasons.map(({ value, label, icon: Icon }) => {
              const active = form.reason === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, reason: value }))}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors flex items-center gap-3 ${active ? theme.cardActive : theme.card}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              );
            })}

            <div className={`rounded-xl border px-4 py-4 ${theme.card}`}>
              <p className={`text-[11px] uppercase tracking-[0.14em] font-bold mb-1 ${theme.headingSubtle}`}>Direct Email</p>
              <a href="mailto:info.ckript@gmail.com" className="text-sm font-semibold underline-offset-4 hover:underline break-all">
                info.ckript@gmail.com
              </a>
            </div>
          </section>

          <section className={`lg:col-span-3 rounded-2xl border p-5 sm:p-7 ${theme.panel}`}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="contact-success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-[320px] flex flex-col items-center justify-center text-center"
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
                      setForm({ reason: "", name: "", email: "", message: "" });
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
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-1 block">
                      <span className={`text-xs font-semibold ${theme.headingSubtle}`}>Full name</span>
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
                      <span className={`text-xs font-semibold ${theme.headingSubtle}`}>Email address</span>
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
                    <span className={`text-xs font-semibold ${theme.headingSubtle}`}>Reason</span>
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

                  <label className="space-y-1 block">
                    <span className={`text-xs font-semibold ${theme.headingSubtle}`}>Message</span>
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
    </div>
  );
};

export default ContactPage;
