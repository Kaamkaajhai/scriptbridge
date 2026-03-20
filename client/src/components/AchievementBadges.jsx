import { motion } from "framer-motion";
import { useDarkMode } from "../context/DarkModeContext";

// Each badge: emoji, name, description, unlock condition
const BADGE_DEFS = [
  {
    id: "first_read",
    emoji: "📖",
    name: "First Script Read",
    description: "Read your first script",
    check: (stats) => stats.scriptsRead >= 1,
    color: "from-blue-500 to-indigo-500",
    glow: "shadow-blue-500/20",
  },
  {
    id: "five_reads",
    emoji: "🔥",
    name: "5 Scripts",
    description: "Completed 5 scripts",
    check: (stats) => stats.scriptsRead >= 5,
    color: "from-orange-500 to-rose-500",
    glow: "shadow-orange-500/20",
  },
  {
    id: "ten_reads",
    emoji: "⚡",
    name: "10 Scripts",
    description: "Completed 10 scripts",
    check: (stats) => stats.scriptsRead >= 10,
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    id: "twenty_five_reads",
    emoji: "🌟",
    name: "Avid Reader",
    description: "Completed 25 scripts",
    check: (stats) => stats.scriptsRead >= 25,
    color: "from-amber-400 to-yellow-500",
    glow: "shadow-amber-400/20",
  },
  {
    id: "first_review",
    emoji: "✍️",
    name: "First Review",
    description: "Wrote your first review",
    check: (stats) => stats.reviewsWritten >= 1,
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
  },
  {
    id: "five_reviews",
    emoji: "🏆",
    name: "Critic",
    description: "Wrote 5 reviews",
    check: (stats) => stats.reviewsWritten >= 5,
    color: "from-yellow-500 to-amber-600",
    glow: "shadow-yellow-500/20",
  },
  {
    id: "first_save",
    emoji: "❤️",
    name: "Bookmarked",
    description: "Saved your first script",
    check: (stats) => stats.favoriteScripts >= 1,
    color: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/20",
  },
  {
    id: "profile_complete",
    emoji: "✅",
    name: "Profile Pro",
    description: "Completed your profile",
    check: (stats) => stats.profileComplete,
    color: "from-teal-400 to-cyan-500",
    glow: "shadow-teal-400/20",
  },
];

const AchievementBadges = ({ stats }) => {
  const { isDarkMode: dark } = useDarkMode();

  const unlocked = BADGE_DEFS.filter((b) => b.check(stats));
  const locked   = BADGE_DEFS.filter((b) => !b.check(stats));

  return (
    <div className={`rounded-2xl border p-5 transition-colors ${dark ? "bg-[#0d1829] border-white/[0.06]" : "bg-white border-gray-200/70 shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dark ? "bg-white/[0.05]" : "bg-[#111111]/[0.06]"}`}>
          <span className="text-sm">🏅</span>
        </div>
        <h3 className={`text-[13px] font-bold ${dark ? "text-white/70" : "text-gray-800"}`}>Achievements</h3>
        <span className={`ml-auto text-[11px] font-semibold ${dark ? "text-white/25" : "text-gray-400"}`}>
          {unlocked.length} / {BADGE_DEFS.length}
        </span>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          {unlocked.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
              title={badge.description}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-default ${
                dark
                  ? "bg-[#111f35] border-white/[0.07]"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-linear-to-br ${badge.color} shadow-lg ${badge.glow}`}>
                {badge.emoji}
              </div>
              <p className={`text-[11px] font-bold text-center leading-tight ${dark ? "text-white/65" : "text-gray-700"}`}>
                {badge.name}
              </p>
              <p className={`text-[10px] text-center leading-tight ${dark ? "text-white/25" : "text-gray-400"}`}>
                {badge.description}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${dark ? "text-white/20" : "text-gray-300"}`}>
            Locked
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {locked.map((badge) => (
              <div
                key={badge.id}
                title={badge.description}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-default opacity-40 ${
                  dark
                    ? "bg-white/[0.02] border-white/[0.04]"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${dark ? "bg-white/[0.05]" : "bg-gray-200"} grayscale`}>
                  {badge.emoji}
                </div>
                <p className={`text-[11px] font-bold text-center leading-tight ${dark ? "text-white/40" : "text-gray-500"}`}>
                  {badge.name}
                </p>
                <p className={`text-[10px] text-center leading-tight ${dark ? "text-white/20" : "text-gray-400"}`}>
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AchievementBadges;
