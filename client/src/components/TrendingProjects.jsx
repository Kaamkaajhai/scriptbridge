import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Star, Eye, Flame, Award, ChevronRight } from "lucide-react";
import api from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";
import ScriptCard from "./ScriptCard";

const SORT_TABS = [
  { key: "featured", label: "Featured", icon: Award },
  { key: "rating", label: "Top Rated", icon: Star },
  { key: "reads", label: "Most Read", icon: Eye },
  { key: "purchases", label: "Trending", icon: Flame },
];

// Animate a number from 0 to value
const AnimatedCount = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const end = parseInt(value) || 0;
    if (!end) return;
    const duration = 900;
    const steps = 40;
    const inc = Math.ceil(end / steps);
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= end) { setDisplay(end); clearInterval(t); }
      else setDisplay(cur);
    }, duration / steps);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display >= 1000 ? `${(display / 1000).toFixed(1)}k` : display}</span>;
};

const TrendingProjects = () => {
  const { isDarkMode: dark } = useDarkMode();
  const [activeTab, setActiveTab] = useState("featured");

  // Featured state
  const [featuredScripts, setFeaturedScripts] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Top / sorted state
  const [topScripts, setTopScripts] = useState({});
  const [topLoading, setTopLoading] = useState({});
  const [isPaused, setIsPaused] = useState(false);

  // Load featured + prefetch all other tabs in background at once
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [featuredRes, ratingRes, readsRes, purchasesRes] = await Promise.all([
          api.get("/scripts/featured"),
          api.get("/scripts/top?sort=rating"),
          api.get("/scripts/top?sort=reads"),
          api.get("/scripts/top?sort=purchases"),
        ]);
        setFeaturedScripts(featuredRes.data);
        setTopScripts({
          rating: ratingRes.data,
          reads: readsRes.data,
          purchases: purchasesRes.data,
        });
      } catch {
        setFeaturedScripts([]);
      }
      setFeaturedLoading(false);
    };
    fetchAll();
  }, []);

  // Auto-rotate hero (paused on hover)
  useEffect(() => {
    if (featuredScripts.length < 2 || isPaused) return;
    const t = setInterval(
      () => setHeroIdx((i) => (i + 1) % Math.min(featuredScripts.length, 5)),
      5000
    );
    return () => clearInterval(t);
  }, [featuredScripts.length, isPaused]);



  const hero = featuredScripts[heroIdx] || featuredScripts[0];
  const isLoading = activeTab === "featured" ? featuredLoading : false;
  const scripts =
    activeTab === "featured"
      ? featuredScripts.slice(0, 8)
      : topScripts[activeTab] || [];

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#505081] to-[#272757] flex items-center justify-center">
            <TrendingUp size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${dark ? "text-gray-100" : "text-gray-900"}`}>
            Trending Projects
          </h2>
        </div>
        <div className={`flex gap-0.5 border rounded-xl p-1 ${dark ? "border-[#182840] bg-[#0b1728]" : "border-gray-100 bg-gray-50"}`}>
          {SORT_TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === t.key
                    ? "bg-gray-900 text-white shadow-sm"
                    : dark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon size={11} strokeWidth={2.5} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Banner — visible only on Featured tab */}
      {activeTab === "featured" &&
        !featuredLoading &&
        featuredScripts.length > 0 && (
          <div
            className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6 cursor-pointer"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {hero.coverImage ? (
                  <img
                    src={hero.coverImage}
                    alt={hero.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#0f1c2e] via-[#111111] to-[#333333]" />
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                  {/* Top row: badges + stats */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#505081]/90 backdrop-blur-sm rounded-full text-[11px] font-bold text-white">
                        <Flame size={10} /> FEATURED
                      </span>
                      {hero?.genre && (
                        <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[11px] font-medium text-white/90 border border-white/20">
                          {hero.genre}
                        </span>
                      )}
                    </div>
                    {(hero?.readsCount > 0 || hero?.rating > 0) && (
                      <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                        {hero?.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-[#c2c2e0] font-semibold">
                            <Star size={11} fill="currentColor" /> {hero.rating.toFixed(1)}
                          </span>
                        )}
                        {hero?.readsCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-blue-300 font-medium">
                            <Eye size={11} /> <AnimatedCount value={hero.readsCount} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom: title, logline, CTA */}
                  <div className="max-w-xl">
                    <motion.h3
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight"
                    >
                      {hero?.title}
                    </motion.h3>
                    {hero?.logline && (
                      <motion.p
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.18 }}
                        className="text-white/60 text-sm leading-relaxed line-clamp-2 mb-4"
                      >
                        {hero.logline}
                      </motion.p>
                    )}
                    <motion.div
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-center gap-3"
                    >
                      <Link
                        to={`/reader/script/${hero?._id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Read Now <ChevronRight size={14} strokeWidth={2.5} />
                      </Link>
                      {hero?.creator?.name && (
                        <span className="text-white/45 text-xs">by {hero.creator.name}</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar (auto-rotate indicator) */}
            {!isPaused && featuredScripts.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 pointer-events-none">
                <motion.div
                  key={`bar-${heroIdx}`}
                  className="h-full bg-white/50"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            )}

            {/* Dots */}
            {featuredScripts.length > 1 && (
              <div className="absolute bottom-4 right-5 flex gap-1.5">
                {featuredScripts.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === heroIdx
                        ? "bg-white w-6"
                        : "bg-white/35 w-1.5 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`h-64 rounded-xl animate-pulse ${dark ? "bg-[#182840]" : "bg-gray-50"
                }`}
            />
          ))}
        </div>
      ) : scripts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {scripts.map((s, i) => (
            <ScriptCard key={s._id} script={s} index={i} rank={activeTab !== "featured" ? i + 1 : null} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 font-normal py-8">
          No projects found
        </p>
      )}

      {/* View all link for featured */}
      {activeTab === "featured" && !featuredLoading && featuredScripts.length > 0 && (
        <div className="mt-5 text-right">
          <Link
            to="/reader/featured"
            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}
          >
            View all featured <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
};

export default TrendingProjects;
