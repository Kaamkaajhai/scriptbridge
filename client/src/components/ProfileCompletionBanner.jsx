import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";

const clampPercent = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const ProfileCompletionBanner = ({
  completion,
  title = "Profile Completion",
  subtitle = "Your profile is incomplete. Add missing details.",
  ctaLabel = "Edit Profile",
  ctaTo,
  onCta,
  className = "",
}) => {
  const { isDarkMode: dark } = useDarkMode();

  if (!completion || completion.isComplete) return null;

  const percent = clampPercent(completion.percentage);
  const doneCount = Number(completion.completedFields || 0);
  const totalCount = Number(completion.totalFields || 0);

  const ctaClasses = dark
    ? "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold border bg-white/[0.06] text-white hover:bg-white/[0.11] border-white/[0.12] transition-all"
    : "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold border bg-white text-[#1e3a5f] hover:bg-[#f4f8ff] border-[#cfdbeb] transition-all shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
        dark
          ? "bg-[#0d1520] border-white/[0.08]"
          : "bg-white border-gray-200/70 shadow-sm"
      } ${className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: dark ? 0.09 : 0.06,
          backgroundImage: "radial-gradient(circle at 1px 1px, #5a8fd8 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3.5">
          <div className="min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dark ? "text-[#90a6c2]" : "text-[#48617f]"}`}>
              {title}
            </p>
            <p className={`text-[14px] font-semibold mt-1.5 ${dark ? "text-white/80" : "text-gray-700"}`}>
              {subtitle}
            </p>
            {totalCount > 0 && (
              <p className={`text-[12px] font-medium mt-1 ${dark ? "text-white/45" : "text-gray-500"}`}>
                {doneCount}/{totalCount} fields completed
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`text-3xl font-black tabular-nums leading-none ${dark ? "text-white" : "text-gray-900"}`}>
              {percent}%
            </div>
            {(onCta || ctaTo) && (
              onCta ? (
                <button type="button" onClick={onCta} className={ctaClasses}>
                  {ctaLabel}
                </button>
              ) : (
                <Link to={ctaTo} className={ctaClasses}>
                  {ctaLabel}
                </Link>
              )
            )}
          </div>
        </div>

        <div className={`h-2.5 rounded-full overflow-hidden ${dark ? "bg-white/[0.08]" : "bg-gray-100"}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] via-[#2d62a0] to-[#5a97e6] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCompletionBanner;
