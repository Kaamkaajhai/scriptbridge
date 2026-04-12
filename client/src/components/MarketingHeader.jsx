import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { AuthContext } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact us" },
];

const isLinkActive = (pathname, to) => {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
};

const desktopLinkClass = (active) =>
  `font-body text-sm font-medium transition-colors whitespace-nowrap ${
    active ? "text-white" : "text-[#94A3B8] hover:text-white"
  }`;

const mobileLinkClass = (active) =>
  `font-body rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-white/10 text-white"
      : "text-[#B7C3D4] hover:bg-white/5 hover:text-white"
  }`;

const MarketingHeader = () => {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const primaryPath = user?.role === "reader" ? "/reader" : "/dashboard";
  const primaryLabel = user?.role === "reader" ? "Reader" : "Dashboard";

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-2">
        <Link to="/" aria-label="Go to Home">
          <BrandLogo className="h-7 sm:h-9 w-auto" />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-[#B7C3D4] hover:text-white hover:border-white/30 transition-colors"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {links.map((item) => (
            <Link key={item.to} to={item.to} className={desktopLinkClass(isLinkActive(pathname, item.to))}>
              {item.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden sm:inline font-body text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
              >
                Profile
              </Link>
              <Link
                to={primaryPath}
                className="bg-[#6366F1] text-white font-body text-sm font-semibold px-4 lg:px-5 py-2.5 rounded-full hover:bg-[#4F46E5] transition-colors whitespace-nowrap"
              >
                {primaryLabel}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-body text-sm font-medium text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap"
              >
                Sign in
              </Link>
              <Link
                to="/join"
                className="bg-[#6366F1] text-white font-body text-sm font-semibold px-4 lg:px-5 py-2.5 rounded-full hover:bg-[#4F46E5] transition-colors whitespace-nowrap"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0F172A]/95">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={mobileLinkClass(isLinkActive(pathname, item.to))}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="font-body rounded-xl px-3 py-2.5 text-sm font-medium text-[#B7C3D4] hover:bg-white/5 hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to={primaryPath}
                    className="font-body rounded-xl bg-[#6366F1] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#4F46E5] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {primaryLabel}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="font-body rounded-xl px-3 py-2.5 text-sm font-medium text-[#B7C3D4] hover:bg-white/5 hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/join"
                    className="font-body rounded-xl bg-[#6366F1] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#4F46E5] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MarketingHeader;
