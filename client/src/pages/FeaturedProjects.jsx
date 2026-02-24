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
      setScripts(Array.isArray(data) ? data.slice(0, 24) : []);
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
    if (index === 0) return { bg: "bg-[#1e3a5f]", text: "text-white", label: "#1" };
    if (index === 1) return { bg: "bg-gray-300", text: "text-gray-800", label: "#2" };
    if (index === 2) return { bg: "bg-gray-400", text: "text-white", label: "#3" };
    return null;
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
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#1e3a5f] to-[#3a7bd5]" />
              <h1 className={`text-2xl font-extrabold tracking-tight ${dark ? "text-gray-100" : "text-gray-900"}`}>Featured Projects</h1>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            <p className="text-[13px] text-gray-400 font-medium ml-[18px]">
              Most talked-about scripts and highest-value projects
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
            {/* #1 Spotlight card */}
            <Link
              to={`/script/${scripts[0]._id}`}
              className="group block mb-6"
            >
                <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border ${dark ? "bg-[#101e30] border-[#333] hover:border-[#444]" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                <div className="flex flex-col sm:flex-row">
                  {/* Cover */}
                  <div className="relative sm:w-80 h-52 sm:h-auto bg-gradient-to-br from-[#0f2439] to-[#1e3a5f] shrink-0 overflow-hidden">
                    {scripts[0].coverImage ? (
                      <img
                        src={getImageUrl(scripts[0].coverImage)}
                        alt={scripts[0].title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col justify-center px-8 min-h-[200px] relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.03]" />
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/[0.02]" />
                        <div className="absolute top-6 right-6 flex gap-1.5">
                          <div className="w-8 h-1 rounded-full bg-white/10" />
                          <div className="w-4 h-1 rounded-full bg-white/[0.06]" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight mb-2">
                          {scripts[0].title}
                        </h3>
                        <p className="text-sm text-white/40 leading-relaxed line-clamp-2 max-w-md">
                          {scripts[0].description || scripts[0].synopsis || "No description available"}
                        </p>
                      </div>
                    )}
                    {/* Rank badge */}
                    <div className="absolute top-3 left-3 w-9 h-9 bg-[#1e3a5f] rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-sm font-extrabold text-white">#1</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {scripts[0].genre && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${dark ? "bg-[#1e3a5f]/30 text-blue-300" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f]"}`}>
                            {scripts[0].genre}
                          </span>
                        )}
                        {scripts[0].contentType && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${dark ? "bg-white/[0.06] text-gray-300" : "bg-gray-50 text-gray-500"}`}>
                            {scripts[0].contentType.replace(/_/g, " ")}
                          </span>
                        )}
                        {scripts[0].premium && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${dark ? "bg-[#1e3a5f]/30 text-blue-300" : "bg-[#1e3a5f]/[0.06] text-[#1e3a5f]"}`}>
                            Premium
                          </span>
                        )}
                      </div>
                      <h2 className={`text-2xl sm:text-3xl font-extrabold mb-2 group-hover:text-[#1e3a5f] transition-colors ${dark ? "text-gray-100" : "text-gray-900"}`}>
                        {scripts[0].title}
                      </h2>
                      <p className="text-base text-gray-500 leading-relaxed line-clamp-2 mb-4">
                        {scripts[0].description || scripts[0].synopsis || "No description available"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        {scripts[0].creator?.profileImage ? (
                          <img src={getImageUrl(scripts[0].creator.profileImage)} alt="" className={`w-8 h-8 rounded-full object-cover ring-2 ${dark ? "ring-[#333]" : "ring-gray-100"}`} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/[0.08] flex items-center justify-center text-xs font-bold text-[#1e3a5f]">
                            {scripts[0].creator?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>{scripts[0].creator?.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-sm font-medium">{scripts[0].views || 0}</span>
                        </div>
                        {scripts[0].price > 0 && (
                          <span className="text-lg font-extrabold text-[#1e3a5f]">${scripts[0].price}</span>
                        )}
                        {scripts[0].scriptScore?.overall && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e3a5f]/[0.06] rounded-lg">
                            <svg className="w-3.5 h-3.5 text-[#1e3a5f]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-bold text-[#1e3a5f]">{scripts[0].scriptScore.overall}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* ── Grid cards (#2+) ── */}
            {scripts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {scripts.slice(1).map((script, idx) => {
                  const rank = rankBadge(idx + 1);
                  const metric = getFeaturedMetric(script);
                  const hasCover = !!script.coverImage;
                  return (
                    <motion.div
                      key={script._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3, ease }}
                    >
                      <Link
                        to={`/script/${script._id}`}
                        className={`group block rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl border ${dark ? "border-[#333] hover:border-[#444] bg-[#101e30]" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                      >
                        {/* ── Cover Section ── */}
                        <div className="relative h-[200px] bg-gradient-to-br from-[#091a2f] via-[#0f2d52] to-[#1a4a7a] overflow-hidden">
                          {hasCover ? (
                            <>
                              <img src={getImageUrl(script.coverImage)} alt={script.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#091a2f]/80 via-[#091a2f]/20 to-transparent" />
                            </>
                          ) : (
                            <>
                              {/* Decorative geometry */}
                              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full border border-white/[0.04]" />
                              <div className="absolute bottom-12 -left-4 w-20 h-20 rounded-full border border-white/[0.03]" />
                              <div className="absolute top-6 right-5 flex flex-col gap-1.5 items-end">
                                <div className="w-10 h-[2px] rounded-full bg-white/10" />
                                <div className="w-6 h-[2px] rounded-full bg-white/[0.06]" />
                              </div>
                              {/* Title + description on cover */}
                              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
                                <h4 className="text-lg font-extrabold text-white leading-tight line-clamp-2 tracking-tight mb-1.5">
                                  {script.title}
                                </h4>
                                <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed font-medium">
                                  {script.logline || script.description || script.synopsis || "No description available"}
                                </p>
                              </div>
                            </>
                          )}

                          {/* Rank badge — top left */}
                          <div className="absolute top-3 left-3">
                            {rank ? (
                              <div className={`w-7 h-7 ${rank.bg} rounded-lg flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
                                <span className={`text-[10px] font-extrabold ${rank.text}`}>{rank.label}</span>
                              </div>
                            ) : (
                              <div className="w-7 h-7 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/15">
                                <span className="text-[10px] font-bold text-white">#{idx + 2}</span>
                              </div>
                            )}
                          </div>

                          {/* Genre badge — top right */}
                          {(script.genre || script.primaryGenre) && (
                            <span className="absolute top-3 right-3 text-[10px] font-bold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                              {script.primaryGenre || script.genre}
                            </span>
                          )}

                          {/* Price tag — if premium, show on cover */}
                          {script.premium && (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm rounded-lg shadow-lg">
                              <span className="text-[11px] font-extrabold text-white">${script.price}</span>
                            </div>
                          )}
                          {!script.premium && (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-lg">
                              <span className="text-[10px] font-bold text-white">Free</span>
                            </div>
                          )}
                        </div>

                        {/* ── Info Section ── */}
                        <div className="p-4">
                          {/* Divider */}
                          <div className={`border-t ${dark ? "border-[#333]" : "border-gray-100"} mb-3`} />

                          {/* Creator row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ring-1 shrink-0 ${dark ? "bg-[#1e3a5f]/20 ring-[#333]" : "bg-[#1e3a5f]/[0.08] ring-gray-100"}`}>
                                {script.creator?.profileImage ? (
                                  <img src={getImageUrl(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-[#1e3a5f]">{script.creator?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                                )}
                              </div>
                              <span className={`text-[11px] font-semibold truncate ${dark ? "text-gray-400" : "text-gray-500"}`}>{script.creator?.name || "Unknown"}</span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-2.5 text-gray-400 shrink-0">
                              <div className="flex items-center gap-1" title="Views">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-[11px] font-semibold tabular-nums">{(script.views || 0).toLocaleString()}</span>
                              </div>
                              {script.scriptScore?.overall > 0 && (
                                <div className="flex items-center gap-1" title="Score">
                                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-[11px] font-semibold tabular-nums">{script.scriptScore.overall}</span>
                                </div>
                              )}
                              {script.pageCount && (
                                <div className="flex items-center gap-1" title="Pages">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  <span className="text-[11px] font-semibold tabular-nums">{script.pageCount}p</span>
                                </div>
                              )}
                            </div>
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
