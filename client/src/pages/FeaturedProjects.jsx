import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";

/* ── Icons ─────────────────────────────────────────── */
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
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
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const timerRef = useRef(null);

  const goTo = useCallback((idx, dir = 1) => {
    setDirection(dir);
    setCurrent((idx + SLIDES.length) % SLIDES.length);
  }, [SLIDES.length]);

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
                {(script.premium || script.isFeatured) && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-white bg-[#1e3a5f] border border-blue-400/50 px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {script.premium ? "Premium" : "Sponsored"}
                  </span>
                )}
                {!(script.premium || script.isFeatured) && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-white bg-gray-700 border border-gray-600 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    Trending
                  </span>
                )}
                <span className="text-[10px] font-black text-white bg-[#111111] px-2.5 py-1 rounded-lg uppercase tracking-widest">
                  #{current + 1} Featured
                </span>
                {script.genre && (
                  <span className="text-[10px] font-bold text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                    {script.genre}
                  </span>
                )}
                {script.contentType && (
                  <span className="text-[10px] font-bold text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 capitalize">
                    {script.contentType.replace(/_/g, " ")}
                  </span>
                )}
                {script.premium ? (
                  <span className="text-[10px] font-black text-white bg-gray-800 px-2.5 py-1 rounded-lg">${script.price}</span>
                ) : (
                  <span className="text-[10px] font-black text-white bg-emerald-500/80 px-2.5 py-1 rounded-lg">Free</span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2 drop-shadow-lg max-w-xl line-clamp-2">
                {script.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-white/60 leading-relaxed line-clamp-2 max-w-lg mb-5 hidden sm:block">
                {script.logline || script.description || script.synopsis || ""}
              </p>

              {/* Action buttons + creator */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to={`/script/${script._id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#111111] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  View Project
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); onWatchPreview(script); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                  {script.trailerUrl ? "Watch Trailer" : "Quick Preview"}
                </button>

                {/* Creator */}
                <div className="hidden sm:flex items-center gap-2 ml-auto">
                  <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {script.creator?.profileImage ? (
                      <img src={resolveImg(script.creator.profileImage)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{script.creator?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                    )}
                  </div>
                  <span className="text-xs text-white/70 font-medium">{script.creator?.name || "Unknown"}</span>
                  {script.scriptScore?.overall > 0 && (
                    <div className="flex items-center gap-1 ml-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] font-bold text-amber-300">{script.scriptScore.overall}</span>
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

        {/* Pause indicator */}
        {paused && (
          <div className="absolute top-4 right-16 flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
            <span className="w-2 h-2 rounded-full bg-white/60" />
            <span className="text-[10px] text-white/50 font-medium">paused</span>
          </div>
        )}
      </div>

      {/* Dot pagination + progress */}
      <div className={`flex items-center justify-center gap-2 py-3.5 ${dark ? "bg-[#080f1e]" : "bg-gray-50"}`}>
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            className="relative group"
          >
            <div className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2.5 bg-[#111111]"
                : dark
                  ? "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
            }`} />
            {/* Auto-progress fill on active dot */}
            {i === current && !paused && (
              <motion.div
                key={`progress-${current}`}
                className="absolute inset-0 rounded-full bg-blue-400/60 origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: "linear" }}
              />
            )}
          </button>
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
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

/* ══════════════════════════════════════════════════════════════ */
/* ── CARD COMPONENTS ── */
/* ══════════════════════════════════════════════════════════════ */

// Sponsored Project Card (Grid Layout)
const SponsoredCard = ({ script, getImageUrl, dark }) => (
  <Link to={`/scripts/${script._id}`}>
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        dark
          ? "border-blue-500/40 bg-gradient-to-br from-[#0a1628] to-[#0d1b2e] hover:shadow-2xl hover:shadow-blue-500/20"
          : "border-blue-300 bg-gradient-to-br from-blue-50 to-slate-50 hover:shadow-2xl hover:shadow-blue-200/50"
      }`}
    >
      {/* Cover Image */}
      <div className="relative h-[340px] overflow-hidden">
        {script.coverImage && (
          <img
            src={getImageUrl(script.coverImage)}
            alt={script.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Sponsored Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f] border border-blue-400/50 rounded-full shadow-lg">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-white text-xs font-bold">SPONSORED</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className={`text-xl font-bold mb-2 line-clamp-1 ${
          dark ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-600"
        } transition-colors`}>
          {script.title}
        </h3>
        
        {script.logline && (
          <p className={`text-sm mb-4 line-clamp-2 leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>
            {script.logline}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {script.genre && (
              <span className={`text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-600"}`}>
                {script.genre}
              </span>
            )}
            {script.rating && (
              <div className="flex items-center gap-1">
                <StarIcon filled />
                <span className={`text-xs font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                  {script.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          {script.views && (
            <div className="flex items-center gap-1">
              <EyeIcon />
              <span className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
                {script.views.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent" />
      </div>
    </motion.div>
  </Link>
);

// Trending Card (Horizontal Scroll)
const TrendingCard = ({ script, getImageUrl, dark }) => (
  <Link to={`/scripts/${script._id}`}>
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`group relative overflow-hidden rounded-2xl w-[360px] flex-shrink-0 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        dark ? "bg-[#0a1628] border-[#1a3050] hover:border-blue-500/40 hover:shadow-blue-500/10" : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-blue-100/60"
      }`}
    >
      <div className="relative h-[240px] overflow-hidden">
        {script.coverImage ? (
          <img
            src={getImageUrl(script.coverImage)}
            alt={script.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#091a2f] via-[#0f2d52] to-[#1a4a7a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        {/* Trending Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f] border border-blue-400/50 rounded-full shadow-lg backdrop-blur-sm">
          <TrendingIcon />
          <span className="text-white text-[11px] font-bold tracking-wide">TRENDING</span>
        </div>

        {/* Genre tag */}
        {script.genre && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
            <span className="text-white text-[11px] font-semibold">{script.genre}</span>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-extrabold text-[17px] line-clamp-2 mb-2 leading-snug">
            {script.title}
          </h3>
          <div className="flex items-center gap-3">
            {script.rating && (
              <div className="flex items-center gap-1">
                <StarIcon filled />
                <span className="text-white text-[13px] font-bold">{script.rating.toFixed(1)}</span>
              </div>
            )}
            {script.views && (
              <div className="flex items-center gap-1">
                <EyeIcon />
                <span className="text-white/80 text-[12px] font-medium">{script.views.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          {script.logline && (
            <p className={`text-[12px] line-clamp-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>{script.logline}</p>
          )}
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
          dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"
        }`}>View →</span>
      </div>
    </motion.div>
  </Link>
);

// Newly Promoted Card (Horizontal Scroll)
const NewlyPromotedCard = ({ script, getImageUrl, dark }) => (
  <Link to={`/scripts/${script._id}`}>
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`group relative overflow-hidden rounded-xl w-[240px] flex-shrink-0 ${
        dark ? "bg-[#0d1e30] border border-[#1a3050]" : "bg-white border border-gray-200"
      } hover:shadow-xl transition-all duration-300`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {script.coverImage && (
          <img
            src={getImageUrl(script.coverImage)}
            alt={script.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* New Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full ${
          dark ? "bg-blue-600 border border-blue-500" : "bg-blue-500"
        }`}>
          <span className="text-white text-xs font-bold">NEW</span>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-sm line-clamp-2 mb-2">
            {script.title}
          </h3>
          {script.genre && (
            <span className="text-gray-400 text-xs font-semibold">
              {script.genre}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  </Link>
);

// Horizontal Scroll Container
const HorizontalScroll = ({ children }) => (
  <div className="relative">
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
      {children}
    </div>
    <style>{`
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
  </div>
);


const FeaturedProjects = () => {
  const { isDarkMode: dark } = useDarkMode();
  
  // Data states
  const [scripts, setScripts] = useState([]);
  const [heroScript, setHeroScript] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [sponsoredScripts, setSponsoredScripts] = useState([]);
  const [trendingPromotions, setTrendingPromotions] = useState([]);
  const [newlyPromoted, setNewlyPromoted] = useState([]);
  
  const [loading, setLoading] = useState(true);
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

  // Auto-play hero carousel
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

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
      const [featuredRes, trendingRes, recentRes] = await Promise.all([
        api.get("/scripts/featured"),
        api.get("/scripts?sort=views&limit=12"),
        api.get("/scripts?sort=createdAt&limit=8")
      ]);

      let allScripts = featuredRes.data || [];
      const trendingData = trendingRes.data || [];
      const recentData = recentRes.data || [];

      // Separate sponsored/premium scripts
      const sponsored = allScripts.filter(s => s.premium || s.isFeatured);
      const regular = allScripts.filter(s => !s.premium && !s.isFeatured);

      // Set hero (top sponsored or first featured)
      setHeroScript(sponsored[0] || allScripts[0] || null);
      setHeroSlides(sponsored.length > 0 ? sponsored.slice(0, 5) : allScripts.slice(0, 5));

      // Sponsored section (exclude hero)
      setSponsoredScripts(sponsored.slice(1, 7));

      // Trending promotions (high engagement)
      const trending = trendingData
        .filter(s => s.premium || s.isFeatured || (s.views && s.views > 500))
        .slice(0, 8);
      setTrendingPromotions(trending);

      // Newly promoted (recent featured)
      const recent = recentData
        .filter(s => s.premium || s.isFeatured)
        .slice(0, 6);
      setNewlyPromoted(recent);

      setScripts(allScripts);
      const params = new URLSearchParams();
      params.append("sort", selectedSort);
      if (selectedGenre) params.append("genre", selectedGenre);
      if (selectedContentType) params.append("contentType", selectedContentType);
      if (selectedBudget) params.append("budget", selectedBudget);
      if (selectedPremium === "premium") params.append("premium", "true");
      else if (selectedPremium === "free") params.append("premium", "false");

      const { data } = await api.get(`/scripts?${params.toString()}`);
      const raw = Array.isArray(data) ? data : [];

      /*  Client-side sort guarantee  */
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

  /*  Pill Button Helper  */
  const Pill = ({ active, onClick, children, variant = "default" }) => {
    const base = "px-3.5 py-[7px] rounded-xl text-[12px] font-semibold transition-all duration-200 whitespace-nowrap border cursor-pointer select-none";
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

  /*  Filter Section Header  */
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
      {/* ── Premium Header with Promote CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="mb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* Sparkle Icon */}
              <div className={`p-2 rounded-xl ${dark ? "bg-gray-800 border border-gray-700" : "bg-gray-100"}`}>
                <svg className={`w-5 h-5 ${dark ? "text-gray-300" : "text-gray-700"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                  Featured Promotions
                </h1>
                <p className={`text-sm font-medium mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  Sponsored projects and premium content • Higher visibility for creators
                </p>
              </div>
            </div>
          </div>

          {/* Promote Your Project CTA */}
          <button
            onClick={() => alert("Promotion feature coming soon! Contact support to promote your project.")}
            className="flex items-center gap-2 px-5 py-3 bg-[#1e3a5f] hover:bg-[#2c5282] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105 border border-blue-400/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Promote Your Project
          </button>
        </div>

        {/* Info Banner */}
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
          dark 
            ? "bg-blue-500/10 border-blue-500/20 text-blue-200" 
            : "bg-blue-50 border-blue-200 text-blue-900"
        }`}>
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${dark ? "text-blue-400" : "text-blue-600"}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">Sponsored Content</p>
            <p className="text-xs opacity-90">
              Projects displayed here are either paid promotions or trending content selected for increased visibility. 
              Want to feature your project? Click "Promote Your Project" to get started.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ══ AD PAGE TOP HEADER BAR ══ */}
      <div className={`rounded-2xl mb-6 overflow-hidden border ${
        dark ? "bg-gradient-to-r from-[#0a1628] via-[#0d1f3a] to-[#0a1628] border-blue-500/20" : "bg-gradient-to-r from-[#0f2044] via-[#1a3a6e] to-[#0f2044] border-blue-400/30"
      }`}>
        <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg">
              <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span className="text-white text-xs font-black tracking-widest uppercase">Promoted Content</span>
            </div>
            <span className={`text-sm font-medium ${ dark ? "text-blue-200/70" : "text-blue-100/80"}`}>Premium placements for maximum visibility</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-xs font-semibold">Live Ads Running</span>
            </div>
            <Link to="/promote" className="flex items-center gap-2 px-4 py-2 bg-white text-[#0f2044] rounded-lg font-bold text-sm hover:bg-blue-50 transition-all shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Advertise Your Project
            </Link>
          </div>
        </div>
      </div>

      {/* ══ FEATURED CAROUSEL ══ */}
      {heroSlides.length > 0 && (() => {
        const slide = heroSlides[heroIndex];
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-2xl h-[560px] group border-2 border-blue-500/20 shadow-2xl shadow-blue-500/10">
              {/* Slides */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide._id}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0"
                >
                  {/* Cover Image */}
                  {slide.coverImage ? (
                    <>
                      <img src={getImageUrl(slide.coverImage)} alt={slide.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                    </>
                  ) : (
                    <div className={`w-full h-full ${dark ? "bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#1e293b]" : "bg-gradient-to-br from-gray-900 via-[#0f1c30] to-[#1e3a5f]"}`} />
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-10">
                    {/* Top badges row */}
                    <div className="absolute top-5 left-5 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-lg shadow-lg">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="text-white font-black text-[11px] tracking-widest uppercase">{slide.premium ? "Premium Ad" : "Sponsored"}</span>
                      </div>
                      {slide.genre && <span className="px-2.5 py-1.5 bg-black/40 backdrop-blur-sm text-white/90 text-[11px] font-bold rounded-lg border border-white/15">{slide.genre}</span>}
                    </div>

                    {/* Slide counter top-right */}
                    <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">
                      <span className="text-white/80 text-xs font-semibold">{heroIndex + 1} / {heroSlides.length}</span>
                    </div>

                    <div className="max-w-3xl">
                      <h2 className="text-5xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                        {slide.title}
                      </h2>
                      {slide.logline && (
                        <p className="text-lg text-gray-200 font-medium mb-6 line-clamp-2 drop-shadow-lg">{slide.logline}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mb-8">
                        {slide.genre && <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white text-sm font-semibold border border-white/20">{slide.genre}</span>}
                        {slide.rating && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                            <StarIcon filled />
                            <span className="text-white text-sm font-bold">{slide.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {slide.views && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                            <EyeIcon />
                            <span className="text-white text-sm font-semibold">{slide.views.toLocaleString()} views</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link to={`/scripts/${slide._id}`} className="px-8 py-4 bg-white text-gray-900 rounded-xl font-black text-base shadow-2xl hover:bg-blue-50 transition-all hover:scale-105">
                          View Project →
                        </Link>
                        <Link to={`/scripts/${slide._id}`} className="px-6 py-4 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-sm text-white rounded-xl font-bold text-base border border-blue-400/50 transition-all">
                          Quick Preview
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next arrows */}
              {heroSlides.length > 1 && (
                <>
                  <button
                    onClick={() => setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white transition-all hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button
                    onClick={() => setHeroIndex(i => (i + 1) % heroSlides.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white transition-all hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {heroSlides.length > 1 && (
                <div className="absolute bottom-5 right-10 flex items-center gap-2 z-20">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`transition-all duration-300 rounded-full ${
                        i === heroIndex ? "w-7 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── SPONSORED PROJECTS CAROUSEL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {sponsoredScripts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-lg">
                <span className="text-white text-[11px] font-black tracking-widest">AD</span>
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                  Sponsored Projects
                </h2>
                <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>Premium promoted content</p>
              </div>
            </div>
            <Link to="/promote" className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              dark ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : "border-blue-300 text-blue-600 hover:bg-blue-50"
            }`}>+ Promote your project</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsoredScripts.map((script, idx) => (
              <SponsoredCard key={script._id} script={script} getImageUrl={getImageUrl} dark={dark} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TRENDING PROMOTIONS CAROUSEL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {trendingPromotions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                <TrendingIcon />
                <span className="text-white text-[11px] font-black tracking-widest">TRENDING</span>
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                  Trending Promotions
                </h2>
                <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>High engagement featured projects</p>
              </div>
            </div>
          </div>

          <HorizontalScroll>
            {trendingPromotions.map((script) => (
              <TrendingCard key={script._id} script={script} getImageUrl={getImageUrl} dark={dark} />
            ))}
          </HorizontalScroll>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── NEWLY PROMOTED CAROUSEL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {newlyPromoted.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-1 rounded-full bg-gradient-to-b from-green-500 to-emerald-500`} />
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                  Newly Promoted
                </h2>
                <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  Recently featured projects
                </p>
              </div>
            </div>
          </div>

          <HorizontalScroll>
            {newlyPromoted.map((script) => (
              <NewlyPromotedCard key={script._id} script={script} getImageUrl={getImageUrl} dark={dark} />
            ))}
          </HorizontalScroll>
        </motion.div>
      )}

      {/* ── Filter bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
                ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                : dark
                  ? "bg-white/[0.04] text-gray-300 border-[#444] hover:border-[#555]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 rounded-md reader-typo-helper font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown open={filtersOpen} />
            </button>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                {selectedGenre && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-[11px] font-bold">
                    {selectedGenre}
                    <button onClick={() => setSelectedGenre("")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedContentType && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-[11px] font-bold">
                    {CONTENT_TYPES.find(c => c.key === selectedContentType)?.label || selectedContentType}
                    <button onClick={() => setSelectedContentType("")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedBudget && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-[11px] font-bold">
                    {budgetLabel[selectedBudget]} Budget
                    <button onClick={() => setSelectedBudget("")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                {selectedPremium !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111]/[0.06] text-[#111111] rounded-lg text-[11px] font-bold">
                    {selectedPremium === "premium" ? "Premium" : "Free"}
                    <button onClick={() => setSelectedPremium("all")} className="hover:bg-[#111111]/10 rounded p-0.5 transition-colors"><XIcon /></button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="reader-typo-helper font-semibold text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>


        </div>

        {/*  Collapsible filter panel  */}
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

      {/*  Loading  */}
      {loading && (
        <div className="flex items-center justify-center py-28">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[2.5px] border-gray-200 border-t-[#111111] rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-medium">Loading projects…</p>
          </div>
        </div>
      )}

      {/*  Empty state  */}
      {!loading && scripts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white rounded-xl text-sm font-semibold hover:bg-[#000000] transition-colors shadow-sm"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            {/* ── Featured Carousel (top 5) ── */}
            <FeaturedCarousel
              scripts={scripts}
              dark={dark}
              getImageUrl={getImageUrl}
              onWatchPreview={setPreviewScript}
            />

            {/* ── More Promoted Projects Section Header ── */}
            {scripts.length > 1 && (
              <>
                <div className="flex items-center justify-between mb-5 mt-8">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-lg">
                      <span className="text-white text-[11px] font-black tracking-widest">AD</span>
                    </div>
                    <div>
                      <h2 className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>
                        More Promoted Projects
                      </h2>
                      <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>
                        Sponsored content & trending scripts
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>
                    {scripts.length - 1} projects
                  </span>
                </div>

                {/* ══ MID-PAGE ADVERTISE BANNER ══ */}
                <div className={`rounded-2xl p-6 mb-6 flex items-center justify-between flex-wrap gap-4 border ${
                  dark ? "bg-gradient-to-r from-[#0d1f3a] to-[#0a1628] border-blue-500/20" : "bg-gradient-to-r from-[#1a3a6e] to-[#0f2044] border-blue-400/20"
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SparklesIcon />
                      <span className="text-blue-300 font-black text-sm tracking-wide uppercase">Boost Your Reach</span>
                    </div>
                    <p className="text-white font-bold text-lg">Get your script in front of 10,000+ readers & investors</p>
                    <p className="text-white/50 text-sm mt-0.5">Premium placements starting from ₹999/month</p>
                  </div>
                  <Link to="/promote" className="flex items-center gap-2 px-6 py-3 bg-white text-[#0f2044] rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl whitespace-nowrap">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Start Advertising
                  </Link>
                </div>
                
                {/* ── Grid cards (#2+) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {scripts.slice(1).map((script, idx) => {
                  const rank = rankBadge(idx + 1);
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3, ease }}
                      onMouseEnter={() => setHoveredCard(script._id || idx)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <Link
                        to={`/script/${script._id}`}
                        className={`group block rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-2xl border ${
                          script.premium || script.isFeatured
                            ? dark
                              ? "border-2 border-blue-500/40 bg-gradient-to-br from-[#0a1628] to-[#0d1b2e] hover:border-blue-500/60 hover:shadow-blue-500/20 shadow-blue-500/10"
                              : "border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-slate-50 hover:border-blue-400 hover:shadow-blue-300/60 shadow-blue-200/40"
                            : dark
                            ? `border-[#1a3050] bg-[#080f1e] hover:border-[#2a4570] hover:shadow-blue-500/10`
                            : `border-gray-100 bg-white hover:border-[#111111]/20 hover:shadow-gray-200/60`
                        }`}
                      >
                        {/* ── Cover Section ── */}
                        <div className="relative h-[300px] bg-gradient-to-br from-[#091a2f] via-[#0f2d52] to-[#1a4a7a] overflow-hidden">
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
                                <h4 className="text-lg font-extrabold text-white leading-tight line-clamp-2 tracking-tight mb-1.5">{script.title}</h4>
                                <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">{script.logline || script.description || script.synopsis || ""}</p>
                              </div>
                            </>
                          )}

                          {/* Sponsored/Premium Badge - Top Left */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {(script.premium || script.isFeatured) && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-[#1e3a5f] border border-blue-400/50 rounded-lg shadow-lg">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[9px] font-black text-white uppercase tracking-wide">
                                  {script.premium ? "Premium" : "Sponsored"}
                                </span>
                              </div>
                            )}
                            {rank && (
                              <div className={`w-7 h-7 ${rank.bg} rounded-lg flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
                                <span className={`text-[10px] font-extrabold ${rank.text}`}>{rank.label}</span>
                              </div>
                            )}
                            {!rank && !(script.premium || script.isFeatured) && (
                              <div className="w-7 h-7 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/15">
                                <span className="text-[10px] font-bold text-white">#{idx + 2}</span>
                              </div>
                            )}
                          </div>

                          {/* Rating badge top-right */}
                          {script.scriptScore?.overall > 0 && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                              </svg>
                              <span className="text-[11px] font-bold text-amber-300 tabular-nums">{script.scriptScore.overall}</span>
                            </div>
                          )}

                          {/* Price / free tag */}
                          {script.premium ? (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm rounded-lg">
                              <span className="text-[11px] font-extrabold text-white">${script.price}</span>
                            </div>
                          ) : (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-lg">
                              <span className="text-[10px] font-bold text-white">Free</span>
                            </div>
                          )}

                          {/* Genre tag */}
                          {(script.genre || script.primaryGenre) && (
                            <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
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
                                  <p className="text-[11px] text-white/70 leading-relaxed line-clamp-3 mb-3">
                                    {script.logline || script.description || script.synopsis}
                                  </p>
                                )}
                                {/* Action buttons */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <CardSaveBtn scriptId={script._id} dark={dark} />
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewScript(script); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                    {script.trailerUrl ? "Trailer" : "Preview"}
                                  </button>
                                  <Link
                                    to={`/script/${script._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#111111] hover:bg-[#2a5080] text-white transition-colors"
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
                        <div className="p-6">
                          {/* Title */}
                          <h3 className={`text-[18px] font-bold leading-snug line-clamp-1 mb-2.5 transition-colors ${
                            dark ? "text-gray-100 group-hover:text-blue-400" : "text-gray-900 group-hover:text-[#111111]"
                          }`}>
                            {script.title}
                          </h3>

                          {/* Popularity bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
                                {SORT_OPTIONS.find(o => o.key === selectedSort)?.label || "Score"}
                              </span>
                              <span className={`text-[11px] font-extrabold tabular-nums ${dark ? "text-gray-200" : "text-gray-700"}`}>
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
                              <span className={`text-[11px] font-semibold truncate ${dark ? "text-gray-400" : "text-gray-500"}`}>
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
                                <span className="text-[11px] font-semibold">{(script.views || 0).toLocaleString()}</span>
                              </div>
                              {script.pageCount && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  <span className="text-[11px] font-semibold tabular-nums">{script.pageCount}p</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/*  Info panel  */}
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
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default FeaturedProjects;
