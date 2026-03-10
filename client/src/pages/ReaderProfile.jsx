import { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Heart, MessageSquare, Pencil, ArrowLeft, X, Camera, Save, Loader2,
  Star, Clock, Eye, TrendingUp, Users, Flame, Award, ChevronLeft, ChevronRight,
  Play, BarChart2, Sparkles, Calendar
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import ScriptCard from "../components/ScriptCard";
import ReviewCard from "../components/ReviewCard";
import { StreakWidget, BadgeShelf, useBadges } from "../components/AchievementSystem";
import { useStreak } from "../context/StreakContext";

/* ── Edit Profile Modal ─────────────────────────────── */
const EditProfileModal = ({ profile, onClose, onSaved }) => {
  const { isDarkMode: dark } = useDarkMode();
  const { setUser, user } = useContext(AuthContext);
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [skills, setSkills] = useState(profile.skills?.join(", ") || "");
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const resolveImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
    return `http://localhost:5002${url}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setImageRemoved(false);
    setError("");
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      let profileImageUrl = imageRemoved ? "" : profile.profileImage;

      // Upload image first if changed
      if (imageFile) {
        const formData = new FormData();
        formData.append("profileImage", imageFile);
        const { data: imgData } = await api.post("/users/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        profileImageUrl = imgData.profileImage;
      }

      // Update profile
      const skillsArr = skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const { data } = await api.put("/users/update", {
        name: name.trim(),
        bio: bio.trim(),
        skills: skillsArr,
        profileImage: profileImageUrl,
      });

      // Update AuthContext
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess(true);
      setTimeout(() => {
        onSaved(data);
        onClose();
      }, 600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
    setSaving(false);
  };

  const currentImage = imageRemoved ? "" : (previewImage || resolveImage(profile.profileImage));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ${dark ? "bg-[#101e30]" : "bg-white"}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-[#182840]" : "border-gray-100"}`}>
          <div>
            <h2 className={`text-lg font-extrabold ${dark ? "text-gray-100" : "text-gray-900"}`}>Edit Profile</h2>
            <p className="text-[12px] text-gray-400 font-medium mt-0.5">Update your profile information</p>
          </div>
            <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${dark ? "bg-white/[0.06] hover:bg-white/[0.1]" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            <X size={16} strokeWidth={2.5} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ring-2 ring-gray-100 border border-gray-200">
                  <span className="text-2xl font-black text-gray-400">
                    {name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-[#111111] rounded-xl flex items-center justify-center shadow-lg shadow-[#111111]/25 hover:bg-[#000000] transition-colors group-hover:scale-110"
              >
                <Camera size={14} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-700">Profile Photo</p>
              <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG or GIF. Max 5MB.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-[12px] font-bold text-[#111111] hover:text-[#000000] transition-colors"
              >
                Change photo
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className={`w-full h-11 px-4 border rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#111111]/30 focus:ring-2 focus:ring-[#111111]/[0.05] transition-all ${dark ? "bg-white/[0.04] border-[#1d3350] text-gray-200 placeholder:text-gray-500 focus:bg-white/[0.06]" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white"}`}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              <span>Bio</span>
              <span className="text-gray-300 normal-case tracking-normal font-semibold">{bio.length}/300</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              placeholder="Tell others a bit about yourself..."
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#111111]/30 focus:ring-2 focus:ring-[#111111]/[0.05] transition-all resize-none leading-relaxed ${dark ? "bg-white/[0.04] border-[#1d3350] text-gray-200 placeholder:text-gray-500 focus:bg-white/[0.06]" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white"}`}
            />
          </div>

          {/* Skills / Interests */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Interests & Skills
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Screenwriting, Drama, Sci-Fi, Film Analysis"
              className={`w-full h-11 px-4 border rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#111111]/30 focus:ring-2 focus:ring-[#111111]/[0.05] transition-all ${dark ? "bg-white/[0.04] border-[#1d3350] text-gray-200 placeholder:text-gray-500 focus:bg-white/[0.06]" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white"}`}
            />
            <p className="text-[11px] text-gray-400 mt-1.5 ml-0.5">Separate with commas</p>
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl"
              >
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
                <p className="text-[12px] font-semibold text-red-600">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl"
              >
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[12px] font-semibold text-green-700">Profile updated successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${dark ? "border-[#182840] bg-[#242424]" : "border-gray-100 bg-gray-50/50"}`}>
          <button
            onClick={onClose}
            disabled={saving}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition-all disabled:opacity-50 ${dark ? "text-gray-300 bg-white/[0.04] border-[#1d3350] hover:border-[#244060]" : "text-gray-600 hover:text-gray-800 bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#111111] rounded-xl hover:bg-[#000000] transition-all shadow-sm shadow-[#111111]/15 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Genre tag colors ──────────────────────────────── */
const GENRE_COLORS = {
  horror:      { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20"     },
  thriller:    { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20"  },
  drama:       { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20"  },
  "sci-fi":    { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/20"    },
  sci_fi:      { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/20"    },
  romance:     { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/20"    },
  action:      { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/20"  },
  comedy:      { bg: "bg-lime-500/10",    text: "text-lime-400",    border: "border-lime-500/20"    },
  fantasy:     { bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/20"  },
  mystery:     { bg: "bg-indigo-500/10",  text: "text-indigo-400",  border: "border-indigo-500/20"  },
  default:     { bg: "bg-gray-500/10",    text: "text-gray-400",    border: "border-gray-500/20"    },
};

const genreColor = (g) => GENRE_COLORS[(g || "").toLowerCase()] || GENRE_COLORS.default;

/* ── Stat Card ─────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, value, label }) => (
  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
      <Icon size={18} strokeWidth={2} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-black text-white leading-none">{value ?? 0}</p>
      <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">{label}</p>
    </div>
  </div>
);

/* ── Section Title ─────────────────────────────────── */
const SectionTitle = ({ icon: Icon, iconBg, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon size={15} className="text-white" strokeWidth={2.5} />
    </div>
    <h3 className="text-[15px] font-extrabold text-white tracking-tight">{title}</h3>
  </div>
);

/* ── Glass Card wrapper ────────────────────────────── */
const GCard = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-white/[0.07] bg-[#0d1525]/80 backdrop-blur-sm shadow-xl ${className}`}>
    {children}
  </div>
);

/* ── Mini Weekly Bar Chart ─────────────────────────── */
const WeeklyChart = ({ streak }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay(); // 0=Sun
  const reorderedDays = [...days.slice(1), days[0]]; // Mon-Sun
  return (
    <div className="flex items-end justify-between gap-1 h-12 mt-3">
      {reorderedDays.map((d, i) => {
        const lit = i < streak && i < 7;
        const isToday = i === (today === 0 ? 6 : today - 1);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: lit ? `${Math.min(100, 30 + i * 10)}%` : "20%" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`w-full rounded-t-md transition-colors ${
                lit
                  ? isToday
                    ? "bg-cyan-400"
                    : "bg-violet-500/70"
                  : "bg-white/[0.06]"
              }`}
              style={{ minHeight: 4 }}
            />
            <span className={`text-[9px] font-bold ${isToday ? "text-cyan-400" : "text-gray-600"}`}>{d}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Recent Reads Horizontal Card ─────────────────── */
const RecentReadCard = ({ script, index }) => {
  const [imgErr, setImgErr] = useState(false);
  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex-none w-44"
    >
      <Link to={`/reader/script/${script._id}`} className="group block">
        {/* Cover */}
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#0f1c2e] mb-2.5">
          {script.coverImage && !imgErr ? (
            <img src={script.coverImage} alt={script.title}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#1a2d45] to-[#0f1c2e] flex items-center justify-center">
              <BookOpen size={22} className="text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
            <span className="text-white text-[11px] font-bold flex items-center gap-1">
              <Eye size={10} /> Read
            </span>
          </div>
          {script.rating > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-md">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] text-white font-bold">{script.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <h4 className="text-xs font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-violet-400 transition-colors">
          {script.title}
        </h4>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
          {script.creator?.name || "Unknown"}
        </p>
        {script.lastReadAt && (
          <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
            <Clock size={8} /> {timeAgo(script.lastReadAt)}
          </p>
        )}
      </Link>
    </motion.div>
  );
};

/* ── Continue Reading Progress Card ───────────────── */
const ContinueCard = ({ script, index }) => {
  const [imgErr, setImgErr] = useState(false);
  const progress = script.progress || Math.floor(Math.random() * 50 + 20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <Link to={`/reader/script/${script._id}`} className="group block">
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-violet-500/30 transition-all duration-200">
          {/* Cover */}
          <div className="w-11 h-16 rounded-xl overflow-hidden shrink-0 bg-[#0f1c2e]">
            {script.coverImage && !imgErr ? (
              <img src={script.coverImage} alt={script.title}
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a2d45] to-[#0f1c2e] flex items-center justify-center">
                <BookOpen size={14} className="text-white/25" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-200 line-clamp-1 group-hover:text-violet-400 transition-colors">
              {script.title}
            </h4>
            {script.genre && (
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-medium mt-1 border ${genreColor(script.genre).bg} ${genreColor(script.genre).text} ${genreColor(script.genre).border}`}>
                {script.genre}
              </span>
            )}
            {/* Progress bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 font-medium">Progress</span>
                <span className="text-[10px] text-cyan-400 font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                />
              </div>
            </div>
          </div>
          {/* Resume button */}
          <div className="shrink-0 w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
            <Play size={12} className="text-violet-400 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ── Review Row ────────────────────────────────────── */
const ReviewRow = ({ review, currentUserId }) => (
  <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
    {review.script && (
      <Link to={`/reader/script/${review.script._id || review.script}`}
        className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.06] group">
        <span className="text-sm font-bold text-gray-200 group-hover:text-violet-400 transition-colors truncate pr-3">
          {review.script.title || "View Script"}
        </span>
        <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" />
      </Link>
    )}
    <ReviewCard review={review} currentUserId={currentUserId} />
  </div>
);

/* ── Main Component ─────────────────────────────────── */
const ReaderProfile = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const [readScripts, setReadScripts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [continueScripts, setContinueScripts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const recentRowRef = useRef(null);

  const profileId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;

  const { streak, longestStreak, totalReads, todayRead } = useStreak();
  const { earnedDefs } = useBadges();

  const resolveImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `http://localhost:5002${url}`;
  };

  useEffect(() => { fetchProfile(); }, [profileId]);
  useEffect(() => { if (profileId) fetchTabData(); }, [activeTab, profileId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [userRes, reviewsRes] = await Promise.all([
        api.get(`/users/${profileId}`),
        api.get(`/reviews/user/${profileId}?limit=1`),
      ]);
      const userObj = userRes.data.user || userRes.data;
      setProfile({ ...userObj, reviewsCount: reviewsRes.data.total || 0 });
    } catch { setProfile(null); }
    finally { setLoading(false); }
  };

  const fetchTabData = async () => {
    try {
      setDataLoading(true);
      if (activeTab === "recent" || activeTab === "favorites") {
        const { data } = await api.get(`/users/${profileId}`);
        const userObj = data.user || data;
        const arr = activeTab === "recent" ? userObj.scriptsRead : userObj.favoriteScripts;
        if (arr?.length) {
          const scripts = await Promise.all(
            arr.slice(0, 20).map(async (sId) => {
              try {
                return typeof sId === "object" ? sId : (await api.get(`/scripts/${sId}`)).data;
              } catch { return null; }
            })
          );
          if (activeTab === "recent") setReadScripts(scripts.filter(Boolean));
          else setFavorites(scripts.filter(Boolean));
        } else {
          if (activeTab === "recent") setReadScripts([]);
          else setFavorites([]);
        }
      } else if (activeTab === "reviews") {
        const { data } = await api.get(`/reviews/user/${profileId}`);
        setReviews(data.reviews || []);
      } else if (activeTab === "continue") {
        const { data } = await api.get("/scripts/continue-reading").catch(() => ({ data: [] }));
        setContinueScripts(data || []);
      }
    } catch { /* silent */ }
    finally { setDataLoading(false); }
  };

  const handleProfileSaved = (updatedData) => {
    setProfile((prev) => ({ ...prev, ...updatedData }));
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gray-700 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 m-6">
      <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-2 border border-white/[0.08]">
        <BookOpen className="w-8 h-8 text-gray-600" />
      </div>
      <p className="text-white font-extrabold text-xl">Profile not found</p>
      <Link to="/reader" className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-6 py-2.5 rounded-xl transition-colors">
        Back to Reader
      </Link>
    </div>
  );

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;

  const followersCount = profile.followers?.length || 0;
  const favoritesCount = profile.favoriteScripts?.length || 0;
  const readsCount = profile.scriptsRead?.length || totalReads || 0;
  const writersFollowed = profile.following?.length || 0;

  const preferredGenres = [
    ...(profile.favoriteGenres || []),
    ...(profile.preferences?.genres || []),
    ...(profile.skills || []),
  ].filter(Boolean).slice(0, 8);

  const tabs = [
    { key: "recent",   label: "Recent Reads",   icon: Clock,         count: readsCount },
    { key: "continue", label: "Continue",        icon: Play,          count: null },
    { key: "favorites",label: "Favorites",       icon: Heart,         count: favoritesCount },
    { key: "reviews",  label: "Reviews",         icon: MessageSquare, count: profile.reviewsCount || 0 },
  ];

  /* ── Derived helpers ── */
  const daysActive = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86_400_000))
    : 0;
  const streak = Math.min(daysActive, 30);
  const streakPct = Math.round((streak / 30) * 100);
  const today = new Date().getDay(); // 0=Sun
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const navTabs = [
    { key: "overview",  label: "Overview",  icon: LayoutDashboard },
    { key: "projects",  label: "Projects",  icon: FolderOpen },
    { key: "about",     label: "About",     icon: Info },
    { key: "settings",  label: "Settings",  icon: Settings },
  ];

  const activityStats = [
    { label: "Scripts Read", value: profile.scriptsRead?.length || 0,   icon: BookOpen,  color: "blue" },
    { label: "Followers",    value: profile.followers?.length || 0,      icon: Users,     color: "violet" },
    { label: "Following",    value: profile.following?.length || 0,      icon: UserPlus,  color: "emerald" },
    { label: "Days Active",  value: daysActive,                          icon: TrendingUp, color: "amber" },
  ];

  const colorMap = {
    blue:    dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20"      : "bg-blue-50 text-blue-600 border-blue-100",
    violet:  dark ? "bg-violet-500/10 text-violet-400 border-violet-500/20": "bg-violet-50 text-violet-600 border-violet-100",
    emerald: dark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20": "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber:   dark ? "bg-amber-500/10 text-amber-400 border-amber-500/20"   : "bg-amber-50 text-amber-600 border-amber-100",
    rose:    dark ? "bg-rose-500/10 text-rose-400 border-rose-500/20"      : "bg-rose-50 text-rose-500 border-rose-100",
  };

  /* ── card wrapper shorthand ── */
  const card = `rounded-2xl border ${
    dark ? "bg-[#0b1929] border-[#16263d] shadow-[0_2px_12px_rgba(0,0,0,0.35)]" : "bg-white border-gray-100/90 shadow-sm"
  }`;

  return (
    <div
      className="min-h-screen pb-20"
      style={{ background: "linear-gradient(135deg, #060d1a 0%, #0b1228 40%, #07101e 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 pt-6 relative">

        {/* Back */}
        <Link to="/reader"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 text-gray-500 hover:text-gray-200 transition-colors group">
          <span className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.1] border border-white/[0.07] flex items-center justify-center transition-colors">
            <ArrowLeft size={13} strokeWidth={2.5} />
          </span>
          Back to Reader
        </Link>

        {/* ══════════════════════════════════════════
            TOP: Profile Hero Card
        ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden mb-6 border border-white/[0.07] shadow-2xl shadow-black/40">

          {/* Banner gradient */}
          <div className="h-32 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1e1040 0%, #0f1e40 50%, #0d1f35 100%)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.18) 0%, transparent 65%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(6,182,212,0.12) 0%, transparent 55%)" }} />
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          </div>

          {/* Avatar + info */}
          <div className="px-7 pb-7 -mt-14 relative"
            style={{ background: "linear-gradient(180deg, rgba(6,13,26,0.7) 0%, #060d1a 100%)" }}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pt-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                {/* Avatar */}
                <div className="relative">
                  {profile.profileImage ? (
                    <img src={resolveImage(profile.profileImage)} alt={profile.name}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#060d1a] shadow-2xl shadow-violet-900/30" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center ring-4 ring-[#060d1a] shadow-2xl border border-violet-500/20"
                      style={{ background: "linear-gradient(135deg, #1e1040, #0f1e40)" }}>
                      <span className="text-3xl font-black text-violet-300">
                        {profile.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  {/* Online / today dot */}
                  {todayRead && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#060d1a] shadow-sm" />
                  )}
                </div>

                {/* Name / role */}
                <div className="text-center sm:text-left pb-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                    <h1 className="text-2xl font-black tracking-tight text-white">
                      {profile.name || "Reader"}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest border w-max mx-auto sm:mx-0"
                      style={{ background: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.25)", color: "#a78bfa" }}>
                      {profile.role || "Reader"}
                    </span>
                  </div>
                  {memberSince && (
                    <p className="text-[12px] text-gray-500 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                      <Calendar size={11} /> Member since {memberSince}
                    </p>
                  )}
                  {/* Quick stats pills */}
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap justify-center sm:justify-start">
                    <span className="text-[12px] font-bold text-gray-400">
                      <span className="text-white">{readsCount}</span> reads
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-[12px] font-bold text-gray-400">
                      <span className="text-white">{favoritesCount}</span> favorites
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-[12px] font-bold text-gray-400">
                      <span className="text-white">{writersFollowed}</span> following
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              {isOwnProfile && (
                <button onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shrink-0 border"
                  style={{ background: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.3)", color: "#c4b5fd" }}>
                  <Pencil size={14} strokeWidth={2.5} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            ABOUT ME (if bio exists)
        ══════════════════════════════════════════ */}
        <GCard className="p-6 mb-6">
          <SectionTitle icon={Sparkles} iconBg="bg-gradient-to-br from-violet-600 to-violet-800" title="About Me" />
          {profile.bio ? (
            <p className="text-sm text-gray-300 leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-sm text-gray-600 italic">
              {isOwnProfile
                ? "No bio yet — click Edit Profile to tell others about yourself."
                : "This reader hasn't added a bio yet."}
            </p>
          )}
        </GCard>

        {/* ══════════════════════════════════════════
            2×2 STATS GRID
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* LEFT COL */}
          <div className="space-y-5">

            {/* Reading Stats Card */}
            <GCard className="p-6">
              <SectionTitle icon={BarChart2} iconBg="bg-gradient-to-br from-cyan-500 to-blue-600" title="Reading Stats" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={BookOpen} iconColor="bg-gradient-to-br from-violet-500 to-violet-700"
                  value={readsCount} label="Total Reads" />
                <StatCard icon={Heart} iconColor="bg-gradient-to-br from-pink-500 to-rose-600"
                  value={favoritesCount} label="Favorites" />
                <StatCard icon={MessageSquare} iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                  value={profile.reviewsCount || 0} label="Reviews Written" />
                <StatCard icon={Users} iconColor="bg-gradient-to-br from-cyan-500 to-teal-600"
                  value={writersFollowed} label="Writers Followed" />
              </div>
            </GCard>

            {/* Favorite Genres Card */}
            <GCard className="p-6">
              <SectionTitle icon={Star} iconBg="bg-gradient-to-br from-yellow-500 to-orange-500" title="Favorite Genres" />
              {preferredGenres.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferredGenres.map((g, i) => {
                    const c = genreColor(g);
                    return (
                      <span key={i}
                        className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold border capitalize tracking-wide ${c.bg} ${c.text} ${c.border}`}>
                        {g.replace(/_/g, "-")}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  {isOwnProfile ? "Add interests in your profile to see genre tags here." : "No genres specified."}
                </p>
              )}
            </GCard>
          </div>

          {/* RIGHT COL */}
          <div className="space-y-5">

            {/* Reading Streak Card */}
            {isOwnProfile && (
              <GCard className="p-6">
                <SectionTitle icon={Flame} iconBg="bg-gradient-to-br from-orange-500 to-red-600" title="Reading Streak" />
                <div className="flex items-end gap-6 mb-1">
                  <div>
                    <p className={`text-5xl font-black leading-none ${streak >= 7 ? "text-orange-400" : streak >= 3 ? "text-amber-400" : "text-white"}`}>
                      {streak}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">current streak</p>
                  </div>
                  <div className="pb-1">
                    <p className="text-2xl font-black text-gray-300">{longestStreak}</p>
                    <p className="text-[11px] text-gray-600 font-medium mt-0.5">best streak</p>
                  </div>
                  <div className="pb-1 ml-auto">
                    {todayRead && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        ✓ Today read
                      </span>
                    )}
                  </div>
                </div>
                <WeeklyChart streak={streak} />
              </GCard>
            )}

            {/* Achievements / Badges Card */}
            {isOwnProfile && (
              <GCard className="p-6">
                <SectionTitle icon={Award} iconBg="bg-gradient-to-br from-purple-500 to-indigo-600" title="Achievements" />
                <BadgeShelf earnedDefs={earnedDefs} dark={true} />
              </GCard>
            )}

            {/* For non-own profile: show streak widget from AchievementSystem */}
            {!isOwnProfile && (
              <GCard className="overflow-hidden">
                <StreakWidget streak={0} longestStreak={0} totalReads={readsCount} todayRead={false} dark={true} />
              </GCard>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB BAR: Recent Reads | Continue | Favorites | Reviews
        ══════════════════════════════════════════ */}
        <GCard className="overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-3.5 text-[13px] font-bold whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? "border-violet-500 text-violet-300 bg-violet-500/[0.06]"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                  }`}>
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{t.label}</span>
                  {t.count !== null && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      isActive ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.05] text-gray-600"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-5 min-h-[320px]">
            <AnimatePresence mode="wait">
              {dataLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl h-[200px] animate-pulse bg-white/[0.04]" />
                  ))}
                </motion.div>
              ) : (
                <>
                  {/* Recent Reads — horizontal scroll */}
                  {activeTab === "recent" && (
                    <motion.div key="recent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {readScripts.length > 0 ? (
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[12px] text-gray-500 font-medium">{readScripts.length} scripts read</p>
                            <div className="flex gap-2">
                              <button onClick={() => recentRowRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                                className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-white/[0.1] transition-all">
                                <ChevronLeft size={14} />
                              </button>
                              <button onClick={() => recentRowRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                                className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-white/[0.1] transition-all">
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                          <div ref={recentRowRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {readScripts.map((s, i) => (
                              <RecentReadCard key={s._id} script={s} index={i} />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <EmptyState icon={BookOpen} title="No scripts read yet"
                          subtitle={isOwnProfile ? "Start exploring scripts on the Reader home page." : "This reader's history is private."}
                          action={isOwnProfile ? (
                            <Link to="/reader" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                              Explore Scripts
                            </Link>
                          ) : null}
                        />
                      )}
                    </motion.div>
                  )}

                  {/* Continue Reading */}
                  {activeTab === "continue" && (
                    <motion.div key="continue" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {continueScripts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {continueScripts.map((s, i) => (
                            <ContinueCard key={s._id} script={s} index={i} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={Play} title="Nothing in progress"
                          subtitle="Scripts you've started reading will appear here."
                          action={isOwnProfile ? (
                            <Link to="/reader" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                              Find a Script
                            </Link>
                          ) : null}
                        />
                      )}
                    </motion.div>
                  )}

                  {/* Favorites */}
                  {activeTab === "favorites" && (
                    <motion.div key="favorites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {favorites.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {favorites.map((s) => <ScriptCard key={s._id} script={s} />)}
                        </div>
                      ) : (
                        <EmptyState icon={Heart} title="No favorites saved"
                          subtitle={isOwnProfile ? "Tap the heart on any script to save it here." : "No favorites made public."} />
                      )}
                    </motion.div>
                  )}

                  {/* Reviews */}
                  {activeTab === "reviews" && (
                    <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reviews.map((r) => (
                            <ReviewRow key={r._id} review={r} currentUserId={user?._id} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={MessageSquare} title="No reviews written"
                          subtitle={isOwnProfile ? "Share your feedback on scripts you've read." : "This reader hasn't written any reviews."} />
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </GCard>

      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editOpen && (
          <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} onSaved={handleProfileSaved} />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.08]"
      style={{ background: "rgba(139,92,246,0.08)" }}>
      <Icon size={28} strokeWidth={1.5} className="text-violet-400/60" />
    </div>
    <h3 className="text-base font-bold text-gray-300 mb-1.5">{title}</h3>
    <p className="text-sm text-gray-600 font-medium max-w-xs mx-auto leading-relaxed">{subtitle}</p>
    {action}
  </div>
);

export default ReaderProfile;
