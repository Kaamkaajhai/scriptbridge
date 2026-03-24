import { motion } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";

const STEPS = [
  { key: "profileImage", label: "Add a profile photo",    check: (p) => !!p.profileImage },
  { key: "bio",          label: "Write a bio",            check: (p) => !!p.bio?.trim() },
  { key: "favoriteGenres", label: "Choose favourite genres", check: (p) => (p.favoriteGenres?.length || 0) > 0 },
  { key: "coverImage",   label: "Upload a cover image",   check: (p) => !!p.coverImage },
];

const ProfileCompletion = ({ profile, onEdit }) => {
  const { isDarkMode: dark } = useDarkMode();

  const completed = STEPS.filter((s) => s.check(profile));
  const pct = Math.round((completed.length / STEPS.length) * 100);
  const allDone = pct === 100;

  const barColor =
    pct === 100 ? "from-emerald-500 to-teal-400" :
    pct >= 50   ? "from-blue-500 to-indigo-500" :
                  "from-orange-400 to-rose-500";

  return (
    <div className={`rounded-2xl border p-5 transition-colors ${dark ? "bg-[#0d1829] border-white/[0.06]" : "bg-white border-gray-200/70 shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dark ? "bg-white/[0.05]" : "bg-[#111111]/[0.06]"}`}>
            <svg className={`w-4 h-4 ${dark ? "text-white/50" : "text-[#111111]/60"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className={`text-[13px] font-bold ${dark ? "text-white/70" : "text-gray-800"}`}>Profile Completion</h3>
        </div>
        <span className={`text-xl font-extrabold tabular-nums ${allDone ? "text-emerald-500" : dark ? "text-white" : "text-gray-900"}`}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={`h-2 rounded-full mb-4 overflow-hidden ${dark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full bg-linear-to-r ${barColor}`}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const done = step.check(profile);
          return (
            <button
              key={step.key}
              onClick={!done ? onEdit : undefined}
              disabled={done}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                done
                  ? dark ? "cursor-default" : "cursor-default"
                  : dark
                  ? "hover:bg-white/[0.04] cursor-pointer"
                  : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              {done ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={16} className={`shrink-0 ${dark ? "text-white/20" : "text-gray-300"}`} />
              )}
              <span className={`text-[13px] font-medium flex-1 ${
                done
                  ? dark ? "text-white/30 line-through" : "text-gray-400 line-through"
                  : dark ? "text-white/65" : "text-gray-700"
              }`}>
                {step.label}
              </span>
              {!done && (
                <ChevronRight size={14} className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${dark ? "text-white/40" : "text-gray-400"}`} />
              )}
            </button>
          );
        })}
      </div>

      {allDone && (
        <p className="mt-3 text-center text-[12px] font-semibold text-emerald-500">
          🎉 Your profile is complete!
        </p>
      )}
    </div>
  );
};

export default ProfileCompletion;
