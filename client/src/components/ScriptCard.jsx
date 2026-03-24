import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDarkMode } from "../context/DarkModeContext";
import {
  Drama, Laugh, Crosshair, Skull, Heart, Flame, Atom, Wand2,
  Search, Clapperboard, Sparkles, ScrollText, Swords, Globe,
  Music, BookOpen, Eye
} from "lucide-react";

const genreIcons = {
  drama: Drama, comedy: Laugh, thriller: Crosshair, horror: Skull,
  romance: Heart, action: Flame, sci_fi: Atom, fantasy: Wand2,
  mystery: Search, documentary: Clapperboard, animation: Sparkles,
  historical: Globe, war: Swords, musical: Music, biography: BookOpen,
  crime: Crosshair,
};

const getIcon = (genre) => {
  const key = (genre || "").toLowerCase().replace(/[\s-]/g, "_");
  return genreIcons[key] || ScrollText;
};

const StarSvg = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className="fill-amber-400 text-amber-400 shrink-0">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/* ─── Placeholder (no cover image) ─── */
const PlaceholderCover = ({ script, dark }) => {
  const IconComponent = getIcon(script.genre);
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${dark ? "bg-[#141c2b]" : "bg-[#f0f3f8]"}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${dark ? "bg-[#1e2a3e] border border-[#2a3a52]" : "bg-white border border-gray-200 shadow-sm"}`}>
        <IconComponent size={26} strokeWidth={1.5} className={dark ? "text-gray-500" : "text-gray-400"} />
      </div>
<<<<<<< HEAD

      {/* Title */}
      <div className="relative z-10 px-5 text-center max-w-[90%]">
        <p className="text-white/85 text-base font-semibold leading-snug line-clamp-2">
          {script.title}
        </p>
        {script.genre && (
          <p className="text-white/35 text-[11px] font-medium mt-2 uppercase tracking-[0.15em]">
            {script.genre}
          </p>
        )}
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
=======
      <h4 className={`text-sm font-bold text-center px-4 leading-tight line-clamp-2 ${dark ? "text-gray-200" : "text-gray-700"}`}>
        {script.title}
      </h4>
      {script.genre && (
        <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${dark ? "text-gray-600" : "text-gray-400"}`}>
          {script.genre}
        </span>
      )}
>>>>>>> origin/master
    </div>
  );
};

<<<<<<< HEAD

