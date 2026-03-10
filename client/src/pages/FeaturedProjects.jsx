import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";

/* ── Filter Options ────────────────────────────────── */
const GENRES = [
  "Thriller", "Drama", "Comedy", "Sci-Fi", "Horror", "Romance",
  "Action", "Mystery", "Fantasy", "Animation", "Crime", "Adventure",
];

const CONTENT_TYPES = [
  { key: "movie", label: "Movie" },
  { key: "tv_series", label: "TV Series" },
  { key: "short_film", label: "Short Film" },
  { key: "web_series", label: "Web Series" },
  { key: "documentary", label: "Documentary" },
  { key: "anime", label: "Anime" },
  { key: "book", label: "Book" },
  { key: "startup", label: "Startup" },
];

const BUDGETS = [
  { key: "micro", label: "Micro" },
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "blockbuster", label: "Blockbuster" },
];

const SORT_OPTIONS = [
  { key: "engagement", label: "Trending", icon: "flame" },
  { key: "price_high", label: "Highest Paid", icon: "dollar" },
  { key: "views", label: "Most Viewed", icon: "eye" },
  { key: "score", label: "Top Rated", icon: "star" },
  { key: "createdAt", label: "Newest", icon: "clock" },
  { key: "price_low", label: "Price: Low → High", icon: "arrowUp" },
];

const PREMIUM_OPTIONS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free Only" },
  { key: "premium", label: "Premium Only" },
];

const budgetLabel = {
  micro: "Micro", low: "Low", medium: "Medium", high: "High", blockbuster: "Blockbuster",
};

