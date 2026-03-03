import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

// ── AI action definitions ────────────────────────────────────────────────────
const AI_ACTIONS = [
  {
    key: "improve",
    label: "Improve",
    icon: "✨",
    description: "Make it more engaging & compelling",
    color: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/30",
  },
  {
    key: "professional",
    label: "Professional",
    icon: "🎬",
    description: "Industry-standard formatting & tone",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
  },
  {
    key: "grammar",
    label: "Fix Grammar",
    icon: "📝",
    description: "Fix spelling, grammar & punctuation",
    color: "from-green-500/20 to-green-600/10",
    border: "border-green-500/30",
  },
  {
    key: "dialogue",
    label: "Better Dialogue",
    icon: "💬",
    description: "Natural voices & subtext",
    color: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
  },
  {
    key: "emotional",
    label: "Add Emotion",
    icon: "❤️",
    description: "Deepen feelings & character arcs",
    color: "from-rose-500/20 to-rose-600/10",
    border: "border-rose-500/30",
  },
  {
    key: "shorten",
    label: "Shorten",
    icon: "✂️",
    description: "Tighten & remove filler",
    color: "from-orange-500/20 to-orange-600/10",
    border: "border-orange-500/30",
  },
  {
    key: "expand",
    label: "Expand",
    icon: "📖",
    description: "Add detail & atmosphere",
    color: "from-teal-500/20 to-teal-600/10",
    border: "border-teal-500/30",
  },
];

const AiWritingAssistant = ({ textContent, onApply, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [result, setResult] = useState(null);
  const [changes, setChanges] = useState([]);
  const [error, setError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [history, setHistory] = useState([]); // undo stack
  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if loading
        if (!isLoading) setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, isLoading]);

  const handleAction = async (actionKey, custom = null) => {
    const text = textContent?.trim();
    if (!text) {
      setError("Write some script content first, then use AI to improve it.");
      return;
    }
    if (text.length < 20) {
      setError("Add at least a few sentences before using AI assistance.");
      return;
    }

    setIsLoading(true);
    setActiveAction(actionKey || "custom");
    setError("");
    setResult(null);
    setChanges([]);

    try {
      const payload = custom
        ? { text, customInstruction: custom }
        : { text, action: actionKey };

      const { data } = await api.post("/ai/writing-assist", payload);

      setResult(data.result);
      setChanges(data.changes || []);

      if (data.usedFallback) {
        setError("AI is temporarily busy. Showing original text — please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "AI request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    // Save current text to history for undo
    setHistory((prev) => [...prev.slice(-9), textContent]);
    onApply(result);
    setResult(null);
    setChanges([]);
    setIsOpen(false);
    setActiveAction(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onApply(prev);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleAction(null, customPrompt.trim());
    setShowCustom(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Trigger Button ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isOpen
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
              : "bg-gradient-to-r from-purple-500/15 to-blue-500/15 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
          }`}
        >
          <span className="text-base">🤖</span>
          AI Assistant
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleUndo}
            title="Undo last AI change"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition"
          >
            ↩️ Undo
          </button>
        )}
      </div>

      {/* ── AI Panel ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0a1220] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            style={{ minWidth: 340 }}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/[0.06] bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Writing Assistant</h3>
                    <p className="text-[10px] text-neutral-500">Free • Powered by Gemini AI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isLoading && setIsOpen(false)}
                  className="text-neutral-500 hover:text-white transition p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="px-5 py-8 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      AI is {activeAction === "grammar" ? "fixing grammar" : activeAction === "professional" ? "making it professional" : activeAction === "shorten" ? "tightening your script" : activeAction === "expand" ? "expanding your content" : activeAction === "dialogue" ? "improving dialogue" : activeAction === "emotional" ? "adding emotional depth" : activeAction === "custom" ? "following your instructions" : "improving your script"}...
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">This usually takes 5-15 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result preview */}
            {!isLoading && result && (
              <div className="px-4 py-3 space-y-3">
                {/* Changes summary */}
                {changes.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/15 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">What changed</p>
                    <ul className="space-y-1">
                      {changes.map((change, i) => (
                        <li key={i} className="text-xs text-green-300/80 flex items-start gap-1.5">
                          <span className="text-green-400 mt-0.5 shrink-0">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preview of result */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Preview</p>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {result.length > 800 ? result.slice(0, 800) + "..." : result}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-500 hover:to-emerald-500 transition shadow-lg shadow-green-500/20"
                  >
                    ✅ Apply Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setChanges([]);
                      setActiveAction(null);
                    }}
                    className="px-4 py-2.5 bg-white/[0.06] text-neutral-400 rounded-xl text-sm font-medium hover:bg-white/[0.1] transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons grid */}
            {!isLoading && !result && (
              <div className="p-4 space-y-3">
                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => handleAction(action.key)}
                      className={`group text-left p-3 rounded-xl border ${action.border} bg-gradient-to-br ${action.color} hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{action.icon}</span>
                        <span className="text-xs font-bold text-white">{action.label}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">{action.description}</p>
                    </button>
                  ))}
                </div>

                {/* Custom instruction */}
                {!showCustom ? (
                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="w-full p-3 rounded-xl border border-dashed border-white/[0.12] text-xs text-neutral-500 hover:border-white/[0.25] hover:text-neutral-300 transition flex items-center justify-center gap-2"
                  >
                    <span>🎯</span> Custom instruction...
                  </button>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="space-y-2">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder='e.g. "Make the villain more menacing" or "Add a plot twist at the end"'
                      rows={2}
                      maxLength={500}
                      autoFocus
                      className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/30 focus:border-transparent resize-none transition"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!customPrompt.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs font-semibold hover:from-purple-500 hover:to-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🎯 Run Custom AI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustom(false);
                          setCustomPrompt("");
                        }}
                        className="px-3 py-2 bg-white/[0.06] text-neutral-400 rounded-lg text-xs hover:bg-white/[0.1] transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Tip */}
                <p className="text-[10px] text-neutral-600 text-center leading-tight px-2">
                  💡 Select any action to let AI improve your entire script. You can undo any change instantly.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiWritingAssistant;
