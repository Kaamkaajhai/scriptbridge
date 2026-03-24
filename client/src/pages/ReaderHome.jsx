import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";
import TrendingProjects from "../components/TrendingProjects";
<<<<<<< HEAD
import ScriptCard from "../components/ScriptCard";
import {
  Drama,
  Laugh,
  Crosshair,
  Skull,
  Heart,
  Flame,
  Atom,
  Wand2,
  Search,
  Clapperboard,
  Sparkles,
  Globe,
  BookOpen,
  Music,
  Swords,
  ScrollText,
} from "lucide-react";

/* ── Genre & content-type options ── */
const GENRE_OPTS = [
  { label: "Action", icon: Flame }, { label: "Comedy", icon: Laugh },
  { label: "Drama", icon: Drama }, { label: "Horror", icon: Skull },
  { label: "Thriller", icon: Crosshair }, { label: "Romance", icon: Heart },
  { label: "Sci-Fi", icon: Atom }, { label: "Fantasy", icon: Wand2 },
  { label: "Mystery", icon: Search }, { label: "Adventure", icon: Swords },
  { label: "Crime", icon: Crosshair }, { label: "Animation", icon: Sparkles },
  { label: "Documentary", icon: Clapperboard }, { label: "Historical", icon: Globe },
  { label: "Biographical", icon: BookOpen }, { label: "Sports", icon: Flame },
  { label: "Musical", icon: Music }, { label: "Family", icon: Heart },
  { label: "Psychological", icon: ScrollText }, { label: "Dark Comedy", icon: Laugh },
];

const TYPE_OPTS = [
  { label: "feature_film", display: "Feature Film", icon: Clapperboard },
  { label: "tv_pilot", display: "TV Pilot", icon: ScrollText },
  { label: "web_series", display: "Web Series", icon: Sparkles },
  { label: "short_film", display: "Short Film", icon: BookOpen },
  { label: "documentary", display: "Documentary", icon: Clapperboard },
  { label: "animation", display: "Animation", icon: Sparkles },
  { label: "limited_series", display: "Limited Series", icon: Globe },
];

