import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";
import LazyImage from "./LazyImage";
import useIntersectionObserver from "../utils/useIntersectionObserver";
import api from "../services/api";
import {
  Drama, Laugh, Crosshair, Skull, Heart, Flame, Atom, Wand2,
  Search, Clapperboard, Sparkles, ScrollText, Swords, Globe,
  Music, BookOpen, Eye, TrendingUp, Bookmark, BookmarkCheck
} from "lucide-react";

// Genre → icon mapping (all use the same theme color)
const genreIcons = {
  drama: Drama,
  comedy: Laugh,
  thriller: Crosshair,
  horror: Skull,
  romance: Heart,
  action: Flame,
  sci_fi: Atom,
  fantasy: Wand2,
  mystery: Search,
  documentary: Clapperboard,
  animation: Sparkles,
  historical: Globe,
  war: Swords,
  musical: Music,
  biography: BookOpen,
  crime: Crosshair,
};

const getIcon = (genre, contentType) => {
  const key = (genre || contentType || "").toLowerCase().replace(/[\s-]/g, "_");
  return genreIcons[key] || ScrollText;
};

// Stable hash for consistent pattern
const hashStr = (str) => {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const PlaceholderCover = ({ script }) => {
  const IconComponent = getIcon(script.genre, script.contentType);
  const hash = hashStr(script._id || script.title);
  const patternIdx = hash % 3;

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden bg-linear-to-b from-[#0f1c2e] to-[#1a2d45]">
      {/* Subtle pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {patternIdx === 0 && (
            <pattern id={`p-${hash}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1" fill="white" />
            </pattern>
          )}
          {patternIdx === 1 && (
            <pattern id={`p-${hash}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 20L20 0M-5 5L5 -5M15 25L25 15" stroke="white" strokeWidth="0.4" />
            </pattern>
          )}
          {patternIdx === 2 && (
            <pattern id={`p-${hash}`} width="28" height="28" patternUnits="userSpaceOnUse">
              <rect x="4" y="4" width="20" height="20" rx="4" fill="none" stroke="white" strokeWidth="0.4" />
            </pattern>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${hash})`} />
      </svg>

      {/* Soft glow */}
      <div className="absolute bottom-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-[0.08] bg-white" />

      {/* Icon */}
      <div className="relative z-10 mb-4 group-hover:scale-105 transition-transform duration-300">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/8 bg-white/5">
          <IconComponent size={28} strokeWidth={1.5} className="text-white/50" />
        </div>
      </div>

      {/* Title */}
      <div className="relative z-10 px-5 text-center max-w-[90%]">
        <p className="text-white/80 text-sm font-semibold leading-snug line-clamp-2">
          {script.title}
        </p>
        {script.genre && (
          <p className="text-white/30 text-xs font-semibold mt-2 uppercase tracking-[0.12em]">
            {script.genre}
          </p>
        )}
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};


const formatReads = (n) => {
  if (!n || n < 1) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const ScriptCard = ({ script, index = 0, rank = null }) => {
  const { isDarkMode: dark } = useDarkMode();
  const { user } = useContext(AuthContext);
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardRef, isVisible] = useIntersectionObserver({ threshold: 0.05 });
  if (!script) return null;

  const showPlaceholder = !script.coverImage || imgError;

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || saving || saved) return;
    setSaving(true);
    try {
      await api.post("/users/watchlist/add", { scriptId: script._id });
      setSaved(true);
    } catch {
      // already saved or error — mark visually saved anyway
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="h-full"
    >
      <Link to={`/reader/script/${script._id}`} className="group block h-full">
          <div className={`card-hover rounded-2xl border overflow-hidden flex flex-col h-full ${dark ? "bg-[#101e30] border-[#182840]" : "bg-white border-gray-200 shadow-sm"}`}>
          {/* Cover */}
          <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "2/3" }}>
            {showPlaceholder ? (
              <PlaceholderCover script={script} />
            ) : (
              <LazyImage
                src={script.coverImage}
                alt={script.title}
                onError={() => setImgError(true)}
                wrapClass="w-full h-full"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            )}
            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
              {script.premium && (
                <span className="px-2.5 py-1 bg-[#505081]/20 text-[#c2c2e0] text-xs font-bold rounded-md border border-[#8686AC]/30">
                  PREMIUM
                </span>
              )}
              {script.isFeatured && (
                <span className="px-2.5 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-md border border-violet-200/60">
                  FEATURED
                </span>
              )}
              {rank && rank <= 3 && (
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  rank === 1 ? "bg-yellow-400 text-yellow-900" :
                  rank === 2 ? "bg-gray-300 text-gray-800" :
                               "bg-[#505081]/30 text-[#c2c2e0]"
                }`}>
                  #{rank}
                </span>
              )}
            </div>
            {script.rating > 0 && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white rounded-md text-xs font-medium text-gray-700 flex items-center gap-1 border border-gray-200">
                <svg className="w-3 h-3 text-[#8686AC] fill-[#8686AC]" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {(script.rating || 0).toFixed(1)}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-3.5 gap-2">
              {formatReads(script.readsCount) && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs text-white/90 font-semibold border border-white/15">
                  <Eye size={12} /> {formatReads(script.readsCount)} reads
                </span>
              )}
              <div className="flex items-center gap-2 w-full">
                {/* Save to Library */}
                {user && (
                  <button
                    onClick={handleSave}
                    title={saved ? "Saved!" : "Save to Library"}
                    className={`flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-sm border transition-all duration-200 shrink-0 ${
                      saved
                        ? "bg-green-500/80 border-green-400/40 text-white"
                        : "bg-white/15 border-white/20 text-white hover:bg-white/25"
                    }`}
                  >
                    {saved
                      ? <BookmarkCheck size={15} strokeWidth={2.5} />
                      : <Bookmark size={15} strokeWidth={2} />
                    }
                  </button>
                )}
                {/* Read Now */}
                <span className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/25 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Now
                </span>
              </div>
            </div>
          </div>
          {/* Info */}
          <div className="p-3.5 flex flex-col flex-1">

            {/* Creator row */}
            <div className="flex items-center gap-2 mb-2">
              {script.creator?.profileImage ? (
                <img src={script.creator.profileImage} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${dark ? "bg-violet-800/60 text-violet-200" : "bg-violet-100 text-violet-600"}`}>
                  {script.creator?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <span className={`text-xs font-medium truncate flex-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                {script.creator?.name || "Unknown"}
              </span>
              {/* Content type badge */}
              {script.contentType && script.contentType !== "movie" && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${dark ? "bg-white/5 text-gray-500 border-white/10" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                  {script.contentType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className={`font-bold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-violet-400 transition-colors ${dark ? "text-gray-100" : "text-gray-800"}`}>
              {script.title}
            </h3>

            {/* Logline */}
            {(script.logline || script.synopsis) && (
              <p className={`text-xs line-clamp-2 mb-2 leading-relaxed ${dark ? "text-gray-500" : "text-gray-500"}`}>
                {script.logline || script.synopsis}
              </p>
            )}

            <div className="flex-1" />

            {/* Footer: rating · reads · pages | genre */}
            <div className={`flex items-center justify-between mt-2 pt-2.5 border-t ${dark ? "border-[#182840]" : "border-gray-100"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Star rating */}
                <span className={`flex items-center gap-1 text-xs font-semibold ${dark ? "text-gray-300" : "text-gray-600"}`}>
                  <svg className="w-3 h-3 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {(script.rating || 0).toFixed(1)}
                  {script.reviewCount > 0 && (
                    <span className={`font-normal ${dark ? "text-gray-600" : "text-gray-400"}`}>({script.reviewCount})</span>
                  )}
                </span>
                {/* Reads */}
                {formatReads(script.readsCount) && (
                  <>
                    <span className={`text-xs ${dark ? "text-gray-700" : "text-gray-300"}`}>·</span>
                    <span className={`flex items-center gap-1 text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>
                      <Eye size={11} /> {formatReads(script.readsCount)}
                    </span>
                  </>
                )}
                {/* Page count */}
                {script.pageCount > 0 && (
                  <>
                    <span className={`text-xs ${dark ? "text-gray-700" : "text-gray-300"}`}>·</span>
                    <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>{script.pageCount}p</span>
                  </>
                )}
              </div>
              {/* Genre pill */}
              {script.genre && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ml-1 ${dark ? "bg-white/5 text-gray-400 border-[#1d3350]" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                  {script.genre}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ScriptCard;
