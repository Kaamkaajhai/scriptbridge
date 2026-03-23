import { useState, useEffect, useRef, useCallback } from "react";
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

/* ── Trailer Preview Modal ─────────────────────────── */
const AIDemo = ({ script, getImageUrl }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=idle, 1=title, 2=genre, 3=logline, 4=hook, 5=cta
  const intervalRef = useRef(null);
  const utterRef = useRef(null);
  const DURATION = 30; // seconds

  const phrases = [
    script.title,
    script.genre ? `A ${script.genre} story` : null,
    script.logline || script.synopsis || script.description || null,
    script.pageCount ? `${script.pageCount} pages of gripping storytelling.` : "A compelling script ready for production.",
    "Available now on Ckript. Read it today.",
  ].filter(Boolean);

  const startDemo = () => {
    if (playing) return;
    setPlaying(true);
    setProgress(0);
    setPhase(1);

    // Text-to-speech
    if ("speechSynthesis" in window) {
      const fullText = phrases.join(". ");
      const utter = new SpeechSynthesisUtterance(fullText);
      utter.rate = 0.92;
      utter.pitch = 1.05;
      utter.volume = 1;
      // Pick a good voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Google") && v.lang === "en-US")
        || voices.find(v => v.lang === "en-US")
        || voices[0];
      if (preferred) utter.voice = preferred;
      utter.onend = () => { stopDemo(); };
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    }

    // Progress bar + phase transitions
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 0.1;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      // Advance visual phases
      if (elapsed < 4) setPhase(1);
      else if (elapsed < 9) setPhase(2);
      else if (elapsed < 20) setPhase(3);
      else if (elapsed < 27) setPhase(4);
      else setPhase(5);
      if (elapsed >= DURATION) stopDemo();
    }, 100);
  };

  const stopDemo = () => {
    setPlaying(false);
    setProgress(0);
    setPhase(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (utterRef.current) window.speechSynthesis?.cancel();
  };

  useEffect(() => () => { stopDemo(); }, []);

  const phaseContent = [
    null,
    { label: "TITLE", text: script.title, size: "text-3xl font-black" },
    { label: "GENRE", text: (script.genre || "") + (script.contentType ? ` · ${script.contentType.replace(/_/g, " ")}` : ""), size: "text-xl font-bold" },
    { label: "STORY", text: script.logline || script.synopsis || script.description || "A story waiting to be told.", size: "text-base font-medium leading-relaxed" },
    { label: "DETAILS", text: script.pageCount ? `${script.pageCount} pages · ${script.premium ? `$${script.price}` : "Free to read"}` : (script.premium ? `$${script.price}` : "Free to read"), size: "text-lg font-semibold" },
    { label: "AVAILABLE ON", text: "Ckript", size: "text-2xl font-black tracking-widest" },
  ];

  const current = phaseContent[phase];

  return (
    <div className="aspect-video bg-gradient-to-br from-[#0a0f1e] via-[#0f1c30] to-[#091628] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background image */}
      {script.coverImage && (
        <img src={getImageUrl(script.coverImage)} alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl scale-110" />
      )}
      {/* Animated rings */}
      {playing && (
        <>
          <div className="absolute w-72 h-72 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute w-48 h-48 rounded-full border border-white/[0.07] animate-ping" style={{ animationDuration: "2s" }} />
        </>
      )}

      {!playing ? (
        /* ── Idle state ── */
        <div className="flex flex-col items-center gap-5 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-7 h-7 text-white/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base mb-1">{script.title}</p>
            <p className="text-white/40 text-xs mb-4">No trailer uploaded · AI demo available</p>
          </div>
          <button onClick={startDemo}
            className="flex items-center gap-2.5 px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Play 30s AI Demo
          </button>
          <span className="text-white/20 text-[11px]">Uses text-to-speech · no upload needed</span>
        </div>
      ) : (
        /* ── Playing state ── */
        <div className="flex flex-col items-center gap-6 z-10 px-10 text-center w-full">
          {current && (
            <motion.div key={phase}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{current.label}</span>
              <p className={`text-white ${current.size} max-w-lg`}>{current.text}</p>
            </motion.div>
          )}
          {/* Soundwave animation */}
          <div className="flex items-center gap-1 h-8">
            {[...Array(18)].map((_, i) => (
              <motion.div key={i}
                className="w-1 rounded-full bg-white/60"
                animate={{ height: [8, Math.random() * 24 + 8, 8] }}
                transition={{ duration: 0.4 + (i % 5) * 0.08, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
          <button onClick={stopDemo}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-xl text-xs font-semibold transition-colors border border-white/10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
            Stop
          </button>
        </div>
      )}

      {/* Progress bar */}
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div className="h-full bg-white/70 rounded-full"
            style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
        </div>
      )}
    </div>
  );
};

const TrailerModal = ({ script, onClose, getImageUrl }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Video or AI Demo */}
          {script.trailerUrl ? (
            <video
              ref={videoRef}
              src={script.trailerUrl.startsWith("http") ? script.trailerUrl : `http://localhost:5002${script.trailerUrl}`}
              controls
              autoPlay
              className="w-full aspect-video"
              poster={script.coverImage ? getImageUrl(script.coverImage) : undefined}
            />
          ) : (
            <AIDemo script={script} getImageUrl={getImageUrl} />
          )}

          {/* Info bar */}
          <div className="bg-[#0a1628] px-5 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-bold text-sm line-clamp-1">{script.title}</p>
              <p className="text-white/40 text-xs">{script.genre} {script.contentType ? `· ${script.contentType.replace(/_/g, " ")}` : ""}</p>
            </div>
            <Link
              to={`/script/${script._id}`}
              onClick={onClose}
              className="flex-shrink-0 px-4 py-1.5 bg-[#111111] hover:bg-[#2a5080] text-white text-xs font-bold rounded-xl transition-colors"
            >
              View Project
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>

  );
};

/* ── Featured Carousel ─────────────────────────────── */
const FeaturedCarousel = ({ scripts, dark, getImageUrl, onWatchPreview }) => {
  const SLIDES = scripts.slice(0, 5);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const timerRef = useRef(null);

  const goTo = useCallback((idx, dir = 1) => {
    setDirection(dir);
    setCurrent((idx + SLIDES.length) % SLIDES.length);
  }, [SLIDES.length]);

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const script = SLIDES[current];
  const resolveImg = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5002${url}`;
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? "6%" : "-6%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-6%" : "6%", opacity: 0 }),
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden mb-8 shadow-lg border ${dark ? "border-[#1a3050] bg-[#080f1e]" : "border-gray-100 bg-gray-50"}`}
    >
      {/* Slide area */}
      <div className="relative h-[360px] sm:h-[420px] overflow-hidden">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            {/* Background cover image */}
            {script.coverImage ? (
              <img
                src={resolveImg(script.coverImage)}
                alt={script.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0a1628] via-[#0f2d52] to-[#1e4a7a]" />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-black text-white bg-[#111111] px-2.5 py-1 rounded-lg uppercase tracking-widest">
                  #{current + 1} Featured
                </span>
                {script.genre && (
                  <span className="text-[11px] font-bold text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                    {script.genre}
                  </span>
                )}
                {script.contentType && (
                  <span className="text-[11px] font-bold text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 capitalize">
                    {script.contentType.replace(/_/g, " ")}
                  </span>
                )}
                {script.premium ? (
                  <span className="text-[11px] font-black text-white bg-amber-500/90 px-2.5 py-1 rounded-lg">${script.price}</span>
                ) : (
                  <span className="text-[11px] font-black text-white bg-emerald-500/80 px-2.5 py-1 rounded-lg">Free</span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-2 drop-shadow-lg max-w-2xl line-clamp-2">
                {script.title}
              </h2>

              {/* Description */}
              <p className="text-base sm:text-lg text-white/70 leading-relaxed line-clamp-2 max-w-2xl mb-5 hidden sm:block">
                {script.logline || script.description || script.synopsis || ""}
              </p>

              {/* Creator */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Creator */}
                <div className="hidden sm:flex items-center gap-2 ml-auto">
                  <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {script.creator?.profileImage ? (
                      <img src={resolveImg(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{script.creator?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                    )}
                  </div>
                  <span className="text-sm text-white/75 font-medium">{script.creator?.name || "Unknown"}</span>
                  {script.scriptScore?.overall > 0 && (
                    <div className="flex items-center gap-1 ml-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bold text-amber-300">{script.scriptScore.overall}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Arrow nav */}
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

      </div>

      {/* Dot pagination + progress */}
      <div className={`flex items-center justify-center gap-2 py-3.5 ${dark ? "bg-[#080f1e]" : "bg-gray-50"}`}>
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="relative"
          >
            <div className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2.5 bg-[#111111]"
                : dark
                  ? "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
            }`} />
            {/* Auto-progress fill on active dot */}
            {i === current && (
              <motion.div
                key={`progress-${current}`}
                className="absolute inset-0 rounded-full bg-blue-400/60 origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: "linear" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className={`hidden sm:flex gap-2 px-4 pb-4 ${dark ? "" : ""}`}>
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`relative flex-1 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              i === current
                ? "border-[#111111] shadow-lg shadow-[#111111]/30 scale-[1.02]"
                : dark ? "border-transparent opacity-50 hover:opacity-80" : "border-transparent opacity-40 hover:opacity-70"
            }`}
          >
            {s.coverImage ? (
              <img src={resolveImg(s.coverImage)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#111111] flex items-center justify-center">
                <span className="text-white/40 text-[9px] font-bold">#{i + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Card Save Button ───────────────────────────────── */
const CardSaveBtn = ({ scriptId, dark }) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const handle = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (loading || saved) return;
    setLoading(true);
    try { await api.post("/users/watchlist/add", { scriptId }); setSaved(true); }
    catch { setSaved(true); }
    setLoading(false);
  };
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 ${
        saved
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
          : "bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
      }`}
    >
      {loading
        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : saved
          ? <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          : <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
      }
      {saved ? "Saved" : "Save"}
    </button>
  );
};


const FeaturedProjects = () => {
  const { isDarkMode: dark } = useDarkMode();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewScript, setPreviewScript] = useState(null);  // trailer modal

  /* Filter state */
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedSort, setSelectedSort] = useState("engagement");
  const [selectedPremium, setSelectedPremium] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);

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
    setLoadError("");
    try {
      const params = new URLSearchParams();
      params.append("sort", selectedSort);
      params.append("limit", "24");
      if (selectedGenre) params.append("genre", selectedGenre);
      if (selectedContentType) params.append("contentType", selectedContentType);
      if (selectedBudget) params.append("budget", selectedBudget);
      if (selectedPremium === "premium") params.append("premium", "true");
      else if (selectedPremium === "free") params.append("premium", "false");

      const { data } = await api.get(`/scripts?${params.toString()}`, { timeout: 10000 });
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.scripts)
          ? data.scripts
          : [];
      setScripts(rows.slice(0, 24));
    } catch {
      setScripts([]);
      setLoadError("Unable to load featured projects right now. Please retry.");
    }
    setLoading(false);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5002${url}`;
  };

  const rankBadge = (index) => {
    if (index === 0) return { bg: "bg-[#111111]", text: "text-white", label: "#1" };
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
    const base = "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap border cursor-pointer select-none";
    const styles = active
      ? "bg-[#111111] text-white border-[#111111] shadow-sm shadow-[#111111]/15"
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
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );

  return (
    <div className="w-full px-0 pt-0 pb-0">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={`mb-6 rounded-2xl border p-6 relative overflow-hidden ${dark ? "bg-[#0d1926] border-[#1a2e47]" : "bg-white border-[#1e3a5f]/20 shadow-sm"}`}
      >
        <div className={`absolute inset-0 pointer-events-none ${dark
          ? "bg-gradient-to-br from-[#1e3a5f]/10 via-transparent to-transparent"
          : "bg-gradient-to-br from-[#1e3a5f]/[0.03] via-transparent to-transparent"
        }`} />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#111111] to-[#3a7bd5]" />
              <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${dark ? "text-gray-100" : "text-gray-900"}`}>Featured Projects</h1>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            <p className="text-base text-gray-500 font-medium ml-[18px]">
              Most talked-about scripts and highest-value projects
            </p>
          </div>
          <p className="text-base text-gray-500 font-medium tabular-nums hidden sm:block">
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
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${filtersOpen || activeFilterCount > 0
                ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                : dark
                  ? "bg-white/[0.04] text-gray-300 border-[#444] hover:border-[#555]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 rounded-md text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown open={filtersOpen} />
            </button>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                {selectedGenre && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-xs font-bold">
                    {selectedGenre}
                    <button onClick={() => setSelectedGenre("")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedContentType && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-xs font-bold">
                    {CONTENT_TYPES.find(c => c.key === selectedContentType)?.label || selectedContentType}
                    <button onClick={() => setSelectedContentType("")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedBudget && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-xs font-bold">
                    {budgetLabel[selectedBudget]} Budget
                    <button onClick={() => setSelectedBudget("")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedPremium !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-xs font-bold">
                    {selectedPremium === "premium" ? "Premium" : "Free"}
                    <button onClick={() => setSelectedPremium("all")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
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
                      <span className="flex items-center">{opt.label}</span>
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
                      className={`text-sm font-semibold transition-colors px-3 py-1.5 rounded-xl ${dark ? "text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/10" : "text-red-500 hover:text-red-600 border border-red-200 bg-red-50"}`}
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
            <div className="w-8 h-8 border-[2.5px] border-gray-200 border-t-[#111111] rounded-full animate-spin"></div>
            <p className="text-base text-gray-500 font-medium">Loading projects…</p>
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
          <p className={`text-2xl font-extrabold mb-1 ${dark ? "text-gray-200" : "text-gray-700"}`}>{loadError ? "Couldn’t load Featured Projects" : "No projects found"}</p>
          <p className="text-base text-gray-500 mb-4">{loadError || "Try adjusting your filters or check back later"}</p>
          {loadError && (
            <button
              onClick={fetchFeatured}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white rounded-xl text-base font-semibold hover:bg-[#000000] transition-colors shadow-sm mr-2"
            >
              Retry loading
            </button>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white rounded-xl text-base font-semibold hover:bg-[#000000] transition-colors shadow-sm"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {/* ── Trailer/Preview Modal ── */}
      <AnimatePresence>
        {previewScript && (
          <TrailerModal
            script={previewScript}
            onClose={() => setPreviewScript(null)}
            getImageUrl={getImageUrl}
          />
        )}
      </AnimatePresence>

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
            {/* ── Featured Carousel (top 5) ── */}
            <FeaturedCarousel
              scripts={scripts}
              dark={dark}
              getImageUrl={getImageUrl}
              onWatchPreview={setPreviewScript}
            />

            {/* ── Grid cards (#6+, or all if carousel didn't consume them) ── */}
            {scripts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {scripts.slice(1).map((script, idx) => {
                  const rank = rankBadge(idx + 1);
                  const metric = getFeaturedMetric(script);
                  const hasCover = !!script.coverImage;
                  const isHovered = hoveredCard === (script._id || idx);
                  // Popularity bar relative to top metric
                  const allMetricVals = scripts.slice(1).map(s => {
                    const m = getFeaturedMetric(s);
                    return typeof m.value === "string" ? parseFloat(m.value.replace(/[$,]/g, "")) || 0 : Number(m.value) || 0;
                  });
                  const maxMetric = Math.max(...allMetricVals, 1);
                  const thisVal = typeof metric.value === "string" ? parseFloat(metric.value.replace(/[$,]/g, "")) || 0 : Number(metric.value) || 0;
                  const popularityPct = Math.round((thisVal / maxMetric) * 100);

                  return (
                    <motion.div
                      key={script._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3, ease }}
                      onMouseEnter={() => setHoveredCard(script._id || idx)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <Link
                        to={`/script/${script._id}`}
                        className={`group block rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-2xl border ${
                          dark
                            ? `border-[#1a3050] bg-[#080f1e] hover:border-[#2a4570] hover:shadow-blue-500/10`
                            : `border-gray-100 bg-white hover:border-[#111111]/20 hover:shadow-gray-200/60`
                        }`}
                      >
                        {/* ── Cover Section ── */}
                        <div className="relative h-[200px] bg-gradient-to-br from-[#091a2f] via-[#0f2d52] to-[#1a4a7a] overflow-hidden">
                          {hasCover ? (
                            <>
                              <img src={getImageUrl(script.coverImage)} alt={script.title} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            </>
                          ) : (
                            <>
                              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full border border-white/[0.04]" />
                              <div className="absolute bottom-12 -left-4 w-20 h-20 rounded-full border border-white/[0.03]" />
                              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
                                <h4 className="text-xl font-extrabold text-white leading-tight line-clamp-2 tracking-tight mb-1.5">{script.title}</h4>
                                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">{script.logline || script.description || script.synopsis || ""}</p>
                              </div>
                            </>
                          )}

                          {/* Rank badge */}
                          <div className="absolute top-3 left-3">
                            {rank ? (
                              <div className={`w-8 h-8 ${rank.bg} rounded-lg flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
                                <span className={`text-xs font-extrabold ${rank.text}`}>{rank.label}</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/15">
                                <span className="text-xs font-bold text-white">#{idx + 2}</span>
                              </div>
                            )}
                          </div>

                          {/* Rating badge top-right */}
                          {script.scriptScore?.overall > 0 && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">{script.scriptScore.overall}</span>
                            </div>
                          )}

                          {/* Price / free tag */}
                          {script.premium ? (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm rounded-lg">
                              <span className="text-sm font-extrabold text-white">${script.price}</span>
                            </div>
                          ) : (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-lg">
                              <span className="text-xs font-bold text-white">Free</span>
                            </div>
                          )}

                          {/* Genre tag */}
                          {(script.genre || script.primaryGenre) && (
                            <span className="absolute bottom-3 left-3 text-xs font-bold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                              {script.primaryGenre || script.genre}
                            </span>
                          )}

                          {/* Hover overlay */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="absolute inset-0 bg-[#0a1628]/85 backdrop-blur-sm flex flex-col justify-end p-4 z-20"
                                onClick={(e) => e.preventDefault()}
                              >
                                {/* Preview text */}
                                {(script.logline || script.description || script.synopsis) && (
                                  <p className="text-sm text-white/75 leading-relaxed line-clamp-3 mb-3">
                                    {script.logline || script.description || script.synopsis}
                                  </p>
                                )}
                                {/* Action buttons */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <CardSaveBtn scriptId={script._id} dark={dark} />
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewScript(script); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                    {script.trailerUrl ? "Trailer" : "Preview"}
                                  </button>
                                  <Link
                                    to={`/script/${script._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-[#111111] hover:bg-[#2a5080] text-white transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                    Details
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* ── Info Section ── */}
                        <div className="p-4">
                          {/* Title */}
                          <h3 className={`text-xl font-bold leading-snug line-clamp-1 mb-2 transition-colors ${
                            dark ? "text-gray-100 group-hover:text-blue-400" : "text-gray-900 group-hover:text-[#111111]"
                          }`}>
                            {script.title}
                          </h3>

                          {/* Popularity bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
                                {SORT_OPTIONS.find(o => o.key === selectedSort)?.label || "Score"}
                              </span>
                              <span className={`text-sm font-extrabold tabular-nums ${dark ? "text-gray-200" : "text-gray-700"}`}>
                                {metric.value}
                              </span>
                            </div>
                            <div className={`h-1 rounded-full overflow-hidden ${dark ? "bg-[#1a3050]" : "bg-gray-100"}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${popularityPct}%` }}
                                transition={{ duration: 0.7, delay: idx * 0.04 + 0.2, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-[#111111] to-[#3a7bd5]"
                              />
                            </div>
                          </div>

                          <div className={`border-t mb-3 ${dark ? "border-[#1a3050]" : "border-gray-100"}`} />

                          {/* Creator + stats row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ring-1 shrink-0 ${
                                dark ? "bg-[#111111]/20 ring-[#333]" : "bg-[#111111]/[0.08] ring-gray-100"
                              }`}>
                                {script.creator?.profileImage ? (
                                  <img src={getImageUrl(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-[#111111]">{script.creator?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                                )}
                              </div>
                              <span className={`text-sm font-semibold truncate ${dark ? "text-gray-400" : "text-gray-500"}`}>
                                {script.creator?.name || "Unknown"}
                              </span>
                            </div>

                            {/* Stats */}
                            <div className={`flex items-center gap-2.5 shrink-0 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-semibold tabular-nums">{(script.views || 0).toLocaleString()}</span>
                              </div>
                              {script.pageCount && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  <span className="text-sm font-semibold tabular-nums">{script.pageCount}p</span>
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
