import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import api from "../services/api";
import ProjectCard from "../components/ProjectCard";

/*  Filter Constants  */
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

const PREMIUM_OPTIONS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free Only" },
  { key: "premium", label: "Premium Only" },
];

const RATING_OPTIONS = [
  { key: "", label: "Any" },
  { key: "3", label: "3+ ★" },
  { key: "4", label: "4+ ★" },
  { key: "4.5", label: "4.5+ ★" },
];

const SORT_OPTIONS = [
  { key: "", label: "Relevance", icon: "" },
  { key: "engagement", label: "Trending", icon: "" },
  { key: "views", label: "Most Viewed", icon: "" },
  { key: "score", label: "Top Rated", icon: "" },
  { key: "price_high", label: "Highest Paid", icon: "" },
  { key: "price_low", label: "Price: Low→High", icon: "" },
];

/*  Icons  */
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

/*  Theme Tokens  */
const getTokens = (dark) => dark ? {
  // Page
  pageBg: "-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen bg-[#0a1628]",
  // Header
  title: "text-white",
  subtitle: "text-slate-400",
  accentBar: "from-blue-400 to-cyan-400",
  // Search bar
  searchWrap: "bg-[#0f1d35]/80 backdrop-blur-sm border-[#1a3050] hover:border-[#2a4570]",
  searchFocused: "!border-blue-500/40 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/10",
  searchIcon: "text-slate-500",
  searchInput: "text-white placeholder:text-slate-500",
  searchClearBtn: "bg-[#1a3050] hover:bg-[#243d5e]",
  searchClearIcon: "text-slate-400",
  searchHint: "text-slate-600 border-slate-700/60",
  // Tabs
  tabBar: "bg-[#0f1d35]/60 backdrop-blur-sm border border-[#1a3050]/50",
  tabActive: "bg-gradient-to-r from-[#111111] to-[#2a5a8f] text-white shadow-lg shadow-[#111111]/30",
  tabIdle: "text-slate-400 hover:text-slate-200",
  // Filter button
  filterBtnActive: "bg-gradient-to-r from-[#111111] to-[#2a5a8f] text-white border-[#111111] shadow-lg shadow-[#111111]/20",
  filterBtnIdle: "bg-[#0f1d35]/80 text-slate-300 border-[#1a3050] hover:border-[#2a4570] hover:bg-[#132744]",
  // Filter tags
  filterTag: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  filterTagX: "hover:bg-blue-500/20",
  clearAll: "text-slate-500 hover:text-red-400",
  // Filter panel
  filterPanel: "bg-[#0f1d35]/90 backdrop-blur-sm border-[#1a3050] shadow-2xl shadow-black/20",
  filterDivider: "border-[#1a3050]/60",
  filterClearMobile: "text-red-400 hover:text-red-300 border-red-500/20 bg-red-500/10",
  // Pill
  pillActive: "bg-gradient-to-r from-[#111111] to-[#2a5a8f] text-white border-transparent shadow-md shadow-[#111111]/20",
  pillIdle: "bg-[#0a1628] text-slate-400 border-[#1a3050] hover:border-[#2a4570] hover:text-slate-200 hover:bg-[#0f1d35]",
  filterLabel: "text-slate-500",
  // Loading
  spinnerTrack: "border-[#1a3050]",
  spinnerColor: "border-t-blue-400",
  spinnerText: "text-slate-500",
  // Empty state
  genreHint: "text-slate-500",
  genreBtn: "text-slate-400 bg-[#0f1d35]/80 border-[#1a3050] hover:border-blue-500/30 hover:text-blue-400 hover:bg-[#132744] hover:shadow-lg hover:shadow-blue-500/5",
  // No results
  noResultBg: "bg-[#0f1d35]/60",
  noResultIcon: "text-slate-600",
  noResultTitle: "text-slate-200",
  noResultSub: "text-slate-500",
  noResultBtn: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20",
  // Results
  resultCount: "text-slate-500",
  sectionBar: "bg-gradient-to-b from-blue-400 to-cyan-400",
  sectionTitle: "text-slate-200",
  sectionCount: "text-slate-500",
  // Person card
  personCard: "bg-[#0f1d35]/70 backdrop-blur-sm border-[#1a3050]/80 hover:bg-[#132744] hover:border-[#2a4570] hover:shadow-xl hover:shadow-blue-500/5",
  personAvatarBg: "bg-[#1a3050]",
  personName: "text-white group-hover:text-blue-400",
  personBio: "text-slate-500",
  personGenreTag: "text-slate-500 bg-[#0a1628]",
  personFollowers: "text-slate-500",
  personChevron: "text-slate-600 group-hover:text-slate-400",
  // Project card
  projectCard: "bg-[#0f1d35]/70 backdrop-blur-sm border-[#1a3050]/80 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 hover:border-[#2a4570]",
  projectEmptyCover: "from-[#0a1628] via-[#0f1d35] to-[#1a3050]",
  projectEmptyIcon: "text-slate-700",
  projectTitle: "text-white group-hover:text-blue-400",
  projectDesc: "text-slate-500",
  projectStatIcon: "text-slate-600",
  projectStatValue: "text-slate-400",
  projectScoreStar: "text-[#8686AC]",
  projectScoreValue: "text-[#c2c2e0]",
  // Popularity bar
  popularityBar: "bg-blue-500/60",
  popularityTrack: "bg-[#1a3050]",
  // Suggestions dropdown
  suggestionsDrop: "bg-[#0f1d35] border-[#1a3050] shadow-2xl shadow-black/40",
  suggestionItem: "hover:bg-[#132744]",
  suggestionText: "text-white",
  suggestionSub: "text-slate-500",
  suggestionHighlight: "text-blue-400 font-bold",
  suggestionSection: "text-slate-600",
  // Trending
  trendingTitle: "text-slate-400",
  trendingChip: "bg-[#0f1d35]/80 border-[#1a3050] text-slate-300 hover:border-blue-500/40 hover:text-blue-400 hover:bg-[#132744]",
  trendingScript: "bg-[#0f1d35]/60 border-[#1a3050] hover:border-[#2a4570] hover:bg-[#132744]",
  trendingScriptTitle: "text-slate-200 group-hover:text-blue-400",
  trendingScriptGenre: "text-slate-600",
  trendingScriptStat: "text-slate-500",
} : {
  pageBg: "",
  title: "text-gray-900",
  subtitle: "text-gray-400",
  accentBar: "from-[#111111] to-[#3a7bd5]",
  searchWrap: "bg-white border-gray-200 shadow-sm",
  searchFocused: "!border-[#111111]/30 shadow-lg shadow-[#111111]/[0.05]",
  searchIcon: "text-gray-400",
  searchInput: "text-gray-900 placeholder:text-gray-400",
  searchClearBtn: "bg-gray-100 hover:bg-gray-200",
  searchClearIcon: "text-gray-500",
  searchHint: "text-gray-300 border-gray-200",
  tabBar: "bg-gray-50/80",
  tabActive: "bg-white text-[#111111] shadow-sm",
  tabIdle: "text-gray-400 hover:text-gray-600",
  filterBtnActive: "bg-[#111111] text-white border-[#111111] shadow-sm",
  filterBtnIdle: "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm",
  filterTag: "bg-[#111111]/[0.06] text-[#111111]",
  filterTagX: "hover:bg-[#111111]/10",
  clearAll: "text-gray-400 hover:text-red-500",
  filterPanel: "bg-white border-gray-100 shadow-sm",
  filterDivider: "border-gray-100",
  filterClearMobile: "text-red-500 hover:text-red-600 border-red-200 bg-red-50",
  pillActive: "bg-[#111111] text-white border-[#111111] shadow-sm shadow-[#111111]/15",
  pillIdle: "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm",
  filterLabel: "text-gray-400",
  spinnerTrack: "border-gray-100",
  spinnerColor: "border-t-[#111111]",
  spinnerText: "text-gray-400",
  genreHint: "text-gray-300",
  genreBtn: "text-gray-500 bg-white border-gray-200 hover:border-[#111111]/30 hover:text-[#111111] hover:shadow-sm",
  noResultBg: "bg-gray-50",
  noResultIcon: "text-gray-300",
  noResultTitle: "text-gray-600",
  noResultSub: "text-gray-400",
  noResultBtn: "bg-[#111111] hover:bg-[#000000] text-white shadow-sm",
  resultCount: "text-gray-400",
  sectionBar: "bg-[#111111]",
  sectionTitle: "text-gray-900",
  sectionCount: "text-gray-400",
  personCard: "bg-white border-gray-100/80 hover:bg-gray-50/50 hover:border-gray-200",
  personAvatarBg: "bg-gray-100",
  personName: "text-gray-900 group-hover:text-[#111111]",
  personBio: "text-gray-400",
  personGenreTag: "text-gray-400 bg-gray-50",
  personFollowers: "text-gray-400",
  personChevron: "text-gray-300 group-hover:text-gray-500",
  projectCard: "bg-white border-gray-100/80 hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1",
  projectEmptyCover: "from-slate-50 via-gray-50 to-slate-100",
  projectEmptyIcon: "text-gray-200",
  projectTitle: "text-gray-900 group-hover:text-[#111111]",
  projectDesc: "text-gray-400",
  projectStatIcon: "text-gray-400",
  projectStatValue: "text-gray-500",
  projectScoreStar: "text-gray-400",
  projectScoreValue: "text-gray-600",
  // Popularity bar
  popularityBar: "bg-[#111111]/70",
  popularityTrack: "bg-gray-100",
  // Suggestions dropdown
  suggestionsDrop: "bg-white border-gray-100 shadow-xl shadow-gray-200/60",
  suggestionItem: "hover:bg-gray-50",
  suggestionText: "text-gray-900",
  suggestionSub: "text-gray-400",
  suggestionHighlight: "text-[#111111] font-bold",
  suggestionSection: "text-gray-300",
  // Trending
  trendingTitle: "text-gray-400",
  trendingChip: "bg-white border-gray-200 text-gray-500 hover:border-[#111111]/30 hover:text-[#111111] hover:shadow-sm",
  trendingScript: "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm",
  trendingScriptTitle: "text-gray-900 group-hover:text-[#111111]",
  trendingScriptGenre: "text-gray-300",
  trendingScriptStat: "text-gray-400",
};

