import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Heart, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import api from "../services/api";

const TYPE_CONFIG = {
  read:   { label: "Read",    Icon: BookOpen, color: "text-blue-400",    bg: "bg-blue-500/10",  border: "border-blue-500/20"  },
  saved:  { label: "Saved",   Icon: Heart,    color: "text-rose-400",    bg: "bg-rose-500/10",  border: "border-rose-500/20"  },
  review: { label: "Reviewed",Icon: Star,     color: "text-amber-400",   bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

const relTime = (date) => {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ActivityTimeline = ({ userId }) => {
  const { isDarkMode: dark } = useDarkMode();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = userId ? `/users/activity/${userId}` : "/users/activity";
    api.get(url)
      .then((r) => { setEvents(r.data.events || []); setStats(r.data.stats); })
      .catch(() => { setEvents([]); })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className={`rounded-2xl border p-5 transition-colors ${dark ? "bg-[#0d1829] border-white/[0.06]" : "bg-white border-gray-200/70 shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dark ? "bg-white/[0.05]" : "bg-[#111111]/[0.06]"}`}>
          <Clock size={14} className={dark ? "text-white/50" : "text-[#111111]/60"} />
        </div>
        <h3 className={`text-[13px] font-bold ${dark ? "text-white/70" : "text-gray-800"}`}>Activity Timeline</h3>
        {stats && (
          <div className="ml-auto flex items-center gap-3">
            <Stat label="Read"    val={stats.scriptsRead}    color="text-blue-400"  dark={dark} />
            <Stat label="Saved"   val={stats.favoriteScripts} color="text-rose-400" dark={dark} />
            <Stat label="Reviews" val={stats.reviewsWritten} color="text-amber-400" dark={dark} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-14 rounded-xl animate-pulse ${dark ? "bg-white/[0.04]" : "bg-gray-100"}`} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-10 text-center">
          <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${dark ? "bg-white/[0.04]" : "bg-gray-100"}`}>
            <BookOpen size={20} className={dark ? "text-white/20" : "text-gray-300"} />
          </div>
          <p className={`text-sm font-semibold ${dark ? "text-white/30" : "text-gray-400"}`}>No activity yet</p>
          <p className={`text-xs mt-1 ${dark ? "text-white/20" : "text-gray-300"}`}>Start reading scripts to build your timeline</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className={`absolute left-[18px] top-0 bottom-0 w-px ${dark ? "bg-white/[0.05]" : "bg-gray-100"}`} />
          <div className="space-y-1">
            {events.map((event, i) => {
              const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.read;
              const { Icon } = cfg;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="flex items-start gap-3 pl-1"
                >
                  {/* Dot */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  {/* Content */}
                  <div className={`flex-1 py-2 pr-2 rounded-xl transition-colors ${dark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                        {event.scriptId ? (
                          <Link to={`/reader/script/${event.scriptId}`} className={`block text-[13px] font-semibold leading-snug truncate mt-0.5 hover:underline ${dark ? "text-white/70" : "text-gray-800"}`}>
                            {event.title}
                          </Link>
                        ) : (
                          <p className={`text-[13px] font-semibold leading-snug truncate mt-0.5 ${dark ? "text-white/70" : "text-gray-800"}`}>{event.title}</p>
                        )}
                        {event.genre && (
                          <span className={`text-[11px] ${dark ? "text-white/25" : "text-gray-400"}`}>{event.genre}</span>
                        )}
                        {event.type === "review" && event.rating && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, si) => (
                              <Star key={si} size={10} className={si < event.rating ? "text-amber-400 fill-amber-400" : dark ? "text-white/10" : "text-gray-200"} />
                            ))}
                          </div>
                        )}
                      </div>
                      {event.date && (
                        <span className={`text-[11px] shrink-0 ${dark ? "text-white/25" : "text-gray-400"}`}>{relTime(event.date)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, val, color, dark }) => (
  <div className="text-center">
    <p className={`text-sm font-extrabold tabular-nums ${color}`}>{val ?? 0}</p>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-white/25" : "text-gray-400"}`}>{label}</p>
  </div>
);

export default ActivityTimeline;