/* ── Quick-Preference Modal ── */
const QuickPrefModal = ({ dark, initialGenres, initialTypes, onSave, onClose }) => {
  const [genres, setGenres] = useState(initialGenres);
  const [types, setTypes] = useState(initialTypes);
  const [saving, setSaving] = useState(false);

  const toggle = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(genres, types);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className={`w-full rounded-2xl border overflow-hidden shadow-2xl ${
          dark ? "bg-[#0d1829] border-white/[0.08]" : "bg-white border-gray-200"
        }`}
        style={{ maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b shrink-0 ${dark ? "border-white/[0.06]" : "border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? "bg-[#1e3a5f]/30" : "bg-[#1e3a5f]/10"}`}>
              <svg className={`w-4 h-4 ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className={`text-2xl font-extrabold leading-tight ${dark ? "text-white" : "text-gray-900"}`}>Set Your Preferences</p>
              <p className={`text-base ${dark ? "text-white/45" : "text-gray-500"}`}>Your feed will show matching content first</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${dark ? "text-white/30 hover:text-white/60 hover:bg-white/[0.06]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Genres */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-base font-bold uppercase tracking-widest ${dark ? "text-white/50" : "text-gray-600"}`}>Genres</p>
              {genres.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-md ${dark ? "bg-[#1e3a5f]/30 text-[#7aafff]" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"}`}>{genres.length} selected</span>
                  <button onClick={() => setGenres([])} className={`text-sm font-semibold hover:underline ${dark ? "text-white/25 hover:text-white/50" : "text-gray-400 hover:text-gray-600"}`}>Clear</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GENRE_OPTS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(genres, setGenres, label)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold border-2 transition-all text-left ${
                    genres.includes(label)
                      ? dark ? "bg-[#1e3a5f] text-white border-[#3a7bd5] shadow-md" : "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                      : dark ? "bg-white/[0.03] text-white/50 border-white/[0.07] hover:border-[#1e3a5f]/50 hover:text-white/80" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.2} />
                  <span className="line-clamp-1">{label}</span>
                  {genres.includes(label) && (
                    <svg className="w-3 h-3 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-base font-bold uppercase tracking-widest ${dark ? "text-white/50" : "text-gray-600"}`}>Content Types</p>
              {types.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-md ${dark ? "bg-[#1e3a5f]/30 text-[#7aafff]" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"}`}>{types.length} selected</span>
                  <button onClick={() => setTypes([])} className={`text-sm font-semibold hover:underline ${dark ? "text-white/25 hover:text-white/50" : "text-gray-400 hover:text-gray-600"}`}>Clear</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTS.map(({ label, display, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(types, setTypes, label)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold border-2 transition-all text-left ${
                    types.includes(label)
                      ? dark ? "bg-[#1e3a5f] text-white border-[#3a7bd5] shadow-md" : "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                      : dark ? "bg-white/[0.03] text-white/50 border-white/[0.07] hover:border-[#1e3a5f]/50 hover:text-white/80" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.2} />
                  <span className="line-clamp-1">{display}</span>
                  {types.includes(label) && (
                    <svg className="w-3 h-3 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview banner */}
          {(genres.length > 0 || types.length > 0) && (
            <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${dark ? "bg-[#1e3a5f]/10 border-[#1e3a5f]/25" : "bg-[#1e3a5f]/[0.04] border-[#1e3a5f]/15"}`}>
              <svg className={`w-4 h-4 mt-0.5 shrink-0 ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <p className={`text-base leading-relaxed ${dark ? "text-[#7aafff]/75" : "text-[#1e3a5f]/75"}`}>
                Your feed will prioritise{" "}
                {genres.length > 0 && <strong>{genres.slice(0, 3).join(", ")}{genres.length > 3 ? ` +${genres.length - 3} more` : ""}</strong>}
                {genres.length > 0 && types.length > 0 && " · "}
                {types.length > 0 && <strong>{types.map(t => TYPE_OPTS.find(o => o.label === t)?.display).join(", ")}</strong>}
                {" "}content.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-5 border-t shrink-0 flex items-center gap-3 ${dark ? "border-white/[0.06]" : "border-gray-100"}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-xl border text-lg font-semibold transition-colors ${dark ? "bg-white/[0.04] text-white/50 border-white/[0.08] hover:bg-white/[0.08]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-[#1e3a5f] text-white text-lg font-bold hover:bg-[#162d4a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-[#1e3a5f]/20"
          >
            {saving
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              : "Save & Apply →"
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── preference match score (higher = better match) ── */
const matchScore = (script, prefGenres, prefTypes) => {
  let score = 0;
  const sg = (script.genre || script.primaryGenre || "").toLowerCase();
  const st = (script.contentType || "").toLowerCase();
  if (prefGenres.some((g) => g.toLowerCase() === sg)) score += 2;
  if (prefTypes.some((t) => t.toLowerCase() === st)) score += 1;
  return score;
};
=======
import ProjectCard from "../components/ProjectCard";
>>>>>>> origin/master

const ReaderHome = () => {
  const { isDarkMode: dark } = useDarkMode();
  const { user, setUser } = useContext(AuthContext);

  const [latestScripts, setLatestScripts] = useState([]);
  const [categories, setCategories] = useState({ contentTypes: [], genres: [] });
  const [activeCategory, setActiveCategory] = useState("all");
  const [forYouActive, setForYouActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPrefModal, setShowPrefModal] = useState(false);

  const savePreferences = useCallback(async (genres, contentTypes) => {
    try {
      await api.put("/users/update", { preferences: { genres, contentTypes } });
      setUser((prev) => prev ? { ...prev, preferences: { genres, contentTypes } } : prev);
      setForYouActive(true);
      setActiveCategory("all");
    } catch { /* silent */ }
    setShowPrefModal(false);
  }, [setUser]);

  /* user preferences from profile */
  const prefGenres = useMemo(
    () => (user?.preferences?.genres || []).map((g) => g.toLowerCase()),
    [user]
  );
  const prefTypes = useMemo(
    () => (user?.preferences?.contentTypes || []).map((t) => t.toLowerCase()),
    [user]
  );
  const hasPrefs = prefGenres.length > 0 || prefTypes.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latestRes, catRes] = await Promise.all([
          api.get("/scripts/latest"),
          api.get("/scripts/categories"),
        ]);
        setLatestScripts(Array.isArray(latestRes.data) ? latestRes.data : []);
        setCategories(catRes.data);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchData();
  }, []);

  /* When "For You" is toggled on, reset category to "all" */
  const handleForYouToggle = () => {
    setForYouActive((v) => {
      if (!v) setActiveCategory("all");
      return !v;
    });
  };

  /* When a category filter is selected, turn off "For You" */
  const handleCategorySelect = (cat) => {
    setForYouActive(false);
    setActiveCategory(cat);
  };

  const displayScripts = useMemo(() => {
    let list = latestScripts;

    /* 1. category filter */
    if (activeCategory !== "all") {
      list = list.filter(
        (s) => s.contentType === activeCategory || s.genre === activeCategory
      );
    }

    /* 2. For You — sort by preference match score */
    if (forYouActive && hasPrefs) {
      list = [...list].sort(
        (a, b) =>
          matchScore(b, prefGenres, prefTypes) -
          matchScore(a, prefGenres, prefTypes)
      );
    }

    return list;
  }, [latestScripts, activeCategory, forYouActive, prefGenres, prefTypes, hasPrefs]);

  /* count how many scripts actually match preferences */
  const matchCount = useMemo(
    () =>
      hasPrefs
        ? latestScripts.filter((s) => matchScore(s, prefGenres, prefTypes) > 0).length
        : 0,
    [latestScripts, prefGenres, prefTypes, hasPrefs]
  );

  return (
    <div className="min-h-screen pb-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-2 space-y-8">

        {/* ── FOR YOU BAR — top of page, always visible ── */}
        <div className={`rounded-2xl border p-4 ${dark ? "bg-[#0d1829] border-white/[0.06]" : "bg-white border-gray-200/70 shadow-sm"}`}>
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${dark ? "bg-[#1e3a5f]/30" : "bg-[#1e3a5f]/10"}`}>
              <svg className={`w-4 h-4 ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>

            {/* Description text */}
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold ${dark ? "text-white/85" : "text-gray-800"}`}>
                {forYouActive && hasPrefs
                  ? `${matchCount} match${matchCount !== 1 ? "es" : ""} found for your preferences`
                  : "Personalised For You"}
              </p>
              <p className={`text-sm mt-0.5 truncate ${dark ? "text-white/40" : "text-gray-500"}`}>
                {hasPrefs
                  ? forYouActive
                    ? prefGenres.concat(prefTypes).join(" · ")
                    : "Filter content based on your genre & content preferences"
                  : "Set your preferences to see tailored content first"}
              </p>
            </div>

            {/* For You toggle button */}
            <button
              onClick={handleForYouToggle}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 shrink-0 ${
                forYouActive
                  ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-md shadow-[#1e3a5f]/20"
                  : dark
                    ? "bg-white/[0.04] text-white/50 border-white/[0.1] hover:border-white/[0.2] hover:text-white/80"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#1e3a5f]/30 hover:text-[#1e3a5f] shadow-sm"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              For You
              {hasPrefs && matchCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-extrabold tabular-nums ${
                  forYouActive ? "bg-white/20 text-white" : dark ? "bg-[#1e3a5f]/30 text-[#7aafff]" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                }`}>
                  {matchCount}
                </span>
              )}
            </button>

            {/* Set / Edit Preferences button — always visible */}
            <button
              onClick={() => setShowPrefModal(true)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-base font-semibold border transition-all ${
                hasPrefs
                  ? dark ? "bg-white/[0.04] text-white/50 border-white/[0.1] hover:border-white/[0.2] hover:text-white/80" : "bg-white text-gray-500 border-gray-200 hover:border-[#1e3a5f]/30 hover:text-[#1e3a5f] shadow-sm"
                  : dark ? "bg-[#1e3a5f] text-white border-[#1e3a5f]/60 hover:bg-[#243f6a]" : "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm hover:bg-[#162d4a]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
              {hasPrefs ? "Edit Prefs" : "Set Preferences"}
            </button>
          </div>

          {/* Expanded preference tags — shown when For You is active */}
          <AnimatePresence>
            {forYouActive && !hasPrefs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-3 pt-3 mt-3 border-t ${dark ? "border-white/[0.06]" : "border-gray-100"}`}>
                  <svg className={`w-4 h-4 shrink-0 ${dark ? "text-[#7aafff]" : "text-[#1e3a5f]"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <p className={`text-sm flex-1 ${dark ? "text-white/60" : "text-gray-600"}`}>
                    You haven't set any preferences yet.
                  </p>
                  <button
                    onClick={() => setShowPrefModal(true)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-xl text-base font-semibold border transition-all ${
                      dark
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f]/60 hover:bg-[#243f6a]"
                        : "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm hover:bg-[#162d4a]"
                    }`}
                  >
                    Set Preferences →
                  </button>
                </div>
              </motion.div>
            )}
            {forYouActive && hasPrefs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-2 flex-wrap pt-3 mt-3 border-t ${dark ? "border-white/[0.06]" : "border-gray-100"}`}>
                  <span className={`text-xs font-bold uppercase tracking-widest shrink-0 ${dark ? "text-white/35" : "text-gray-500"}`}>
                    Filtering by
                  </span>
                  {prefGenres.map((g) => (
                    <span key={g} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                      dark ? "bg-[#1e3a5f]/20 text-[#7aafff] border-[#1e3a5f]/30" : "bg-[#1e3a5f]/[0.07] text-[#1e3a5f] border-[#1e3a5f]/20"
                    }`}>{g}</span>
                  ))}
                  {prefTypes.map((t) => (
                    <span key={t} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                      dark ? "bg-white/[0.05] text-white/40 border-white/[0.08]" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>{t.replace(/_/g, " ")}</span>
                  ))}
                  <button
                    onClick={() => setShowPrefModal(true)}
                    className={`ml-auto text-sm font-semibold shrink-0 hover:underline ${
                      dark ? "text-[#7aafff]/60 hover:text-[#7aafff]" : "text-[#1e3a5f]/50 hover:text-[#1e3a5f]"
                    }`}
                  >
                    Edit preferences →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── TRENDING PROJECTS ── */}
        <TrendingProjects />

        {/* ── LATEST SCRIPTS ── */}
        <section className="pb-4">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${dark ? "text-gray-100" : "text-gray-800"}`}>
              Latest Scripts
            </h2>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            <button
              onClick={() => handleCategorySelect("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${
                activeCategory === "all" && !forYouActive
                  ? "bg-gray-800 text-white border-gray-800"
                  : dark
                    ? "bg-white/[0.04] text-gray-400 border-[#1d3350] hover:border-[#244060] hover:text-gray-200"
                    : "bg-white text-gray-400 border-gray-150 hover:border-gray-300 hover:text-gray-600"
              }`}
            >
              All
            </button>
            {categories.contentTypes.map((c) => (
              <button
                key={c}
                onClick={() => handleCategorySelect(c)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all capitalize border ${
                  activeCategory === c && !forYouActive
                    ? "bg-gray-800 text-white border-gray-800"
                    : dark
                      ? "bg-white/[0.04] text-gray-400 border-[#1d3350] hover:border-[#244060] hover:text-gray-200"
                      : "bg-white text-gray-400 border-gray-150 hover:border-gray-300 hover:text-gray-600"
                }`}
              >
                {c.replace(/_/g, " ")}
              </button>
            ))}
            {categories.genres?.map((g) => (
              <button
                key={g}
                onClick={() => handleCategorySelect(g)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all capitalize border ${
                  activeCategory === g && !forYouActive
                    ? "bg-gray-800 text-white border-gray-800"
                    : dark
                      ? "bg-white/[0.04] text-gray-400 border-[#1d3350] hover:border-[#244060] hover:text-gray-200"
                      : "bg-white text-gray-400 border-gray-150 hover:border-gray-300 hover:text-gray-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Scripts grid */}
          {loading ? (
<<<<<<< HEAD
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-64 rounded-xl animate-pulse ${dark ? "bg-[#182840]" : "bg-gray-50"}`} />
              ))}
=======
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <div key={i} className={`h-64 rounded-xl animate-pulse ${dark ? "bg-[#182840]" : "bg-gray-50"}`} />)}
            </div>
          ) : filteredLatest.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLatest.map((s, i) => <ProjectCard key={s._id} project={s} userName={s.creator?.name || "Unknown"} />)}
>>>>>>> origin/master
            </div>
          ) : displayScripts.length > 0 ? (
            <motion.div
              key={`${activeCategory}-${forYouActive}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6"
            >
              {displayScripts.map((s, i) => {
                const isMatch = forYouActive && matchScore(s, prefGenres, prefTypes) > 0;
                return (
                  <div key={s._id} className="relative">
                    {isMatch && (
                      <div className={`absolute -top-1.5 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                        dark ? "bg-[#1e3a5f] text-[#7aafff] ring-1 ring-[#3a7bd5]/30" : "bg-[#1e3a5f] text-white"
                      }`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Match
                      </div>
                    )}
                    <ScriptCard script={s} index={i} />
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${dark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                <svg className={`w-5 h-5 ${dark ? "text-gray-500" : "text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3.75 3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className={`font-medium text-base ${dark ? "text-gray-400" : "text-gray-500"}`}>No scripts found</p>
            </div>
          )}
        </section>

      </div>

      {/* ── Quick Preference Modal ── */}
      <AnimatePresence>
        {showPrefModal && (
          <QuickPrefModal
            dark={dark}
            initialGenres={prefGenres}
            initialTypes={prefTypes}
            onSave={savePreferences}
            onClose={() => setShowPrefModal(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ReaderHome;