/*  Reusable Components  */
const Pill = ({ active, onClick, children, t }) => {
  const base = "px-3.5 py-[7px] rounded-xl text-[12px] font-semibold transition-all duration-200 whitespace-nowrap border cursor-pointer select-none";
  const styles = active ? t.pillActive : t.pillIdle;
  return <button onClick={onClick} className={`${base} ${styles}`}>{children}</button>;
};

const FilterSection = ({ label, children, t }) => (
  <div className="space-y-2.5">
    <h4 className={`text-[11px] font-bold uppercase tracking-widest pl-0.5 ${t.filterLabel}`}>{label}</h4>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const budgetLabel = { micro: "Micro", low: "Low", medium: "Medium", high: "High", blockbuster: "Blockbuster" };

/*  Main Component  */
const Search = () => {
  const { isDarkMode: dark } = useDarkMode();
  const t = getTokens(dark);

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "all");
  const [results, setResults] = useState({ users: [], scripts: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  /* Filter state (project filters) */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedPremium, setSelectedPremium] = useState("all");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedRating, setSelectedRating] = useState("");

  /* Suggestions state */
  const [suggestions, setSuggestions] = useState({ scripts: [], users: [] });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionsRef = useRef(null);

  /* Trending state */
  const [trending, setTrending] = useState({ scripts: [], genres: [] });
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  // Load trending on mount
  useEffect(() => {
    api.get("/search/trending").then(({ data }) => {
      setTrending(data);
      setTrendingLoaded(true);
    }).catch(() => setTrendingLoaded(true));
  }, []);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync from URL params when navigating from navbar
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    const urlType = searchParams.get("type") || "all";
    if (urlQ && urlQ !== query) setQuery(urlQ);
    if (urlType !== activeTab) setActiveTab(urlType);
  }, [searchParams]);

  const showProjectFilters = activeTab === "all" || activeTab === "projects";

  const activeFilterCount = [
    selectedGenre,
    selectedContentType,
    selectedBudget,
    selectedPremium !== "all" ? selectedPremium : "",
    selectedSort,
    selectedRating,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedGenre("");
    setSelectedContentType("");
    setSelectedBudget("");
    setSelectedPremium("all");
    setSelectedSort("");
    setSelectedRating("");
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "projects", label: "Projects" },
    { key: "writers", label: "Writers" },
    { key: "investors", label: "Investors" },
    { key: "readers", label: "Readers" },
  ];

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.trim()) {
        doSearch();
      } else if (showProjectFilters && activeFilterCount > 0) {
        // Allow filter-only browsing (no search query)
        doSearch();
      } else {
        setResults({ users: [], scripts: [] });
        setSearched(false);
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [query, activeTab, selectedGenre, selectedContentType, selectedBudget, selectedPremium, selectedSort, selectedRating]);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions({ scripts: [], users: [] });
      setSuggestionsOpen(false);
      return;
    }
    setSuggestionsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        setSuggestions(data);
        setSuggestionsOpen((data.scripts?.length > 0 || data.users?.length > 0));
      } catch {
        setSuggestions({ scripts: [], users: [] });
      }
      setSuggestionsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append("q", query.trim());
      params.append("type", activeTab);

      // Add project filters
      if (showProjectFilters) {
        if (selectedGenre) params.append("genre", selectedGenre);
        if (selectedContentType) params.append("contentType", selectedContentType);
        if (selectedBudget) params.append("budget", selectedBudget);
        if (selectedPremium === "premium") params.append("premium", "true");
        else if (selectedPremium === "free") params.append("premium", "false");
      }

      const { data } = await api.get(`/search?${params.toString()}`);

      // Client-side sort for search results
      let scripts = data.scripts || [];
      if (selectedSort && showProjectFilters) {
        scripts = [...scripts].sort((a, b) => {
          switch (selectedSort) {
            case "views": return (b.views || 0) - (a.views || 0);
            case "score": return (b.scriptScore?.overall || 0) - (a.scriptScore?.overall || 0);
            case "price_high": return (b.price || 0) - (a.price || 0);
            case "price_low": return (a.price || 0) - (b.price || 0);
            case "engagement": return (b.unlockCount || 0) - (a.unlockCount || 0);
            default: return 0;
          }
        });
      }

      // Client-side rating filter
      if (selectedRating && showProjectFilters) {
        const minRating = parseFloat(selectedRating);
        scripts = scripts.filter((s) => (s.scriptScore?.overall || 0) >= minRating);
      }

      setResults({ ...data, scripts });
    } catch {
      setResults({ users: [], scripts: [] });
    }
    setLoading(false);
  };

  const totalResults = (results.users?.length || 0) + (results.scripts?.length || 0);

  const roleColors = {
    writer: "#111111", creator: "#111111", investor: "#111111",
    reader: "#111111", producer: "#111111", director: "#111111",
    actor: "#111111", industry: "#111111", professional: "#111111",
  };

  const getProfileImage = (user) => {
    if (!user.profileImage) return null;
    return user.profileImage.startsWith("http") ? user.profileImage : `http://localhost:5002${user.profileImage}`;
  };

  const getCoverImage = (script) => {
    if (!script.coverImage) return null;
    return script.coverImage.startsWith("http") ? script.coverImage : `http://localhost:5002${script.coverImage}`;
  };

  const ease = [0.25, 0.46, 0.45, 0.94];

  return (
    <div className={t.pageBg}>
    <div className="max-w-5xl mx-auto">

      {/*  Header + Search  */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-6"
      >
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${t.accentBar}`} />
              <h1 className={`reader-typo-page-title font-extrabold tracking-tight ${t.title}`}>Search</h1>
            </div>
            <p className={`reader-typo-helper font-medium ml-[18px] ${t.subtitle}`}>
              Discover talent & projects across the platform
            </p>
          </div>
        </div>

        {/* Search bar with suggestions */}
        <div ref={suggestionsRef} className="relative">
          <div className={`relative rounded-xl border transition-all duration-300 ${t.searchWrap} ${focused ? t.searchFocused : ""}`}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-[18px] h-[18px] ${t.searchIcon}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { setFocused(true); if (suggestions.scripts?.length > 0 || suggestions.users?.length > 0) setSuggestionsOpen(true); }}
              onBlur={() => setFocused(false)}
              placeholder="Search by name, genre, title, skills..."
              className={`w-full h-12 pl-12 pr-12 bg-transparent rounded-xl text-[14px] focus:outline-none ${t.searchInput}`}
            />
            {suggestionsLoading && (
              <div className="absolute right-11 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin" />
            )}
            {query ? (
              <button
                onClick={() => { setQuery(""); setSuggestionsOpen(false); inputRef.current?.focus(); }}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${t.searchClearBtn}`}
              >
                <svg className={`w-3.5 h-3.5 ${t.searchClearIcon}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold border rounded-md px-1.5 py-0.5 select-none pointer-events-none hidden sm:block ${t.searchHint}`}>
                ⌘K
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {suggestionsOpen && (suggestions.scripts?.length > 0 || suggestions.users?.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border overflow-hidden ${t.suggestionsDrop}`}
              >
                {suggestions.scripts?.length > 0 && (
                  <div>
                    <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${t.suggestionSection}`}>Scripts</div>
                    {suggestions.scripts.map((s) => {
                      const hl = query.trim();
                      const parts = s.title.split(new RegExp(`(${hl})`, "i"));
                      return (
                        <button
                          key={s._id}
                          onMouseDown={() => { setQuery(s.title); setSuggestionsOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${t.suggestionItem}`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700/40">
                            {s.coverImage ? (
                              <img src={s.coverImage.startsWith("http") ? s.coverImage : `http://localhost:5002${s.coverImage}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-medium truncate ${t.suggestionText}`}>
                              {parts.map((part, idx) =>
                                part.toLowerCase() === hl.toLowerCase()
                                  ? <span key={idx} className={t.suggestionHighlight}>{part}</span>
                                  : part
                              )}
                            </p>
                            <p className={`text-[11px] truncate ${t.suggestionSub}`}>
                              {s.genre && <span>{s.genre}</span>}
                              {s.creator?.name && <span> · {s.creator.name}</span>}
                            </p>
                          </div>
                          {s.readsCount > 0 && (
                            <span className={`text-[10px] font-medium flex-shrink-0 ${t.suggestionSub}`}>{s.readsCount.toLocaleString()} reads</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {suggestions.users?.length > 0 && (
                  <div className={suggestions.scripts?.length > 0 ? `border-t ${dark ? "border-[#1a3050]" : "border-gray-100"}` : ""}>
                    <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${t.suggestionSection}`}>People</div>
                    {suggestions.users.map((u) => (
                      <button
                        key={u._id}
                        onMouseDown={() => { setQuery(u.name); setSuggestionsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${t.suggestionItem}`}
                      >
                        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${dark ? "bg-[#1a3050]" : "bg-gray-100"}`}>
                          {u.profileImage ? (
                            <img src={u.profileImage.startsWith("http") ? u.profileImage : `http://localhost:5002${u.profileImage}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className={`text-[12px] font-bold ${dark ? "text-blue-300" : "text-[#111111]"}`}>{u.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium truncate ${t.suggestionText}`}>{u.name}</p>
                          <p className={`text-[11px] capitalize ${t.suggestionSub}`}>{u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/*  Category tabs + Filter toggle  */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-3">
            {/* Category tabs */}
            <div className={`inline-flex items-center rounded-full p-1 gap-0.5 ${t.tabBar}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-5 py-2 rounded-full reader-typo-tab font-semibold transition-all duration-250 whitespace-nowrap ${activeTab === tab.key
                    ? t.tabActive
                    : t.tabIdle
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter toggle — only when projects are visible */}
            {showProjectFilters && (
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl reader-typo-button font-semibold transition-all duration-200 border ${filtersOpen || activeFilterCount > 0
                  ? t.filterBtnActive
                  : t.filterBtnIdle
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
            )}
          </div>

          {/* Active filter tags */}
          {showProjectFilters && activeFilterCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {selectedGenre && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${t.filterTag}`}>
                  {selectedGenre}
                  <button onClick={() => setSelectedGenre("")} className={`rounded p-0.5 transition-colors ${t.filterTagX}`}><XIcon /></button>
                </span>
              )}
              {selectedContentType && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${t.filterTag}`}>
                  {CONTENT_TYPES.find(c => c.key === selectedContentType)?.label || selectedContentType}
                  <button onClick={() => setSelectedContentType("")} className={`rounded p-0.5 transition-colors ${t.filterTagX}`}><XIcon /></button>
                </span>
              )}
              {selectedBudget && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${t.filterTag}`}>
                  {budgetLabel[selectedBudget]} Budget
                  <button onClick={() => setSelectedBudget("")} className={`rounded p-0.5 transition-colors ${t.filterTagX}`}><XIcon /></button>
                </span>
              )}
              {selectedPremium !== "all" && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${t.filterTag}`}>
                  {selectedPremium === "premium" ? "Premium" : "Free"}
                  <button onClick={() => setSelectedPremium("all")} className={`rounded p-0.5 transition-colors ${t.filterTagX}`}><XIcon /></button>
                </span>
              )}
              {selectedSort && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${t.filterTag}`}>
                  {SORT_OPTIONS.find(s => s.key === selectedSort)?.label}
                  <button onClick={() => setSelectedSort("")} className={`rounded p-0.5 transition-colors ${t.filterTagX}`}><XIcon /></button>
                </span>
              )}
              {selectedRating && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${t.filterTag}`}>
                  {RATING_OPTIONS.find(r => r.key === selectedRating)?.label}
                  <button onClick={() => setSelectedRating("")} className={`rounded p-0.5 transition-colors ${t.filterTagX}`}><XIcon /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className={`text-[11px] font-semibold transition-colors px-2 py-1 ${t.clearAll}`}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/*  Collapsible filter panel  */}
        <AnimatePresence>
          {showProjectFilters && filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className={`border rounded-2xl p-5 sm:p-6 space-y-5 mb-4 ${t.filterPanel}`}>
                {/* Sort By */}
                <FilterSection label="Sort By" t={t}>
                  {SORT_OPTIONS.map((opt) => (
                    <Pill key={opt.key} active={selectedSort === opt.key} onClick={() => setSelectedSort(selectedSort === opt.key ? "" : opt.key)} t={t}>
                      <span className="flex items-center gap-1.5">{opt.icon} {opt.label}</span>
                    </Pill>
                  ))}
                </FilterSection>

                <div className={`border-t ${t.filterDivider}`} />

                {/* Genre */}
                <FilterSection label="Genre" t={t}>
                  <Pill active={!selectedGenre} onClick={() => setSelectedGenre("")} t={t}>All Genres</Pill>
                  {GENRES.map((g) => (
                    <Pill key={g} active={selectedGenre === g} onClick={() => setSelectedGenre(selectedGenre === g ? "" : g)} t={t}>{g}</Pill>
                  ))}
                </FilterSection>

                <div className={`border-t ${t.filterDivider}`} />

                {/* Content Type */}
                <FilterSection label="Content Type" t={t}>
                  <Pill active={!selectedContentType} onClick={() => setSelectedContentType("")} t={t}>All Types</Pill>
                  {CONTENT_TYPES.map((ct) => (
                    <Pill key={ct.key} active={selectedContentType === ct.key} onClick={() => setSelectedContentType(selectedContentType === ct.key ? "" : ct.key)} t={t}>{ct.label}</Pill>
                  ))}
                </FilterSection>

                <div className={`border-t ${t.filterDivider}`} />

                {/* Budget + Premium row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FilterSection label="Budget Range" t={t}>
                    <Pill active={!selectedBudget} onClick={() => setSelectedBudget("")} t={t}>Any</Pill>
                    {BUDGETS.map((b) => (
                      <Pill key={b.key} active={selectedBudget === b.key} onClick={() => setSelectedBudget(selectedBudget === b.key ? "" : b.key)} t={t}>{b.label}</Pill>
                    ))}
                  </FilterSection>

                  <FilterSection label="Pricing" t={t}>
                    {PREMIUM_OPTIONS.map((p) => (
                      <Pill key={p.key} active={selectedPremium === p.key} onClick={() => setSelectedPremium(p.key)} t={t}>{p.label}</Pill>
                    ))}
                  </FilterSection>
                </div>

                <div className={`border-t ${t.filterDivider}`} />

                {/* Min Rating */}
                <FilterSection label="Min Rating" t={t}>
                  {RATING_OPTIONS.map((r) => (
                    <Pill key={r.key} active={selectedRating === r.key} onClick={() => setSelectedRating(selectedRating === r.key && r.key !== "" ? "" : r.key)} t={t}>{r.label}</Pill>
                  ))}
                </FilterSection>

                {/* Clear All (mobile) */}
                {activeFilterCount > 0 && (
                  <div className="flex sm:hidden justify-end pt-2">
                    <button onClick={clearAllFilters} className={`text-[12px] font-semibold transition-colors px-3 py-1.5 border rounded-xl ${t.filterClearMobile}`}>
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/*  States  */}

      {/* Loading */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-28 gap-3"
          >
            <div className={`w-8 h-8 border-[2.5px] rounded-full animate-spin ${t.spinnerTrack} ${t.spinnerColor}`} />
            <p className={`text-[13px] font-medium ${t.spinnerText}`}>Searching...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty — no query */}
      {!loading && !searched && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
          className="py-10 space-y-10"
        >
          {/* Trending searches / scripts */}
          {trendingLoaded && trending.scripts?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🔥</span>
                <p className={`text-[13px] font-bold uppercase tracking-widest ${t.trendingTitle}`}>Trending Now</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {trending.scripts.slice(0, 8).map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setQuery(s.title)}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 text-left ${t.trendingScript}`}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                      {s.coverImage ? (
                        <img src={s.coverImage.startsWith("http") ? s.coverImage : `http://localhost:5002${s.coverImage}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${dark ? "bg-[#1a3050]" : "bg-gray-100"}`}>
                          <span className="text-sm">📄</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold truncate transition-colors ${t.trendingScriptTitle}`}>{s.title}</p>
                      <p className={`text-[10px] truncate ${t.trendingScriptGenre}`}>
                        {s.genre || "Script"}
                        {(s.readsCount > 0) && <span className={` · ${t.trendingScriptStat}`}>{s.readsCount.toLocaleString()} reads</span>}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular genre chips */}
          <div>
            <p className={`text-[13px] font-bold uppercase tracking-widest mb-4 ${t.trendingTitle}`}>Browse by genre</p>
            <div className="flex flex-wrap items-center gap-2.5 max-w-lg">
              {(trending.genres?.length > 0 ? trending.genres : ["Thriller", "Drama", "Comedy", "Sci-Fi", "Horror", "Romance", "Action", "Mystery"]).map((g) => (
                <button
                  key={g}
                  onClick={() => setQuery(g)}
                  className={`px-4 py-2 text-[13px] font-medium border rounded-xl transition-all duration-200 ${t.trendingChip}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* No results */}
      {!loading && searched && totalResults === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4 ${t.noResultBg}`}>
            <svg className={`w-5 h-5 ${t.noResultIcon}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className={`text-[15px] font-semibold mb-1 ${t.noResultTitle}`}>No results{query ? ` for "${query}"` : ""}</p>
          <p className={`text-[13px] mb-4 ${t.noResultSub}`}>Try different keywords or adjust your filters</p>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${t.noResultBtn}`}>
              Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {/*  Results  */}
      {!loading && searched && totalResults > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Result count */}
          <p className={`text-[12px] font-medium mb-6 ${t.resultCount}`}>
            {totalResults} result{totalResults !== 1 ? "s" : ""}
          </p>

          {/*  People  */}
          {results.users?.length > 0 && (
            <section className="mb-10">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-1 h-4 rounded-full ${t.sectionBar}`} />
                  <h2 className={`text-[13px] font-bold uppercase tracking-wider ${t.sectionTitle}`}>People</h2>
                  <span className={`text-[11px] font-medium ml-1 ${t.sectionCount}`}>{results.users.length}</span>
                </div>
              )}

              <div className="space-y-2">
                {results.users.map((user, i) => {
                  const img = getProfileImage(user);
                  const color = roleColors[user.role] || "#6b7280";

                  return (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3, ease }}
                    >
                      <Link
                        to={`/profile/${user._id}`}
                        className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 group ${t.personCard}`}
                      >
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${t.personAvatarBg}`}>
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[14px] font-bold" style={{ color: dark ? "#93c5fd" : color }}>
                              {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <h3 className={`text-[14px] font-semibold truncate transition-colors ${t.personName}`}>
                              {user.name}
                            </h3>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide px-2 py-[2px] rounded-full"
                              style={{ color: dark ? "#93c5fd" : color, backgroundColor: dark ? "rgba(59,130,246,0.12)" : color + "10" }}
                            >
                              {user.role}
                            </span>
                            {user.writerProfile?.wgaMember && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${dark ? "text-blue-400 bg-blue-500/10" : "text-[#111111] bg-[#111111]/[0.08]"}`}>WGA</span>
                            )}
                          </div>
                          {user.bio && (
                            <p className={`text-[12px] line-clamp-1 mt-0.5 ${t.personBio}`}>{user.bio}</p>
                          )}
                          {user.sid && (
                            <p className={`text-[10px] font-semibold mt-0.5 ${t.personFollowers}`}>SID: {user.sid}</p>
                          )}
                        </div>

                        {/* Right side — meta */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          {user.writerProfile?.genres?.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1">
                              {user.writerProfile.genres.slice(0, 2).map((g) => (
                                <span key={g} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.personGenreTag}`}>{g}</span>
                              ))}
                            </div>
                          )}
                          <span className={`text-[11px] font-medium tabular-nums whitespace-nowrap ${t.personFollowers}`}>
                            {user.followerCount || 0} <span className="hidden sm:inline">follower{(user.followerCount || 0) !== 1 ? "s" : ""}</span>
                          </span>
                          <svg className={`w-4 h-4 transition-colors ${t.personChevron}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/*  Projects  */}
          {results.scripts?.length > 0 && (
            <section>
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-1 h-4 rounded-full ${t.sectionBar}`} />
                  <h2 className={`text-[13px] font-bold uppercase tracking-wider ${t.sectionTitle}`}>Projects</h2>
                  <span className={`text-[11px] font-medium ml-1 ${t.sectionCount}`}>{results.scripts.length}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.scripts.map((script, i) => {
                  const cover = getCoverImage(script);

                  return (
                    <motion.div
                      key={script._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3, ease }}
                    >
                      <Link
                        to={`/script/${script._id}`}
                        className={`block rounded-2xl border overflow-hidden transition-all duration-300 group ${t.projectCard}`}
                      >
                        {/* Cover */}
                        <div className="relative h-40 overflow-hidden">
                          {cover ? (
                            <img src={cover} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center ${t.projectEmptyCover}`}>
                              <svg className={`w-8 h-8 ${t.projectEmptyIcon}`} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                          {/* Rating badge on cover */}
                          {script.scriptScore?.overall > 0 && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                              <svg className="w-3 h-3 text-[#8686AC]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span className="text-[11px] font-bold text-[#c2c2e0] tabular-nums">{script.scriptScore.overall}</span>
                            </div>
                          )}

                          {/* Floating tags */}
                          <div className="absolute top-3 left-3 flex items-start gap-1.5">
                            {(script.genre || script.contentType) && (
                              <span className="text-[10px] font-bold text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                                {script.genre || script.contentType}
                              </span>
                            )}
                            {script.premium && (
                              <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-lg shadow-sm ${dark ? "bg-blue-500" : "bg-[#111111]"}`}>
                                ${script.price}
                              </span>
                            )}
                          </div>

                          {/* Creator at bottom */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 overflow-hidden">
                              {script.creator?.profileImage ? (
                                <img
                                  src={script.creator.profileImage.startsWith("http") ? script.creator.profileImage : `http://localhost:5002${script.creator.profileImage}`}
                                  alt="" className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[9px] font-bold text-white">{script.creator?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-white/90 drop-shadow-sm">{script.creator?.name || "Unknown"}</span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-4">
                          <h3 className={`text-[14px] font-bold leading-snug line-clamp-1 transition-colors mb-1 ${t.projectTitle}`}>
                            {script.title}
                          </h3>
                          {script.description && (
                            <p className={`text-[12px] leading-relaxed line-clamp-2 mb-3 ${t.projectDesc}`}>{script.description}</p>
                          )}

                          {/* Popularity bar */}
                          {(script.viewCount || script.views || script.readsCount) > 0 && (() => {
                            const maxInSet = Math.max(...results.scripts.map(s => s.viewCount || s.views || s.readsCount || 0), 1);
                            const pct = Math.round(((script.viewCount || script.views || script.readsCount || 0) / maxInSet) * 100);
                            return pct > 0 ? (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-[9px] font-bold uppercase tracking-widest ${t.trendingScriptStat}`}>Popularity</span>
                                  <span className={`text-[9px] font-semibold tabular-nums ${t.trendingScriptStat}`}>{pct}%</span>
                                </div>
                                <div className={`h-1 rounded-full overflow-hidden ${t.popularityTrack}`}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.04 + 0.2, ease: [0.4, 0, 0.2, 1] }}
                                    className={`h-full rounded-full ${t.popularityBar}`}
                                  />
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Stats */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <svg className={`w-3.5 h-3.5 ${t.projectStatIcon}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className={`text-[11px] font-semibold tabular-nums ${t.projectStatValue}`}>{(script.viewCount || script.views || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className={`w-3.5 h-3.5 ${t.projectStatIcon}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                              <span className={`text-[11px] font-semibold tabular-nums ${t.projectStatValue}`}>{script.unlockCount || 0}</span>
                            </div>
                            {script.readsCount > 0 && (
                              <div className="flex items-center gap-1">
                                <svg className={`w-3.5 h-3.5 ${t.projectStatIcon}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                                <span className={`text-[11px] font-semibold tabular-nums ${t.projectStatValue}`}>{script.readsCount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </motion.div>
      )}
    </div>
    </div>
  );
};

export default Search;
