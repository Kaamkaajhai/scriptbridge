import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { Film } from "lucide-react";

const ScriptDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverError, setCoverError] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdLoading, setHoldLoading] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Handlers ─────────────────────────────────────────── */

  const handleDeleteScript = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/scripts/${id}`);
      // Notify sidebar (and any other listeners) to refresh their lists
      window.dispatchEvent(new CustomEvent("scriptDeleted", { detail: { id } }));
      setShowDeleteModal(false);
      navigate(`/profile/${user._id}`);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteLoading(false);
    }
  };

  const resolveImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `http://localhost:5001${url}`;
  };

  useEffect(() => {
    fetchScript();
    setCoverError(false);
  }, [id]);

  const fetchScript = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/scripts/${id}`);
      setScript(data);
    } catch {
      /* demo fallback */
      setScript({
        _id: id,
        title: "The Last Detective",
        logline:
          "A retired detective is drawn back into one final case that will challenge everything he believes.",
        description:
          "A gripping thriller about a retired detective drawn back into one final case.",
        synopsis:
          "When a serial killer resurfaces after 20 years, retired detective Marcus Cole is the only one who can stop them.",
        genre: "Thriller",
        primaryGenre: "Thriller",
        contentType: "feature_film",
        format: "feature",
        pageCount: 110,
        classification: {
          primaryGenre: "Thriller",
          secondaryGenre: "Crime",
          tones: ["Dark", "Suspenseful", "Gritty"],
          themes: ["Revenge", "Redemption", "Justice"],
          settings: ["Urban", "Contemporary", "New York"],
        },
        contentIndicators: {
          bechdelTest: true,
          basedOnTrueStory: false,
          adaptation: false,
        },
        creator: { _id: "demo", name: "Sarah Mitchell", profileImage: "" },
        price: 149.99,
        premium: true,
        trailerUrl: "",
        trailerStatus: "none",
        scriptScore: {
          overall: 87,
          plot: 90,
          characters: 85,
          dialogue: 88,
          pacing: 82,
          marketability: 92,
          feedback:
            "Strong commercial potential with a compelling protagonist and tight plot structure.",
          scoredAt: new Date().toISOString(),
        },
        roles: [
          {
            _id: "r1",
            characterName: "Det. Marcus Cole",
            type: "Rough, older, like Liam Neeson",
            description: "Retired detective, haunted by his past",
            ageRange: { min: 45, max: 65 },
            gender: "Male",
          },
          {
            _id: "r2",
            characterName: "Agent Williams",
            type: "Professional, sharp",
            description: "FBI agent assigned to the case",
            ageRange: { min: 30, max: 50 },
            gender: "Female",
          },
        ],
        holdStatus: "available",
        holdFee: 200,
        views: 342,
        tags: ["thriller", "detective", "serial-killer"],
        budget: "medium",
        createdAt: new Date().toISOString(),
        auditionCount: 13,
        services: { hosting: true, evaluation: true, aiTrailer: false },
        rating: 4.2,
        reviewCount: 8,
        readsCount: 56,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHold = async () => {
    setHoldLoading(true);
    try {
      await api.post("/scripts/hold", { scriptId: script._id });
      await fetchScript();
      setShowHoldModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place hold");
    } finally {
      setHoldLoading(false);
    }
  };

  const handleGenerateTrailer = async () => {
    setTrailerLoading(true);
    try {
      await api.post("/ai/generate-trailer", { scriptId: script._id });
      await fetchScript();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate trailer");
    } finally {
      setTrailerLoading(false);
    }
  };

  const handleGenerateScore = async () => {
    setScoreLoading(true);
    try {
      await api.post("/ai/script-score", { scriptId: script._id });
      await fetchScript();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate score");
    } finally {
      setScoreLoading(false);
    }
  };

  const handleUnlockSynopsis = async () => {
    setUnlockLoading(true);
    try {
      await api.post("/scripts/unlock", { scriptId: script._id });
      await fetchScript();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unlock synopsis");
    } finally {
      setUnlockLoading(false);
    }
  };

  /* ── Formatters ───────────────────────────────────────── */

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

  const fmtFormat = (f) => {
    const map = {
      feature: "Feature Film",
      tv_1hr: "TV (1 Hour)",
      tv_halfhr: "TV (Half Hour)",
      short: "Short Film",
      feature_film: "Feature Film",
      tv_1hour: "TV (1 Hour)",
      tv_pilot_1hour: "TV Pilot (1 Hour)",
      tv_halfhour: "TV (Half Hour)",
      tv_pilot_halfhour: "TV Pilot (Half Hour)",
      short_film: "Short Film",
      web_series: "Web Series",
      play: "Play",
    };
    return (
      map[f] ||
      f?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "\u2014"
    );
  };

  const fmtBudget = (b) => {
    const map = {
      micro: "Micro (<$100K)",
      low: "Low ($100K\u2013$1M)",
      medium: "Medium ($1M\u2013$15M)",
      high: "High ($15M\u2013$75M)",
      blockbuster: "Blockbuster ($75M+)",
    };
    return (
      map[b] || b?.charAt(0).toUpperCase() + b?.slice(1) || "\u2014"
    );
  };

  const scoreColor = (v = 0) =>
    v >= 80 ? "text-emerald-400" : v >= 60 ? "text-amber-400" : "text-rose-400";

  const scoreBg = (v = 0) =>
    v >= 80 ? "bg-emerald-500" : v >= 60 ? "bg-amber-500" : "bg-rose-500";

  /* ── Loading / Error ──────────────────────────────────── */

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );

  if (!script)
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
          <Film size={28} strokeWidth={1.5} className="text-neutral-600" />
        </div>
        <h2 className="text-lg font-bold text-white/80 mb-1">
          Script not found
        </h2>
        <Link
          to="/search"
          className="text-[#5b9bd5] hover:underline text-sm font-semibold"
        >
          Browse scripts
        </Link>
      </div>
    );

  /* ── Computed values ──────────────────────────────────── */

  const score = script.scriptScore || {};
  const isOwner = script.creator?._id === user?._id;
  const isPro = ["investor", "producer", "director"].includes(user?.role);
  const showCoverPlaceholder = !script.coverImage || coverError;
  const cl = script.classification || {};
  const ci = script.contentIndicators || {};

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "classification", label: "Classification" },
    { id: "score", label: "Score" },
    { id: "roles", label: "Roles" },
    { id: "synopsis", label: "Synopsis" },
    ...(isOwner && script.textContent
      ? [{ id: "content", label: "My Script" }]
      : []),
  ];

  const stats = [
    {
      label: "Views",
      value: script.views || 0,
      gradient: "from-blue-500/10 to-blue-500/5",
      accent: "text-blue-400",
      ring: "ring-blue-500/20",
    },
    {
      label: "Reads",
      value: script.readsCount || 0,
      gradient: "from-purple-500/10 to-purple-500/5",
      accent: "text-purple-400",
      ring: "ring-purple-500/20",
    },
    {
      label: "Auditions",
      value: script.auditionCount || 0,
      gradient: "from-amber-500/10 to-amber-500/5",
      accent: "text-amber-400",
      ring: "ring-amber-500/20",
    },
    {
      label: "Reviews",
      value: script.reviewCount || 0,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      accent: "text-emerald-400",
      ring: "ring-emerald-500/20",
    },
  ];

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* ── Back ──────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white mb-5 transition font-medium group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* ══════════════  HERO CARD  ══════════════════════ */}
        <div className="bg-[#0d1829] rounded-2xl border border-white/[0.06] overflow-hidden mb-6">
          {/* Cover / Trailer */}
          <div className="relative h-52 sm:h-72 bg-gradient-to-br from-[#060c17] via-[#0c1a2d] to-[#0f2035]">
            {showCoverPlaceholder ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/[0.08] bg-white/[0.03] mb-4">
                  <Film
                    size={28}
                    strokeWidth={1.5}
                    className="text-white/30"
                  />
                </div>
                <p className="text-white/60 text-lg font-semibold">
                  {script.title}
                </p>
                {script.genre && (
                  <p className="text-white/20 text-xs font-medium mt-1 uppercase tracking-[0.2em]">
                    {script.genre}
                  </p>
                )}
              </div>
            ) : (
              <img
                src={resolveImage(script.coverImage)}
                alt={script.title}
                onError={() => setCoverError(true)}
                className="w-full h-full object-cover absolute inset-0"
              />
            )}

            {/* Play overlay */}
            {script.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl ring-1 ring-white/10">
                  <svg
                    className="w-6 h-6 text-white ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {script.premium && (
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-amber-500/20">
                  &#9733; Premium
                </span>
              )}
              {script.holdStatus === "held" && (
                <span className="px-3 py-1 bg-red-500/90 text-white rounded-lg text-[11px] font-bold">
                  Held
                </span>
              )}
              {script.isFeatured && (
                <span className="px-3 py-1 bg-purple-500/90 text-white rounded-lg text-[11px] font-bold">
                  Featured
                </span>
              )}
            </div>

            {/* Bottom gradient overlay with chips */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d1829] via-[#0d1829]/80 to-transparent pt-12 pb-4 px-5">
              <div className="flex items-end justify-between">
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-white rounded-lg text-[11px] font-semibold border border-white/10">
                    {fmtFormat(script.format)}
                  </span>
                  {(script.primaryGenre || script.genre) && (
                    <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-white rounded-lg text-[11px] font-semibold border border-white/10">
                      {script.primaryGenre || script.genre}
                    </span>
                  )}
                  {cl.secondaryGenre && (
                    <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-white rounded-lg text-[11px] font-semibold border border-white/10">
                      {cl.secondaryGenre}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white/80 rounded-lg text-[11px] font-medium">
                    {script.views || 0} views
                  </span>
                  {script.readsCount > 0 && (
                    <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white/80 rounded-lg text-[11px] font-medium">
                      {script.readsCount} reads
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Script Info Area ──────────────────────────── */}
          <div className="p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Left column */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight leading-tight">
                  {script.title}
                </h1>

                {/* Author */}
                <Link
                  to={`/profile/${script.creator?._id}`}
                  className="inline-flex items-center gap-2.5 mb-5 group"
                >
                  {script.creator?.profileImage && !coverError ? (
                    <img
                      src={resolveImage(script.creator.profileImage)}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white/10"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a5080] flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white/10">
                      {script.creator?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm text-white/80 font-semibold group-hover:text-white transition">
                    {script.creator?.name}
                  </span>
                </Link>

                {/* Logline */}
                {script.logline && (
                  <div className="bg-gradient-to-r from-white/[0.03] to-transparent rounded-xl p-4 mb-5 border-l-2 border-[#1e3a5f]">
                    <p className="text-[13px] text-neutral-400 leading-relaxed italic">
                      &ldquo;{script.logline}&rdquo;
                    </p>
                  </div>
                )}

                {/* Description */}
                {script.description && (
                  <p className="text-sm text-neutral-500 leading-relaxed mb-5">
                    {script.description}
                  </p>
                )}

                {/* Synopsis preview */}
                {script.synopsis && (
                  <div className="bg-white/[0.03] rounded-xl p-4 mb-5 border border-white/[0.05]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Synopsis
                    </p>
                    <p className="text-[13px] text-neutral-400 leading-relaxed whitespace-pre-wrap">
                      {script.synopsis}
                    </p>
                    {script.isSynopsisLocked && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-neutral-500">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <span className="font-semibold">
                          Full synopsis locked &mdash; teaser shown
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content indicators */}
                {(ci.bechdelTest ||
                  ci.basedOnTrueStory ||
                  ci.adaptation) && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {ci.bechdelTest && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/15">
                        &#10003; Bechdel Test
                      </span>
                    )}
                    {ci.basedOnTrueStory && (
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[11px] font-bold border border-blue-500/15">
                        Based on True Story
                      </span>
                    )}
                    {ci.adaptation && (
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[11px] font-bold border border-purple-500/15">
                        Adaptation
                        {ci.adaptationSource
                          ? `: ${ci.adaptationSource}`
                          : ""}
                      </span>
                    )}
                  </div>
                )}

                {/* Tags */}
                {script.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {script.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-white/[0.04] text-neutral-500 rounded-lg text-[11px] font-medium ring-1 ring-white/[0.06] hover:ring-white/[0.12] transition"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right Sidebar ─────────────────────────── */}
              <div className="lg:w-64 space-y-3 flex-shrink-0">
                {/* Price card */}
                <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Price
                  </p>
                  <p className="text-3xl font-extrabold text-white mb-3">
                    ${script.price}
                    <span className="text-sm font-medium text-neutral-500 ml-1">
                      USD
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                        Pages
                      </p>
                      <p className="text-lg font-extrabold text-white tabular-nums">
                        {script.pageCount || "\u2014"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                        Budget
                      </p>
                      <p className="text-[13px] font-bold text-white capitalize">
                        {script.budget || "\u2014"}
                      </p>
                    </div>
                    {score?.overall && (
                      <div>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                          Score
                        </p>
                        <p
                          className={`text-lg font-extrabold tabular-nums ${scoreColor(score.overall)}`}
                        >
                          {score.overall}
                        </p>
                      </div>
                    )}
                    {script.rating > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                          Rating
                        </p>
                        <p className="text-lg font-extrabold text-amber-400 tabular-nums">
                          &#9733; {script.rating.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  {isOwner && (
                    <button
                      onClick={() =>
                        navigate(`/upload?edit=${script._id}`)
                      }
                      className="w-full px-4 py-2.5 bg-white/[0.06] text-white rounded-xl text-xs font-bold hover:bg-white/[0.1] transition flex items-center justify-center gap-2 border border-white/[0.08]"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit &amp; Republish
                    </button>
                  )}

                  {!isOwner &&
                    isPro &&
                    script.holdStatus === "available" && (
                      <button
                        onClick={() => setShowHoldModal(true)}
                        className="w-full px-4 py-3 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#254a75] transition shadow-lg shadow-[#1e3a5f]/20"
                      >
                        Place Hold &mdash; ${script.holdFee || 200}
                      </button>
                    )}

                  {script.holdStatus === "held" && (
                    <div className="w-full px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold text-center border border-red-500/15">
                      Currently Held
                    </div>
                  )}

                  {isOwner &&
                    !script.trailerUrl &&
                    script.trailerStatus !== "processing" && (
                      <button
                        onClick={handleGenerateTrailer}
                        disabled={trailerLoading}
                        className="w-full px-4 py-2.5 bg-[#1a3050] text-white rounded-xl text-xs font-bold hover:bg-[#213d64] transition disabled:opacity-50 flex items-center justify-center gap-2 border border-white/[0.06]"
                      >
                        <Film size={14} />
                        {trailerLoading
                          ? "Generating..."
                          : "Generate AI Trailer"}
                      </button>
                    )}

                  {script.trailerStatus === "processing" && (
                    <div className="w-full px-4 py-2.5 bg-white/[0.03] text-neutral-500 rounded-xl text-xs font-bold text-center border border-white/[0.06] flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
                      Trailer Processing
                    </div>
                  )}

                  {isOwner && !score?.overall && (
                    <button
                      onClick={handleGenerateScore}
                      disabled={scoreLoading}
                      className="w-full px-4 py-2.5 bg-[#1a3050] text-white rounded-xl text-xs font-bold hover:bg-[#213d64] transition disabled:opacity-50 flex items-center justify-center gap-2 border border-white/[0.06]"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                      </svg>
                      {scoreLoading
                        ? "Scoring..."
                        : "Get Script Score \u2014 $10"}
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full px-4 py-2.5 bg-red-500/8 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/15 hover:text-red-300 transition flex items-center justify-center gap-2 border border-red-500/15 mt-1"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Delete Project
                    </button>
                  )}
                </div>

                {/* Services */}
                {script.services && (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Active Services
                    </p>
                    <div className="space-y-1.5">
                      {script.services.hosting && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-neutral-400 font-medium">
                            Hosted &amp; Searchable
                          </span>
                        </div>
                      )}
                      {script.services.evaluation && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-neutral-400 font-medium">
                            Professional Evaluation
                          </span>
                        </div>
                      )}
                      {script.services.aiTrailer && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span className="text-neutral-400 font-medium">
                            AI Trailer
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-neutral-600 font-medium text-center">
                  Uploaded {formatDate(script.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════  TABS BAR  ═════════════════════════ */}
        <div className="flex gap-1 mb-6 bg-[#0a1220] rounded-xl p-1 overflow-x-auto border border-white/[0.04]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all whitespace-nowrap px-4 ${
                activeTab === tab.id
                  ? "bg-[#1e3a5f] text-white shadow-md shadow-[#0a1520]/60"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════  TAB CONTENT  ═════════════════════ */}
        <AnimatePresence mode="wait">
          {/* ── Overview ─────────────────────────────────── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className={`bg-gradient-to-br ${s.gradient} rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.12] transition group`}
                  >
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                      {s.label}
                    </p>
                    <p className="text-2xl font-extrabold text-white tabular-nums">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Project details table */}
              <div className="bg-[#0d1829] rounded-xl border border-white/[0.06] p-6">
                <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  Project Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: "Format", value: fmtFormat(script.format) },
                    {
                      label: "Primary Genre",
                      value:
                        cl.primaryGenre ||
                        script.primaryGenre ||
                        script.genre,
                    },
                    {
                      label: "Secondary Genre",
                      value: cl.secondaryGenre,
                    },
                    { label: "Page Count", value: script.pageCount },
                    {
                      label: "Budget Level",
                      value: fmtBudget(script.budget),
                    },
                    {
                      label: "Hold Fee",
                      value: script.holdFee
                        ? `$${script.holdFee}`
                        : null,
                    },
                    {
                      label: "Hold Status",
                      value:
                        script.holdStatus?.charAt(0).toUpperCase() +
                        script.holdStatus?.slice(1),
                    },
                    {
                      label: "Uploaded",
                      value: formatDate(script.createdAt),
                    },
                  ]
                    .filter((i) => i.value && i.value !== "\u2014")
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-2.5 border-b border-white/[0.04] last:border-0"
                      >
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-sm font-semibold text-neutral-200">
                          {item.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Classification ───────────────────────────── */}
          {activeTab === "classification" && (
            <motion.div
              key="classification"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[
                {
                  label: "Tones",
                  items: cl.tones,
                  color:
                    "bg-white/[0.06] text-white/80 border border-white/[0.08]",
                },
                {
                  label: "Themes",
                  items: cl.themes,
                  color:
                    "bg-blue-500/10 text-blue-300 border border-blue-500/15",
                },
                {
                  label: "Settings",
                  items: cl.settings,
                  color:
                    "bg-white/[0.04] text-neutral-300 border border-white/[0.06]",
                },
              ]
                .filter((c) => c.items?.length > 0)
                .map((cat) => (
                  <div
                    key={cat.label}
                    className="bg-[#0d1829] rounded-xl border border-white/[0.06] p-6"
                  >
                    <h3 className="text-[13px] font-bold text-white mb-3">
                      {cat.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item, i) => (
                        <span
                          key={i}
                          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold ${cat.color}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

              {!cl.tones?.length &&
                !cl.themes?.length &&
                !cl.settings?.length && (
                  <div className="text-center py-12 bg-[#0d1829] rounded-xl border border-white/[0.06]">
                    <h3 className="text-base font-bold text-neutral-200 mb-1">
                      No Classification Data
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {isOwner
                        ? "Add tones, themes, and settings when editing your script"
                        : "Classification data hasn't been added yet"}
                    </p>
                  </div>
                )}
            </motion.div>
          )}

          {/* ── Score ────────────────────────────────────── */}
          {activeTab === "score" && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {score?.overall ? (
                <div className="bg-[#0d1829] rounded-xl border border-white/[0.06] p-6">
                  {/* Overall */}
                  <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/[0.06]">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0f1e30] to-[#162d4a] flex items-center justify-center shadow-2xl shadow-[#020609]/40 ring-1 ring-white/[0.06]">
                      <span className="text-3xl font-extrabold text-white">
                        {score.overall}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white tracking-tight mb-0.5">
                        Overall Score
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium">
                        AI-powered analysis across 5 dimensions
                      </p>
                      {score.scoredAt && (
                        <p className="text-[11px] text-neutral-600 mt-1">
                          Scored on {formatDate(score.scoredAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dimension bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {[
                      { label: "Plot", val: score.plot },
                      { label: "Characters", val: score.characters },
                      { label: "Dialogue", val: score.dialogue },
                      { label: "Pacing", val: score.pacing },
                      { label: "Marketability", val: score.marketability },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-300">
                            {item.label}
                          </span>
                          <span
                            className={`text-lg font-extrabold tabular-nums ${scoreColor(item.val)}`}
                          >
                            {item.val}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`h-full rounded-full ${scoreBg(item.val)}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Feedback */}
                  {score.feedback && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                      <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
                        AI Feedback
                      </p>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {score.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#0d1829] rounded-xl border border-white/[0.06]">
                  <svg
                    className="w-8 h-8 mx-auto text-neutral-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                  <h3 className="text-base font-bold text-neutral-200 mb-1">
                    No Score Yet
                  </h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    {isOwner
                      ? "Generate an AI Script Score for detailed analysis"
                      : "The creator hasn't scored this script yet"}
                  </p>
                  {isOwner && (
                    <button
                      onClick={handleGenerateScore}
                      disabled={scoreLoading}
                      className="px-6 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#254a75] transition disabled:opacity-50"
                    >
                      {scoreLoading
                        ? "Scoring..."
                        : "Get Script Score \u2014 $10"}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Roles ────────────────────────────────────── */}
          {activeTab === "roles" && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {script.roles?.length > 0 ? (
                script.roles.map((role) => (
                  <div
                    key={role._id}
                    className="bg-[#0d1829] rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {role.characterName}
                      </h3>
                      {role.gender && (
                        <span className="px-2.5 py-0.5 bg-white/[0.04] text-neutral-500 rounded-lg text-[11px] font-bold border border-white/[0.06]">
                          {role.gender}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/80 font-semibold mb-1.5">
                      {role.type}
                    </p>
                    {role.description && (
                      <p className="text-sm text-neutral-500 leading-relaxed mb-3">
                        {role.description}
                      </p>
                    )}
                    {role.ageRange && (
                      <span className="text-xs text-neutral-500 font-medium">
                        Age: {role.ageRange.min}&ndash;{role.ageRange.max}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-[#0d1829] rounded-xl border border-white/[0.06]">
                  <h3 className="text-base font-bold text-neutral-200 mb-1">
                    No Roles Defined
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {isOwner
                      ? "Add character roles to attract talent"
                      : "No roles have been added yet"}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── My Script (owner only) ───────────────────── */}
          {activeTab === "content" && isOwner && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 bg-[#0d1829] rounded-xl border border-white/[0.06] px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <Film size={16} className="text-white/50" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">
                      {script.title}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {(() => {
                        const plain = script.textContent
                          .replace(/<[^>]*>/g, " ")
                          .replace(/\s+/g, " ")
                          .trim();
                        const words = plain
                          .split(" ")
                          .filter(Boolean).length;
                        const pages =
                          script.pageCount || Math.ceil(words / 250);
                        return `${words.toLocaleString()} words \u00B7 ~${pages} pages`;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const plain = script.textContent
                        .replace(/<[^>]*>/g, "\n")
                        .replace(/\n{3,}/g, "\n\n")
                        .trim();
                      navigator.clipboard.writeText(plain);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.08] rounded-lg text-xs font-semibold transition"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.08] rounded-lg text-xs font-semibold transition"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>

              {/* Script content viewer */}
              <div className="bg-[#0d1829] rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="max-w-2xl mx-auto px-8 py-10 sm:px-16">
                  <div className="text-center mb-10 pb-8 border-b border-white/[0.06]">
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                      {script.title}
                    </h2>
                    {script.format && (
                      <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                        {fmtFormat(script.format)}
                      </p>
                    )}
                  </div>
                  {script.textContent.startsWith("<") ? (
                    <div
                      className="script-content"
                      dangerouslySetInnerHTML={{
                        __html: script.textContent,
                      }}
                    />
                  ) : (
                    <pre
                      className="whitespace-pre-wrap text-[14px] text-neutral-300 leading-relaxed"
                      style={{
                        fontFamily:
                          '"Courier Prime", "Courier New", Courier, monospace',
                      }}
                    >
                      {script.textContent}
                    </pre>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-neutral-600">
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                This content is private and only visible to you as the
                creator
              </div>
            </motion.div>
          )}

          {/* ── Synopsis (full tab) ──────────────────────── */}
          {activeTab === "synopsis" && (
            <motion.div
              key="synopsis"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#0d1829] rounded-xl border border-white/[0.06] p-6"
            >
              {script.synopsis ? (
                <>
                  <h3 className="text-lg font-extrabold text-white mb-4 tracking-tight">
                    Synopsis
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap mb-6">
                    {script.synopsis}
                  </p>
                  {script.isSynopsisLocked && (
                    <div className="pt-5 border-t border-white/[0.06]">
                      <div className="bg-white/[0.03] rounded-xl p-6 text-center border border-white/[0.05]">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.06] flex items-center justify-center mb-3">
                          <svg
                            className="w-5 h-5 text-neutral-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        </div>
                        <h4 className="text-base font-bold text-neutral-200 mb-2">
                          Full Synopsis Locked
                        </h4>
                        {script.isWriter ? (
                          <p className="text-sm text-neutral-500">
                            Writers cannot purchase synopsis access.
                            Only industry professionals can unlock full
                            scripts.
                          </p>
                        ) : script.canPurchase ? (
                          <div>
                            <p className="text-sm text-neutral-500 mb-4">
                              Pay to unlock the full synopsis and
                              content.
                            </p>
                            <button
                              onClick={handleUnlockSynopsis}
                              disabled={unlockLoading}
                              className="px-6 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#254a75] transition disabled:opacity-50"
                            >
                              {unlockLoading
                                ? "Processing..."
                                : `Unlock \u2014 $${script.price || 0}`}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">
                            Sign in as a producer or director to
                            unlock.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {!script.isSynopsisLocked && !script.isCreator && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-xs font-bold">
                        Full synopsis unlocked
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-base font-bold text-neutral-200 mb-1">
                    No Synopsis Available
                  </h3>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ══════════════  MODALS  ═════════════════════════════ */}

      {/* Trailer modal */}
      {showTrailer && script.trailerUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowTrailer(false)}
                className="w-8 h-8 rounded-lg bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition"
              >
                &#10005;
              </button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <video
                src={script.trailerUrl}
                controls
                autoPlay
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d1829] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-white/[0.06]"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg
                  className="w-5.5 h-5.5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h2 className="text-lg font-extrabold text-white mb-1 tracking-tight text-center">
                Delete Project?
              </h2>
              <p className="text-sm text-neutral-500 mb-1 text-center">
                &ldquo;
                <span className="font-semibold text-neutral-300">
                  {script.title}
                </span>
                &rdquo; will be removed from your profile and all
                listings.
              </p>
              <p className="text-xs text-neutral-600 text-center mb-6">
                Uploaded files are kept in storage. This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-white/[0.06] text-neutral-400 rounded-xl text-sm font-semibold hover:bg-white/[0.1] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteScript}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hold modal */}
      <AnimatePresence>
        {showHoldModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !holdLoading && setShowHoldModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d1829] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/[0.06]"
            >
              <h2 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                Place Hold
              </h2>
              <p className="text-sm text-neutral-500 mb-5">
                Reserve 30-day exclusive access to &ldquo;
                <span className="font-semibold text-neutral-300">
                  {script.title}
                </span>
                &rdquo;
              </p>
              <div className="bg-white/[0.03] rounded-xl p-4 mb-5 border border-white/[0.05] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">
                    Hold Fee
                  </span>
                  <span className="font-bold text-white">
                    ${script.holdFee || 200}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">
                    Platform Fee (10%)
                  </span>
                  <span className="font-bold text-neutral-500">
                    $
                    {((script.holdFee || 200) * 0.1).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                  <span className="font-bold text-neutral-300">
                    Creator Receives
                  </span>
                  <span className="font-bold text-white">
                    $
                    {((script.holdFee || 200) * 0.9).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/[0.06] text-neutral-400 rounded-xl text-sm font-semibold hover:bg-white/[0.1] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHold}
                  disabled={holdLoading}
                  className="flex-1 px-4 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#254a75] transition disabled:opacity-50"
                >
                  {holdLoading ? "Processing..." : "Confirm Hold"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScriptDetail;
