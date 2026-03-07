import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { Search, UserPlus, UserCheck } from "lucide-react";

const GENRE_COLORS = {
  Drama: "bg-blue-50 text-blue-600",
  Comedy: "bg-yellow-50 text-yellow-600",
  Thriller: "bg-red-50 text-red-600",
  Horror: "bg-orange-50 text-orange-700",
  "Sci-Fi": "bg-purple-50 text-purple-600",
  Romance: "bg-pink-50 text-pink-600",
  Action: "bg-rose-50 text-rose-600",
  Documentary: "bg-teal-50 text-teal-600",
  Animation: "bg-cyan-50 text-cyan-600",
  Fantasy: "bg-violet-50 text-violet-600",
};
const genreColor = (g) => GENRE_COLORS[g] || "bg-gray-100 text-gray-500";const Writers = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode: dark } = useDarkMode();
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("reputation");
  const [searchQuery, setSearchQuery] = useState("");
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followLoading, setFollowLoading] = useState(new Set());

const SORT_TABS = [
  { key: "reputation", label: "Top Writers",  icon: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172" },
  { key: "score",      label: "AI Score",     icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  { key: "views",      label: "Most Viewed",  icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" },
  { key: "followers",  label: "Followers",    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  { key: "scripts",    label: "Most Scripts", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
];

/* ─── Rank tiers (no gold) ────────────────────── */
// 1 = blue-violet (premier)  2 = slate  3 = teal
const RANK_TIERS = {
  1: {
    strip:    "from-blue-500 via-violet-500 to-indigo-500",
    avatarRing: "ring-blue-400/30",
    badge:    "from-blue-500 to-violet-500 text-white",
    glow:     "shadow-[0_4px_32px_rgba(99,102,241,0.14)]",
    border:   { l: "border-blue-200/60",   d: "border-blue-500/20" },
    bg:       { l: "bg-blue-50/30",        d: "bg-[#0a1628]" },
    label:    { l: "text-blue-600 bg-blue-50 border-blue-100",    d: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  },
  2: {
    strip:    "from-slate-400 to-slate-300",
    avatarRing: "ring-slate-300/40",
    badge:    "from-slate-400 to-slate-300 text-slate-800",
    glow:     "shadow-[0_4px_20px_rgba(100,116,139,0.14)]",
    border:   { l: "border-slate-200",     d: "border-slate-500/20" },
    bg:       { l: "bg-slate-50/40",       d: "bg-[#0f1823]" },
    label:    { l: "text-slate-600 bg-slate-100 border-slate-200", d: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  },
  3: {
    strip:    "from-teal-400 to-cyan-400",
    avatarRing: "ring-teal-400/30",
    badge:    "from-teal-400 to-cyan-400 text-teal-900",
    glow:     "shadow-[0_4px_20px_rgba(20,184,166,0.13)]",
    border:   { l: "border-teal-200/60",   d: "border-teal-500/20" },
    bg:       { l: "bg-teal-50/20",        d: "bg-[#081a1c]" },
    label:    { l: "text-teal-700 bg-teal-50 border-teal-100",    d: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  },
};

  const handleFollow = async (e, writerId) => {
    e.preventDefault();
    if (!user) return;
    setFollowLoading(prev => new Set([...prev, writerId]));
    try {
      const isFollowing = followedIds.has(writerId);
      await api.post(`/users/${writerId}/${isFollowing ? "unfollow" : "follow"}`);
      setFollowedIds(prev => {
        const next = new Set(prev);
        isFollowing ? next.delete(writerId) : next.add(writerId);
        return next;
      });
    } catch { /* silent */ }
    setFollowLoading(prev => { const n = new Set(prev); n.delete(writerId); return n; });
  };

  const filteredWriters = writers.filter(w =>
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.writerProfile?.genres?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const avatarUrl = writer.profileImage
    ? writer.profileImage.startsWith("http")
      ? writer.profileImage
      : `${import.meta.env.VITE_API_URL || "http://localhost:5001"}${writer.profileImage}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className={`flex flex-col items-center gap-4`}>
          <div className={`w-9 h-9 border-[3px] rounded-full animate-spin ${dark ? 'border-gray-700 border-t-blue-400' : 'border-gray-200 border-t-[#111111]'}`}></div>
          <p className={`text-sm font-medium animate-pulse ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Loading writers…</p>
        </div>
      </div>
    );
  }

  const topMedalStyles = [
    { bg: dark ? "bg-[#111111]/20 border-[#4a7db5]/30" : "bg-[#111111]/[0.06] border-[#111111]/10", text: dark ? "text-blue-400" : "text-[#111111]", label: "🥇" },
    { bg: dark ? "bg-white/[0.06] border-white/10" : "bg-gray-50 border-gray-200/60", text: dark ? "text-gray-400" : "text-gray-500", label: "🥈" },
    { bg: dark ? "bg-amber-900/20 border-amber-700/20" : "bg-amber-50 border-amber-200/60", text: dark ? "text-amber-400" : "text-amber-600", label: "🥉" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-[#111111]/20' : 'bg-[#111111]/[0.06]'}`}>
                <svg className="w-[18px] h-[18px] text-[#111111]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Writers</h1>
            </div>
            <p className={`text-[13px] font-medium ml-[46px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {sortBy === "reputation" ? "Ranked by overall reputation" :
               sortBy === "score" ? "Ranked by average AI script score" :
               sortBy === "views" ? "Ranked by total script views" :
               "Ranked by follower count"}
              {filteredWriters.length !== writers.length && ` · ${filteredWriters.length} of ${writers.length} shown`}
            </p>
          </div>

          {/* Sort toggle */}
          <div className={`flex items-center gap-1 rounded-xl p-1 ${dark ? 'bg-white/[0.06]' : 'bg-gray-100/60'}`}>
            {sortTabs.map((tab) => (
              <button key={tab.key} onClick={() => setSortBy(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all duration-200 ${
                  sortBy === tab.key
                    ? dark ? "bg-[#111111]/30 text-blue-300 shadow-sm" : "bg-white text-gray-900 shadow-sm"
                    : dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${dark ? 'bg-white/[0.04] border-[#182840]' : 'bg-gray-50 border-gray-200/60'}`}>
          <Search size={15} className={dark ? 'text-gray-500' : 'text-gray-400'} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search writers by name or genre…"
            className={`flex-1 text-[13px] bg-transparent outline-none font-medium ${dark ? 'text-gray-200 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-400'}`} />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className={`text-[11px] font-semibold ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>Clear</button>
          )}
        </div>
      </motion.div>

      {filteredWriters.length === 0 ? (
        <div className={`rounded-2xl border shadow-sm py-20 text-center ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${dark ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
            <svg className={`w-6 h-6 ${dark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </div>
          <p className={`text-[15px] font-bold mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{searchQuery ? "No writers match your search" : "No writers found"}</p>
          <p className={`text-[13px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{searchQuery ? "Try a different name or genre" : "Check back later for registered writers"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredWriters.map((writer, index) => {
              const isTop3 = index < 3;
              const medal = isTop3 ? topMedalStyles[index] : null;
              const genres = writer.writerProfile?.genres || [];
              const isWGA = writer.writerProfile?.wgaMember;
              const representation = writer.writerProfile?.representationStatus;
              const isFollowing = followedIds.has(writer._id);
              const isFollowLoading = followLoading.has(writer._id);
              const isSelf = user?._id === writer._id;

              return (
                <motion.div key={writer._id}
                  layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: index * 0.025, duration: 0.22 }}
                >
                  <div className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 group ${
                    isTop3
                      ? dark ? `bg-[#101e30] border-[#182840] hover:border-[#1d3350] hover:shadow-md hover:shadow-[#020609]/20` : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                      : dark ? "bg-[#0d1a28] border-[#182840]/60 hover:border-[#182840] hover:shadow-sm" : "bg-white border-gray-100/80 hover:border-gray-200 hover:shadow-sm"
                  }`}>
                    {/* Top 3 accent line */}
                    {isTop3 && (
                      <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-linear-to-r ${
                        index === 0 ? "from-[#111111] to-[#333333]" :
                        index === 1 ? "from-gray-300 to-gray-400" :
                        "from-amber-400 to-amber-500"
                      } opacity-70`}></div>
                    )}

                    {/* Rank badge */}
                    {isTop3 ? (
                      <div className={`w-10 h-10 rounded-xl ${medal.bg} ${medal.text} border flex flex-col items-center justify-center shrink-0`}>
                        <span className="text-base leading-none">{medal.label}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <span className={`text-[14px] font-bold tabular-nums ${dark ? 'text-gray-600' : 'text-gray-300'}`}>{index + 1}</span>
                      </div>
                    )}

                    {/* Avatar — links to profile */}
                    <Link to={`/profile/${writer._id}`} className="shrink-0">
                      {writer.profileImage ? (
                        <img
                          src={writer.profileImage.startsWith("http") ? writer.profileImage : `${import.meta.env.VITE_API_URL || "http://localhost:5002"}${writer.profileImage}`}
                          alt={writer.name}
                          className={`w-12 h-12 rounded-full object-cover ring-2 transition-all group-hover:ring-[#111111]/30 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-linear-to-br from-[#111111] to-[#333333] flex items-center justify-center ring-2 transition-all group-hover:ring-[#111111]/30 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`}>
                          <span className="text-white font-bold text-[14px]">{writer.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}
                    </Link>

                    {/* Writer info */}
                    <Link to={`/profile/${writer._id}`} className="flex-1 min-w-0 group/link">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-[14px] font-bold truncate transition-colors group-hover/link:text-[#111111] ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {writer.name}
                        </h3>
                        {isWGA && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${dark ? 'bg-[#111111]/20 text-blue-400' : 'bg-[#111111]/[0.08] text-[#111111]'}`}>WGA</span>
                        )}
                        {representation && representation !== "unrepresented" && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${dark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Repped</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                        {genres.length > 0 ? (
                          <div className="flex items-center gap-1 overflow-hidden flex-wrap">
                            {genres.slice(0, 3).map((g) => (
                              <span key={g} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                dark ? 'bg-white/[0.06] text-gray-400' : genreColor(g)
                              } shrink-0`}>{g}</span>
                            ))}
                            {genres.length > 3 && (
                              <span className={`text-[10px] font-medium shrink-0 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>+{genres.length - 3}</span>
                            )}
                          </div>
                        ) : writer.bio ? (
                          <span className={`text-[12px] font-medium truncate ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{writer.bio}</span>
                        ) : (
                          <span className={`text-[12px] font-medium ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Screenwriter</span>
                        )}
                      </div>
                    </Link>

                    {/* Stats */}
                    <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                      {/* Scripts */}
                      <div className="text-right hidden sm:block">
                        <p className={`text-[14px] font-extrabold tabular-nums ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{writer.scriptCount || 0}</p>
                        <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Scripts</p>
                      </div>

                      {/* Primary sort metric */}
                      {sortBy === "score" && (
                        <div className="text-right">
                          <p className={`text-[14px] font-extrabold tabular-nums ${(writer.avgScore || 0) >= 80 ? "text-[#111111]" : dark ? 'text-gray-100' : 'text-gray-900'}`}>{Math.round(writer.avgScore || 0)}</p>
                          <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Avg Score</p>
                        </div>
                      )}
                      {sortBy === "views" && (
                        <div className="text-right">
                          <p className={`text-[14px] font-extrabold tabular-nums ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{(writer.totalViews || 0).toLocaleString()}</p>
                          <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Views</p>
                        </div>
                      )}
                      {sortBy === "followers" && (
                        <div className="text-right">
                          <p className={`text-[14px] font-extrabold tabular-nums ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{(writer.followerCount || 0).toLocaleString()}</p>
                          <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Followers</p>
                        </div>
                      )}
                      {sortBy === "reputation" && (
                        <div className="text-right">
                          <p className={`text-[14px] font-extrabold tabular-nums ${(writer.reputation || 0) >= 40 ? "text-[#111111]" : dark ? 'text-gray-100' : 'text-gray-900'}`}>{Math.round(writer.reputation || 0)}</p>
                          <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Rep</p>
                        </div>
                      )}

                      {/* Follow button */}
                      {user && !isSelf && (
                        <button
                          onClick={(e) => handleFollow(e, writer._id)}
                          disabled={isFollowLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 shrink-0 ${
                            isFollowing
                              ? dark ? "bg-[#111111]/20 text-blue-400 hover:bg-red-900/20 hover:text-red-400" : "bg-[#111111]/[0.08] text-[#111111] hover:bg-red-50 hover:text-red-500"
                              : dark ? "bg-[#111111]/30 text-blue-300 hover:bg-[#111111]/50" : "bg-[#111111] text-white hover:bg-[#000000] shadow-sm"
                          } disabled:opacity-50`}
                        >
                          {isFollowLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isFollowing ? (
                            <UserCheck size={13} />
                          ) : (
                            <UserPlus size={13} />
                          )}
                          <span className="hidden sm:inline">{isFollowing ? "Following" : "Follow"}</span>
                        </button>
                      )}

                      {/* Arrow */}
                      <Link to={`/profile/${writer._id}`}>
                        <svg className={`w-4 h-4 group-hover:translate-x-0.5 transition-all ${dark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Writers;
