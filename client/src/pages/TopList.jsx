import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";

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

const TIME_PERIODS = [
  { key: "alltime", label: "All Time" },
  { key: "monthly", label: "Monthly" },
  { key: "weekly",  label: "Weekly" },
];

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

/* ── Rank Badge ────────────────────────────────────── */
const RankBadge = ({ rank, dark }) => {
  const medals = {
    1: { bg: "from-[#c2c2e0] to-[#8686AC]", text: "text-[#0F0E47]", shadow: "shadow-[#8686AC]/40" },
    2: { bg: "from-slate-300 to-gray-200",   text: "text-slate-700", shadow: "shadow-slate-300/40" },
    3: { bg: "from-[#505081] to-[#272757]", text: "text-[#c2c2e0]", shadow: "shadow-[#505081]/40" },
  };
  const medal = medals[rank];
  if (medal) {
    return (
      <div className={`absolute top-3 left-3 w-8 h-8 rounded-full bg-gradient-to-br ${medal.bg} ${medal.text} flex items-center justify-center text-[12px] font-black shadow-lg ${medal.shadow} z-10`}>
        {rank}
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

/* ── Rank Change Indicator ───────────────────────────── */
const RankChange = ({ change }) => {
  if (change === 0 || change === null || change === undefined) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100/60 text-gray-400 dark:bg-white/5">
        <span>—</span>
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
        </svg>
        +{change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-500">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
      </svg>
      {change}
    </span>
  );
};

/* ── Save Button ─────────────────────────────────────── */
const SaveButton = ({ scriptId, dark }) => {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/users/watchlist/add", { scriptId });
      setSaved(true);
    } catch {
      setSaved(true); // optimistic — already saved is fine
    }
    setSaving(false);
  };

  return (
    <button
      onClick={handleSave}
      title={saved ? "Saved to library" : "Save to library"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
        saved
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
          : dark
            ? "bg-white/15 hover:bg-white/25 text-white border border-white/20"
            : "bg-white/90 hover:bg-white text-[#111111] border border-white/60 shadow-sm"
      }`}
    >
      {saving ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : saved ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      )}
      {saved ? "Saved" : "Save"}
    </button>
  );
};

/* ── Pill ─────────────────────────────────────────────── */
const Pill = ({ active, onClick, children, dark }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 border ${
      active
        ? "bg-[#111111] text-white border-[#111111] shadow-sm"
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
    <span className={`text-[13px] font-bold uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-400"}`}>
      {label}
    </span>
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
    divider:     dark ? "border-[#333]" : "border-gray-100",
    stat:        dark ? "bg-white/[0.04] border-[#333]" : "bg-[#111111]/[0.05] border-transparent",
    statLabel:   dark ? "text-gray-400" : "text-gray-400",
    statValue:   dark ? "text-cyan-300" : "text-[#111111]",
    filterPanel: dark ? "bg-[#101e30] border-[#333]" : "bg-white border-gray-100",
    sortActive:  "bg-[#111111] text-white shadow-lg shadow-[#111111]/30",
    sortIdle:    dark ? "bg-white/[0.04] text-gray-300 border-[#444] hover:bg-white/[0.08] hover:text-gray-200" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm",
    filterBtn:   dark ? "bg-white/[0.04] border-[#444] text-gray-300 hover:bg-white/[0.08] hover:text-gray-200" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm",
    filterBtnActive: "bg-[#111111] text-white border-[#111111] shadow-sm",
    tag:         dark ? "bg-blue-500/15 text-blue-300 border-blue-400/25" : "bg-[#111111]/[0.06] text-[#111111] border-transparent",
    tagX:        dark ? "hover:bg-blue-500/25" : "hover:bg-[#111111]/10",
    statPill:    dark ? "text-gray-400" : "text-gray-400",
    emptyCard:   dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-gray-100",
    emptyTitle:  dark ? "text-gray-100" : "text-gray-800",
    metricBar:   dark ? "bg-[#162236]" : "bg-gray-100",
    iconMuted:   dark ? "text-gray-500" : "text-gray-300",
    // Hover overlay
    hoverOverlay: dark ? "bg-[#0a1628]/90 backdrop-blur-md" : "bg-[#0f1d35]/85 backdrop-blur-md",
    hoverPreviewText: "text-white/90",
    hoverPreviewSub:  "text-white/55",
    hoverTag:         "bg-white/10 text-white/80 border border-white/10",
    // Period tabs
    periodTab:       dark ? "bg-[#101e30] border-[#333]" : "bg-white border-gray-100",
    periodTabActive: "bg-[#111111] text-white border-[#111111] shadow-sm",
    periodTabIdle:   dark ? "bg-white/[0.04] text-gray-300 border-[#444] hover:bg-white/[0.08] hover:text-white" : "bg-white text-gray-500 border-gray-200 hover:border-[#111111]/30 hover:text-[#111111]",
  };

  /* ── State ── */
  const [scripts, setScripts]           = useState([]);
  const [prevScripts, setPrevScripts]   = useState([]);  // for rank change calculation
  const [loading, setLoading]           = useState(true);
  const [sortBy, setSortBy]             = useState("platform");
  const [timePeriod, setTimePeriod]     = useState("alltime");
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [selectedGenre, setSelectedGenre]             = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedBudget, setSelectedBudget]           = useState("");
  const [selectedPremium, setSelectedPremium]         = useState("all");
  const [hoveredId, setHoveredId]       = useState(null);

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

  useEffect(() => {
    fetchScripts();
  }, [sortBy, timePeriod, selectedGenre, selectedContentType, selectedBudget, selectedPremium]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sort", sortBy);
      if (timePeriod !== "alltime") params.append("period", timePeriod);
      if (selectedGenre)       params.append("genre", selectedGenre);
      if (selectedContentType) params.append("contentType", selectedContentType);
      if (selectedBudget)      params.append("budget", selectedBudget);
      if (selectedPremium === "premium") params.append("premium", "true");
      else if (selectedPremium === "free") params.append("premium", "false");
      const { data } = await api.get(`/scripts?${params.toString()}`);
      const fresh = Array.isArray(data) ? data : [];
      // Save current ordering as previous for next fetch's rank change calc
      setPrevScripts(scripts.length > 0 ? scripts : []);
      setScripts(fresh);
    } catch {
      setScripts([]);
    }
    setLoading(false);
  };

  // Compute rank change: positive = moved up, negative = moved down
  const getRankChange = useCallback((scriptId, currentRank) => {
    if (prevScripts.length === 0) return 0;
    const prevRank = prevScripts.findIndex(s => (s._id || s.id) === scriptId);
    if (prevRank === -1) return null; // new entry
    const change = (prevRank + 1) - currentRank; // positive = improved rank
    return change;
  }, [prevScripts]);

  const sortTabs = [
    { key: "platform",   label: "Platform", desc: "Ranked by overall platform performance" },
    { key: "score",      label: "AI Score", desc: "Ranked by script quality score"         },
    { key: "engagement", label: "Readers",  desc: "Ranked by reader engagement"            },
    { key: "views",      label: "Views",    desc: "Ranked by total views"                  },
  ];

  const getMetric = (script) => {
    if (sortBy === "platform")   { const v = Math.round(script.platformScore || 0);  return { value: v, pct: Math.min(v, 100) }; }
    if (sortBy === "score")      { const v = script.scriptScore?.overall || 0;        return { value: v, pct: Math.min(v, 100) }; }
    if (sortBy === "engagement") { const v = Math.round(script.engagementScore || 0); return { value: v, pct: Math.min(v, 100) }; }
    const v = script.views || 0;
    return { value: v.toLocaleString(), pct: Math.min((v / 1000) * 100, 100) };
  };

  const resolveImg = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `http://localhost:5002${url}`;
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className={`h-8 w-40 rounded-xl animate-pulse mb-2 ${dark ? "bg-[#162236]" : "bg-gray-100"}`} />
        <div className={`h-4 w-64 rounded-lg animate-pulse ${dark ? "bg-[#1a2e47]" : "bg-gray-50"}`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} dark={dark} />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ═══════ HEADER ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={`rounded-2xl border p-6 relative overflow-hidden ${dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-gray-200/70 shadow-sm"}`}
      >
        <div className={`absolute inset-0 pointer-events-none ${dark
          ? "bg-gradient-to-br from-[#1e3a5f]/10 via-transparent to-transparent"
          : "bg-gradient-to-br from-[#1e3a5f]/[0.03] via-transparent to-transparent"
        }`} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#111111] to-[#3a7bd5]" />
              <h1 className={`text-3xl font-extrabold tracking-tight ${t.header}`}>Top List</h1>
            </div>
            <p className={`text-[15px] font-medium ml-[18px] ${t.sub}`}>
              {sortTabs.find(tab => tab.key === sortBy)?.desc}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${t.stat}`}>
              <span className={`text-[13px] font-semibold ${t.statLabel}`}>Scripts</span>
              <span className={`text-[16px] font-extrabold tabular-nums ${t.statValue}`}>{scripts.length}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${t.stat}`}>
              <span className={`text-[13px] font-semibold ${t.statLabel}`}>Top</span>
              <span className={`text-[16px] font-extrabold tabular-nums ${t.statValue}`}>{topScore.toLocaleString()}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              dark ? "bg-white/[0.04] border-[#1a2e47]" : "bg-gray-50 border-transparent"
            }`}>
              <span className={`text-[13px] font-semibold ${t.statLabel}`}>Avg</span>
              <span className={`text-[16px] font-extrabold tabular-nums ${dark ? "text-gray-200" : "text-gray-500"}`}>{avgMetric.toLocaleString()}</span>
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
        {/* ── Time Period tabs ── */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[13px] font-bold uppercase tracking-widest mr-1 ${
            dark ? "text-gray-500" : "text-gray-400"
          }`}>Period</span>
          <div className={`inline-flex items-center gap-1 p-1 rounded-xl border ${t.periodTab}`}>
            {TIME_PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setTimePeriod(p.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] font-semibold transition-all duration-200 border ${
                  timePeriod === p.key ? t.periodTabActive : t.periodTabIdle
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {SORT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSortBy(tab.key)}
                  className={`px-4 py-2 rounded-xl text-[15px] font-semibold transition-all duration-200 whitespace-nowrap border ${
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
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[15px] font-semibold transition-all duration-200 border ${
                filtersOpen || activeFilterCount > 0 ? t.filterBtnActive : t.filterBtn
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
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold border ${t.tag}`}>
                  {selectedGenre}
                  <button onClick={() => setSelectedGenre("")} className={`rounded p-0.5 transition-colors ${t.tagX}`}><XIcon /></button>
                </span>
              )}
              {selectedContentType && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold border ${t.tag}`}>
                  {CONTENT_TYPES.find(c => c.key === selectedContentType)?.label || selectedContentType}
                  <button onClick={() => setSelectedContentType("")} className={`rounded p-0.5 transition-colors ${t.tagX}`}><XIcon /></button>
                </span>
              )}
              {selectedBudget && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold border ${t.tag}`}>
                  {budgetLabel[selectedBudget]} Budget
                  <button onClick={() => setSelectedBudget("")} className={`rounded p-0.5 transition-colors ${t.tagX}`}><XIcon /></button>
                </span>
              )}
              {selectedPremium !== "all" && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold border ${t.tag}`}>
                  {selectedPremium === "premium" ? "Premium" : "Free"}
                  <button onClick={() => setSelectedPremium("all")} className={`rounded p-0.5 transition-colors ${t.tagX}`}><XIcon /></button>
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
                  <div className="flex sm:hidden justify-end pt-1">
                    <button onClick={clearAllFilters} className="text-[14px] font-semibold text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 border border-red-400/30 rounded-xl bg-red-500/10">
                      Clear all filters
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
          <p className={`text-[18px] font-bold mb-1 ${t.emptyTitle}`}>No projects found</p>
          <p className={`text-[15px] mb-5 ${t.sub}`}>Try adjusting your filters or check back later</p>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white rounded-xl text-sm font-semibold hover:bg-[#000000] transition-colors shadow-sm">
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {scripts.map((script, index) => {
            const metric   = getMetric(script);
            const hasCover = !!script.coverImage;
            const rank     = index + 1;
            return (
              <motion.div
                key={script._id || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                onMouseEnter={() => setHoveredId(script._id || index)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative"
              >
                <Link
                  to={`/script/${script._id}`}
                  className={`group block rounded-2xl overflow-hidden transition-all duration-300 border ${t.card} ${t.cardShadow} hover:-translate-y-1.5`}
                >
                  {/* ── Cover ── */}
                  <div className="relative h-[400px] bg-gradient-to-br from-[#091a2f] via-[#0f2d52] to-[#1a4a7a] overflow-hidden">
                    {hasCover ? (
                      <>
                        <img
                          src={resolveImg(script.coverImage)}
                          alt={script.title}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#091a2f]/80 via-[#091a2f]/20 to-transparent" />
                      </>
                    ) : (
                      <>
                        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-white/[0.04]" />
                        <div className="absolute top-16 -right-4 w-20 h-20 rounded-full border border-white/[0.03]" />
                        <div className="absolute bottom-12 -left-4 w-24 h-24 rounded-full border border-white/[0.03]" />
                        <div className="absolute top-6 right-6 flex flex-col gap-1.5 items-end">
                          <div className="w-10 h-[2px] rounded-full bg-white/10" />
                          <div className="w-6 h-[2px] rounded-full bg-white/[0.06]" />
                          <div className="w-8 h-[2px] rounded-full bg-white/[0.04]" />
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-8">
                          <h4 className="text-2xl font-extrabold text-white leading-tight line-clamp-2 tracking-tight mb-3">
                            {script.title}
                          </h4>
                          <p className="text-[13px] text-white/40 line-clamp-2 leading-relaxed font-medium">
                            {script.logline || script.description || script.synopsis || "No description available"}
                          </p>
                        </div>
                      </>
                    )}

                    <RankBadge rank={rank} dark={dark} />

                    {(script.primaryGenre || script.genre) && (
                      <span className="absolute top-3 right-3 text-[12px] font-bold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                        {script.primaryGenre || script.genre}
                      </span>
                    )}

                    {script.premium ? (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#505081]/90 backdrop-blur-sm rounded-lg shadow-lg">
                        <span className="text-[13px] font-extrabold text-white">${script.price}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-lg">
                        <span className="text-[12px] font-bold text-white">Free</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20 overflow-hidden">
                        {script.creator?.profileImage ? (
                          <img src={resolveImg(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-white">{script.creator?.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-[13px] font-semibold text-white/80 drop-shadow">{script.creator?.name || "Unknown"}</span>
                    </div>

                    {/* ── Hover Quick-Preview Overlay ── */}
                    <AnimatePresence>
                      {hoveredId === (script._id || index) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className={`absolute inset-0 flex flex-col justify-end p-4 z-20 ${t.hoverOverlay}`}
                          onClick={(e) => e.preventDefault()}
                        >
                          {/* Preview content */}
                          <div className="mb-3">
                            <p className={`text-[15px] font-bold mb-1 leading-snug ${t.hoverPreviewText}`}>
                              {script.title}
                            </p>
                            {(script.logline || script.description || script.synopsis) && (
                              <p className={`text-[13px] leading-relaxed line-clamp-3 mb-2 ${t.hoverPreviewSub}`}>
                                {script.logline || script.description || script.synopsis}
                              </p>
                            )}
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {script.genre && (
                                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-lg ${t.hoverTag}`}>{script.genre}</span>
                              )}
                              {script.contentType && (
                                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-lg ${t.hoverTag}`}>{script.contentType}</span>
                              )}
                              {script.pageCount && (
                                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-lg ${t.hoverTag}`}>{script.pageCount} pages</span>
                              )}
                            </div>
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <SaveButton scriptId={script._id} dark={dark} />
                            <Link
                              to={`/script/${script._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#111111] hover:bg-[#000000] text-white transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                              View
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── Info Section ── */}
                  <div className="p-7">
                    {/* Title + rank change row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className={`text-[20px] font-bold leading-snug line-clamp-1 flex-1 ${
                        dark ? "text-gray-100 group-hover:text-white" : "text-gray-900 group-hover:text-[#111111]"
                      } transition-colors`}>
                        {script.title}
                      </h3>
                      <RankChange change={getRankChange(script._id || index, rank)} />
                    </div>

                    {/* Metric bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[12px] font-bold uppercase tracking-wider ${t.sub}`}>
                          {sortTabs.find(tab => tab.key === sortBy)?.label}
                        </span>
                        <span className={`text-[17px] font-extrabold tabular-nums ${dark ? "text-white" : "text-gray-800"}`}>
                          {metric.value}
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${t.metricBar}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.pct}%` }}
                          transition={{ duration: 0.6, delay: index * 0.04 + 0.2, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-[#111111] to-[#3a7bd5]"
                        />
                      </div>
                    </div>
                    <div className={`border-t ${t.divider} mb-3`} />
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1 ${t.statPill}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[11px] font-semibold tabular-nums">{(script.views || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {script.scriptScore?.overall > 0 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-[#8686AC]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                            </svg>
                            <span className={`text-[13px] font-semibold tabular-nums ${t.statPill}`}>{script.scriptScore.overall}</span>
                          </div>
                        )}
                        {script.pageCount && (
                          <div className={`flex items-center gap-1 ${t.statPill}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-[13px] font-semibold tabular-nums">{script.pageCount}p</span>
                          </div>
                          <span className="text-[11px] font-semibold text-white/75 drop-shadow truncate max-w-[90px]">{script.creator?.name || "Unknown"}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Info Panel ── */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className={`text-[15px] font-extrabold leading-snug mb-1.5 line-clamp-2 ${t.header}`}>
                        {script.title}
                      </h3>

                      {(script.logline || script.description) && (
                        <p className={`text-[12px] leading-relaxed line-clamp-2 mb-3 ${t.sub}`}>
                          {script.logline || script.description}
                        </p>
                      )}

                      {(script.contentType || script.budget) && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-4">
                          {script.contentType && (
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border capitalize ${dark ? "bg-white/[0.04] text-white/35 border-white/[0.07]" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                              {script.contentType.replace(/_/g, " ")}
                            </span>
                          )}
                          {script.budget && (
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border capitalize ${dark ? "bg-white/[0.03] text-white/25 border-white/[0.05]" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                              {script.budget}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${t.sub}`}>
                            {activeTab.label}
                          </span>
                          <span className={`text-[15px] font-extrabold tabular-nums ${t.statValue}`}>
                            {metric.value}
                          </span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${t.metricBar}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.7, delay: index * 0.04 + 0.2, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#3a7bd5]"
                          />
                        </div>
                      </div>

                      <div className={`flex items-center justify-between pt-3.5 border-t mt-auto gap-2 ${t.divider}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 ${t.statPill}`}>
                            <EyeIcon />
                            <span className="text-[12px] font-semibold tabular-nums">{(script.views || 0).toLocaleString()}</span>
                          </div>
                          {script.scriptScore?.overall > 0 && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <StarIcon cls="w-3.5 h-3.5" />
                              <span className="text-[12px] font-semibold tabular-nums">{script.scriptScore.overall}</span>
                            </div>
                          )}
                          {script.pageCount && (
                            <div className={`flex items-center gap-1.5 ${t.statPill}`}>
                              <PageIcon />
                              <span className="text-[12px] font-semibold tabular-nums">{script.pageCount}p</span>
                            </div>
                          )}
                        </div>

                        <span className={`shrink-0 text-[12px] font-bold px-3.5 py-1.5 rounded-xl border transition-all group-hover:scale-105 ${
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
