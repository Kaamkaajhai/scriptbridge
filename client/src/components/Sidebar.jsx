import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import api from "../services/api";
import BrandLogo from "./BrandLogo";

const Sidebar = ({ purchaseRequestCount = 0, unreadMessageCount = 0 }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  // State for collapsible sections
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [watchlistOpen, setWatchlistOpen] = useState(true); // NEW for Producers

  const [myScripts, setMyScripts] = useState([]);
  const [watchlist, setWatchlist] = useState([]); // NEW for Producers
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const isIndustry = user?.role === 'professional' || user?.role === 'producer' || user?.role === 'investor';
  const isReader = user?.role === 'reader';
  const isAdmin = user?.role === 'admin';
  const isWriterRole = user?.role === 'writer' || user?.role === 'creator';
  const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(/\/api\/?$/, "").replace(/\/$/, "");
  const rawProfileImage = user?.profileImage || user?.profilePicture || "";
  const normalizedProfileImagePath = typeof rawProfileImage === "string"
    ? rawProfileImage.trim().replace(/\\/g, "/")
    : "";
  const resolvedProfileImage = normalizedProfileImagePath
    ? (normalizedProfileImagePath.startsWith("http")
      ? normalizedProfileImagePath
      : `${apiBaseUrl}${normalizedProfileImagePath.startsWith("/") ? "" : "/"}${normalizedProfileImagePath}`)
    : "";

  useEffect(() => {
    if (user) {
      if (isIndustry) {
        fetchWatchlist();
      } else if (!isReader) {
        fetchMyScripts();
      }
    }
  }, [user]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [resolvedProfileImage]);

  // Re-fetch scripts whenever one is deleted anywhere in the app
  useEffect(() => {
    const onScriptDeleted = () => {
      if (!isIndustry && !isReader) fetchMyScripts();
    };
    window.addEventListener("scriptDeleted", onScriptDeleted);
    return () => window.removeEventListener("scriptDeleted", onScriptDeleted);
  }, [isIndustry]);

  const fetchMyScripts = async () => {
    try {
      const { data } = await api.get("/scripts");
      const mine = data.filter(
        (s) => (s.creator?._id === user?._id || s.creator === user?._id) && s.status !== "draft"
      );
      setMyScripts(mine);
    } catch { setMyScripts([]); }
  };

  const fetchWatchlist = async () => {
    try {
      // You need an endpoint for this: /users/watchlist
      const { data } = await api.get("/users/watchlist");
      setWatchlist(data);
    } catch {
      setWatchlist([]);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const isActive = (path) => {
    if (location.pathname === path) return true;
    // Only use prefix matching for paths that won't accidentally match sibling routes
    // e.g. "/reader" must NOT match "/reader/profile/..." since Profile is its own nav item
    const siblingPaths = [...mainNavItems, ...actionItems, ...bottomNavItems].map((i) => i.path);
    if (siblingPaths.some((p) => p !== path && p.startsWith(path + "/"))) return false;
    return location.pathname.startsWith(path + "/");
  };

  const isInvestorRole = user?.role === "investor";

  // --- Investor sectioned sidebar ---
  const investorSections = isInvestorRole ? [
    {
      label: "Overview",
      items: [
        { path: "/home", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
        { path: "/dashboard", label: "Dashboard", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
        { path: "/top-list", label: "Top List", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
      ],
    },
    {
      label: "Discover",
      items: [
        { path: "/search", label: "Search Scripts", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
        { path: "/top-list", label: "Top List", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { path: "/featured", label: "Featured", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
      ],
    },
    {
      label: "Network",
      items: [
        { path: `/profile/${user?._id || ""}`, label: "My Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        { path: "/messages", label: "Messages", icon: "M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
        { path: "/purchase-requests", label: "My Requests", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      ],
    },
  ] : null;

  const mainNavItems = isAdmin ? [
    { path: "/search", label: "Search Projects", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { path: "/top-list", label: "Top List", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { path: "/featured", label: "Featured", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
  ] : isReader ? [
    { path: "/reader", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: `/profile/${user?._id || ""}`, label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { path: "/search", label: "Search Projects", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { path: "/top-list", label: "Top List", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { path: "/featured", label: "Featured", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
  ] : isIndustry ? [
    { path: "/dashboard", label: "Dashboard", icon: "M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" },
    { path: `/profile/${user?._id || ""}`, label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { path: "/search", label: "Search Scripts", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { path: "/top-list", label: "Top List", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { path: "/featured", label: "Featured", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
    { path: "/messages", label: "Messages", icon: "M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  ] : [
    { path: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    ...(isWriterRole ? [{ path: "/featured", label: "Featured", icon: "M9.049 2.927C9.349 2.005 10.651 2.005 10.951 2.927l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.196-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" }] : []),
    { path: "/top-list", label: "Top List", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { path: "/featured", label: "Featured", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
    { path: "/credits", label: "Credits", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 w-full text-left transition-colors ${isDarkMode ? "text-[#2a3a4e] hover:text-[#8896a7]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <svg className={`w-4 h-4 transition-transform duration-200 ${projectsOpen ? "rotate-90" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className={`text-sm font-bold tracking-wider uppercase ${isDarkMode ? "text-[#2a3a4e]" : "text-gray-400"}`}>My Projects</span>
                </button>
                {projectsOpen && (
                  <div className="pl-3">
                    {myScripts.length > 0 ? (
                      myScripts.map((script) => (
                        <Link key={script._id} to={`/script/${script._id}`} onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 px-5 py-2 transition-colors ${isDarkMode ? "text-[#8896a7] hover:text-white" : "text-gray-500 hover:text-gray-700"}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isDarkMode ? "bg-[#1c2a3a]" : "bg-gray-300"}`}></div>
                          <span className="text-[15px] font-semibold truncate">{script.title}</span>
                        </Link>
                      ))
                    ) : (
                      <p className={`px-5 py-2 text-sm italic font-medium ${isDarkMode ? "text-[#3a4a5e]" : "text-gray-400"}`}>No projects yet</p>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </nav>

      {/* ── User row ── */}
      <div className={`border-t p-3 ${isDarkMode ? "border-[#1a3050]" : "border-gray-100"}`}>
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 ${isDarkMode ? "hover:bg-[#132744]" : "hover:bg-gray-50"}`}>
          <div className="relative shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${user?._id || ""}`)}
          >
            {user?.profileImage ? (
              <img src={user.profileImage.startsWith("http") ? user.profileImage : `http://localhost:5002${user.profileImage}`} alt={user.name}
                className={`w-10 h-10 rounded-full object-cover ring-2 ${isDarkMode ? "ring-[#1a3050]" : "ring-gray-200"}`} />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? "bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-blue-300" : "bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] text-white"}`}>
                {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              </div>
            )}
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ${isDarkMode ? "ring-[#0b1426]" : "ring-white"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[13.5px] font-bold truncate leading-tight ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{user?.name || "User"}</p>
            <p className={`text-[11px] font-medium capitalize truncate mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {user?.role === "professional" ? "Industry Pro" : user?.role || "Member"}
            </p>
          </div>
          <button onClick={handleLogout} title="Log out"
            className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all ${isDarkMode ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:text-red-500 hover:bg-red-50"}`}>
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen w-[280px] border-r flex-col z-30 ${isDarkMode ? "bg-[#0b1426] border-[#1a3050]" : "bg-white/80 backdrop-blur-xl border-gray-200/60"}`}>
        <SidebarContent />
      </aside>

      <aside className={`hidden md:flex lg:hidden fixed left-0 top-0 h-screen w-[64px] border-r flex-col items-center z-30 ${isDarkMode ? "bg-[#080e18] border-[#151f2e]" : "bg-white/80 backdrop-blur-xl border-gray-200/60"}`}>
        <div className="h-16 flex items-center justify-center">
          <Link to="/dashboard">
            <svg className={`w-7 h-7 ${isDarkMode ? "text-[#8896a7]" : "text-[#1e3a5f]"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </Link>
        </div>
        <nav className="flex-1 flex flex-col items-center gap-1 py-2 overflow-y-auto">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            const showPurchaseBadge = isPurchaseRequestsItem(item.path) && purchaseRequestCount > 0;
            const showMessageBadge = isMessagesItem(item.path) && unreadMessageCount > 0;
            return (
              <Link key={item.label} to={item.path} title={item.label}
                className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${active
                  ? isDarkMode ? "bg-[#0d1520] text-white" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                  : isDarkMode ? "text-[#4a5a6e] hover:bg-[#0d1520] hover:text-[#8896a7]" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}>
                <Icon d={item.icon} />
                {showMessageBadge && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[19px] h-[19px] px-1 rounded-full bg-[#0f766e] text-white text-[10px] font-extrabold leading-none ring-2 ring-white/80">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                )}
                {showPurchaseBadge && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[19px] h-[19px] px-1 rounded-full bg-[#1e3a5f] text-white text-[10px] font-extrabold leading-none ring-2 ring-white/80">
                    {purchaseRequestCount > 9 ? "9+" : purchaseRequestCount}
                  </span>
                )}
              </Link>
            );
          })}
          <div className={`w-6 my-1 border-t ${isDarkMode ? "border-[#151f2e]" : "border-gray-100"}`}></div>
          {actionItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.label} to={item.path} title={item.label}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${active
                  ? isDarkMode ? "bg-[#0d1520] text-white" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                  : isDarkMode ? "text-[#4a5a6e] hover:bg-[#0d1520] hover:text-[#8896a7]" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}>
                <Icon d={item.icon} />
              </Link>
            );
          })}
        </nav>
        <div className="py-3 flex flex-col items-center gap-2">
        <button onClick={() => navigate(`/profile/${user?._id || ""}`)}>
            {resolvedProfileImage && !avatarLoadError ? (
              <img
                src={resolvedProfileImage}
                alt={user?.name || "User"}
                onError={() => setAvatarLoadError(true)}
                className={`w-9 h-9 rounded-full object-cover ring-1 ${isDarkMode ? "ring-[#1c2a3a]" : "ring-gray-200"}`}
              />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? "bg-[#0d1520] text-[#8896a7] ring-1 ring-[#1c2a3a]" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"}`}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </button>
          <button onClick={handleLogout} title="Log out"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? "text-[#4a5a6e] hover:text-[#8896a7] hover:bg-[#0d1520]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}>
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </button>
        </div>
      </aside>

      <button onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-50 w-9 h-9 border rounded-lg flex items-center justify-center shadow-sm ${isDarkMode ? "bg-[#080e18] border-[#151f2e] text-[#8896a7]" : "bg-white border-gray-200 text-gray-600"}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)}></div>
          <aside className={`absolute left-0 top-0 h-full w-[260px] shadow-lg ${isDarkMode ? "bg-[#080e18]" : "bg-white"}`}>
            <button onClick={() => setMobileOpen(false)} className={`absolute top-4 right-3 ${isDarkMode ? "text-[#4a5a6e] hover:text-white" : "text-gray-400 hover:text-gray-600"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around px-1 z-40 ${isDarkMode ? "bg-[#080e18] border-[#151f2e]" : "bg-white/90 backdrop-blur-xl border-gray-200/60"}`}>
        {mobileItems.map((item) => {
          const active = isActive(item.path);
          const showMessageBadge = isMessagesItem(item.path) && unreadMessageCount > 0;
          return (
            <Link key={item.path} to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 transition-colors ${active
                ? isDarkMode ? "text-white" : "text-[#1e3a5f]"
                : isDarkMode ? "text-[#4a5a6e]" : "text-gray-400"
                }`}>
              <Icon d={item.icon} size={`w-[22px] h-[22px] ${active ? "stroke-[2.2]" : ""}`} />
              {showMessageBadge && (
                <span className="absolute top-0.5 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0f766e] text-white text-[10px] font-extrabold leading-none ring-2 ring-white/80">
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                </span>
              )}
              <span className={`text-xs ${active
                ? isDarkMode ? "font-extrabold text-white" : "font-extrabold text-[#1e3a5f]"
                : isDarkMode ? "font-bold text-[#4a5a6e]" : "font-bold text-gray-400"
                }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