/* ── Icons ─────────────────────────────────────────── */
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const ChevronDown = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ── Main Component ────────────────────────────────── */
const FeaturedProjects = () => {
  const { isDarkMode: dark } = useDarkMode();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Filter state */
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedSort, setSelectedSort] = useState("engagement");
  const [selectedPremium, setSelectedPremium] = useState("all");

  const filterRef = useRef(null);

  const activeFilterCount = [
    selectedGenre,
    selectedContentType,
    selectedBudget,
    selectedPremium !== "all" ? selectedPremium : "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedGenre("");
    setSelectedContentType("");
    setSelectedBudget("");
    setSelectedSort("engagement");
    setSelectedPremium("all");
  };

  useEffect(() => {
    fetchFeatured();
  }, [selectedSort, selectedGenre, selectedContentType, selectedBudget, selectedPremium]);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sort", selectedSort);
      if (selectedGenre) params.append("genre", selectedGenre);
      if (selectedContentType) params.append("contentType", selectedContentType);
      if (selectedBudget) params.append("budget", selectedBudget);
      if (selectedPremium === "premium") params.append("premium", "true");
      else if (selectedPremium === "free") params.append("premium", "false");

      const { data } = await api.get(`/scripts?${params.toString()}`);
      const raw = Array.isArray(data) ? data : [];

      /* ── Client-side sort guarantee ── */
      const sorted = [...raw].sort((a, b) => {
        if (selectedSort === "views") return (b.views || 0) - (a.views || 0);
        if (selectedSort === "score") return (b.scriptScore?.overall || 0) - (a.scriptScore?.overall || 0);
        if (selectedSort === "price_high") return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (selectedSort === "price_low") return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (selectedSort === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
        /* engagement / trending default */
        const engA = a.engagementScore || a.views || 0;
        const engB = b.engagementScore || b.views || 0;
        return engB - engA;
      });

      setScripts(sorted.slice(0, 24));
    } catch {
      setScripts([]);
    }
    setLoading(false);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5001${url}`;
  };

  const rankBadge = (index) => {
    if (index === 0) return { bg: "bg-[#1e3a5f]", text: "text-white", label: `#${index + 1}`, tier: "gold" };
    if (index === 1) return { bg: "bg-slate-400", text: "text-white", label: `#${index + 1}`, tier: "silver" };
    if (index === 2) return { bg: "bg-slate-500", text: "text-white", label: `#${index + 1}`, tier: "bronze" };
    return { bg: "bg-black/40", text: "text-white", label: `#${index + 1}`, tier: "default" };
  };

  /* ── Rank metric value for a script ── */
  const getRankValue = (script) => {
    if (selectedSort === "views") return `${(script.views || 0).toLocaleString()} views`;
    if (selectedSort === "score") return `${script.scriptScore?.overall || 0} score`;
    if (selectedSort === "price_high" || selectedSort === "price_low") return script.price > 0 ? `$${script.price}` : "Free";
    if (selectedSort === "createdAt") return new Date(script.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return `${(script.views || 0).toLocaleString()} views`;
  };

  /* ── Rank bar width (0-100%) relative to #1 ── */
  const getRankBarPct = (script) => {
    if (!scripts.length) return 0;
    const top = scripts[0];
    if (selectedSort === "score") {
      const max = top.scriptScore?.overall || 1;
      return Math.round(((script.scriptScore?.overall || 0) / max) * 100);
    }
    if (selectedSort === "price_high" || selectedSort === "price_low") {
      const max = Number(top.price) || 1;
      return Math.round(((Number(script.price) || 0) / max) * 100);
    }
    /* views / engagement */
    const max = top.views || top.engagementScore || 1;
    const val = script.views || script.engagementScore || 0;
    return Math.round((val / max) * 100);
  };

  const getFeaturedMetric = (script) => {
    if (selectedSort === "score") {
      const value = script.scriptScore?.overall || 0;
      return { value, pct: Math.min(value, 100) };
    }
    if (selectedSort === "views") {
      const value = script.views || 0;
      return { value: value.toLocaleString(), pct: Math.min((value / 1000) * 100, 100) };
    }
    if (selectedSort === "price_high" || selectedSort === "price_low") {
      const value = Number(script.price || 0);
      return { value: `$${value}`, pct: Math.min((value / 500) * 100, 100) };
    }
    const value = script.engagementScore || script.views || 0;
    return { value: Math.round(value), pct: Math.min(Math.round(value), 100) };
  };

  const ease = [0.25, 0.46, 0.45, 0.94];

  /* ── Pill Button Helper ──────────────────────────── */
  const Pill = ({ active, onClick, children, variant = "default" }) => {
    const base = "px-3.5 py-[7px] rounded-xl text-[12px] font-semibold transition-all duration-200 whitespace-nowrap border cursor-pointer select-none";
    const styles = active
      ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm shadow-[#1e3a5f]/15"
      : dark
        ? "bg-white/[0.04] text-gray-300 border-[#444] hover:border-[#555] hover:text-gray-200"
        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm";
    return (
      <button onClick={onClick} className={`${base} ${styles}`}>
        {children}
      </button>
    );
  };

  /* ── Filter Section Header ───────────────────────── */
  const FilterSection = ({ label, children }) => (
    <div className="space-y-2.5">
      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-6"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#1e3a5f] to-[#3a7bd5]" />
              <h1 className={`text-2xl font-extrabold tracking-tight ${dark ? "text-gray-100" : "text-gray-900"}`}>Featured Projects</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                dark ? "bg-[#1e3a5f]/30 text-[#7aafff] border-[#1e3a5f]/40" : "bg-[#1e3a5f]/[0.07] text-[#1e3a5f] border-[#1e3a5f]/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dark ? "bg-[#7aafff]" : "bg-[#1e3a5f]"}`} />
                PROMOTED
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                dark ? "bg-white/[0.05] text-white/50 border-white/[0.08]" : "bg-gray-100 text-gray-600 border-gray-200"
              }`}>
                TRENDING
              </span>
            </div>
            <p className={`text-[13px] font-medium ml-[18px] ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Promoted & trending scripts hand-picked for industry professionals
            </p>
          </div>
          <p className="text-sm text-gray-400 font-medium tabular-nums hidden sm:block">
            {scripts.length} project{scripts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>

      {/* ── Filter bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease }}
        className="mb-6"
      >
        {/* Top row — filter toggle + sort + results count */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-3">
            {/* Filter toggle button */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 border ${filtersOpen || activeFilterCount > 0
                ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm"
                : dark
                  ? "bg-white/[0.04] text-gray-300 border-[#444] hover:border-[#555]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown open={filtersOpen} />
            </button>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                {selectedGenre && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e3a5f]/[0.06] text-[#1e3a5f] rounded-lg text-[11px] font-bold">
                    {selectedGenre}
                    <button onClick={() => setSelectedGenre("")} className="hover:bg-[#1e3a5f]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedContentType && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e3a5f]/[0.06] text-[#1e3a5f] rounded-lg text-[11px] font-bold">
                    {CONTENT_TYPES.find(c => c.key === selectedContentType)?.label || selectedContentType}
                    <button onClick={() => setSelectedContentType("")} className="hover:bg-[#1e3a5f]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedBudget && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e3a5f]/[0.06] text-[#1e3a5f] rounded-lg text-[11px] font-bold">
                    {budgetLabel[selectedBudget]} Budget
                    <button onClick={() => setSelectedBudget("")} className="hover:bg-[#1e3a5f]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedPremium !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e3a5f]/[0.06] text-[#1e3a5f] rounded-lg text-[11px] font-bold">
                    {selectedPremium === "premium" ? "Premium" : "Free"}
                    <button onClick={() => setSelectedPremium("all")} className="hover:bg-[#1e3a5f]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>


        </div>

        {/* ── Collapsible filter panel ── */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              ref={filterRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className={`${dark ? "bg-[#101e30] border-[#333]" : "bg-white border-gray-100"} rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 border`}>
                {/* Sort By */}
                <FilterSection label="Sort By">
                  {SORT_OPTIONS.map((opt) => (
                    <Pill
                      key={opt.key}
                      active={selectedSort === opt.key}
                      onClick={() => setSelectedSort(opt.key)}
                    >
                      <span className="flex items-center gap-1.5">
                        {opt.icon === "flame" && <span>🔥</span>}
                        {opt.icon === "dollar" && <span>💰</span>}
                        {opt.icon === "eye" && <span>👁</span>}
                        {opt.icon === "star" && <span>⭐</span>}
                        {opt.icon === "clock" && <span>🕐</span>}
                        {opt.icon === "arrowUp" && <span>📈</span>}
                        {opt.label}
                      </span>
                    </Pill>
                  ))}
                </FilterSection>

                <div className={`border-t ${dark ? "border-[#333]" : "border-gray-100"}`} />

                {/* Genre */}
                <FilterSection label="Genre">
                  <Pill active={!selectedGenre} onClick={() => setSelectedGenre("")}>All Genres</Pill>
                  {GENRES.map((g) => (
                    <Pill
                      key={g}
                      active={selectedGenre === g}
                      onClick={() => setSelectedGenre(selectedGenre === g ? "" : g)}
                    >
                      {g}
                    </Pill>
                  ))}
                </FilterSection>

                <div className={`border-t ${dark ? "border-[#333]" : "border-gray-100"}`} />

                {/* Content Type */}
                <FilterSection label="Content Type">
                  <Pill active={!selectedContentType} onClick={() => setSelectedContentType("")}>All Types</Pill>
                  {CONTENT_TYPES.map((ct) => (
                    <Pill
                      key={ct.key}
                      active={selectedContentType === ct.key}
                      onClick={() => setSelectedContentType(selectedContentType === ct.key ? "" : ct.key)}
                    >
                      {ct.label}
                    </Pill>
                  ))}
                </FilterSection>

                <div className={`border-t ${dark ? "border-[#333]" : "border-gray-100"}`} />

                {/* Budget + Premium row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FilterSection label="Budget Range">
                    <Pill active={!selectedBudget} onClick={() => setSelectedBudget("")}>Any</Pill>
                    {BUDGETS.map((b) => (
                      <Pill
                        key={b.key}
                        active={selectedBudget === b.key}
                        onClick={() => setSelectedBudget(selectedBudget === b.key ? "" : b.key)}
                      >
                        {b.label}
                      </Pill>
                    ))}
                  </FilterSection>

                  <FilterSection label="Pricing">
                    {PREMIUM_OPTIONS.map((p) => (
                      <Pill
                        key={p.key}
                        active={selectedPremium === p.key}
                        onClick={() => setSelectedPremium(p.key)}
                      >
                        {p.label}
                      </Pill>
                    ))}
                  </FilterSection>
                </div>

                {/* Clear All (mobile) */}
                {activeFilterCount > 0 && (
                  <div className="flex sm:hidden justify-end pt-2">
                    <button
                      onClick={clearAllFilters}
                      className={`text-[12px] font-semibold transition-colors px-3 py-1.5 rounded-xl ${dark ? "text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/10" : "text-red-500 hover:text-red-600 border border-red-200 bg-red-50"}`}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-28">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[2.5px] border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-medium">Loading projects…</p>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && scripts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-24 rounded-2xl border ${dark ? "bg-[#101e30] border-[#333]" : "bg-white border-gray-100"}`}
        >
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${dark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
            <svg className={`w-8 h-8 ${dark ? "text-gray-500" : "text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className={`text-lg font-bold mb-1 ${dark ? "text-gray-200" : "text-gray-700"}`}>No projects found</p>
          <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or check back later</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors shadow-sm"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {/* ── Hero card (top #1) ── */}
      {!loading && scripts.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedSort}-${selectedGenre}-${selectedContentType}-${selectedBudget}-${selectedPremium}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
          >
            {/* ── #1 Spotlight — Full-width promoted hero ── */}
            <Link to={`/script/${scripts[0]._id}`} className="group block mb-6">
              <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl ${
                dark
                  ? "border-[#1e3a5f]/50 hover:border-[#1e3a5f]/80 shadow-lg shadow-[#1e3a5f]/10"
                  : "border-[#1e3a5f]/20 hover:border-[#1e3a5f]/40 shadow-md shadow-[#1e3a5f]/5"
              }`}>

                {/* Promoted accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1e3a5f] via-[#3a7bd5] to-[#1e3a5f] z-20" />

                {/* Background fill */}
                <div className={`absolute inset-0 ${
                  dark
                    ? "bg-gradient-to-br from-[#0f1e30] via-[#0d1829] to-[#111d2e]"
                    : "bg-gradient-to-br from-[#f0f4f9] via-white to-[#e8f0f9]"
                }`} />

                <div className="relative z-10 flex flex-col lg:flex-row">

                  {/* Left — tall cover image */}
                  <div className="relative lg:w-[460px] h-80 lg:h-[420px] shrink-0 overflow-hidden">
                    {scripts[0].coverImage ? (
                      <>
                        <img
                          src={getImageUrl(scripts[0].coverImage)}
                          alt={scripts[0].title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 lg:to-black/40" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0a1628] via-[#1e3a5f] to-[#0d2540] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#3a7bd5]/[0.06] blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#1e3a5f]/[0.08] blur-2xl" />
                        <div className="text-5xl font-black text-white/5 absolute bottom-4 right-4 leading-none select-none">01</div>
                        <h3 className="text-2xl font-extrabold text-white text-center leading-tight tracking-tight mb-3 relative z-10">
                          {scripts[0].title}
                        </h3>
                        <p className="text-sm text-white/40 text-center line-clamp-3 relative z-10">
                          {scripts[0].logline || scripts[0].description || scripts[0].synopsis || ""}
                        </p>
                      </div>
                    )}

                    {/* Promoted badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e3a5f]/90 backdrop-blur-sm rounded-lg shadow-lg">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">#1 {SORT_OPTIONS.find(s => s.key === selectedSort)?.label || "Trending"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
                        <span className="text-[11px] font-extrabold text-white">{getRankValue(scripts[0])}</span>
                      </div>
                    </div>

                    {/* Price bottom-right */}
                    {scripts[0].price > 0 ? (
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-[#1e3a5f]/90 backdrop-blur-md rounded-xl border border-white/15 shadow-lg">
                        <span className="text-base font-extrabold text-white">${scripts[0].price}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20">
                        <span className="text-[11px] font-bold text-white">Free</span>
                      </div>
                    )}
                  </div>

                  {/* Right — info panel */}
                  <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
                    <div>
                      {/* Badges row */}
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {scripts[0].genre && (
                          <span className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${
                            dark ? "bg-[#1e3a5f]/30 text-[#7aafff] border-[#1e3a5f]/40" : "bg-[#1e3a5f]/[0.07] text-[#1e3a5f] border-[#1e3a5f]/20"
                          }`}>{scripts[0].genre}</span>
                        )}
                        {scripts[0].contentType && (
                          <span className={`px-3 py-1 rounded-lg text-[11px] font-semibold capitalize ${
                            dark ? "bg-white/[0.06] text-gray-300 border border-white/10" : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}>{scripts[0].contentType.replace(/_/g, " ")}</span>
                        )}
                        {scripts[0].premium && (
                          <span className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide border ${
                            dark ? "bg-[#1e3a5f] text-white border-[#1e3a5f]/60" : "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                          }`}>
                            ✦ Premium
                          </span>
                        )}
                        {scripts[0].budget && (
                          <span className={`px-3 py-1 rounded-lg text-[11px] font-semibold capitalize ${
                            dark ? "bg-white/[0.05] text-white/50 border border-white/[0.08]" : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}>{scripts[0].budget} Budget</span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight mb-3 group-hover:text-[#3a7bd5] transition-colors ${
                        dark ? "text-white" : "text-gray-900"
                      }`}>
                        {scripts[0].title}
                      </h2>

                      {/* Logline / description */}
                      <p className={`text-[14px] leading-relaxed line-clamp-3 mb-5 ${
                        dark ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {scripts[0].logline || scripts[0].description || scripts[0].synopsis || "No description available"}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 flex-wrap mb-5">
                        <div className={`flex items-center gap-1.5 ${ dark ? "text-gray-400" : "text-gray-500"}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[13px] font-semibold">{(scripts[0].views || 0).toLocaleString()} views</span>
                        </div>
                        {scripts[0].scriptScore?.overall > 0 && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                            dark ? "bg-[#1e3a5f]/20 border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.06] border-[#1e3a5f]/15"
                          }`}>
                            <svg className={`w-3.5 h-3.5 ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>
                            <span className={`text-[12px] font-bold ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`}>{scripts[0].scriptScore.overall} / 100</span>
                          </div>
                        )}
                        {scripts[0].pageCount && (
                          <span className={`text-[13px] font-semibold ${ dark ? "text-gray-400" : "text-gray-500"}`}>{scripts[0].pageCount} pages</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom — creator + CTA */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${ dark ? "ring-white/10" : "ring-gray-200"}`}>
                          {scripts[0].creator?.profileImage ? (
                            <img src={getImageUrl(scripts[0].creator.profileImage)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${ dark ? "bg-[#1e3a5f] text-white" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"}`}>
                              {scripts[0].creator?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`text-[12px] ${ dark ? "text-white/30" : "text-gray-400"}`}>Written by</p>
                          <p className={`text-[13px] font-bold ${ dark ? "text-white" : "text-gray-800"}`}>{scripts[0].creator?.name || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-all group-hover:scale-105 ${
                          dark
                            ? "bg-[#1e3a5f] text-white border-[#1e3a5f]/60 shadow-lg shadow-[#1e3a5f]/20 group-hover:bg-[#243f6a]"
                            : "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-md shadow-[#1e3a5f]/15 group-hover:bg-[#162d4a]"
                        }`}>
                          View Script →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* ── Grid cards (#2+) — Promoted ad-style ── */}
            {scripts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {scripts.slice(1).map((script, idx) => {
                  const rank = rankBadge(idx + 1);
                  const hasCover = !!script.coverImage;

                  return (
                    <motion.div
                      key={script._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.35, ease }}
                    >
                      <Link
                        to={`/script/${script._id}`}
                        className={`group block rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-xl border relative ${
                          dark
                            ? "border-white/[0.08] hover:border-white/[0.15] bg-[#0d1829]"
                            : "border-gray-100 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {/* Accent top bar */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1e3a5f] to-[#3a7bd5] z-10" />

                        {/* ── Cover: taller, ad-poster style ── */}
                        <div className="relative h-[360px] overflow-hidden">
                          {hasCover ? (
                            <>
                              <img
                                src={getImageUrl(script.coverImage)}
                                alt={script.title}
                                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#071525] via-[#0f2439] to-[#162f50] relative overflow-hidden">
                              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#3a7bd5]/[0.04] blur-xl" />
                              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#1e3a5f]/[0.06] blur-lg" />
                              {/* Big rank number watermark */}
                              <div className="absolute bottom-3 right-4 text-7xl font-black text-white/[0.04] select-none leading-none">#{idx + 2}</div>
                              {/* Centered title */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                <h4 className="text-xl font-extrabold text-white leading-tight tracking-tight mb-2 line-clamp-3">{script.title}</h4>
                                <p className="text-[11px] text-white/35 line-clamp-2 leading-relaxed">
                                  {script.logline || script.description || script.synopsis || ""}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Rank badge — top left */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 ${rank.bg} rounded-lg shadow-lg ring-1 ring-white/10`}>
                              <span className={`text-[12px] font-extrabold ${rank.text}`}>{rank.label}</span>
                            </div>
                            <div className="flex items-center px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
                              <span className="text-[10px] font-bold text-white/90">{getRankValue(script)}</span>
                            </div>
                          </div>

                          {/* Genre — top right */}
                          {(script.genre || script.primaryGenre) && (
                            <span className="absolute top-3 right-3 z-10 text-[10px] font-bold text-white bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                              {script.primaryGenre || script.genre}
                            </span>
                          )}

                          {/* Bottom overlay — title + price */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                            {hasCover && (
                              <h4 className="text-[15px] font-extrabold text-white leading-tight mb-1.5 line-clamp-2 drop-shadow-lg">
                                {script.title}
                              </h4>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-white/60">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-[11px] font-semibold">{(script.views || 0).toLocaleString()}</span>
                              </div>
                              {script.price > 0 ? (
                                <div className="px-2.5 py-1 bg-[#1e3a5f]/90 backdrop-blur-sm rounded-lg border border-white/10">
                                  <span className="text-[12px] font-extrabold text-white">${script.price}</span>
                                </div>
                              ) : (
                                <div className={`px-2.5 py-1 backdrop-blur-sm rounded-lg border ${
                                  dark ? "bg-white/10 border-white/20" : "bg-white/20 border-white/30"
                                }`}>
                                  <span className="text-[10px] font-bold text-white">Free</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── Info panel ── */}
                        <div className="p-5">
                          {/* Title */}
                          <h4 className={`text-[15px] font-extrabold leading-snug mb-1.5 line-clamp-2 ${dark ? "text-white" : "text-gray-900"}`}>
                            {script.title}
                          </h4>

                          {/* Logline / description */}
                          {(script.logline || script.description || script.synopsis) && (
                            <p className={`text-[12px] leading-relaxed line-clamp-2 mb-3 ${dark ? "text-white/40" : "text-gray-500"}`}>
                              {script.logline || script.description || script.synopsis}
                            </p>
                          )}

                          {/* Badges row */}
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            {script.genre && (
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                                dark ? "bg-[#1e3a5f]/20 text-[#7aafff] border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f] border-[#1e3a5f]/15"
                              }`}>{script.genre}</span>
                            )}
                            {script.contentType && (
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border capitalize ${
                                dark ? "bg-white/[0.05] text-white/40 border-white/[0.07]" : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}>{script.contentType.replace(/_/g, " ")}</span>
                            )}
                            {script.budget && (
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border capitalize ${
                                dark ? "bg-white/[0.04] text-white/30 border-white/[0.06]" : "bg-gray-50 text-gray-400 border-gray-100"
                              }`}>{script.budget} budget</span>
                            )}
                          </div>

                          {/* Rank bar */}
                          <div className="mb-4">
                            <div className={`flex items-center justify-between mb-1`}>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-white/25" : "text-gray-400"}`}>
                                {SORT_OPTIONS.find(s => s.key === selectedSort)?.label || "Rank"}
                              </span>
                              <span className={`text-[11px] font-bold tabular-nums ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`}>
                                {getRankValue(script)}
                              </span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#3a7bd5] transition-all duration-700"
                                style={{ width: `${getRankBarPct(script)}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className={`flex items-center gap-4 pb-4 mb-4 border-b ${dark ? "border-white/[0.06]" : "border-gray-100"}`}>
                            <div className={`flex items-center gap-1.5 ${dark ? "text-white/35" : "text-gray-400"}`}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-[12px] font-semibold tabular-nums">{(script.views || 0).toLocaleString()}</span>
                            </div>
                            {script.pageCount && (
                              <div className={`flex items-center gap-1.5 ${dark ? "text-white/35" : "text-gray-400"}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="text-[12px] font-semibold tabular-nums">{script.pageCount}pp</span>
                              </div>
                            )}
                            {script.scriptScore?.overall > 0 && (
                              <div className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                                dark ? "bg-[#1e3a5f]/15 border-[#1e3a5f]/25" : "bg-[#1e3a5f]/[0.05] border-[#1e3a5f]/10"
                              }`}>
                                <svg className={`w-3.5 h-3.5 ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                                </svg>
                                <span className={`text-[12px] font-bold ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`}>{script.scriptScore.overall}</span>
                              </div>
                            )}
                          </div>

                          {/* Creator row + CTA */}
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 shrink-0 ${dark ? "ring-white/10" : "ring-gray-200"}`}>
                              {script.creator?.profileImage ? (
                                <img src={getImageUrl(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-[11px] font-bold ${dark ? "bg-[#1e3a5f] text-white" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"}`}>
                                  {script.creator?.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[12px] font-semibold truncate ${dark ? "text-gray-300" : "text-gray-700"}`}>{script.creator?.name || "Unknown"}</p>
                              <p className={`text-[10px] ${dark ? "text-white/25" : "text-gray-400"}`}>Author</p>
                            </div>
                            <span className={`text-[12px] font-bold px-4 py-2 rounded-xl border transition-all group-hover:scale-105 ${
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
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default FeaturedProjects;
