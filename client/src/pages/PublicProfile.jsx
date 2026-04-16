import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";
import publicApi from "../services/publicApi";
import { resolveMediaUrl } from "../utils/mediaUrl";

const PublicProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useDarkMode();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      return () => {
        cancelled = true;
      };
    }

    if (user?.token && id) {
      navigate(`/profile/${id}`, { replace: true });
      return () => {
        cancelled = true;
      };
    }

    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await publicApi.get(`/users/public/${id}`);
        if (cancelled) return;
        setProfile(data?.user || null);
        setScripts(Array.isArray(data?.scripts) ? data.scripts : []);
      } catch (err) {
        if (cancelled) return;
        const apiMessage = err?.response?.data?.message;
        setError(apiMessage || "This shared profile is unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) {
      fetchPublicProfile();
    } else {
      setLoading(false);
      setError("Invalid profile link.");
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, id, navigate, user?.token]);

  const loginLink = useMemo(() => {
    const next = `${location.pathname}${location.search || ""}`;
    return `/login?next=${encodeURIComponent(next)}`;
  }, [location.pathname, location.search]);

  const memberSince = useMemo(() => {
    const raw = profile?.createdAt;
    if (!raw) return "";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [profile?.createdAt]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? "bg-[#060e1a]" : "bg-[#f5f7fb]"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>Loading shared profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? "bg-[#060e1a]" : "bg-[#f5f7fb]"}`}>
        <div className={`max-w-md w-full rounded-2xl border p-6 text-center ${dark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200 shadow-sm"}`}>
          <h1 className={`text-xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Shared Profile Unavailable</h1>
          <p className={`mt-2 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>{error || "This link may be expired or private."}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Go Home</Link>
            <Link to={loginLink} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dark ? "bg-[#060e1a]" : "bg-[#f5f7fb]"}`}>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className={`rounded-3xl border overflow-hidden ${dark ? "border-[#1a3050] bg-[#0f1d35]" : "border-gray-200 bg-white shadow-sm"}`}>
          <div className={`h-24 sm:h-32 ${dark ? "bg-gradient-to-r from-[#16345b] via-[#1f4b85] to-[#16345b]" : "bg-gradient-to-r from-[#dbeafe] via-[#bfdbfe] to-[#dbeafe]"}`} />
          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-10 sm:-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <img
                  src={resolveMediaUrl(profile.profileImage) || "https://via.placeholder.com/96x96?text=User"}
                  alt={profile.name || "User"}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 ${dark ? "border-[#0f1d35]" : "border-white"}`}
                />
                <div>
                  <p className={`text-[11px] uppercase tracking-wider font-bold ${dark ? "text-blue-200" : "text-blue-700"}`}>Shared Profile</p>
                  <h1 className={`text-2xl sm:text-3xl font-extrabold leading-tight ${dark ? "text-white" : "text-gray-900"}`}>{profile.name || "User"}</h1>
                  <p className={`text-sm font-semibold capitalize ${dark ? "text-gray-300" : "text-gray-600"}`}>{profile.role || "member"}</p>
                </div>
              </div>

              <Link
                to={loginLink}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Login To Connect
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              <div className={`rounded-3xl border p-5 ${dark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-9 h-9 rounded-full border flex items-center justify-center ${dark ? "border-white/10 text-blue-200" : "border-gray-200 text-blue-700 bg-blue-50"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </span>
                  <h3 className={`text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>About</h3>
                </div>
                <p className={`text-[15px] leading-relaxed ${dark ? "text-gray-200" : "text-gray-700"}`}>
                  {profile.bio || "No about details shared yet."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`rounded-3xl border p-5 ${dark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-9 h-9 rounded-full border flex items-center justify-center ${dark ? "border-white/10 text-blue-200" : "border-gray-200 text-blue-700 bg-blue-50"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </span>
                    <h3 className={`text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Role</h3>
                  </div>
                  <span className={`inline-flex px-4 py-2 rounded-2xl text-[14px] font-bold border ${dark ? "border-white/10 text-gray-100 bg-white/[0.04]" : "border-gray-200 text-gray-800 bg-gray-50"}`}>
                    {String(profile.role || "member").charAt(0).toUpperCase() + String(profile.role || "member").slice(1)}
                  </span>
                </div>

                <div className={`rounded-3xl border p-5 ${dark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-9 h-9 rounded-full border flex items-center justify-center ${dark ? "border-white/10 text-blue-200" : "border-gray-200 text-blue-700 bg-blue-50"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </span>
                    <h3 className={`text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Member Info</h3>
                  </div>
                  {memberSince ? (
                    <p className={`text-[14px] font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>Member since {memberSince}</p>
                  ) : (
                    <p className={`text-[14px] ${dark ? "text-gray-400" : "text-gray-500"}`}>Member details unavailable</p>
                  )}
                </div>
              </div>

              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div className={`rounded-3xl border p-5 ${dark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-9 h-9 rounded-full border flex items-center justify-center ${dark ? "border-white/10 text-blue-200" : "border-gray-200 text-blue-700 bg-blue-50"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </span>
                    <h3 className={`text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Skills & Expertise</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className={`px-3 py-1.5 rounded-2xl text-[13px] font-semibold border ${dark ? "border-white/10 text-gray-200 bg-white/[0.04]" : "border-gray-200 text-gray-700 bg-gray-50"}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${dark ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                Followers: {Number(profile.followerCount || 0)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${dark ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                Following: {Number(profile.followingCount || 0)}
              </span>
              {Array.isArray(profile?.writerProfile?.genres) && profile.writerProfile.genres.slice(0, 4).map((genre) => (
                <span key={genre} className={`px-3 py-1 rounded-full text-xs font-bold ${dark ? "bg-blue-500/15 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl sm:text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Published Projects</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dark ? "bg-white/10 text-gray-200" : "bg-white border border-gray-200 text-gray-700"}`}>
              {scripts.length}
            </span>
          </div>

          {scripts.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${dark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200"}`}>
              <p className={`text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>No public projects available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scripts.map((script) => (
                <Link
                  key={script._id}
                  to={`/share/project/${script._id}`}
                  className={`rounded-2xl border overflow-hidden transition-transform hover:-translate-y-0.5 ${dark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200 shadow-sm"}`}
                >
                  <div className={`aspect-[16/7] ${dark ? "bg-[#0a1322]" : "bg-gray-100"}`}>
                    {script.coverImage ? (
                      <img src={resolveMediaUrl(script.coverImage)} alt={script.title || "Project"} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className={`text-lg font-extrabold leading-tight ${dark ? "text-white" : "text-gray-900"}`}>{script.title || "Untitled Project"}</h3>
                    {script.logline ? <p className={`mt-1 text-sm font-semibold ${dark ? "text-gray-200" : "text-gray-700"}`}>{script.logline}</p> : null}
                    {script.synopsis ? <p className={`mt-2 text-xs leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>{script.synopsis}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
