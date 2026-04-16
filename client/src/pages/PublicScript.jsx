import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import publicApi from "../services/publicApi";
import { resolveMediaUrl } from "../utils/mediaUrl";

const PublicScript = () => {
  const { id } = useParams();
  const location = useLocation();
  const { isDarkMode: dark } = useDarkMode();

  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchPublicScript = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await publicApi.get(`/scripts/public/${id}`);
        if (cancelled) return;
        setScript(data || null);
      } catch (err) {
        if (cancelled) return;
        const apiMessage = err?.response?.data?.message;
        setError(apiMessage || "This shared project is unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) {
      fetchPublicScript();
    } else {
      setLoading(false);
      setError("Invalid project link.");
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const loginLink = useMemo(() => {
    const next = `${location.pathname}${location.search || ""}`;
    return `/login?next=${encodeURIComponent(next)}`;
  }, [location.pathname, location.search]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? "bg-[#060e1a]" : "bg-[#f5f7fb]"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (!script || error) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? "bg-[#060e1a]" : "bg-[#f5f7fb]"}`}>
        <div className={`max-w-md w-full rounded-2xl border p-6 text-center ${dark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200 shadow-sm"}`}>
          <h1 className={`text-xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Shared Project Unavailable</h1>
          <p className={`mt-2 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>{error || "This link may be expired or private."}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Go Home</Link>
            <Link to={loginLink} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const coverUrl = resolveMediaUrl(script.coverImage);
  const trailerUrl = resolveMediaUrl(script.uploadedTrailerUrl || script.trailerUrl);

  return (
    <div className={`min-h-screen ${dark ? "bg-[#060e1a]" : "bg-[#f5f7fb]"}`}>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className={`rounded-3xl border overflow-hidden ${dark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className={`aspect-[16/6] ${dark ? "bg-[#0a1322]" : "bg-gray-100"}`}>
            {coverUrl ? <img src={coverUrl} alt={script.title || "Project"} className="w-full h-full object-cover" /> : null}
          </div>

          <div className="p-5 sm:p-8">
            <p className={`text-[11px] uppercase tracking-wider font-bold ${dark ? "text-blue-200" : "text-blue-700"}`}>Shared Project</p>
            <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold leading-tight ${dark ? "text-white" : "text-gray-900"}`}>{script.title || "Untitled Project"}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {script.primaryGenre || script.genre ? (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${dark ? "bg-blue-500/15 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                  {script.primaryGenre || script.genre}
                </span>
              ) : null}
              {script.format ? (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${dark ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                  {script.formatOther || script.format}
                </span>
              ) : null}
            </div>

            <div className={`mt-4 text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>
              <span className="font-semibold">By </span>
              {script.creator?._id ? (
                <Link to={`/share/profile/${script.creator._id}`} className={`font-bold hover:underline ${dark ? "text-white" : "text-gray-900"}`}>
                  {script.creator?.name || "Creator"}
                </Link>
              ) : (
                <span className={`font-bold ${dark ? "text-white" : "text-gray-900"}`}>{script.creator?.name || "Creator"}</span>
              )}
            </div>

            {script.logline ? (
              <p className={`mt-5 text-base sm:text-lg font-bold leading-relaxed ${dark ? "text-white" : "text-gray-900"}`}>{script.logline}</p>
            ) : null}

            {script.synopsis ? (
              <div className="mt-5">
                <h2 className={`text-sm uppercase tracking-wider font-extrabold ${dark ? "text-gray-200" : "text-gray-800"}`}>Synopsis</h2>
                <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-gray-300" : "text-gray-700"}`}>{script.synopsis}</p>
              </div>
            ) : null}

            {trailerUrl ? (
              <div className="mt-6">
                <h2 className={`text-sm uppercase tracking-wider font-extrabold ${dark ? "text-gray-200" : "text-gray-800"}`}>Trailer</h2>
                <video className="mt-2 w-full rounded-xl border border-black/10" controls preload="metadata" src={trailerUrl} />
              </div>
            ) : null}

            <div className={`mt-7 rounded-2xl border p-4 ${dark ? "bg-[#0b1426] border-[#1a3050]" : "bg-[#f8fafc] border-gray-200"}`}>
              <p className={`text-sm font-semibold ${dark ? "text-gray-200" : "text-gray-800"}`}>
                Want full project access and direct collaboration options?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={loginLink} className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Login / Sign Up</Link>
                <Link to={`/script/${script._id}`} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"}`}>
                  Open Full Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicScript;
