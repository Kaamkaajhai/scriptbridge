import { useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { AlertCircle, Building2, Linkedin, IndianRupee, Film, TrendingUp, Bell, User, CreditCard, Briefcase, Globe, Target, Heart } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";

const GENRE_OPTIONS = [
  "Action", "Comedy", "Drama", "Horror", "Thriller",
  "Romance", "Sci-Fi", "Fantasy", "Mystery", "Adventure",
  "Crime", "Western", "Animation", "Documentary", "Historical",
  "War", "Musical", "Biographical", "Sports", "Political",
  "Legal", "Medical", "Supernatural", "Psychological", "Noir",
  "Family", "Teen", "Satire", "Dark Comedy", "Mockumentary"
];

const NUANCED_TAGS = [
  "Revenge", "Redemption", "Coming of Age", "Love Triangle", "Betrayal",
  "Family Drama", "Social Justice", "Identity Crisis", "Survival",
  "Power Struggle", "Forbidden Love", "Loss & Grief", "Ambition",
  "Good vs Evil", "Man vs Nature", "Isolation", "Corruption",
  "Second Chance", "Underdog Story", "Fish Out of Water", "Chosen One",
  "Quest", "Transformation", "Sacrifice", "Justice", "Freedom",
  "Urban", "Rural", "Suburban", "Space", "Historical", "Contemporary",
  "Post-Apocalyptic", "Dystopian", "Small Town", "Big City",
  "Wilderness", "Ocean/Sea", "Desert", "Jungle", "Medieval",
  "Future", "Alternate Reality", "Virtual Reality", "Underground",
  "Prison", "Hospital", "School/College", "Military Base",
  "Dark", "Satirical", "Gritty", "Lighthearted", "Noir",
  "Uplifting", "Tragic", "Suspenseful", "Whimsical", "Intense",
  "Edgy", "Heartwarming", "Cynical", "Hopeful", "Melancholic",
  "Surreal", "Cerebral", "Raw", "Poetic", "Epic"
];

const INVESTOR_GENRE_OPTIONS = [
  "Action", "Comedy", "Drama", "Horror", "Thriller",
  "Romance", "Sci-Fi", "Fantasy", "Mystery", "Documentary",
  "Crime", "Animation", "Historical", "Biographical", "Sports",
  "Family", "Musical", "War", "Western", "Adventure"
];

const BUDGET_TIERS = [
  { key: "micro", label: "Micro", range: "< ₹50L" },
  { key: "low", label: "Low", range: "₹50L – ₹2Cr" },
  { key: "medium", label: "Medium", range: "₹2Cr – ₹10Cr" },
  { key: "high", label: "High", range: "₹10Cr – ₹50Cr" },
  { key: "blockbuster", label: "Blockbuster", range: "₹50Cr+" },
];

const FORMAT_OPTIONS = [
  "Feature Film", "TV Pilot", "Web Series", "Documentary",
  "Short Film", "Anime", "Limited Series", "Reality Show"
];

const READER_GENRE_OPTIONS = [
  { label: "Action" },
  { label: "Comedy" },
  { label: "Drama" },
  { label: "Horror" },
  { label: "Thriller" },
  { label: "Romance" },
  { label: "Sci-Fi" },
  { label: "Fantasy" },
  { label: "Mystery" },
  { label: "Adventure" },
  { label: "Crime" },
  { label: "Animation" },
  { label: "Documentary" },
  { label: "Historical" },
  { label: "Biographical" },
  { label: "Sports" },
  { label: "Musical" },
  { label: "Family" },
  { label: "Psychological" },
  { label: "Dark Comedy" },
];

const READER_CONTENT_TYPES = [
  { label: "feature_film", display: "Feature Film" },
  { label: "tv_pilot", display: "TV Pilot" },
  { label: "web_series", display: "Web Series" },
  { label: "short_film", display: "Short Film" },
  { label: "documentary", display: "Documentary" },
  { label: "animation", display: "Animation" },
  { label: "limited_series", display: "Limited Series" },
  { label: "reality_show", display: "Reality Show" },
];

const EditProfileModal = ({ profile, onClose, onUpdate }) => {
  const { isDarkMode: dark } = useDarkMode();
  const { setUser } = useContext(AuthContext);
  const isWriter = profile.role === "creator" || profile.role === "writer";
  const isInvestor = profile.role === "investor";
  const wp = profile.writerProfile || {};
  const ip = profile.industryProfile || {};
  const mandates = ip.mandates || {};

  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    skills: profile.skills?.join(", ") || "",
    profileImage: profile.profileImage || "",
    coverImage: profile.coverImage || "",
  });

  // Investor-specific state
  const [investorData, setInvestorData] = useState({
    company: ip.company || "",
    linkedInUrl: ip.linkedInUrl || "",
    investmentRange: "",
  });
  const [investorGenres, setInvestorGenres] = useState(mandates.genres || profile.preferences?.genres || []);
  const [investorBudgets, setInvestorBudgets] = useState(mandates.budgetTiers || []);
  const [investorFormats, setInvestorFormats] = useState(mandates.formats || []);
  const [notifPrefs, setNotifPrefs] = useState({
    smartMatchAlerts: profile.notificationPrefs?.smartMatchAlerts ?? true,
    auditionAlerts: profile.notificationPrefs?.auditionAlerts ?? true,
    holdAlerts: profile.notificationPrefs?.holdAlerts ?? true,
    viewAlerts: profile.notificationPrefs?.viewAlerts ?? true,
  });

  // Writer-specific state
  const [representationStatus, setRepresentationStatus] = useState(wp.representationStatus || "unrepresented");
  const [agencyName, setAgencyName] = useState(wp.agencyName || "");
  const [wgaMember, setWgaMember] = useState(wp.wgaMember || false);
  const [selectedGenres, setSelectedGenres] = useState(wp.genres || []);
  const [specializedTags, setSpecializedTags] = useState(wp.specializedTags || []);
  const [diversity, setDiversity] = useState({
    gender: wp.diversity?.gender || "",
    ethnicity: wp.diversity?.ethnicity || "",
  });
  const [showTagError, setShowTagError] = useState(false);

  // Reader preferences state
  const isReader = profile.role === "reader";
  const [readerGenres, setReaderGenres] = useState(profile.preferences?.genres || []);
  const [readerContentTypes, setReaderContentTypes] = useState(profile.preferences?.contentTypes || []);

  const toggleReaderGenre = (genre) => {
    setReaderGenres((prev) => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };
  const toggleReaderContentType = (ct) => {
    setReaderContentTypes((prev) => prev.includes(ct) ? prev.filter(c => c !== ct) : [...prev, ct]);
  };



  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(profile.profileImage || "");
  const [coverImagePreview, setCoverImagePreview] = useState(profile.coverImage || "");
  const fileInputRef = useRef(null);
  const fileInputRefCover = useRef(null);

  // Active section for mobile-friendly navigation
  const [activeSection, setActiveSection] = useState("basic");

  const sections = isWriter
    ? [
      { key: "basic", label: "Basic", icon: <User size={13} /> },
      { key: "writer", label: "Writer", icon: <Briefcase size={13} /> },
      { key: "genres", label: "Genres", icon: <Film size={13} /> },
      { key: "tags", label: "Tags", icon: <Target size={13} /> },
      { key: "diversity", label: "Diversity", icon: <Heart size={13} /> },
    ]
    : isInvestor
      ? [
        { key: "basic", label: "Basic", icon: <User size={13} /> },
        { key: "investor", label: "Investor", icon: <TrendingUp size={13} /> },
        { key: "preferences", label: "Preferences", icon: <Film size={13} /> },
        { key: "notifications", label: "Alerts", icon: <Bell size={13} /> },
      ]
      : isReader
        ? [
          { key: "basic", label: "Basic", icon: <User size={13} /> },
          { key: "preferences", label: "Preferences", icon: <Film size={13} /> },
        ]
        : [
          { key: "basic", label: "Basic", icon: <User size={13} /> },
        ];

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleTag = (tag) => {
    if (specializedTags.includes(tag)) {
      setSpecializedTags(specializedTags.filter((t) => t !== tag));
    } else {
      if (specializedTags.length >= 5) {
        setShowTagError(true);
        setTimeout(() => setShowTagError(false), 2000);
        return;
      }
      setSpecializedTags([...specializedTags, tag]);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, WebP and GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      const { data } = await api.post("/users/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, profileImage: data.profileImage });
      setImagePreview(`http://localhost:5002${data.profileImage}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image");
      setImagePreview(profile.profileImage || "");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, profileImage: "" });
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, WebP and GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setCoverImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    setCoverUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      const { data } = await api.post("/users/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, coverImage: data.profileImage });
      setCoverImagePreview(`http://localhost:5002${data.profileImage}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload cover image");
      setCoverImagePreview(profile.coverImage || "");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCoverImage = () => {
    setFormData({ ...formData, coverImage: "" });
    setCoverImagePreview("");
    if (fileInputRefCover.current) fileInputRefCover.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const payload = {
        ...formData,
        skills: skillsArray,
      };

      if (isWriter) {
        payload.writerProfile = {
          representationStatus,
          agencyName,
          wgaMember,
          genres: selectedGenres,
          specializedTags,
          diversity,
        };
      }

      if (isInvestor) {
        payload.company = investorData.company;
        payload.linkedInUrl = investorData.linkedInUrl;
        payload.investmentRange = investorData.investmentRange;
        payload.preferredGenres = investorGenres;
        payload.preferredBudgets = investorBudgets;
        payload.preferredFormats = investorFormats;
        payload.notificationPrefs = notifPrefs;
      }

      // Reader preferences
      if (isReader) {
        payload.preferences = {
          genres: readerGenres,
          contentTypes: readerContentTypes,
        };
      }



      const { data } = await api.put("/users/update", payload);
      // Sync AuthContext so ReaderHome / For You bar picks up new preferences
      setUser((prev) => prev ? { ...prev, ...data } : prev);
      onUpdate(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const displayImage = imagePreview
    ? imagePreview.startsWith("data:") || imagePreview.startsWith("http")
      ? imagePreview
      : `http://localhost:5002${imagePreview}`
    : "";

  const displayCoverImage = coverImagePreview
    ? coverImagePreview.startsWith("data:") || coverImagePreview.startsWith("http")
      ? coverImagePreview
      : `http://localhost:5002${coverImagePreview}`
    : "";

  const inputClass = dark
    ? "w-full px-3.5 py-2.5 bg-[#242424] border border-[#444] rounded-lg text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 focus:bg-[#101e30] transition-colors"
    : "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#1e3a5f] focus:bg-white transition-colors";
  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-xl border w-full overflow-hidden ${dark ? 'bg-[#101e30] border-[#444]' : 'bg-white border-gray-200/80'}`}
        style={{ maxWidth: isInvestor ? "580px" : "520px", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-[#333]' : 'border-gray-100'}`}>
          <h2 className={`text-base font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Edit Profile</h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section Tabs */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1 px-5 pt-3 pb-2 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeSection === s.key
                    ? "bg-[#0f2544] text-white shadow-lg shadow-[#0f2544]/20"
                    : dark ? "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mx-5 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 130px)" }}>
          {/* === BASIC SECTION === */}
          {activeSection === "basic" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Profile Image Upload */}
              <div>
                <label className={labelClass}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="Profile"
                        className="w-[72px] h-[72px] rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-full bg-[#1e3a5f]/10 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#1e3a5f]">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3.5 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-semibold hover:bg-[#162d4a] transition-colors disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </button>
                    {displayImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${dark ? 'bg-[#242424] text-gray-400 border-[#444] hover:text-red-400 hover:border-red-500/40' : 'bg-white text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200'}`}
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400">JPG, PNG, WebP or GIF. Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className={labelClass}>Cover Image</label>
                <div className="space-y-2">
                  <div className="relative w-full h-[120px] rounded-lg overflow-hidden border-2 border-gray-200">
                    {displayCoverImage ? (
                      <img
                        src={displayCoverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1e3a5f]/20 to-[#0f2544]/20 flex items-center justify-center">
                        <span className={`text-sm font-semibold ${dark ? 'text-gray-600' : 'text-gray-400'}`}>No cover image</span>
                      </div>
                    )}
                    {coverUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={fileInputRefCover}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefCover.current?.click()}
                      disabled={coverUploading}
                      className="px-3.5 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-semibold hover:bg-[#162d4a] transition-colors disabled:opacity-50"
                    >
                      {coverUploading ? "Uploading..." : "Upload Cover"}
                    </button>
                    {coverImagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${dark ? 'bg-[#242424] text-gray-400 border-[#444] hover:text-red-400 hover:border-red-500/40' : 'bg-white text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200'}`}
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400">JPG, PNG, WebP or GIF. Max 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows="3"
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-[10px] text-gray-400 mt-1">{formData.bio.length}/500</p>
              </div>

              <div>
                <label className={labelClass}>Skills</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className={inputClass}
                  placeholder="Writing, Directing, Acting"
                />
                <p className="text-[11px] text-gray-400 mt-1">Separate skills with commas</p>
              </div>
            </motion.div>
          )}

          {/* === WRITER DETAILS SECTION === */}
          {activeSection === "writer" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Writer Details</h3>
                <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Professional information visible to industry contacts</p>
              </div>

              <div>
                <label className={labelClass}>Representation Status</label>
                <select
                  value={representationStatus}
                  onChange={(e) => setRepresentationStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="unrepresented">Unrepresented</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                  <option value="manager_and_agent">Manager & Agent</option>
                </select>
              </div>

              {(representationStatus === "agent" || representationStatus === "manager_and_agent") && (
                <div>
                  <label className={labelClass}>Agency Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., CAA, WME, UTA"
                  />
                </div>
              )}

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${dark ? 'bg-white/[0.03] border-[#444]' : 'bg-gray-50 border-gray-200'}`}>
                <input
                  type="checkbox"
                  id="wgaMemberEdit"
                  checked={wgaMember}
                  onChange={(e) => setWgaMember(e.target.checked)}
                  className="w-5 h-5 text-[#1a365d] border-gray-300 rounded focus:ring-[#1a365d]"
                />
                <label htmlFor="wgaMemberEdit" className={`text-sm font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  I am a WGA member
                </label>
              </div>
            </motion.div>
          )}

          {/* === GENRES SECTION === */}
          {activeSection === "genres" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Primary Genres</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select all genres that apply to your work</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all border-2 ${selectedGenres.includes(genre)
                        ? "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-[#242424] text-gray-300 border-[#444] hover:border-blue-500" : "bg-white text-gray-700 border-gray-200 hover:border-[#1a365d]"
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-[#0f2544]">{selectedGenres.length}</span> genre{selectedGenres.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </motion.div>
          )}

          {/* === SPECIALIZED TAGS SECTION === */}
          {activeSection === "tags" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Specialized Tags</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Choose themes, tones, or settings you specialize in (max 5)
                </p>
              </div>

              <AnimatePresence>
                {showTagError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg"
                  >
                    <AlertCircle size={14} />
                    <span>Please choose your top 5 only.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg ${dark ? 'border-[#444] bg-[#242424]' : 'border-gray-200 bg-gray-50'}`}>
                {NUANCED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${specializedTags.includes(tag)
                        ? "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-[#101e30] text-gray-300 border-[#444] hover:border-blue-500" : "bg-white text-gray-700 border-gray-200 hover:border-[#1a365d]"
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 flex items-center justify-between">
                <span>{specializedTags.length}/5 tags selected</span>
                {specializedTags.length > 0 && (
                  <span className="font-medium text-[#0f2544]">{specializedTags.join(", ")}</span>
                )}
              </p>
            </motion.div>
          )}

          {/* === DIVERSITY SECTION === */}
          {activeSection === "diversity" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Diversity Information</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Optional — helps producers find underrepresented voices
                </p>
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <input
                  type="text"
                  value={diversity.gender}
                  onChange={(e) => setDiversity({ ...diversity, gender: e.target.value })}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className={labelClass}>Ethnicity</label>
                <input
                  type="text"
                  value={diversity.ethnicity}
                  onChange={(e) => setDiversity({ ...diversity, ethnicity: e.target.value })}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>
            </motion.div>
          )}

          {/* === INVESTOR DETAILS SECTION === */}
          {activeSection === "investor" && isInvestor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Investor Profile</h3>
                <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Business details visible to creators and writers</p>
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Building2 size={12} /> Company / Firm</span>
                </label>
                <input
                  type="text"
                  value={investorData.company}
                  onChange={(e) => setInvestorData({ ...investorData, company: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Yash Raj Films, Dharma Productions"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Linkedin size={12} /> LinkedIn URL</span>
                </label>
                <input
                  type="url"
                  value={investorData.linkedInUrl}
                  onChange={(e) => setInvestorData({ ...investorData, linkedInUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><IndianRupee size={12} /> Investment Range</span>
                </label>
                <select
                  value={investorData.investmentRange}
                  onChange={(e) => setInvestorData({ ...investorData, investmentRange: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select typical investment range</option>
                  <option value="under_50l">Under ₹50 Lakhs</option>
                  <option value="50l_2cr">₹50 Lakhs – ₹2 Crore</option>
                  <option value="2cr_10cr">₹2 Crore – ₹10 Crore</option>
                  <option value="10cr_50cr">₹10 Crore – ₹50 Crore</option>
                  <option value="50cr_plus">₹50 Crore+</option>
                </select>
              </div>

              <div className={`flex items-start gap-2.5 p-3 rounded-lg ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                <TrendingUp size={16} className={`mt-0.5 shrink-0 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <p className={`text-xs ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Complete your investor profile to get better script recommendations and connect with relevant creators.
                </p>
              </div>
            </motion.div>
          )}

          {/* === INVESTOR PREFERENCES SECTION === */}
          {activeSection === "preferences" && isInvestor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Preferred Genres */}
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Preferred Genres</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select genres you're interested in investing in</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INVESTOR_GENRE_OPTIONS.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setInvestorGenres((prev) => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre])}
                      className={`px-2.5 py-2 rounded-lg font-medium text-xs transition-all border ${investorGenres.includes(genre)
                        ? dark ? "bg-[#0f2544] text-white border-[#1e3a5f] shadow-md shadow-[#0f2544]/20" : "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {investorGenres.length > 0 && (
                  <p className={`text-xs mt-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="font-semibold text-[#0f2544]">{investorGenres.length}</span> genre{investorGenres.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Budget Tiers */}
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Budget Tiers</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What budget ranges interest you?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUDGET_TIERS.map((tier) => (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => setInvestorBudgets((prev) => prev.includes(tier.key) ? prev.filter(b => b !== tier.key) : [...prev, tier.key])}
                      className={`px-3 py-2.5 rounded-lg text-xs transition-all border text-left ${investorBudgets.includes(tier.key)
                        ? dark ? "bg-[#0f2544] text-white border-[#1e3a5f] shadow-md shadow-[#0f2544]/20" : "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"
                      }`}
                    >
                      <span className="font-bold block">{tier.label}</span>
                      <span className={`text-[10px] ${investorBudgets.includes(tier.key) ? 'text-white/60' : dark ? 'text-gray-600' : 'text-gray-400'}`}>{tier.range}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Formats */}
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Content Formats</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What types of content do you fund?</p>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setInvestorFormats((prev) => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt])}
                      className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all border ${investorFormats.includes(fmt)
                        ? dark ? "bg-[#0f2544] text-white border-[#1e3a5f] shadow-md shadow-[#0f2544]/20" : "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* === NOTIFICATION PREFERENCES SECTION === */}
          {activeSection === "notifications" && isInvestor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Notification Preferences</h3>
                <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Control which alerts you receive</p>
              </div>

              {[
                { key: "smartMatchAlerts", label: "Smart Match Alerts", desc: "Get notified when scripts match your preferences" },
                { key: "holdAlerts", label: "Hold Updates", desc: "Updates when scripts you've held have changes" },
                { key: "viewAlerts", label: "Profile Views", desc: "Know when creators view your investor profile" },
                { key: "auditionAlerts", label: "Audition Alerts", desc: "Notifications about audition opportunities" },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${dark
                    ? notifPrefs[item.key] ? 'bg-[#0f2544]/30 border-[#1e3a5f]/40' : 'bg-white/[0.02] border-[#333] hover:border-[#444]'
                    : notifPrefs[item.key] ? 'bg-[#1e3a5f]/[0.04] border-[#1e3a5f]/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</p>
                    <p className={`text-[11px] mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifPrefs[item.key]}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${notifPrefs[item.key]
                      ? 'bg-[#1e3a5f]'
                      : dark ? 'bg-[#333]' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifPrefs[item.key] ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                </label>
              ))}
            </motion.div>
          )}

          {/* === READER PREFERENCES SECTION === */}
          {activeSection === "preferences" && isReader && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Genres */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Favourite Genres</h3>
                  {readerGenres.length > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${dark ? 'bg-[#1e3a5f]/30 text-[#7aafff]' : 'bg-[#1e3a5f]/10 text-[#1e3a5f]'}`}>
                      {readerGenres.length} selected
                    </span>
                  )}
                </div>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Tap to select genres you love — we'll show those scripts first</p>
                <div className="grid grid-cols-2 gap-2">
                  {READER_GENRE_OPTIONS.map(({ label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleReaderGenre(label)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-all border-2 text-left ${
                        readerGenres.includes(label)
                          ? dark
                            ? 'bg-[#1e3a5f] text-white border-[#3a7bd5] shadow-md shadow-[#1e3a5f]/30'
                            : 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : dark
                            ? 'bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50 hover:text-gray-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-gray-900'
                      }`}
                    >
                      <span>{label}</span>
                      {readerGenres.includes(label) && (
                        <svg className="w-3 h-3 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {readerGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setReaderGenres([])}
                    className={`mt-2 text-[11px] font-semibold hover:underline ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Content Types */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Content Types</h3>
                  {readerContentTypes.length > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${dark ? 'bg-[#1e3a5f]/30 text-[#7aafff]' : 'bg-[#1e3a5f]/10 text-[#1e3a5f]'}`}>
                      {readerContentTypes.length} selected
                    </span>
                  )}
                </div>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What formats do you enjoy watching?</p>
                <div className="grid grid-cols-2 gap-2">
                  {READER_CONTENT_TYPES.map(({ label, display }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleReaderContentType(label)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-all border-2 text-left ${
                        readerContentTypes.includes(label)
                          ? dark
                            ? 'bg-[#1e3a5f] text-white border-[#3a7bd5] shadow-md shadow-[#1e3a5f]/30'
                            : 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : dark
                            ? 'bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50 hover:text-gray-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-gray-900'
                      }`}
                    >
                      <span>{display}</span>
                      {readerContentTypes.includes(label) && (
                        <svg className="w-3 h-3 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {readerContentTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setReaderContentTypes([])}
                    className={`mt-2 text-[11px] font-semibold hover:underline ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Summary banner */}
              {(readerGenres.length > 0 || readerContentTypes.length > 0) && (
                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  dark ? 'bg-[#1e3a5f]/10 border-[#1e3a5f]/25' : 'bg-[#1e3a5f]/[0.04] border-[#1e3a5f]/15'
                }`}>
                  <svg className={`w-4 h-4 mt-0.5 shrink-0 ${dark ? 'text-[#7aafff]' : 'text-[#1e3a5f]'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-[#7aafff]/70' : 'text-[#1e3a5f]/70'}`}>
                    Your home feed will prioritise <strong>{readerGenres.length > 0 ? readerGenres.slice(0, 3).join(", ") : ""}{readerGenres.length > 3 ? ` +${readerGenres.length - 3} more` : ""}</strong>{readerGenres.length > 0 && readerContentTypes.length > 0 ? " · " : ""}<strong>{readerContentTypes.length > 0 ? readerContentTypes.map(c => READER_CONTENT_TYPES.find(x => x.label === c)?.display).join(", ") : ""}</strong> content.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons - always visible */}
          <div className={`flex items-center gap-2.5 pt-3 border-t ${dark ? 'border-[#333]' : 'border-gray-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${dark ? 'bg-[#242424] text-gray-300 border-[#444] hover:bg-[#333]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2.5 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#162d4a] transition-colors disabled:opacity-50 text-sm font-bold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
