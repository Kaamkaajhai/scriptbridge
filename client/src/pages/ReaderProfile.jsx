import { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Heart, MessageSquare, Pencil, ArrowLeft, X, Camera, Save, Loader2, Users, UserPlus, Flame, LayoutDashboard, FolderOpen, Info, Settings, Mail, CalendarDays, ShieldCheck, Star, SlidersHorizontal, TrendingUp, CheckCircle2, ChevronRight } from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import ScriptCard from "../components/ScriptCard";
import ReviewCard from "../components/ReviewCard";

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
    return `http://localhost:5001${url}`;
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
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-[#1e3a5f] rounded-xl flex items-center justify-center shadow-lg shadow-[#1e3a5f]/25 hover:bg-[#162d4a] transition-colors group-hover:scale-110"
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
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[12px] font-bold text-[#1e3a5f] hover:text-[#162d4a] transition-colors"
                >
                  Change photo
                </button>
                {currentImage && (
                  <>
                    <span className="text-gray-300 text-[10px]">·</span>
                    <button
                      onClick={handleRemoveImage}
                      className="text-[12px] font-bold text-red-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
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
              className={`w-full h-11 px-4 border rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1e3a5f]/30 focus:ring-2 focus:ring-[#1e3a5f]/5 transition-all ${dark ? "bg-white/[0.04] border-[#1d3350] text-gray-200 placeholder:text-gray-500 focus:bg-white/[0.06]" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white"}`}
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
              className={`w-full px-4 py-3 border rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1e3a5f]/30 focus:ring-2 focus:ring-[#1e3a5f]/5 transition-all resize-none leading-relaxed ${dark ? "bg-white/[0.04] border-[#1d3350] text-gray-200 placeholder:text-gray-500 focus:bg-white/[0.06]" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white"}`}
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
              className={`w-full h-11 px-4 border rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#1e3a5f]/30 focus:ring-2 focus:ring-[#1e3a5f]/5 transition-all ${dark ? "bg-white/[0.04] border-[#1d3350] text-gray-200 placeholder:text-gray-500 focus:bg-white/[0.06]" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white"}`}
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#1e3a5f] rounded-xl hover:bg-[#162d4a] transition-all shadow-sm shadow-[#1e3a5f]/15 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

/* ── Main Component ─────────────────────────────────── */
const ReaderProfile = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { isDarkMode: dark } = useDarkMode();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("read");
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [readScripts, setReadScripts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const profileId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;

  const resolveImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `http://localhost:5001${url}`;
  };

  useEffect(() => { fetchProfile(); }, [profileId]);
  useEffect(() => { if (profileId) fetchTabData(); }, [activeTab, profileId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [userRes, reviewsRes] = await Promise.all([
        api.get(`/users/${profileId}`),
        api.get(`/reviews/user/${profileId}?limit=1`) // Fetch total review count
      ]);
      const userObj = userRes.data.user || userRes.data;
      setProfile({ ...userObj, reviewsCount: reviewsRes.data.total || 0 });
    } catch { setProfile(null); }
    finally { setLoading(false); }
  };

  const fetchTabData = async () => {
    try {
      setDataLoading(true);
      if (activeTab === "read" || activeTab === "favorites") {
        const { data } = await api.get(`/users/${profileId}`);
        const userObj = data.user || data;
        const arr = activeTab === "read" ? userObj.scriptsRead : userObj.favoriteScripts;

        if (arr?.length) {
          const scripts = await Promise.all(
            arr.slice(0, 20).map(async (sId) => {
              try {
                const s = typeof sId === "object" ? sId : (await api.get(`/scripts/${sId}`)).data;
                return s;
              } catch { return null; }
            })
          );
          if (activeTab === "read") setReadScripts(scripts.filter(Boolean));
          else setFavorites(scripts.filter(Boolean));
        } else {
          if (activeTab === "read") setReadScripts([]);
          else setFavorites([]);
        }
      } else if (activeTab === "reviews") {
        const { data } = await api.get(`/reviews/user/${profileId}`);
        setReviews(data.reviews || []);
      }
    } catch { /* silent */ }
    finally { setDataLoading(false); }
  };

  const handleProfileSaved = (updatedData) => {
    setProfile((prev) => ({ ...prev, ...updatedData }));
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-2xl m-6">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-gray-900 font-extrabold text-xl">Profile not found</p>
      <p className="text-gray-500 font-medium text-sm mb-2">This user might have been removed or deleted.</p>
      <Link to="/reader" className="text-sm font-bold text-white bg-[#1e3a5f] hover:bg-[#162d4a] px-6 py-2.5 rounded-xl transition-colors">
        Back to Reader
      </Link>
    </div>
  );

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;

  const tabs = [
    { key: "read", label: "Scripts Read", icon: BookOpen, count: profile.scriptsRead?.length || 0 },
    { key: "favorites", label: "Favorites", icon: Heart, count: profile.favoriteScripts?.length || 0 },
    { key: "reviews", label: "Reviews", icon: MessageSquare, count: profile.reviewsCount || 0 },
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
    <div className={`min-h-screen pb-20 px-4 sm:px-6 pt-6 ${ dark ? "bg-[#050d18]" : "bg-[#f4f6fa]" }`}>
    <div className="max-w-6xl mx-auto">
      {/* ── Back Button ── */}
      <Link to="/reader" className={`inline-flex items-center gap-2 text-[15px] font-semibold mb-7 transition-colors group ${ dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700" }`}>
        <span className={`p-1.5 rounded-lg transition-colors ${ dark ? "bg-white/[0.05] group-hover:bg-white/[0.1]" : "bg-white group-hover:bg-gray-100 shadow-sm border border-gray-200" }`}>
          <ArrowLeft size={14} />
        </span>
        Back to Reader
      </Link>

      {/* ══════════════════════════════════════════════════
           PROFILE HEADER CARD
      ══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`rounded-3xl overflow-hidden mb-6 ${ dark ? "bg-[#0b1929] border border-[#16263d] shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : "bg-white border border-gray-100 shadow-md" }`}
      >
        {/* ── Banner ── */}
        <div className="relative h-40 overflow-hidden" style={{ background: "linear-gradient(135deg, #061020 0%, #0f2444 40%, #1a3d6b 70%, #1e5090 100%)" }}>
          {/* Geometric shapes */}
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-sky-400/8 blur-3xl" />
          <div className="absolute top-6 right-1/4 w-32 h-32 rounded-full bg-indigo-500/15 blur-2xl" />
          {/* Subtle line texture */}
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          {/* Bottom fade */}
          <div className={`absolute bottom-0 left-0 right-0 h-16 ${ dark ? "bg-gradient-to-t from-[#0b1929] to-transparent" : "bg-gradient-to-t from-white/20 to-transparent" }`} />
        </div>

        {/* ── Header body ── */}
        <div className="px-6 sm:px-8 pb-7 -mt-16 relative">

          {/* Row: avatar + identity + edit btn */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">

            {/* Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.profileImage ? (
                  <img src={resolveImage(profile.profileImage)} alt={profile.name}
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xl ring-4 transition-transform duration-300 hover:scale-[1.03] ${ dark ? "ring-[#0b1929]" : "ring-white" }`} />
                ) : (
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center shadow-2xl ring-4 transition-transform duration-300 hover:scale-[1.03] ${ dark ? "ring-[#0b1929] bg-gradient-to-br from-[#1a3a68] to-[#2d5a8e]" : "ring-white bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e]" }`}>
                    <span className="text-3xl font-black text-white/80 select-none tracking-tight">{profile.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  </div>
                )}
                <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ${ dark ? "ring-[#0b1929]" : "ring-white" }`} />
              </div>

              {/* Identity */}
              <div className="text-center sm:text-left pb-0.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                  <h1 className={`text-[30px] sm:text-[34px] font-black tracking-tight leading-none ${ dark ? "text-white" : "text-gray-900" }`}>
                    {profile.name || "User Profile"}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-widest ${ dark ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20" : "bg-blue-50 text-blue-600 ring-1 ring-blue-200" }`}>
                    <ShieldCheck size={10} strokeWidth={2.5} />
                    {profile.role === "professional" ? "Industry Pro" : profile.role || "Reader"}
                  </span>
                </div>
                <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[14px] font-medium ${ dark ? "text-gray-500" : "text-gray-400" }`}>
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={12} strokeWidth={2} className="shrink-0" />
                      {profile.email}
                    </span>
                  )}
                  {memberSince && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={12} strokeWidth={2} className="shrink-0" />
                      Joined {memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit button */}
            {isOwnProfile && (
              <button onClick={() => setEditOpen(true)}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-semibold border transition-all duration-200 active:scale-95 ${ dark ? "bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 border-white/[0.08] hover:border-white/[0.15]" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm" }`}>
                <Pencil size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:rotate-[-10deg]" />
                Edit Profile
              </button>
            )}
          </div>

          {/* ── Stat pills row ── */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t ${ dark ? "border-white/[0.06]" : "border-gray-100" }`}>
            {[
              { label: "Scripts Read", value: profile.scriptsRead?.length || 0, icon: BookOpen,    color: "blue" },
              { label: "Followers",    value: profile.followers?.length   || 0, icon: Users,       color: "violet" },
              { label: "Following",    value: profile.following?.length   || 0, icon: UserPlus,    color: "emerald" },
              { label: "Year Joined",  value: memberSince?.split(" ")[1]  || "—", icon: CalendarDays, color: "amber" },
            ].map(({ label, value, icon: SI, color }) => (
              <div key={label} className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 ${ dark ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]" : "bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm" }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${colorMap[color]}`}>
                  <SI size={15} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[22px] font-black tabular-nums leading-none ${ dark ? "text-white" : "text-gray-900" }`}>{value}</p>
                  <p className={`text-[11.5px] font-semibold uppercase tracking-wider mt-0.5 ${ dark ? "text-gray-600" : "text-gray-400" }`}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════
           NAVIGATION TAB BAR
      ══════════════════════════════════════════════════ */}
      <div className={`flex items-center gap-1 mb-7 rounded-2xl p-1 ${ dark ? "bg-[#0b1929] border border-[#16263d]" : "bg-white border border-gray-100 shadow-sm" }`}>
        {navTabs.map(({ key, label, icon: TabIcon }) => {
          const active = dashboardTab === key;
          return (
            <button key={key} onClick={() => setDashboardTab(key)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-semibold transition-all duration-200 ${ active
                ? dark
                  ? "bg-[#1e3a5f] text-white shadow-lg shadow-[#1e3a5f]/30"
                  : "bg-[#1e3a5f] text-white shadow-md shadow-[#1e3a5f]/20"
                : dark
                  ? "text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
              <TabIcon size={14} strokeWidth={active ? 2.5 : 2} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
           DASHBOARD BODY  (two-column layout)
      ══════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {dashboardTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5"
          >
            {/* ════════ LEFT COLUMN ════════ */}
            <div className="flex flex-col gap-5">

              {/* ── Currently Reading ── */}
              <div className={card}>
                <div className={`flex items-center justify-between px-6 py-4 border-b ${ dark ? "border-[#16263d]" : "border-gray-100" }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap.blue}`}>
                      <BookOpen size={14} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className={`text-[16px] font-bold ${ dark ? "text-white" : "text-gray-900" }`}>Currently Reading</p>
                      <p className={`text-[13px] mt-0.5 ${ dark ? "text-gray-600" : "text-gray-400" }`}>{readScripts.length} script{readScripts.length !== 1 ? "s" : ""} in your list</p>
                    </div>
                  </div>
                  <Link to="/reader" className={`inline-flex items-center gap-1 text-[14px] font-semibold transition-colors px-3 py-1.5 rounded-lg ${ dark ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50" }`}>
                    Browse <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="p-4">
                  {readScripts.length > 0 ? (
                    <div className="space-y-2">
                      {readScripts.slice(0, 5).map((s) => (
                        <Link key={s._id} to={`/reader/script/${s._id}`}
                          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-150 ${ dark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50" }`}>
                          {s.thumbnail ? (
                            <img src={s.thumbnail.startsWith("http") ? s.thumbnail : `http://localhost:5001${s.thumbnail}`} alt={s.title} className="w-9 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className={`w-9 h-12 rounded-lg flex items-center justify-center shrink-0 ${ dark ? "bg-blue-500/10" : "bg-blue-50" }`}>
                              <BookOpen size={14} className={dark ? "text-blue-400" : "text-blue-500"} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[15px] font-semibold truncate ${ dark ? "text-gray-100" : "text-gray-900" }`}>{s.title}</p>
                            <p className={`text-[12.5px] truncate mt-0.5 ${ dark ? "text-gray-500" : "text-gray-400" }`}>{s.genre || "Script"}</p>
                          </div>
                          <ChevronRight size={13} className={dark ? "text-gray-700" : "text-gray-300"} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-12 rounded-xl border border-dashed ${ dark ? "border-[#16263d]" : "border-gray-200" }`}>
                      <BookOpen size={28} strokeWidth={1.5} className={dark ? "text-gray-700 mb-3" : "text-gray-300 mb-3"} />
                      <p className={`text-[15px] font-semibold mb-1 ${ dark ? "text-gray-400" : "text-gray-600" }`}>No scripts yet</p>
                      <p className={`text-[13px] mb-5 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Start reading to see your list here</p>
                      <Link to="/reader" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-[14px] font-semibold hover:bg-[#162d4a] transition-colors">
                        <BookOpen size={12} /> Explore Scripts
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Activity Stats ── */}
              <div className={card}>
                <div className={`flex items-center gap-3 px-6 py-4 border-b ${ dark ? "border-[#16263d]" : "border-gray-100" }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap.violet}`}>
                    <TrendingUp size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className={`text-[16px] font-bold ${ dark ? "text-white" : "text-gray-900" }`}>Activity Stats</p>
                    <p className={`text-[13px] mt-0.5 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Your reading activity at a glance</p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activityStats.map(({ label, value, icon: SI, color }) => (
                    <div key={label} className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${ dark ? "bg-white/[0.02] border-[#16263d] hover:border-[#1e3a5f]/60 hover:bg-white/[0.04]" : "bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm" }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
                        <SI size={16} strokeWidth={2} />
                      </div>
                      <span className={`text-[32px] font-black tabular-nums leading-none mt-0.5 ${ dark ? "text-white" : "text-gray-900" }`}>{value}</span>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider text-center ${ dark ? "text-gray-600" : "text-gray-400" }`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Favorites (conditional) ── */}
              {favorites.length > 0 && (
                <div className={card}>
                  <div className={`flex items-center justify-between px-6 py-4 border-b ${ dark ? "border-[#16263d]" : "border-gray-100" }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap.rose}`}>
                        <Heart size={14} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className={`text-[16px] font-bold ${ dark ? "text-white" : "text-gray-900" }`}>Favorites</p>
                        <p className={`text-[13px] mt-0.5 ${ dark ? "text-gray-600" : "text-gray-400" }`}>{favorites.length} saved script{favorites.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {favorites.slice(0, 4).map((s) => (
                      <Link key={s._id} to={`/reader/script/${s._id}`}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 ${ dark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50" }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ dark ? "bg-rose-500/10" : "bg-rose-50" }`}>
                          <Heart size={13} className="text-rose-400" strokeWidth={2} />
                        </div>
                        <p className={`text-[15px] font-semibold truncate flex-1 ${ dark ? "text-gray-100" : "text-gray-800" }`}>{s.title}</p>
                        <ChevronRight size={13} className={dark ? "text-gray-700" : "text-gray-300"} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ════════ RIGHT COLUMN ════════ */}
            <div className="flex flex-col gap-5">

              {/* ── Reading Streak ── */}
              <div className={card}>
                <div className={`flex items-center gap-3 px-5 py-4 border-b ${ dark ? "border-[#16263d]" : "border-gray-100" }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap.amber}`}>
                    <Flame size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className={`text-[16px] font-bold ${ dark ? "text-white" : "text-gray-900" }`}>Reading Streak</p>
                    <p className={`text-[13px] mt-0.5 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Keep your momentum going</p>
                  </div>
                </div>
                <div className="px-5 pt-7 pb-5">
                  {/* Arc ring */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-32 h-32">
                      {/* Glow layer */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-orange-500/10 blur-xl" />
                      </div>
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 relative z-10">
                        <circle cx="50" cy="50" r="38" fill="none" stroke={ dark ? "#16263d" : "#f3f4f6" } strokeWidth="6" />
                        <circle cx="50" cy="50" r="38" fill="none"
                          stroke="url(#streakGrad)" strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${streakPct * 2.39} 238.7`} />
                        <defs>
                          <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#f97316" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <span className={`text-4xl font-black leading-none tabular-nums ${ dark ? "text-white" : "text-gray-900" }`}>{streak}</span>
                        <span className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${ dark ? "text-gray-600" : "text-gray-400" }`}>days</span>
                      </div>
                    </div>
                    <p className={`text-[13px] font-medium mt-3 ${ dark ? "text-gray-500" : "text-gray-400" }`}>
                      {streak >= 30 ? "Max streak reached!" : `${30 - streak} days to next milestone`}
                    </p>
                  </div>

                  {/* Weekly bar chart */}
                  <div className={`rounded-xl px-4 pt-3.5 pb-4 ${ dark ? "bg-white/[0.03] border border-[#16263d]" : "bg-gray-50 border border-gray-100" }`}>
                    <p className={`text-[12px] font-semibold uppercase tracking-widest mb-3 ${ dark ? "text-gray-600" : "text-gray-400" }`}>This Week</p>
                    <div className="flex items-end gap-2 h-10">
                      {weekDays.map((d, i) => {
                        const isToday = i === today;
                        const past = i < today;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                            <div className={`w-full rounded-md transition-all ${
                              isToday ? "h-10 bg-gradient-to-t from-orange-500 to-orange-400 shadow-sm shadow-orange-500/30"
                              : past ? "h-6 bg-orange-400/30"
                              : dark ? "h-2 bg-white/[0.06]" : "h-2 bg-gray-200"
                            }`} />
                            <span className={`text-[11px] font-bold ${ isToday ? "text-orange-400" : dark ? "text-gray-700" : "text-gray-400" }`}>{d}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </motion.div>
        )}

        {/* ── PROJECTS TAB ── */}
        {dashboardTab === "projects" && (
          <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {/* Sub-tabs: Scripts Read / Favorites / Reviews */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${ isActive ? "bg-[#1e3a5f] text-white shadow-md shadow-[#1e3a5f]/25" : dark ? "bg-white/[0.03] text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 border border-[#1d3350]" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200" }`}>
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-blue-300" : "text-gray-400"} />
                    {t.label}
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${ isActive ? "bg-white/20 text-white" : dark ? "bg-white/[0.06] border border-[#1d3350] text-gray-500" : "bg-white border border-gray-200 text-gray-500 shadow-sm" }`}>{t.count}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {dataLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`rounded-2xl border h-[280px] animate-pulse ${ dark ? "bg-[#0d1b2e] border-[#182840]" : "bg-white border-gray-100" }`} />
                  ))}
                </motion.div>
              ) : (
                <div className="min-h-[400px]">
                  {activeTab === "read" && (
                    <motion.div key="read" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      {readScripts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {readScripts.map((s) => <ScriptCard key={s._id} script={s} />)}
                        </div>
                      ) : (
                        <EmptyState icon={BookOpen} title="No scripts read yet"
                          subtitle={isOwnProfile ? "Discover new scripts and dive into a reading adventure!" : "This user hasn't made their reading list public."}
                          action={isOwnProfile ? <Link to="/reader" className="mt-4 inline-block px-6 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#162d4a] transition-colors shadow-sm">Explore Scripts</Link> : null} />
                      )}
                    </motion.div>
                  )}
                  {activeTab === "favorites" && (
                    <motion.div key="favorites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      {favorites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favorites.map((s) => <ScriptCard key={s._id} script={s} />)}
                        </div>
                      ) : (
                        <EmptyState icon={Heart} title="No favorites saved"
                          subtitle={isOwnProfile ? "Save your favorite scripts by tapping the heart icon!" : "This user hasn't saved any favorites."} />
                      )}
                    </motion.div>
                  )}
                  {activeTab === "reviews" && (
                    <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      {reviews.length > 0 ? (
                        <div className="columns-1 md:columns-2 gap-6 space-y-6">
                          {reviews.map((r) => (
                            <div key={r._id} className="break-inside-avoid">
                              <div className={`rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${ dark ? "bg-[#0d1b2e] border-[#182840]" : "bg-white border-gray-100" }`}>
                                {r.script && (
                                  <Link to={`/reader/script/${r.script._id || r.script}`} className={`flex items-center justify-between mb-4 pb-4 border-b group ${ dark ? "border-[#182840]" : "border-gray-50" }`}>
                                    <span className={`text-sm font-black group-hover:text-[#1e3a5f] transition-colors truncate pr-4 ${ dark ? "text-gray-100" : "text-gray-900" }`}>{r.script.title || "View Script"}</span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#1e3a5f] transition-colors shrink-0" />
                                  </Link>
                                )}
                                <ReviewCard review={r} currentUserId={user?._id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={MessageSquare} title="No reviews left"
                          subtitle={isOwnProfile ? "Help writers by sharing your thoughtful feedback!" : "This user hasn't reviewed any scripts."} />
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── ABOUT TAB ── */}
        {dashboardTab === "about" && (
          <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
            {profile.bio && (
              <div className={`${card} p-6 md:col-span-2`}>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Bio</p>
                <p className={`text-sm leading-relaxed font-medium ${ dark ? "text-gray-300" : "text-gray-600" }`}>{profile.bio}</p>
              </div>
            )}
            {profile.skills?.length > 0 && (
              <div className={`${card} p-6 md:col-span-2`}>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Interests & Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border ${ dark ? "bg-[#1e3a5f]/25 text-[#7aafff] border-[#2a4a6e]/60" : "bg-[#1e3a5f]/[0.05] text-[#1e3a5f] border-[#1e3a5f]/12" }`}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className={`${card} p-6`}>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Member Info</p>
              <div className="space-y-3">
                {[{ icon: CalendarDays, label: "Joined", value: memberSince || "—" }, { icon: ShieldCheck, label: "Role", value: profile.role === "professional" ? "Industry Pro" : profile.role || "Reader" }].map(({ icon: EI, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <EI size={15} strokeWidth={2} className={`shrink-0 ${ dark ? "text-gray-500" : "text-gray-400" }`} />
                    <span className={`text-[13px] font-medium flex-1 ${ dark ? "text-gray-500" : "text-gray-400" }`}>{label}</span>
                    <span className={`text-[13px] font-bold ${ dark ? "text-gray-200" : "text-gray-800" }`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${card} p-6`}>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Preferences</p>
              {(profile.preferences?.genres?.length > 0 || profile.preferences?.contentTypes?.length > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {[...(profile.preferences.genres || []), ...(profile.preferences.contentTypes || [])].map((p, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${ dark ? "bg-[#1e3a5f]/25 text-[#7aafff] border-[#2a4a6e]/60" : "bg-[#1e3a5f]/[0.05] text-[#1e3a5f] border-[#1e3a5f]/12" }`}>{p}</span>
                  ))}
                </div>
              ) : (
                <p className={`text-[13px] font-medium ${ dark ? "text-gray-500" : "text-gray-400" }`}>No preferences set.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SETTINGS TAB ── */}
        {dashboardTab === "settings" && isOwnProfile && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
            className="max-w-xl">
            <div className={`${card} p-6`}>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${ dark ? "text-gray-600" : "text-gray-400" }`}>Account Settings</p>
              <div className="space-y-3">
                <button onClick={() => setEditOpen(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:scale-[1.01] ${ dark ? "border-[#182840] hover:border-[#2a4060] hover:bg-white/[0.03]" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50" }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap.blue}`}><Pencil size={15} strokeWidth={2.5} /></div>
                  <div className="flex-1">
                    <p className={`text-[13.5px] font-bold ${ dark ? "text-gray-100" : "text-gray-900" }`}>Edit Profile</p>
                    <p className={`text-[11.5px] ${ dark ? "text-gray-500" : "text-gray-400" }`}>Update name, bio, photo and skills</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-400" />
                </button>
                <Link to="/reader/onboarding"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] ${ dark ? "border-[#182840] hover:border-[#2a4060] hover:bg-white/[0.03]" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50" }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap.emerald}`}><SlidersHorizontal size={15} strokeWidth={2.5} /></div>
                  <div className="flex-1">
                    <p className={`text-[13.5px] font-bold ${ dark ? "text-gray-100" : "text-gray-900" }`}>Update Preferences</p>
                    <p className={`text-[11.5px] ${ dark ? "text-gray-500" : "text-gray-400" }`}>Genres, content types & reading goals</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-400" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
        {dashboardTab === "settings" && !isOwnProfile && (
          <motion.div key="settings-na" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
            <EmptyState icon={Settings} title="Settings unavailable" subtitle="You can only manage settings for your own profile." />
          </motion.div>
        )}
      </AnimatePresence>

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

const EmptyState = ({ icon: Icon, title, subtitle, action }) => {
  const { isDarkMode: dark } = useDarkMode();
  return (
  <div className={`backdrop-blur-xl rounded-3xl border shadow-sm p-12 lg:p-16 text-center max-w-2xl mx-auto flex flex-col items-center ${dark ? "bg-[#101e30]/50 border-[#182840]" : "bg-white/50 border-gray-100/50"}`}>
    <div className={`w-20 h-20 rounded-2xl border shadow-sm flex items-center justify-center mb-6 ${dark ? "bg-white/[0.04] border-[#182840]" : "bg-gradient-to-br from-gray-50 to-gray-100 border-white"}`}>
      <Icon size={32} strokeWidth={1.5} className="text-gray-400" />
    </div>
    <h3 className={`text-xl font-black mb-2 ${dark ? "text-gray-100" : "text-gray-900"}`}>{title}</h3>
    <p className="text-sm text-gray-500 font-medium max-w-md mx-auto leading-relaxed mb-2">{subtitle}</p>
    {action}
  </div>
  );
};

export default ReaderProfile;