const StarIcon = () => (
  <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

=======
>>>>>>> origin/master
const ScriptCard = ({ script, index = 0 }) => {
  const { isDarkMode: dark } = useDarkMode();
  const [imgErr, setImgErr] = useState(false);
  if (!script) return null;

  const noImage = !script.coverImage || imgErr;
  const rating = script.rating || script.scriptScore?.overall || 0;
  const reviewCount = script.reviewCount || 0;
  const views = script.views || 0;

  return (
    <motion.div
<<<<<<< HEAD
      initial={{ opacity: 0, y: 12 }}
=======
      initial={{ opacity: 0, y: 10 }}
>>>>>>> origin/master
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <Link to={`/reader/script/${script._id}`} className="group block h-full">
<<<<<<< HEAD
        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full ${
          dark
            ? "bg-[#0d1b2e] border-[#1a2d45] hover:border-[#2a4a6e] hover:shadow-2xl hover:shadow-black/50"
            : "bg-white border-gray-200/80 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50/80"
        }`}>

          {/* Cover */}
          <div className="relative overflow-hidden bg-[#0a1628]" style={{ aspectRatio: "2/3" }}>
            {showPlaceholder ? (
              <PlaceholderCover script={script} />
            ) : (
              <img
                src={script.coverImage}
                alt={script.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
              />
            )}

            {/* Top-left badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {script.premium && (
                <span className="px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg tracking-wider shadow-lg">
                  ★ PREMIUM
                </span>
              )}
              {script.isFeatured && (
                <span className="px-2.5 py-1 bg-violet-600/90 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg tracking-wider shadow-lg">
                  ✦ FEATURED
                </span>
              )}
            </div>

            {/* Top-right rating chip */}
            {script.rating > 0 && (
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-xl flex items-center gap-1.5 border border-white/10 shadow-lg">
                <StarIcon />
                <span className="text-[13px] font-bold text-white leading-none">{(script.rating || 0).toFixed(1)}</span>
              </div>
            )}

            {/* Hover — Read Now CTA */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0d1b2e] text-sm font-bold rounded-xl shadow-2xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Now
                </span>
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="p-4 pt-3.5 flex flex-col flex-1">

            {/* Creator */}
            <div className="flex items-center gap-2 mb-2.5">
              {script.creator?.profileImage ? (
                <img src={script.creator.profileImage} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  dark ? "bg-[#1e3a5f] text-[#7aafff]" : "bg-blue-50 text-blue-600"
                }`}>
                  {script.creator?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className={`text-sm font-semibold truncate ${
                dark ? "text-gray-400" : "text-gray-500"
              }`}>
=======
        <div
          className={`
            rounded-2xl overflow-hidden flex flex-col h-full
            transition-all duration-300
            hover:-translate-y-1
            ${dark
              ? "bg-[#141c2b] border border-[#1e2a3e] hover:border-[#2e4060] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              : "bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            }
          `}
        >
          {/* ── Cover ── */}
          <div className="relative" style={{ aspectRatio: "4/3" }}>
            {noImage ? (
              <PlaceholderCover script={script} dark={dark} />
            ) : (
              <>
                <img
                  src={script.coverImage}
                  alt={script.title}
                  onError={() => setImgErr(true)}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />

              </>
            )}

            {/* Badges row */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-10">
              {/* Left badges */}
              <div className="flex flex-col gap-1.5">
                {script.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[9px] font-bold tracking-wide uppercase bg-violet-600 text-white">
                    + Featured
                  </span>
                )}
                {script.premium && (
                  <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[9px] font-bold tracking-wide uppercase bg-amber-500 text-white">
                    Premium
                  </span>
                )}
              </div>
              {/* Right: rating */}
              {rating > 0 && (
                <div className={`flex items-center gap-1 px-2 py-[3px] rounded-md text-[11px] font-bold ${dark ? "bg-[#141c2b]/80 backdrop-blur text-amber-400" : "bg-white/90 backdrop-blur text-amber-600"}`}>
                  <StarSvg size={11} />
                  {rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {/* ── Info ── */}
          <div className="flex flex-col flex-1 px-3.5 pt-3 pb-2.5">
            {/* Genre + read time */}
            {script.genre && (
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-[2px] rounded ${dark ? "bg-violet-500/20 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                  {script.genre}
                </span>
                {script.pageCount && (
                  <span className={`text-[10px] ${dark ? "text-gray-500" : "text-gray-400"}`}>• {Math.ceil(script.pageCount / 1.5)} min read</span>
                )}
              </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-2 mb-1.5">
              {script.creator?.profileImage ? (
                <img src={script.creator.profileImage} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${dark ? "bg-[#1e2a3e] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                  {script.creator?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className={`text-[11px] truncate ${dark ? "text-gray-500" : "text-gray-400"}`}>
>>>>>>> origin/master
                {script.creator?.name || "Unknown"}
              </span>
            </div>

            {/* Title */}
<<<<<<< HEAD
            <h3 className={`font-bold text-xl leading-snug mb-2 line-clamp-2 transition-colors ${
              dark ? "text-white group-hover:text-[#7aafff]" : "text-gray-900 group-hover:text-[#1e3a5f]"
            }`}>
=======
            <h3 className={`text-[13px] font-bold leading-snug line-clamp-2 mb-1 ${dark ? "text-gray-100" : "text-gray-900"}`}>
>>>>>>> origin/master
              {script.title}
            </h3>

            {/* Logline */}
<<<<<<< HEAD
            {(script.logline || script.synopsis) && (
              <p className={`text-base line-clamp-2 mb-3 leading-relaxed ${
                dark ? "text-gray-500" : "text-gray-500"
              }`}>
                {script.logline || script.synopsis}
=======
            {script.logline && (
              <p className={`text-[11px] leading-relaxed line-clamp-2 ${dark ? "text-gray-600" : "text-gray-400"}`}>
                {script.logline}
>>>>>>> origin/master
              </p>
            )}

            <div className="flex-1" />

<<<<<<< HEAD
            {/* Footer */}
            <div className={`flex items-center justify-between pt-3 mt-1 border-t ${
              dark ? "border-[#1a2d45]" : "border-gray-100"
            }`}>
              {script.genre ? (
                <span className={`text-sm px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide ${
                  dark
                    ? "bg-[#1e3a5f]/60 text-[#7aafff] border border-[#2a4a6e]"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}>
                  {script.genre}
                </span>
              ) : <span />}

              <div className="flex items-center gap-1">
                <StarIcon />
                <span className={`text-base font-bold ${
                  dark ? "text-gray-300" : "text-gray-700"
                }`}>
                  {(script.rating || 0).toFixed(1)}
                </span>
                <span className={`text-sm ${
                  dark ? "text-gray-600" : "text-gray-400"
                }`}>
                  ({script.reviewCount || 0})
                </span>
              </div>
=======
            {/* Footer stats */}
            <div className={`flex items-center gap-3 mt-2 pt-2 border-t ${dark ? "border-[#1e2a3e]" : "border-gray-100"}`}>
              {script.genre && (
                <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-[2px] rounded ${dark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                  {script.genre}
                </span>
              )}
              <div className="flex items-center gap-1">
                <StarSvg size={11} />
                <span className={`text-[11px] font-semibold ${dark ? "text-gray-300" : "text-gray-600"}`}>{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <span className={`text-[10px] ${dark ? "text-gray-600" : "text-gray-400"}`}>({reviewCount})</span>
                )}
              </div>
              {views > 0 && (
                <div className={`flex items-center gap-1 ml-auto ${dark ? "text-gray-600" : "text-gray-400"}`}>
                  <Eye size={11} strokeWidth={2} />
                  <span className="text-[10px] font-medium">{fmt(views)}</span>
                </div>
              )}
>>>>>>> origin/master
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ScriptCard;
