import { useState, useEffect, useContext, useRef, useCallback, createContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, TrendingUp, Crown, Star, Flame, Play,
  ChevronRight, ChevronLeft, BookOpen, LayoutGrid, Eye, Heart,
  Search, Clock, Zap, CheckCircle, Filter, X,
  Drama, Laugh, Crosshair, Skull,
  Atom, Wand2, Fingerprint, Clapperboard,
  Music2, Scroll, Globe, Shield
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import ScriptCard from "../components/ScriptCard";
import FeaturedSection from "../components/FeaturedSection";

/* ═══════════════════════════════════════════════════════
   THEME CONTEXT  (avoids prop-drilling isDarkMode)
═══════════════════════════════════════════════════════ */
const ThemeCtx = createContext(false);
const useTh = () => useContext(ThemeCtx);

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════ */
const ALL_GENRES = [
  "Drama","Thriller","Horror","Comedy","Romance","Action",
  "Sci-Fi","Fantasy","Mystery","Documentary","Animation",
  "Historical","Crime","Musical","Biography","War",
];

const GENRE_META = {
  drama:       { color:"from-blue-800 to-blue-950",  dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",  lite:"bg-blue-100 text-blue-700 border-blue-300"  },
  thriller:    { color:"from-blue-700 to-blue-900",     dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",  lite:"bg-blue-100 text-blue-700 border-blue-300"  },
  horror:      { color:"from-red-700 to-rose-900",       dark:"bg-red-500/15 text-red-300 border-red-500/30",           lite:"bg-red-100 text-red-700 border-red-300"           },
  comedy:      { color:"from-blue-600 to-blue-800",   dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",  lite:"bg-blue-100 text-blue-700 border-blue-300"  },
  romance:     { color:"from-gray-600 to-gray-800",      dark:"bg-gray-500/15 text-gray-300 border-gray-500/30",        lite:"bg-gray-100 text-gray-700 border-gray-300"        },
  action:      { color:"from-blue-700 to-blue-900",   dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",     lite:"bg-blue-100 text-blue-700 border-blue-300"     },
  "sci-fi":    { color:"from-blue-600 to-blue-800",      dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",        lite:"bg-blue-100 text-blue-700 border-blue-300"        },
  sci_fi:      { color:"from-blue-600 to-blue-800",      dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",        lite:"bg-blue-100 text-blue-700 border-blue-300"        },
  fantasy:     { color:"from-blue-700 to-blue-900",  dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",  lite:"bg-blue-100 text-blue-700 border-blue-300"  },
  mystery:     { color:"from-gray-700 to-gray-900",   dark:"bg-gray-500/15 text-gray-300 border-gray-500/30",  lite:"bg-gray-100 text-gray-700 border-gray-300"  },
  documentary: { color:"from-blue-600 to-gray-700",      dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",        lite:"bg-blue-100 text-blue-700 border-blue-300"        },
  animation:   { color:"from-gray-600 to-gray-800",     dark:"bg-gray-500/15 text-gray-300 border-gray-500/30",        lite:"bg-gray-100 text-gray-700 border-gray-300"        },
  crime:       { color:"from-slate-600 to-gray-700",     dark:"bg-slate-500/15 text-slate-300 border-slate-500/30",     lite:"bg-slate-100 text-slate-700 border-slate-300"     },
  musical:     { color:"from-gray-700 to-gray-900",   dark:"bg-gray-500/15 text-gray-300 border-gray-500/30",        lite:"bg-gray-100 text-gray-700 border-gray-300"},
  biography:   { color:"from-blue-700 to-blue-900",   dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",     lite:"bg-blue-100 text-blue-700 border-blue-300"     },
  war:         { color:"from-red-800 to-slate-800",      dark:"bg-red-500/15 text-red-300 border-red-500/30",           lite:"bg-red-100 text-red-700 border-red-300"           },
  historical:  { color:"from-blue-800 to-blue-950",   dark:"bg-blue-500/15 text-blue-300 border-blue-500/30",     lite:"bg-blue-100 text-blue-700 border-blue-300"     },
  default:     { color:"from-blue-700 to-blue-900",    dark:"bg-white/10 text-gray-300 border-white/15",              lite:"bg-gray-100 text-gray-600 border-gray-300"        },
};

const genreMeta = (g) =>
  GENRE_META[(g || "").toLowerCase().replace(/[\s-]/g, "_")] ||
  GENRE_META[(g || "").toLowerCase()] ||
  GENRE_META.default;

/* Returns the right badge classes for current theme */
const genreBadgeClass = (g, dark) => {
  const m = genreMeta(g);
  return dark ? m.dark : m.lite;
};

const fmtNum = (n) => {
  if (!n || n < 1) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const fmtDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  const diff = Date.now() - dt.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const GENRE_ICON_MAP = {
  drama: Drama, comedy: Laugh, thriller: Fingerprint, horror: Skull,
  romance: Heart, action: Zap, sci_fi: Atom, "sci-fi": Atom,
  fantasy: Wand2, mystery: Search, documentary: Clapperboard,
  animation: Sparkles, historical: Globe, war: Shield,
  musical: Music2, biography: Scroll, crime: Crosshair,
};
const getGenreIcon = (g) =>
  GENRE_ICON_MAP[(g || "").toLowerCase().replace(/[\s-]/g, "_")] ||
  GENRE_ICON_MAP[(g || "").toLowerCase()] ||
  BookOpen;

/* ═══════════════════════════════════════════════════════
   GENRE BADGE
═══════════════════════════════════════════════════════ */
const GenreBadge = ({ genre }) => {
  const dark = useTh();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${genreBadgeClass(genre, dark)}`}>
      {(genre || "").replace(/_/g, "-")}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════
   PLACEHOLDER COVER
═══════════════════════════════════════════════════════ */
const PlaceholderCover = ({ script }) => {
  const dark = useTh();
  const Icon = getGenreIcon(script.genre);
  const m = genreMeta(script.genre);
  return (
    <div className={`w-full h-full flex items-center justify-center ${dark ? "bg-gradient-to-br from-[#0a1628] via-[#1a2d45] to-[#0d1b2e]" : "bg-gradient-to-br from-blue-50 to-blue-100"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dark ? "bg-blue-600/20 border border-blue-500/30" : "bg-blue-200"}`}>
        <Icon size={20} strokeWidth={1.5} className={dark ? "text-blue-400" : "text-blue-600"} />
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

/* ═══════════════════════════════════════════════════════
   FEED CARD
═══════════════════════════════════════════════════════ */
const FeedCard = ({ script, index = 0, showRank = null }) => {
  const dark = useTh();
  const [imgErr, setImgErr] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useContext(AuthContext);

  const handleSave = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user || saving || saved) return;
    setSaving(true);
    try { await api.post("/users/watchlist/add", { scriptId: script._id }); setSaved(true); }
    catch { setSaved(true); }
    finally { setSaving(false); }
  };

  const reads = fmtNum(script.readsCount || script.views);
  const noImg = !script.coverImage || imgErr;
  const ctLabel = script.contentType && script.contentType !== "movie"
    ? script.contentType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : null;

  const cardBg    = dark ? "bg-[#0d1e30] border-[#1a3050] hover:border-blue-500/40 hover:shadow-blue-900/20" : "bg-white border-gray-200 hover:border-blue-400/50 hover:shadow-blue-100/60";
  const authorTxt = dark ? "text-gray-400" : "text-gray-500";
  const titleTxt  = dark ? "text-gray-100 group-hover:text-blue-300" : "text-gray-800 group-hover:text-blue-600";
  const loglineTxt= dark ? "text-gray-600" : "text-gray-400";
  const footerBdr = dark ? "border-[#1a3050]"  : "border-gray-100";
  const ratingTxt = dark ? "text-gray-300"     : "text-gray-700";
  const genreTxt  = dark ? "bg-white/5 text-gray-500 border-[#1a3050]" : "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex-none w-64 sm:w-72"
    >
      <Link to={`/reader/script/${script._id}`} className="group block h-full">
        <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg ${cardBg}`}>
          <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
            {noImg ? <PlaceholderCover script={script} /> : (
              <img src={script.coverImage} alt={script.title}
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" />
            )}
            {showRank && (
              <div className={`absolute top-2 left-2 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg ${showRank === 1 ? "bg-yellow-400 text-yellow-900" : showRank === 2 ? "bg-gray-300 text-gray-800" : showRank === 3 ? "bg-gray-600 text-white" : "bg-black/60 text-white border border-white/15 backdrop-blur-sm"}`}>#{showRank}</div>
            )}
            {!showRank && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {script.premium && <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">PREMIUM</span>}
                {script.isFeatured && <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">FEATURED</span>}
              </div>
            )}
            {script.rating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10">
                <Star size={9} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white">{script.rating.toFixed(1)}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-2.5 gap-1.5">
              {reads && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[11px] text-white/90 font-semibold border border-white/15">
                  <Eye size={10} /> {reads}
                </span>
              )}
              <div className="flex items-center gap-1.5 w-full">
                {user && (
                  <button onClick={handleSave}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm border transition-all shrink-0 ${saved ? "bg-green-500/80 border-green-400/40 text-white" : "bg-white/15 border-white/20 text-white hover:bg-white/25"}`}>
                    <Heart size={12} className={saved ? "fill-white" : ""} />
                  </button>
                )}
                <span className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600/90 backdrop-blur-sm rounded-xl border border-blue-400/30 text-white font-bold text-[11px]">
                  <Play size={10} fill="currentColor" /> Read Now
                </span>
              </div>
            </div>
          </div>
          <div className="p-2.5 flex flex-col flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              {script.creator?.profileImage
                ? <img src={script.creator.profileImage} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                : <div className="w-4 h-4 rounded-full bg-blue-700/60 flex items-center justify-center text-[8px] font-bold text-blue-200 shrink-0">{script.creator?.name?.charAt(0)?.toUpperCase() || "?"}</div>
              }
              <span className={`text-[11px] font-medium truncate flex-1 ${authorTxt}`}>{script.creator?.name || "Unknown"}</span>
              {ctLabel && <span className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${dark ? "bg-white/5 text-gray-500 border-white/8" : "bg-gray-50 text-gray-400 border-gray-200"}`}>{ctLabel}</span>}
            </div>
            <h4 className={`font-bold text-xs leading-snug line-clamp-2 transition-colors mb-1 ${titleTxt}`}>{script.title}</h4>
            {(script.logline || script.synopsis) && (
              <p className={`text-[10px] line-clamp-2 leading-relaxed mb-1.5 ${loglineTxt}`}>{script.logline || script.synopsis}</p>
            )}
            <div className="flex-1" />
            <div className={`flex items-center justify-between pt-2 border-t ${footerBdr}`}>
              <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${ratingTxt}`}>
                  <svg className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {(script.rating || 0).toFixed(1)}
                </span>
                {script.pageCount > 0 && <span className={`text-[10px] ${dark ? "text-gray-600" : "text-gray-400"}`}>· {script.pageCount}p</span>}
              </div>
              {script.genre && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${genreTxt}`}>{script.genre}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   HORIZONTAL SCROLL ROW
═══════════════════════════════════════════════════════ */
const HScrollRow = ({ scripts, loading, skeletonCount = 6 }) => {
  const dark = useTh();
  const rowRef = useRef(null);
  const scroll = (d) => rowRef.current?.scrollBy({ left: d * 260, behavior: "smooth" });
  const skelBg = dark ? "bg-white/[0.05]" : "bg-gray-100";

  if (loading) return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div key={i} className="flex-none w-64 sm:w-72">
          <div className={`w-full rounded-2xl animate-pulse mb-2.5 ${skelBg}`} style={{ aspectRatio: "2/3" }} />
          <div className={`h-3 rounded animate-pulse mb-1.5 w-4/5 ${skelBg}`} />
          <div className={`h-2.5 rounded animate-pulse w-1/2 ${skelBg}`} />
        </div>
      ))}
    </div>
  );
  if (!scripts?.length) return null;

  return (
    <div className="relative group/row">
      <button onClick={() => scroll(-1)} className={`absolute left-0 top-1/3 -translate-y-1/2 z-10 w-8 h-8 rounded-full backdrop-blur-sm border flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity -translate-x-3 hover:scale-110 ${dark ? "bg-black/70 border-white/10 text-white" : "bg-white border-gray-200 text-gray-600 shadow-md"}`}>
        <ChevronLeft size={15} />
      </button>
      <button onClick={() => scroll(1)} className={`absolute right-0 top-1/3 -translate-y-1/2 z-10 w-8 h-8 rounded-full backdrop-blur-sm border flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-3 hover:scale-110 ${dark ? "bg-black/70 border-white/10 text-white" : "bg-white border-gray-200 text-gray-600 shadow-md"}`}>
        <ChevronRight size={15} />
      </button>
      <div ref={rowRef} className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {scripts.map((s, i) => <FeedCard key={s._id} script={s} index={i} />)}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════ */
const SectionHeader = ({ icon: Icon, gradient, title, subtitle, badge = null }) => {
  const dark = useTh();
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600/20 border border-blue-500/30 shadow-lg">
          <Icon size={18} className="text-blue-400" strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-extrabold tracking-tight leading-none ${dark ? "text-white" : "text-gray-900"}`}>{title}</h2>
            {badge && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wide ${dark ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-cyan-50 text-cyan-700 border-cyan-300"}`}>{badge}</span>
            )}
          </div>
          {subtitle && <p className={`text-xs mt-0.5 font-medium ${dark ? "text-gray-500" : "text-gray-400"}`}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   HERO BANNER
═══════════════════════════════════════════════════════ */
const HeroBanner = ({ scripts, loading }) => {
  const dark = useTh();
  const [current, setCurrent] = useState(0);
  const [imgErrs, setImgErrs] = useState({});
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);
  const total = scripts?.length || 0;

  const goTo = (idx, dir = 1) => { setDirection(dir); setCurrent((idx + total) % total); };
  const prev = (e) => { e?.stopPropagation(); goTo(current - 1, -1); };
  const next = (e) => { e?.stopPropagation(); goTo(current + 1, 1); };

  useEffect(() => {
    if (paused || total < 2) return;
    timerRef.current = setInterval(() => goTo(current + 1, 1), 5500);
    return () => clearInterval(timerRef.current);
  }, [current, paused, total]);

  if (loading) return (
    <div className={`w-full rounded-3xl animate-pulse ${dark ? "bg-white/[0.04]" : "bg-gray-200"}`} style={{ height: "420px" }} />
  );
  if (!total) return null;

  const script = scripts[current];
  const imgErr = imgErrs[script._id];
  const m = genreMeta(script.genre);

  /* Overlay colours differ by theme */
  const overlayFrom = dark ? "#05080f" : "#0f172a";

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden select-none"
      style={{ height: "420px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute top-5 left-6 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          <Crown size={13} className="text-yellow-400" />
          <span className="text-xs font-black text-white uppercase tracking-widest">Featured Projects</span>
        </div>
        {(script.isFeatured || script.premium) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border" style={{ background: "rgba(124,58,237,0.25)", borderColor: "rgba(139,92,246,0.4)" }}>
            <Sparkles size={11} className="text-violet-300" />
            <span className="text-[11px] font-bold text-violet-200 uppercase tracking-wider">{script.premium ? "Sponsored" : "Trending"}</span>
          </div>
        )}
      </div>

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={script._id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <Link to={`/reader/script/${script._id}`} className="group block w-full h-full">
            {script.coverImage && !imgErr ? (
              <img src={script.coverImage} alt={script.title}
                onError={() => setImgErrs(p => ({ ...p, [script._id]: true }))}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a2d45] to-[#0d1b2e] opacity-60" />
            )}
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${overlayFrom} 0%, ${overlayFrom}99 30%, transparent 70%)` }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${overlayFrom}e6 0%, ${overlayFrom}66 40%, transparent 75%)` }} />
            <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-10 pb-14">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {script.genre && <GenreBadge genre={script.genre} />}
                {script.contentType && script.contentType !== "movie" && (
                  <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">{script.contentType.replace(/_/g, " ")}</span>
                )}
                {script.rating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-gray-200 font-bold">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    {script.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-2.5 max-w-2xl group-hover:text-blue-200 transition-colors drop-shadow-lg">{script.title}</h1>
              {(script.logline || script.synopsis) && (
                <p className="text-sm text-white/60 mb-5 max-w-xl line-clamp-2 leading-relaxed">{script.logline || script.synopsis}</p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {script.creator?.name && (
                  <div className="flex items-center gap-2">
                    {script.creator?.profileImage
                      ? <img src={script.creator.profileImage} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                      : <div className="w-6 h-6 rounded-full bg-violet-700/60 flex items-center justify-center text-[10px] font-bold text-violet-200">{script.creator.name.charAt(0).toUpperCase()}</div>
                    }
                    <span className="text-sm text-gray-300 font-medium">by {script.creator.name}</span>
                  </div>
                )}
                {fmtNum(script.readsCount) && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Eye size={13} /> {fmtNum(script.readsCount)} reads
                  </span>
                )}
                <button className="ml-auto sm:ml-0 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg hover:scale-105 active:scale-95 transition-transform" style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>
                  <Play size={14} fill="currentColor" /> Read Now
                </button>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white opacity-0 hover:opacity-100 transition-opacity hover:bg-black/75 hover:scale-110 flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white opacity-0 hover:opacity-100 transition-opacity hover:bg-black/75 hover:scale-110 flex items-center justify-center">
            <ChevronRight size={20} />
          </button>
        </>
      )}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {scripts.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i, i > current ? 1 : -1); }}
              className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"}`} />
          ))}
        </div>
      )}
      {total > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] z-20 bg-white/10">
          <motion.div key={current} className="h-full bg-blue-600" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5.5, ease: "linear" }} />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TOP LIST CARD
