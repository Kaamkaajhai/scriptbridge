/**
 * SkeletonCards
 *
 * Shared skeleton loading components that precisely mimic
 * the layout of ProjectCard and ScriptCard.
 *
 * Usage:
 *   import { ProjectCardSkeleton, ScriptCardSkeleton } from "./SkeletonCards";
 *   {loading && Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
 */
import { useDarkMode } from "../context/DarkModeContext";

/* ────────────────────────────────────────────────────────────
   Shared shimmer line primitive
   ──────────────────────────────────────────────────────────── */
const Bone = ({ className = "" }) => {
  const { isDarkMode: dark } = useDarkMode();
  return (
    <div
      className={`rounded-lg skeleton ${className}`}
      style={dark ? {
        background: "linear-gradient(90deg, #0e1c2e 25%, #1a3050 37%, #0e1c2e 63%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      } : undefined}
    />
  );
};

/* ────────────────────────────────────────────────────────────
   ProjectCard skeleton  (icon · author · title · logline · footer)
   ──────────────────────────────────────────────────────────── */
export const ProjectCardSkeleton = () => {
  const { isDarkMode: dark } = useDarkMode();
  return (
    <div
      className={`rounded-2xl border overflow-hidden w-full ${
        dark ? "bg-[#0d1829] border-white/[0.06]" : "bg-white border-gray-100 shadow-sm"
      }`}
      aria-busy="true"
      aria-label="Loading project card"
    >
      {/* Body */}
      <div className="flex flex-col items-center px-6 pt-10 pb-6">
        {/* Icon placeholder */}
        <Bone className="w-16 h-16 rounded-2xl mb-5" />
        {/* Author placeholder */}
        <Bone className="w-24 h-3 mb-3" />
        {/* Title placeholder */}
        <Bone className="w-40 h-5 mb-2" />
        <Bone className="w-28 h-5 mb-6" />
        {/* Logline placeholders */}
        <Bone className="w-full h-3 mb-2" />
        <Bone className="w-5/6 h-3 mb-2" />
        <Bone className="w-4/6 h-3 mb-8" />
      </div>
      {/* Footer */}
      <div
        className={`border-t px-6 py-4 flex items-center justify-center gap-4 ${
          dark ? "border-white/[0.06]" : "border-gray-100"
        }`}
      >
        <Bone className="w-20 h-4" />
        <Bone className="w-20 h-4" />
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   ScriptCard skeleton  (cover · title · genre · meta row)
   ──────────────────────────────────────────────────────────── */
export const ScriptCardSkeleton = () => {
  const { isDarkMode: dark } = useDarkMode();
  return (
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col h-full ${
        dark ? "bg-[#101e30] border-[#182840]" : "bg-white border-gray-100/80 shadow-sm"
      }`}
      aria-busy="true"
      aria-label="Loading script card"
    >
      {/* Cover area (aspect-3/4) */}
      <div className="relative" style={{ paddingBottom: "133%" }}>
        <Bone className="absolute inset-0 rounded-none" />
      </div>

      {/* Info section */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Title */}
        <Bone className="w-4/5 h-3.5" />
        <Bone className="w-3/5 h-3" />
        {/* Genre chip */}
        <Bone className="w-16 h-4 rounded-full mt-1" />
        {/* Meta row */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Bone className="w-10 h-3" />
          <Bone className="w-10 h-3" />
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Dashboard stat card skeleton
   ──────────────────────────────────────────────────────────── */
export const StatCardSkeleton = () => {
  const { isDarkMode: dark } = useDarkMode();
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark ? "bg-[#0d1829] border-white/[0.06]" : "bg-white border-gray-100 shadow-sm"
      }`}
      aria-busy="true"
    >
      <div className="flex items-center justify-between mb-4">
        <Bone className="w-20 h-3" />
        <Bone className="w-8 h-8 rounded-xl" />
      </div>
      <Bone className="w-28 h-7 mb-2" />
      <Bone className="w-16 h-2.5" />
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Generic list-row skeleton (messages, writers, etc.)
   ──────────────────────────────────────────────────────────── */
export const RowSkeleton = () => {
  const { isDarkMode: dark } = useDarkMode();
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
        dark ? "bg-[#0d1829]" : "bg-gray-50"
      }`}
      aria-busy="true"
    >
      <Bone className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="w-1/3 h-3" />
        <Bone className="w-2/3 h-2.5" />
      </div>
      <Bone className="w-12 h-3 shrink-0" />
    </div>
  );
};
