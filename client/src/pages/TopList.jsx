import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";
import ProjectCard from "../components/ProjectCard";

/* ── Constants ─────────────────────────────────────── */ 
const GENRES = [
  "Thriller","Drama","Comedy","Sci-Fi","Horror","Romance",
  "Action","Mystery","Fantasy","Animation","Crime","Adventure",
];
const CONTENT_TYPES = [
  { key: "movie",       label: "Movie"       },
  { key: "tv_series",   label: "TV Series"   },
  { key: "short_film",  label: "Short Film"  },
  { key: "web_series",  label: "Web Series"  },
  { key: "documentary", label: "Documentary" },
  { key: "anime",       label: "Anime"       },
  { key: "book",        label: "Book"        },
  { key: "startup",     label: "Startup"     },
];
const BUDGETS = [
  { key: "micro",       label: "Micro"       },
  { key: "low",         label: "Low"         },
  { key: "mid",         label: "Mid"         },
  { key: "high",        label: "High"        },
  { key: "blockbuster", label: "Blockbuster" },
];
const PREMIUM_OPTIONS = [
  { key: "all",     label: "All"     },
  { key: "premium", label: "Premium" },
  { key: "free",    label: "Free"    },
];

/* ── Sort Tabs ─────────────────────────────────────── */
const SORT_TABS = [
  { key: "platform",  label: "Top Ranked",  desc: "Ranked by overall platform score",   icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { key: "score",     label: "AI Score",    desc: "Ranked by script quality score",     icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { key: "views",     label: "Most Viewed", desc: "Ranked by total views",              icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" },
];

const ease = [0.25, 0.46, 0.45, 0.94];

/* ── Icon Components ───────────────────────────────── */
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PageIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const StarIcon = ({ cls }) => (
  <svg className={cls || "w-3.5 h-3.5"} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const ChevronDown = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ── Rank Medal ─────────────────────────────────────── */
const RankMedal = ({ rank }) => {
  if (rank === 1) return (
    <div className="absolute top-3 left-3 z-20 flex flex-col items-center gap-0.5">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-400/40 ring-2 ring-amber-200/60">
        <span className="text-[13px] font-black text-amber-900">1</span>
      </div>
      <span className="text-[8px] font-extrabold text-amber-300 uppercase tracking-widest drop-shadow">GOLD</span>
    </div>
  );
  if (rank === 2) return (
    <div className="absolute top-3 left-3 z-20 flex flex-col items-center gap-0.5">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-300/40 ring-2 ring-slate-200/50">
        <span className="text-[13px] font-black text-slate-700">2</span>
      </div>
      <span className="text-[8px] font-extrabold text-slate-300 uppercase tracking-widest drop-shadow">SILVER</span>
    </div>
  );
  if (rank === 3) return (
    <div className="absolute top-3 left-3 z-20 flex flex-col items-center gap-0.5">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-400/40 ring-2 ring-orange-200/50">
        <span className="text-[13px] font-black text-orange-900">3</span>
      </div>
      <span className="text-[8px] font-extrabold text-orange-300 uppercase tracking-widest drop-shadow">BRONZE</span>
    </div>
  );
  return (
    <div className="absolute top-3 left-3 z-20 w-7 h-7 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center border border-white/15">
      <span className="text-[11px] font-bold text-white/70">#{rank}</span>
    </div>
  );
};

/* ── Pill ─────────────────────────────────────────── */
const Pill = ({ active, onClick, children, dark }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 border ${
      active
        ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm"
        : dark
          ? "bg-white/[0.04] text-gray-300 border-[#1d3454] hover:bg-white/[0.08] hover:text-gray-200"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm"
    }`}
  >
    {children}
  </button>
);

const FilterSection = ({ label, children, dark }) => (
  <div className="space-y-2.5">
    <span className={`text-[11px] font-bold uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-400"}`}>{label}</span>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

/* ── Skeleton ─────────────────────────────────────── */
const SkeletonCard = ({ dark }) => (
  <div className={`rounded-2xl overflow-hidden border ${dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-gray-100"}`}>
    <div className={`h-[240px] animate-pulse ${dark ? "bg-[#162236]" : "bg-gray-100"}`} />
    <div className="p-5 space-y-3">
      <div className={`h-3 rounded-full animate-pulse w-3/4 ${dark ? "bg-[#1d3050]" : "bg-gray-100"}`} />
      <div className={`h-3 rounded-full w-1/2 animate-pulse ${dark ? "bg-[#162236]" : "bg-gray-50"}`} />
      <div className={`h-1.5 rounded-full animate-pulse mt-4 ${dark ? "bg-[#162236]" : "bg-gray-100"}`} />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT — Top List
══════════════════════════════════════════════════════ */
const TopList = () => {
  const { isDarkMode: dark } = useDarkMode();

  const t = {
    card:        dark ? "bg-[#0d1926] border-[#1a2e47] hover:border-[#264060]" : "bg-white border-gray-100 hover:border-gray-200",
    cardShadow:  dark ? "hover:shadow-xl hover:shadow-black/25" : "hover:shadow-xl",
    header:      dark ? "text-gray-100" : "text-gray-900",
    sub:         dark ? "text-gray-400" : "text-gray-400",
    divider:     dark ? "border-[#1a2e47]" : "border-gray-100",
    stat:        dark ? "bg-white/[0.04] border-[#1a2e47]" : "bg-gray-50 border-gray-200",
    statLabel:   dark ? "text-[#8896a7]" : "text-gray-500",
    statValue:   dark ? "text-white" : "text-gray-800",
    filterPanel: dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-gray-100",
    sortActive:  "bg-[#1e3a5f] text-white shadow-lg shadow-[#1e3a5f]/30",
    sortIdle:    dark ? "bg-white/[0.04] text-gray-300 border-[#1d3454] hover:bg-white/[0.08] hover:text-gray-200" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm",
    filterBtn:   dark ? "bg-white/[0.04] border-[#1d3454] text-gray-300 hover:bg-white/[0.08] hover:text-gray-200" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm",
    tag:         dark ? "bg-blue-500/15 text-blue-300 border-blue-400/25" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f] border-transparent",
    tagX:        dark ? "hover:bg-blue-500/25" : "hover:bg-[#1e3a5f]/10",
    statPill:    dark ? "text-gray-400" : "text-gray-400",
    emptyCard:   dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-gray-100",
    emptyTitle:  dark ? "text-gray-100" : "text-gray-800",
    metricBar:   dark ? "bg-[#162236]" : "bg-gray-100",
    iconMuted:   dark ? "text-gray-500" : "text-gray-300",
  };

  /* ── State ── */
  const [scripts, setScripts]                         = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [loadError, setLoadError]                     = useState("");
  const [sortBy, setSortBy]                           = useState("platform");
  const [filtersOpen, setFiltersOpen]                 = useState(false);
  const [selectedGenre, setSelectedGenre]             = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedBudget, setSelectedBudget]           = useState("");
  const [selectedPremium, setSelectedPremium]         = useState("all");

  const activeFilterCount = [
    selectedGenre, selectedContentType, selectedBudget,
    selectedPremium !== "all" ? selectedPremium : "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedGenre("");
    setSelectedContentType("");
    setSelectedBudget("");
    setSelectedPremium("all");
  };

  useEffect(() => { fetchScripts(); }, [sortBy, selectedGenre, selectedContentType, selectedBudget, selectedPremium]);

  const fetchScripts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      params.append("sort", sortBy);
      params.append("limit", "24");
      if (selectedGenre)       params.append("genre", selectedGenre);
      if (selectedContentType) params.append("contentType", selectedContentType);
      if (selectedBudget)      params.append("budget", selectedBudget);
      if (selectedPremium === "premium") params.append("premium", "true");
      else if (selectedPremium === "free") params.append("premium", "false");
      const { data } = await api.get(`/scripts/top-list?${params.toString()}`, { timeout: 10000 });
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.scripts)
          ? data.scripts
          : [];
      setScripts(rows);
    } catch {
      setScripts([]);
      setLoadError("Unable to load top projects right now. Please retry.");
    }
    setLoading(false);
  };

  /* ── Metrics ── */
  const getMetric = (script) => {
    if (sortBy === "platform")   { const v = Math.round(script.platformScore || 0);  return { value: v, pct: Math.min(v, 100) }; }
    if (sortBy === "score")      { const v = script.scriptScore?.overall || 0;        return { value: v, pct: Math.min(v, 100) }; }
    if (sortBy === "engagement") { const v = Math.round(script.engagementScore || 0); return { value: v, pct: Math.min(v, 100) }; }
    const v = script.views || 0;
    return { value: v.toLocaleString(), pct: Math.min((v / 1000) * 100, 100) };
  };

  const resolveImage = (url) => {
    if (!url) return "";
    return url.startsWith("http") || url.startsWith("data:") ? url : `http://localhost:5002${url}`;
  };

  const numericMetrics = scripts.map(s => {
    const v = getMetric(s).value;
    return typeof v === "string" ? Number(v.replaceAll(",", "")) || 0 : Number(v) || 0;
  });
  const topScore  = numericMetrics.length ? Math.max(...numericMetrics) : 0;
  const maxForBar = topScore || 1;

  const activeTab = SORT_TABS.find((tab) => tab.key === sortBy) || SORT_TABS[0];

  /* ── Loading ── */
  if (loading && scripts.length === 0) return (
    <div className="w-full px-0">
      <div className="mb-6 px-0 pt-0">
        <div className={`h-8 w-40 rounded-xl animate-pulse mb-2 ${dark ? "bg-[#162236]" : "bg-gray-100"}`} />
        <div className={`h-4 w-64 rounded-lg animate-pulse ${dark ? "bg-[#1a2e47]" : "bg-gray-50"}`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-0 pb-0">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} dark={dark} />)}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6 px-0 pt-0 pb-0">

      {/* ═══════ HEADER ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={`rounded-2xl border p-6 relative overflow-hidden ${dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-[#1e3a5f]/20 shadow-sm"}`}
      >
        <div className={`absolute inset-0 pointer-events-none ${dark
          ? "bg-gradient-to-br from-[#1e3a5f]/10 via-transparent to-transparent"
          : "bg-gradient-to-br from-[#1e3a5f]/[0.03] via-transparent to-transparent"
        }`} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#1e3a5f] to-[#3a7bd5]" />
              <h1 className={`text-[28px] font-semibold tracking-[-0.01em] ${t.header}`}>Top List</h1>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <p className={`text-[14px] font-normal leading-[1.6] ml-[18px] ${t.sub}`}>{activeTab.desc}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.07]" : "bg-gray-50 border-gray-100"}`}>
              <span className={`text-[12px] font-medium uppercase tracking-[0.08em] mb-0.5 ${dark ? "text-white/25" : "text-gray-400"}`}>Total</span>
              <span className={`text-[20px] font-semibold tabular-nums leading-none ${dark ? "text-white" : "text-gray-900"}`}>{scripts.length}</span>
            </div>
            <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${
              dark ? "bg-[#1e3a5f]/15 border-[#1e3a5f]/25" : "bg-[#1e3a5f]/[0.05] border-[#1e3a5f]/15"
            }`}>
              <span className={`text-[12px] font-medium uppercase tracking-[0.08em] mb-0.5 ${dark ? "text-[#7aafff]/50" : "text-[#1e3a5f]/50"}`}>#1 Score</span>
              <span className={`text-[20px] font-semibold tabular-nums leading-none ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`}>{topScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════ SORT TABS + FILTERS ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07, ease }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {SORT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSortBy(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 whitespace-nowrap border ${
                    sortBy === tab.key ? t.sortActive : t.sortIdle
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 border ${
                filtersOpen || activeFilterCount > 0
                  ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm"
                  : dark
                    ? "bg-[#0d1926] text-white/45 border-[#1d3454] hover:border-white/[0.15] hover:text-white/70"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-md text-[10px] font-bold">{activeFilterCount}</span>
              )}
              <ChevronDown open={filtersOpen} />
            </button>
          </div>

          {activeFilterCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
              {selectedGenre && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium uppercase tracking-[0.08em] border ${dark ? "bg-[#1e3a5f]/20 text-[#7aafff] border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f] border-[#1e3a5f]/15"}`}>
                  {selectedGenre} <button onClick={() => setSelectedGenre("")} className="hover:opacity-60"><XIcon /></button>
                </span>
              )}
              {selectedContentType && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium uppercase tracking-[0.08em] border ${dark ? "bg-[#1e3a5f]/20 text-[#7aafff] border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f] border-[#1e3a5f]/15"}`}>
                  {CONTENT_TYPES.find(c => c.key === selectedContentType)?.label} <button onClick={() => setSelectedContentType("")} className="hover:opacity-60"><XIcon /></button>
                </span>
              )}
              {selectedBudget && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium uppercase tracking-[0.08em] border ${dark ? "bg-[#1e3a5f]/20 text-[#7aafff] border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f] border-[#1e3a5f]/15"}`}>
                  {BUDGETS.find(b => b.key === selectedBudget)?.label} <button onClick={() => setSelectedBudget("")} className="hover:opacity-60"><XIcon /></button>
                </span>
              )}
              {selectedPremium !== "all" && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium uppercase tracking-[0.08em] border ${dark ? "bg-[#1e3a5f]/20 text-[#7aafff] border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f] border-[#1e3a5f]/15"}`}>
                  {selectedPremium === "premium" ? "Premium" : "Free"} <button onClick={() => setSelectedPremium("all")} className="hover:opacity-60"><XIcon /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className={`text-[11px] font-semibold px-2 py-1 transition-colors ${dark ? "text-white/25 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}>
                Clear all
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className={`rounded-2xl border p-5 sm:p-6 space-y-5 mb-3 ${dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-gray-100 shadow-sm"}`}>
                <FilterSection label="Genre" dark={dark}>
                  <Pill active={!selectedGenre} onClick={() => setSelectedGenre("")} dark={dark}>All Genres</Pill>
                  {GENRES.map(g => <Pill key={g} active={selectedGenre === g} onClick={() => setSelectedGenre(selectedGenre === g ? "" : g)} dark={dark}>{g}</Pill>)}
                </FilterSection>
                <div className={`border-t ${t.divider}`} />
                <FilterSection label="Content Type" dark={dark}>
                  <Pill active={!selectedContentType} onClick={() => setSelectedContentType("")} dark={dark}>All Types</Pill>
                  {CONTENT_TYPES.map(ct => <Pill key={ct.key} active={selectedContentType === ct.key} onClick={() => setSelectedContentType(selectedContentType === ct.key ? "" : ct.key)} dark={dark}>{ct.label}</Pill>)}
                </FilterSection>
                <div className={`border-t ${t.divider}`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FilterSection label="Budget" dark={dark}>
                    <Pill active={!selectedBudget} onClick={() => setSelectedBudget("")} dark={dark}>Any</Pill>
                    {BUDGETS.map(b => <Pill key={b.key} active={selectedBudget === b.key} onClick={() => setSelectedBudget(selectedBudget === b.key ? "" : b.key)} dark={dark}>{b.label}</Pill>)}
                  </FilterSection>
                  <FilterSection label="Pricing" dark={dark}>
                    {PREMIUM_OPTIONS.map(p => <Pill key={p.key} active={selectedPremium === p.key} onClick={() => setSelectedPremium(p.key)} dark={dark}>{p.label}</Pill>)}
                  </FilterSection>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex sm:hidden justify-end">
                    <button onClick={clearAllFilters} className={`text-[12px] font-semibold px-3 py-1.5 rounded-xl border ${dark ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-red-500 border-red-200 bg-red-50"}`}>
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════ CONTENT ═══════ */}
      {scripts.length === 0 && !loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border py-24 text-center ${t.emptyCard}`}
        >
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${dark ? "bg-[#162236]" : "bg-gray-50"}`}>
            <svg className={`w-7 h-7 ${t.iconMuted}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className={`text-[16px] font-bold mb-1.5 ${t.emptyTitle}`}>{loadError ? "Couldn’t load Top List" : "No projects found"}</p>
          <p className={`text-[13px] mb-5 ${t.sub}`}>{loadError || "Try adjusting your filters or check back later"}</p>
          {loadError && (
            <button onClick={fetchScripts} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-[14px] font-medium hover:bg-[#162d4a] transition-colors shadow-sm mr-2">
              Retry loading
            </button>
          )}
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-[14px] font-medium hover:bg-[#162d4a] transition-colors shadow-sm">
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={sortBy}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-7"
          >
            {scripts.map((script, index) => {
              const rank     = index + 1;
              const metric   = getMetric(script);
              const hasCover = !!script.coverImage;
              const rawVal   = typeof metric.value === "string"
                ? Number(metric.value.replaceAll(",", "")) || 0
                : Number(metric.value) || 0;
              const barPct   = Math.round((rawVal / maxForBar) * 100);

              return (
                <motion.div
                  key={script._id || index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.32, ease }}
                >
                  <Link
                    to={`/script/${script._id}`}
                    className={`group flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl h-full ${t.card} ${t.cardShadow}`}
                  >
                    {/* ── Top accent bar ── */}
                    <div className={`h-[3px] w-full bg-gradient-to-r ${
                      rank === 1 ? "from-amber-400 to-yellow-300" :
                      rank === 2 ? "from-slate-300 to-slate-400"  :
                      rank === 3 ? "from-orange-400 to-amber-400" :
                      "from-[#1e3a5f] to-[#3a7bd5]"
                    }`} />

                    {/* ── Cover ── */}
                    <div className="relative h-[236px] overflow-hidden shrink-0">
                      {hasCover ? (
                        <>
                          <img
                            src={resolveImg(script.coverImage)}
                            alt={script.title}
                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#071525] via-[#0f2439] to-[#162f50] flex items-center justify-center p-6 relative overflow-hidden">
                          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[#3a7bd5]/[0.05] blur-2xl" />
                          <div className="absolute text-8xl font-black text-white/[0.025] select-none leading-none bottom-0 right-2">#{rank}</div>
                          <div className="relative z-10 text-center">
                            <h4 className="text-[18px] font-semibold text-white leading-[1.35] line-clamp-2 tracking-[-0.01em]">{script.title}</h4>
                            {(script.logline || script.description) && (
                              <p className="text-[14px] font-normal text-white/55 mt-2.5 line-clamp-2 leading-[1.6]">{script.logline || script.description}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <RankMedal rank={rank} />

                      {(script.genre || script.primaryGenre) && (
                        <span className="absolute top-3 right-3 z-10 text-[12px] font-medium uppercase tracking-[0.08em] text-white bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                          {script.primaryGenre || script.genre}
                        </span>
                      )}

                      {script.price > 0 ? (
                        <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 bg-[#1e3a5f]/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg">
                          <span className="text-sm font-extrabold text-white">${script.price}</span>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20">
                          <span className="text-xs font-semibold text-white">Free</span>
                        </div>
                      )}

                      {hasCover && (
                        <div className="absolute bottom-3 left-12 z-10 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/20 bg-white/10 shrink-0">
                            {script.creator?.profileImage
                              ? <img src={resolveImg(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                              : <span className="text-[8px] font-bold text-white flex items-center justify-center h-full">{script.creator?.name?.charAt(0)?.toUpperCase()}</span>
                            }
                          </div>
                          <span className="text-sm font-medium text-white/80 drop-shadow truncate max-w-[110px]">{script.creator?.name || "Unknown"}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Info Panel ── */}
                    <div className="flex flex-col flex-1 p-6 lg:p-7">
                      <h3 className={`text-[18px] font-semibold leading-[1.35] mb-3 line-clamp-2 ${t.header}`}>
                        {script.title}
                      </h3>

                      {(script.logline || script.description) && (
                        <p className={`text-[14px] font-normal leading-[1.6] line-clamp-3 mb-5 ${t.sub}`}>
                          {script.logline || script.description}
                        </p>
                      )}

                      {(script.contentType || script.budget) && (
                        <div className="flex items-center gap-2.5 flex-wrap mb-6">
                          {script.contentType && (
                            <span className={`text-[12px] font-medium uppercase tracking-[0.08em] px-2.5 py-1 rounded-lg border ${dark ? "bg-white/[0.04] text-white/45 border-white/[0.07]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {script.contentType.replace(/_/g, " ")}
                            </span>
                          )}
                          {script.budget && (
                            <span className={`text-[12px] font-medium uppercase tracking-[0.08em] px-2.5 py-1 rounded-lg border ${dark ? "bg-white/[0.03] text-white/35 border-white/[0.05]" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                              {script.budget}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-[12px] font-medium uppercase tracking-[0.08em] ${t.sub}`}>
                            {activeTab.label}
                          </span>
                          <span className={`text-[20px] font-semibold tabular-nums ${t.statValue}`}>
                            {metric.value}
                          </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${t.metricBar}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.7, delay: index * 0.04 + 0.2, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#3a7bd5]"
                          />
                        </div>
                      </div>

                      <div className={`flex items-center justify-between pt-4 border-t mt-auto gap-3 ${t.divider}`}>
                        <div className="flex items-center flex-wrap gap-3.5">
                          <div className={`flex items-center gap-1.5 ${t.statPill}`}>
                            <EyeIcon />
                            <span className="text-[12px] font-medium tabular-nums">{(script.views || 0).toLocaleString()}</span>
                          </div>
                          {script.scriptScore?.overall > 0 && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <StarIcon cls="w-3.5 h-3.5" />
                              <span className="text-[12px] font-medium tabular-nums">{script.scriptScore.overall}</span>
                            </div>
                          )}
                          {script.pageCount && (
                            <div className={`flex items-center gap-1.5 ${t.statPill}`}>
                              <PageIcon />
                              <span className="text-[12px] font-medium tabular-nums">{script.pageCount}p</span>
                            </div>
                          )}
                        </div>

                        <span className={`shrink-0 text-[14px] font-medium px-[18px] py-2 rounded-xl border transition-all group-hover:scale-105 ${
                          dark
                            ? "bg-[#1e3a5f] text-white border-[#1e3a5f]/60 group-hover:bg-[#243f6a]"
                            : "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm group-hover:bg-[#162d4a]"
                        }`}>Read →</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default TopList;