═══════════════════════════════════════════════════════ */
const TopListCard = ({ script, rank }) => {
  const dark = useTh();
  const [imgErr, setImgErr] = useState(false);
  const reads = fmtNum(script.readsCount || script.views);
  const cardBg  = dark ? "border-[#1a3050] bg-[#0d1e30] hover:border-violet-500/30" : "border-gray-200 bg-white hover:border-violet-300 hover:shadow-md";
  const titleTxt= dark ? "text-gray-100 group-hover:text-violet-300" : "text-gray-800 group-hover:text-violet-600";
  const authorTxt = dark ? "text-gray-500" : "text-gray-400";
  const metaTxt = dark ? "text-gray-500" : "text-gray-400";
  const rankColor = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-500" : dark ? "text-gray-600" : "text-gray-300";

  const noImg = !script.coverImage || imgErr;

  return (
    <Link to={`/reader/script/${script._id}`} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${cardBg}`}>
      {/* Rank number */}
      <span className={`text-xl font-black w-7 text-center shrink-0 leading-none ${rankColor}`}>{rank}</span>

      {/* Cover or coloured initial */}
      <div className="relative shrink-0 w-10 h-14 rounded-lg overflow-hidden">
        {noImg ? (
          <div className={`w-full h-full flex items-center justify-center font-black text-base ${dark ? "bg-[#1a3050] text-white/50" : "bg-slate-200 text-slate-400"}`}>
            {script.title?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img src={script.coverImage} alt={script.title}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-[13px] leading-snug line-clamp-1 mb-0.5 transition-colors ${titleTxt}`}>{script.title}</h3>
        {script.genre && <GenreBadge genre={script.genre} />}
        <div className="flex items-center gap-2 mt-1">
          {script.creator?.name && <span className={`text-[10px] truncate ${authorTxt}`}>{script.creator.name}</span>}
          {script.rating > 0 && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ml-auto shrink-0 ${metaTxt}`}>
              <Star size={9} className="text-yellow-400 fill-yellow-400" />{script.rating.toFixed(1)}
            </span>
          )}
          {reads && <span className={`flex items-center gap-0.5 text-[10px] shrink-0 ${metaTxt}`}><Eye size={9}/>{reads}</span>}
        </div>
      </div>
    </Link>
  );
};

/* ═══════════════════════════════════════════════════════
   TRENDING CARD  (same style as FeedCard)
═══════════════════════════════════════════════════════ */
const TrendingCard = ({ script, index = 0 }) => {
  const dark = useTh();
  const [imgErr, setImgErr] = useState(false);
  const reads = fmtNum(script.readsCount || script.views);
  const noImg = !script.coverImage || imgErr;

  const cardBg    = dark ? "bg-[#0d1e30] border-[#1a3050] hover:border-violet-500/40 hover:shadow-violet-900/20" : "bg-white border-gray-200 hover:border-violet-400/50 hover:shadow-violet-100/60";
  const titleTxt  = dark ? "text-gray-100 group-hover:text-violet-300" : "text-gray-800 group-hover:text-violet-600";
  const authorTxt = dark ? "text-gray-400" : "text-gray-500";
  const footerBdr = dark ? "border-[#1a3050]" : "border-gray-100";
  const ratingTxt = dark ? "text-gray-300" : "text-gray-700";
  const genreTxt  = dark ? "bg-white/5 text-gray-500 border-[#1a3050]" : "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }}>
      <Link to={`/reader/script/${script._id}`} className="group block h-full">
        <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg ${cardBg}`}>
          <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
            {noImg ? <PlaceholderCover script={script} /> : (
              <img src={script.coverImage} alt={script.title}
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" />
            )}
            {/* TRENDING badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-bold">
              <Flame size={9} /> TRENDING
            </div>
            {script.rating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10">
                <Star size={9} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white">{script.rating.toFixed(1)}</span>
              </div>
            )}
            {reads && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2.5">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[11px] text-white/90 font-semibold border border-white/15">
                  <TrendingUp size={10} /> {reads}
                </span>
              </div>
            )}
          </div>
          <div className="p-2.5 flex flex-col flex-1">
            {script.creator?.name && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-violet-700/60 flex items-center justify-center text-[8px] font-bold text-violet-200 shrink-0">{script.creator.name.charAt(0).toUpperCase()}</div>
                <span className={`text-[11px] font-medium truncate ${authorTxt}`}>{script.creator.name}</span>
              </div>
            )}
            <h4 className={`font-bold text-xs leading-snug line-clamp-2 transition-colors mb-1 ${titleTxt}`}>{script.title}</h4>
            <div className="flex-1" />
            <div className={`flex items-center justify-between pt-2 border-t ${footerBdr}`}>
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${ratingTxt}`}>
                <svg className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {(script.rating || 0).toFixed(1)}
              </span>
              {script.genre && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${genreTxt}`}>{script.genre}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   RECENTLY ADDED CARD  (same style as FeedCard)
═══════════════════════════════════════════════════════ */
const RecentCard = ({ script, index = 0 }) => {
  const dark = useTh();
  const [imgErr, setImgErr] = useState(false);
  const dateStr = fmtDate(script.createdAt);
  const noImg = !script.coverImage || imgErr;

  const cardBg    = dark ? "bg-[#0d1e30] border-[#1a3050] hover:border-violet-500/40 hover:shadow-violet-900/20" : "bg-white border-gray-200 hover:border-violet-400/50 hover:shadow-violet-100/60";
  const titleTxt  = dark ? "text-gray-100 group-hover:text-violet-300" : "text-gray-800 group-hover:text-violet-600";
  const authorTxt = dark ? "text-gray-400" : "text-gray-500";
  const footerBdr = dark ? "border-[#1a3050]" : "border-gray-100";
  const ratingTxt = dark ? "text-gray-300" : "text-gray-700";
  const genreTxt  = dark ? "bg-white/5 text-gray-500 border-[#1a3050]" : "bg-gray-50 text-gray-500 border-gray-200";
  const dateTxt   = dark ? "text-gray-600" : "text-gray-400";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }}>
      <Link to={`/reader/script/${script._id}`} className="group block h-full">
        <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg ${cardBg}`}>
          <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
            {noImg ? <PlaceholderCover script={script} /> : (
              <img src={script.coverImage} alt={script.title}
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" />
            )}
            {/* NEW badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
              <Clock size={9} /> NEW
            </div>
            {script.rating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10">
                <Star size={9} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white">{script.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="p-2.5 flex flex-col flex-1">
            {script.creator?.name && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-violet-700/60 flex items-center justify-center text-[8px] font-bold text-violet-200 shrink-0">{script.creator.name.charAt(0).toUpperCase()}</div>
                <span className={`text-[11px] font-medium truncate ${authorTxt}`}>{script.creator.name}</span>
              </div>
            )}
            <h4 className={`font-bold text-xs leading-snug line-clamp-2 transition-colors mb-1 ${titleTxt}`}>{script.title}</h4>
            <div className="flex-1" />
            <div className={`flex items-center justify-between pt-2 border-t ${footerBdr}`}>
              <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${ratingTxt}`}>
                  <svg className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {(script.rating || 0).toFixed(1)}
                </span>
                {dateStr && <span className={`text-[10px] ${dateTxt}`}>· {dateStr}</span>}
              </div>
              {script.genre && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${genreTxt}`}>{script.genre}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   FILTER MODAL
═══════════════════════════════════════════════════════ */
const GENRE_ICONS = {
  Drama: Drama, Thriller: Fingerprint, Horror: Skull, Comedy: Laugh,
  Romance: Heart, Action: Zap, "Sci-Fi": Atom, Fantasy: Wand2,
  Mystery: Search, Documentary: Clapperboard, Animation: Sparkles,
  Historical: Globe, Crime: Crosshair, Musical: Music2, Biography: Scroll, War: Shield,
};

const FilterModal = ({ isOpen, onClose, selectedGenres, onApply }) => {
  const dark = useTh();
  const [tempSelected, setTempSelected] = useState(selectedGenres);

  useEffect(() => {
    setTempSelected(selectedGenres);
  }, [selectedGenres, isOpen]);

  const toggle = (g) => setTempSelected(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);

  const handleApply = () => {
    onApply(tempSelected);
    onClose();
  };

  const handleClear = () => {
    setTempSelected([]);
  };

  if (!isOpen) return null;

  const overlayBg = dark ? "bg-black/60" : "bg-black/40";
  const modalBg = dark ? "bg-[#0a1219] border-white/10" : "bg-white border-gray-200";
  const titleTxt = dark ? "text-white" : "text-gray-900";
  const subTxt = dark ? "text-gray-400" : "text-gray-500";
  const closeBg = dark ? "bg-white/5 hover:bg-white/10 text-gray-400" : "bg-gray-100 hover:bg-gray-200 text-gray-600";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${overlayBg}`} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border shadow-2xl ${modalBg}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
          <div>
            <h2 className={`text-2xl font-black ${titleTxt}`}>Filter by Genre</h2>
            <p className={`text-sm mt-1 ${subTxt}`}>Select genres to personalize your feed</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${closeBg}`}>
            <X size={20} />
          </button>
        </div>

        {/* Genre Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {ALL_GENRES.map((g, i) => {
              const Icon = GENRE_ICONS[g] || BookOpen;
              const sel = tempSelected.includes(g);
              const m = genreMeta(g);
              return (
                <motion.button
                  key={g}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => toggle(g)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                    sel
                      ? `${dark ? "bg-[#1a3050]" : "bg-violet-50"} ${dark ? "border-violet-500/50" : "border-violet-300"} shadow-lg scale-105`
                      : dark
                      ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15"
                      : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  {sel && (
                    <CheckCircle
                      size={14}
                      className={`absolute top-2 right-2 ${dark ? "text-violet-400" : "text-violet-600"}`}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className={sel ? (dark ? "text-violet-300" : "text-violet-600") : dark ? "text-gray-500" : "text-gray-400"}
                  />
                  <span
                    className={`text-xs font-bold text-center leading-tight ${
                      sel ? (dark ? "text-violet-200" : "text-violet-700") : dark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {g}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${dark ? "border-white/10" : "border-gray-200"}`}>
          <button
            onClick={handleClear}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              dark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Clear All
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${
                dark ? "text-gray-400 border-white/10 hover:bg-white/5" : "text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/30"
            >
              <Filter size={14} />
              Apply {tempSelected.length > 0 ? `(${tempSelected.length})` : ""}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const ReaderHome = () => {
  const { user, setUser } = useContext(AuthContext);
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const [latestScripts, setLatestScripts] = useState([]);
  const [topScripts, setTopScripts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [featuredScripts, setFeaturedScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGenres, setFilterGenres] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Initialize filter genres from user preferences
  useEffect(() => {
    const preferredGenres = [
      ...(user?.favoriteGenres || []),
      ...(user?.preferences?.genres || []),
      ...(user?.skills || []),
    ].filter(Boolean).map(g => g.toLowerCase());
    const uniquePreferred = [...new Set(preferredGenres)];
    if (uniquePreferred.length > 0 && filterGenres.length === 0) {
      setFilterGenres(uniquePreferred.map(g => g.charAt(0).toUpperCase() + g.slice(1)));
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestRes, recRes, topRes] = await Promise.all([
        api.get("/scripts/latest"),
        api.get("/scripts/recommendations").catch(() => ({ data: [] })),
        api.get("/scripts?sort=views&limit=16").catch(() => ({ data: [] })),
      ]);
      const latest = latestRes.data || [];
      setLatestScripts(latest);
      setRecommendations(recRes.data || []);

      const topRaw = topRes.data;
      setTopScripts(Array.isArray(topRaw) ? topRaw.slice(0, 12) : (topRaw?.scripts || []).slice(0, 12));

      const featured = latest.filter(s => s.isFeatured || s.premium);
      setFeaturedScripts(
        featured.length >= 3 ? featured.slice(0, 6)
          : [...featured, ...latest.filter(s => s.rating >= 4).slice(0, 6 - featured.length)].slice(0, 6)
      );
    } catch (err) {
      console.error("fetchData error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter scripts based on selected genres
  const filterByGenres = (scripts) => {
    if (filterGenres.length === 0) return scripts;
    const lowerGenres = filterGenres.map(g => g.toLowerCase());
    return scripts.filter(s => lowerGenres.some(g => (s.genre || "").toLowerCase().includes(g)));
  };

  const personalizedScripts = filterGenres.length > 0
    ? [
      ...filterByGenres(recommendations),
      ...recommendations.filter(s => !filterGenres.some(g => (s.genre || "").toLowerCase().includes(g.toLowerCase()))),
    ]
    : recommendations;

  const trendingScripts = filterByGenres(
    [...latestScripts].sort((a, b) => (b.readsCount || 0) - (a.readsCount || 0))
  ).slice(0, 10);

  const filteredLatest = filterByGenres(latestScripts);
  const filteredTop = filterByGenres(topScripts);

  const handleFilterApply = async (genres) => {
    setFilterGenres(genres);
    // Optionally save to user preferences
    if (genres.length > 0) {
      try {
        await api.post("/users/interests", { genres: genres.map(g => g.toLowerCase()) });
        const updated = { ...user, skills: genres.map(g => g.toLowerCase()) };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save interests:", err);
      }
    }
  };

  /* ── Theme-aware page background ── */
  const pageBg = isDarkMode
    ? "linear-gradient(160deg,#04070e 0%,#060b16 50%,#050910 100%)"
    : "transparent";   /* let MainLayout bg-[#f8f9fb] show through */

  const skelBg = isDarkMode ? "bg-white/[0.04]" : "bg-gray-100";
  const skelBg2 = isDarkMode ? "bg-white/[0.03]" : "bg-gray-50";
  const dividerColor = isDarkMode ? "border-white/[0.06]" : "border-gray-200";

  return (
    <ThemeCtx.Provider value={isDarkMode}>
      <div className="min-h-screen pb-24" style={{ background: pageBg }}>
        {/* Ambient glows — only in dark mode */}
        {isDarkMode && (
          <>
            <div className="fixed top-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(124,58,237,0.05) 0%,transparent 70%)" }} />
            <div className="fixed bottom-1/3 left-1/5 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(6,182,212,0.04) 0%,transparent 70%)" }} />
          </>
        )}

        <div className="w-full max-w-[1400px] mx-auto px-4 pt-4 space-y-12">

          {/* 1. FEATURED & SPONSORED - Premium Promotional Section */}
          <FeaturedSection />

          {/* Filter Button Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {filterGenres.length > 0 ? "Filtered Feed" : "All Scripts"}
              </h1>
              {filterGenres.length > 0 && (
                <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Showing {filterGenres.join(", ")} scripts
                </p>
              )}
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                filterGenres.length > 0
                  ? "bg-blue-600 text-white border-transparent shadow-lg hover:bg-blue-700 hover:scale-105"
                  : isDarkMode
                  ? "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <Filter size={16} />
              {filterGenres.length > 0 ? `Filters (${filterGenres.length})` : "Filter by Genre"}
            </button>
          </div>

          <div className="space-y-12">
            {/* 2. RECOMMENDED FOR YOU */}
            {(loading || personalizedScripts.length > 0) && (
              <section>
                <SectionHeader
                  icon={Sparkles}
                  gradient="from-blue-700 to-blue-900"
                  title="Recommended For You"
                  subtitle={filterGenres.length > 0
                    ? `Based on your interest in ${filterGenres.slice(0, 3).join(", ")}`
                    : "Popular picks curated for you"}
                />
                <HScrollRow scripts={personalizedScripts.slice(0, 12)} loading={loading} />
              </section>
            )}

            {/* 3. TOP LIST */}
            {(loading || filteredTop.length > 0) && (
              <section>
                <SectionHeader icon={Crown} gradient="from-yellow-500 to-amber-600" title="Top List" subtitle="Most viewed and highest rated scripts" badge="Ranked" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl animate-pulse ${skelBg}`}>
                        <div className={`w-10 h-6 rounded ${skelBg}`} />
                        <div className={`w-14 rounded-xl ${skelBg}`} style={{ aspectRatio: "2/3" }} />
                        <div className="flex-1 space-y-2"><div className={`h-3 rounded w-4/5 ${skelBg}`} /><div className={`h-2.5 rounded w-1/2 ${skelBg2}`} /></div>
                      </div>
                    ))
                    : filteredTop.slice(0, 12).map((s, i) => <TopListCard key={s._id} script={s} rank={i + 1} />)
                  }
                </div>
              </section>
            )}

            {/* 4. TRENDING PROJECTS */}
            {(loading || trendingScripts.length > 0) && (
              <section>
                    <SectionHeader icon={Flame} gradient="from-orange-500 to-red-600" title="Trending Projects" subtitle="Rapidly gaining reads right now" badge="Hot" />
                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                          <div key={i}>
                            <div className={`w-full rounded-2xl animate-pulse mb-2.5 ${skelBg}`} style={{ aspectRatio: "2/3" }} />
                            <div className={`h-3 rounded mb-1.5 w-4/5 animate-pulse ${skelBg}`} />
                            <div className={`h-2.5 rounded w-1/2 animate-pulse ${skelBg2}`} />
                          </div>
                        ))
                        : trendingScripts.map((s, i) => <TrendingCard key={s._id} script={s} index={i} />)
                      }
                    </div>
                  </section>
                )}

                {/* 5. RECENTLY ADDED */}
                {(loading || filteredLatest.length > 0) && (
                  <section>
                    <SectionHeader icon={Clock} gradient="from-cyan-500 to-blue-600" title="Recently Added" subtitle="Fresh scripts just uploaded" />
                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                          <div key={i}>
                            <div className={`w-full rounded-2xl animate-pulse mb-2.5 ${skelBg}`} style={{ aspectRatio: "2/3" }} />
                            <div className={`h-3 rounded mb-1.5 w-4/5 animate-pulse ${skelBg}`} />
                            <div className={`h-2.5 rounded w-1/2 animate-pulse ${skelBg2}`} />
                          </div>
                        ))
                        : filteredLatest.slice(0, 12).map((s, i) => <RecentCard key={s._id} script={s} index={i} />)
                      }
                    </div>
                  </section>
                )}

                {/* 6. BROWSE ALL */}
                {(loading || filteredLatest.length > 0) && (
                  <section>
                    <SectionHeader icon={LayoutGrid} gradient="from-slate-500 to-gray-700" title="Browse All Scripts" 
                      subtitle={filterGenres.length > 0 ? "Filtered by your selected genres" : "Explore everything on CKript"} />
                    {loading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i}>
                            <div className={`w-full rounded-2xl animate-pulse mb-2.5 ${skelBg}`} style={{ aspectRatio: "2/3" }} />
                            <div className={`h-3 rounded mb-1.5 w-4/5 animate-pulse ${skelBg}`} />
                            <div className={`h-2.5 rounded w-1/2 animate-pulse ${skelBg2}`} />
                          </div>
                        ))}
                      </div>
                    ) : filteredLatest.length > 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {filteredLatest.map((s, i) => <FeedCard key={s._id} script={s} index={i} />)}
                      </motion.div>
                    ) : (
                      <div className="text-center py-20">
                        <BookOpen size={52} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-700" : "text-gray-300"}`} strokeWidth={1.5} />
                        <p className={`text-lg font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {filterGenres.length > 0 ? "No scripts found for selected genres" : "No scripts found"}
                        </p>
                        <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                          {filterGenres.length > 0 ? "Try selecting different genres" : "Check back soon for new content"}
                        </p>
                      </div>
                    )}
                  </section>
                )}

          </div>
        </div>

        {/* Filter Modal */}
        <AnimatePresence>
          {showFilterModal && (
            <FilterModal
              isOpen={showFilterModal}
              onClose={() => setShowFilterModal(false)}
              selectedGenres={filterGenres}
              onApply={handleFilterApply}
            />
          )}
        </AnimatePresence>
      </div>
    </ThemeCtx.Provider>
  );
};

export default ReaderHome;
