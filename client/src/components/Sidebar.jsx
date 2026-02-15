import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [myScripts, setMyScripts] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchMyScripts();
  }, []);

  const fetchMyScripts = async () => {
    try {
      const { data } = await api.get("/scripts");
      const mine = data.filter(
        (s) => s.creator?._id === user?._id || s.creator === user?._id
      );
      setMyScripts(mine);
    } catch {
      setMyScripts([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  /* ── Navigation items matching the screenshot ── */
  const mainNavItems = [
    {
      path: "/dashboard",
      label: "MY DASHBOARD",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: `/profile/${user?._id || ""}`,
      label: "MY PROFILE",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      path: "/feed",
      label: "TOP LISTS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      path: "/featured",
      label: "FEATURED PROJECTS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      path: "/messages",
      label: "MY PROGRAMS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: "/search",
      label: "SEARCH PROJECTS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
        </svg>
      ),
    },
    {
      path: "/search?type=writers",
      label: "SEARCH WRITERS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      path: "/smart-match",
      label: "SMART MATCH",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      path: "/auditions",
      label: "AUDITIONS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      ),
    },
    {
      path: "/notifications",
      label: "NOTIFICATIONS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
  ];

  const actionItems = [
    {
      path: "/upload",
      label: "ADD PROJECT",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "BUY EVALUATIONS",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  /* ─── Mobile bottom items (top 5) ─── */
  const mobileItems = [
    { path: "/dashboard", label: "Dashboard", iconD: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/feed", label: "Feed", iconD: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { path: "/upload", label: "Create", iconD: "M12 4v16m8-8H4" },
    { path: "/search", label: "Search", iconD: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { path: `/profile/${user?._id || ""}`, label: "Profile", iconD: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  const NavItem = ({ item }) => {
    const active = isActive(item.path);
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3.5 px-5 py-2.5 text-[13px] font-semibold tracking-wider transition-all duration-200 ${
          active
            ? "bg-gradient-to-r from-cyan-700/80 to-teal-600/70 text-white"
            : "text-amber-600 hover:bg-white/5 hover:text-amber-400"
        }`}
      >
        <span className={`shrink-0 ${active ? "text-white" : "text-amber-600/80 group-hover:text-amber-400"}`}>
          {item.icon}
        </span>
        <span>{item.label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-wide">SCRIPT BRIDGE</span>
      </div>

      {/* ── Separator ── */}
      <div className="mx-4 border-t border-gray-700/60"></div>

      {/* ── Main navigation ── */}
      <nav className="flex-1 py-3 overflow-y-auto sidebar-scroll">
        {mainNavItems.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}

        {/* ── Separator ── */}
        <div className="mx-4 my-3 border-t border-gray-700/60"></div>

        {actionItems.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}

        {/* ── MY PROJECTS collapsible ── */}
        <div className="mx-4 my-3 border-t border-gray-700/60"></div>

        <button
          onClick={() => setProjectsOpen(!projectsOpen)}
          className="flex items-center gap-2 px-5 py-2.5 w-full text-left text-amber-600 hover:text-amber-400 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${projectsOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[13px] font-semibold tracking-wider">MY PROJECTS</span>
        </button>

        {projectsOpen && (
          <div className="pl-5">
            {myScripts.length > 0 ? (
              myScripts.map((script) => (
                <Link
                  key={script._id}
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-5 py-2 text-amber-600/70 hover:text-amber-400 transition-colors"
                >
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                  <div className="min-w-0">
                    <span className="block text-[12px] font-semibold tracking-wider truncate">
                      {script.title?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">Listed</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-5 py-2 text-[11px] text-gray-600 italic">No projects yet</p>
            )}
          </div>
        )}
      </nav>

      {/* ── User section at bottom ── */}
      <div className="border-t border-gray-700/60 p-4">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-[12px] font-semibold tracking-wider text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all flex items-center gap-2 justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          LOG OUT
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ══ DESKTOP (lg+) — Full dark sidebar ══ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[380px] bg-[#111111] flex-col z-30">
        <SidebarContent />
      </aside>

      {/* ══ TABLET (md–lg) — Icon-only dark sidebar ══ */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-screen w-[72px] bg-[#111111] flex-col items-center z-30">
        <div className="py-5">
          <Link to="/dashboard">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </Link>
        </div>
        <nav className="flex-1 flex flex-col items-center gap-1 px-2 py-2 overflow-y-auto">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                title={item.label}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-cyan-700/80 to-teal-600/70 text-white"
                    : "text-amber-600/70 hover:bg-white/5 hover:text-amber-400"
                }`}
              >
                {item.icon}
              </Link>
            );
          })}
          <div className="w-8 my-2 border-t border-gray-700/60"></div>
          {actionItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                title={item.label}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-cyan-700/80 to-teal-600/70 text-white"
                    : "text-amber-600/70 hover:bg-white/5 hover:text-amber-400"
                }`}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>
        <div className="py-4 flex flex-col items-center gap-2">
          <button onClick={() => navigate(`/profile/${user?._id || ""}`)}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-700" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-amber-500">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </button>
          <button onClick={handleLogout} title="Log out" className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ══ MOBILE (<md) — Hamburger + slide-out sidebar + bottom bar ══ */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#111] rounded-lg flex items-center justify-center text-amber-500 shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-[300px] bg-[#111111] shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111]/95 backdrop-blur-md border-t border-gray-800 flex items-center justify-around px-1 z-40">
        {mobileItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl transition-all duration-200 ${
                active ? "text-teal-400" : "text-gray-500"
              }`}
            >
              <svg className={`w-5 h-5 ${active ? "scale-110" : ""}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.iconD} />
              </svg>
              <span className={`text-[10px] leading-tight ${active ? "font-bold text-teal-400" : "font-medium text-gray-500"}`}>
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
