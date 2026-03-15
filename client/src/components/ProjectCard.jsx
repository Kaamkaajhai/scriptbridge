import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import { useState } from "react";
import {
  Drama, Laugh, Crosshair, Skull, Heart, Flame, Atom, Wand2,
  Search, Clapperboard, Sparkles, ScrollText, Swords, Globe,
  Music, BookOpen, Eye, BookOpenCheck
} from "lucide-react";

const FORMAT_LABEL = {
  feature: "Feature Film", feature_film: "Feature Film",
  short: "Short Film", short_film: "Short Film",
  tv_pilot: "TV Pilot", limited_series: "Limited Series",
  webseries: "Web Series", documentary: "Documentary",
};

const STATUS = {
  pending_approval: { label: "In Review", dot: "bg-amber-400" },
  rejected:         { label: "Rejected",  dot: "bg-rose-400" },
  published:        { label: "Published", dot: "bg-emerald-400" },
  draft:            { label: "Draft",     dot: "bg-gray-400" },
};

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

const ProjectCard = ({ project, userName }) => {
  const navigate = useNavigate();
  const { isDarkMode: dark } = useDarkMode();
  const [imgErr, setImgErr] = useState(false);

  const isClickable = project?.status === "published";
  const genre = project?.primaryGenre || project?.genre || null;
  const format = FORMAT_LABEL[project?.format] || project?.format || null;
  const score = project?.platformScore?.overall ?? project?.scriptScore?.overall ?? null;
  const views = project?.views ?? 0;
  const rating = project?.rating ?? 0;
  const reads = project?.readsCount ?? 0;
  const status = STATUS[project?.status] || STATUS.draft;
  const coverImage = project?.coverImage || null;
  const noImage = !coverImage || imgErr;
  const GenreIcon = getIcon(genre);

  return (
    <div
      onClick={() => isClickable && navigate(`/script/${project._id}`)}
      className={`
        group relative flex flex-col overflow-hidden rounded-2xl border
        transition-all duration-300 select-none
        ${isClickable ? "cursor-pointer hover:-translate-y-1" : "cursor-default"}
        ${dark
          ? "bg-[#141c2b] border-[#1e2a3e] hover:border-[#2e4060] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          : "bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        }
      `}
    >
      {/* ── COVER ── */}
      <div className="relative w-full flex-shrink-0 overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {noImage ? (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${dark ? "bg-[#141c2b]" : "bg-[#f0f3f8]"}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${dark ? "bg-[#1e2a3e] border border-[#2a3a52]" : "bg-white border border-gray-200 shadow-sm"}`}>
              <GenreIcon size={24} strokeWidth={1.5} className={dark ? "text-gray-500" : "text-gray-400"} />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${dark ? "text-gray-600" : "text-gray-400"}`}>No Cover</span>
          </div>
        ) : (
          <img
            src={coverImage}
            alt={project?.title}
            onError={() => setImgErr(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        )}



        {/* Status badge — top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-[3px] rounded-md ${dark ? "bg-[#141c2b]/80 backdrop-blur text-white/80 border border-white/[0.06]" : "bg-white/90 backdrop-blur text-gray-700 border border-gray-200/70 shadow-sm"}`}>
            <span className="relative flex h-[5px] w-[5px]">
              {project?.status === "published" && <span className={`absolute inline-flex h-full w-full rounded-full opacity-50 ${status.dot} animate-ping`} />}
              <span className={`relative inline-flex h-[5px] w-[5px] rounded-full ${status.dot}`} />
            </span>
            {status.label}
          </span>
        </div>

        {/* Score — top-right */}
        {score != null && (
          <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-[3px] rounded-md text-[11px] font-bold ${dark ? "bg-[#141c2b]/80 backdrop-blur text-amber-400 border border-white/[0.06]" : "bg-white/90 backdrop-blur text-amber-600 border border-gray-200/70 shadow-sm"}`}>
            <StarSvg size={11} />
            {score}
          </div>
        )}

        {/* Premium badge */}
        {project?.premium && (
          <span className="absolute bottom-3 right-3 px-2 py-[3px] rounded-md text-[9px] font-bold tracking-wide uppercase bg-amber-500 text-white">
            Premium
          </span>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col flex-1 px-3.5 pt-3 pb-2.5">
        {/* Genre + format tags */}
        {(genre || format) && (
          <div className="flex items-center gap-1.5 mb-2">
            {genre && (
              <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-[2px] rounded ${dark ? "bg-violet-500/20 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                {genre}
              </span>
            )}
            {format && (
              <span className={`text-[9px] font-medium tracking-wide px-2 py-[2px] rounded ${dark ? "bg-white/[0.04] text-gray-500" : "bg-gray-50 text-gray-400"}`}>
                {format}
              </span>
            )}
          </div>
        )}

        {/* Author */}
        <p className={`text-[11px] mb-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          {userName || "Unknown Author"}
        </p>

        {/* Title */}
        <h3 className={`text-[14px] font-bold leading-snug line-clamp-1 mb-1 ${dark ? "text-gray-100" : "text-gray-900"}`}>
          {project?.title || "Untitled Project"}
        </h3>

        {/* Logline */}
        <p className={`text-[11px] leading-relaxed line-clamp-2 flex-1 ${(project?.logline || project?.description) ? (dark ? "text-gray-600" : "text-gray-400") : (dark ? "text-gray-700" : "text-gray-300")}`}>
          {project?.logline || project?.description || "No description provided."}
        </p>

        {/* Footer stats */}
        <div className={`flex items-center gap-3 mt-2 pt-2 border-t ${dark ? "border-[#1e2a3e]" : "border-gray-100"}`}>
          {genre && (
            <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-[2px] rounded ${dark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
              {genre}
            </span>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <StarSvg size={11} />
              <span className={`text-[11px] font-semibold ${dark ? "text-gray-300" : "text-gray-600"}`}>{rating.toFixed(1)}</span>
            </div>
          )}
          <div className={`flex items-center gap-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>
            <Eye size={11} strokeWidth={2} />
            <span className="text-[10px] font-medium">{fmt(views)}</span>
          </div>
          {reads > 0 && (
            <div className={`flex items-center gap-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>
              <BookOpenCheck size={11} strokeWidth={2} />
              <span className="text-[10px] font-medium">{fmt(reads)}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Price / Sold / Hold */}
          {project?.isSold ? (
            <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-[2px] rounded ${dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>Sold</span>
          ) : project?.holdStatus === "held" ? (
            <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-[2px] rounded ${dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>On Hold</span>
          ) : project?.premium && project?.price ? (
            <span className={`text-[13px] font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>${project.price}</span>
          ) : null}
        </div>
      </div>

      {/* Rejection reason */}
      {project?.status === "rejected" && project?.rejectionReason && (
        <div className={`px-3.5 py-2 border-t text-[10px] leading-relaxed line-clamp-2 ${dark ? "border-[#1e2a3e] bg-rose-950/20 text-rose-400/70" : "border-gray-100 bg-rose-50/60 text-rose-500"}`}>
          <span className="font-bold mr-1">Reason:</span>{project.rejectionReason}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;