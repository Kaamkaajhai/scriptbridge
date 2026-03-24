import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import BuyCreditsModal from "./BuyCreditsModal";
import api from "../services/api";
import BrandLogo from "./BrandLogo";
import {
  Zap, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight,
  Gift, RefreshCw, ShoppingCart, X, Loader2, ChevronRight
} from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode: dark } = useDarkMode();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showCreditsPanel, setShowCreditsPanel] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [recentTx, setRecentTx] = useState([]);

  const dropdownRef = useRef(null);
  const creditsPanelRef = useRef(null);

  const searchOptions = [
    { key: "all",       label: "All",       icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
    { key: "projects",  label: "Projects",  icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
    { key: "writers",   label: "Writers",   icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
    { key: "investors", label: "Investors", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "readers",   label: "Readers",   icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
  ];

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close credits panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (creditsPanelRef.current && !creditsPanelRef.current.contains(e.target)) {
        setShowCreditsPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCreditsData = useCallback(async () => {
    try {
      setCreditsLoading(true);
      const [balRes, histRes] = await Promise.all([
        api.get("/credits/balance"),
        api.get("/credits/history?page=1&limit=4"),
      ]);
      setCreditsData(balRes.data);
      setRecentTx(histRes.data.transactions || []);
    } catch {
      setCreditsData(null);
      setRecentTx([]);
    } finally {
      setCreditsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== "investor") {
      fetchCreditsData();
    }
  }, [user, fetchCreditsData]);

  const handleCreditsUpdate = (data) => {
    if (data?.credits) {
      setCreditsData((prev) => ({ ...prev, balance: data.credits.balance }));
    }
    fetchCreditsData();
  };

  const handleSearchNavigate = (type) => {
    setShowDropdown(false);
    navigate(`/search?type=${type}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d);
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const txIcon = (type) => {
    const map = { purchase: ArrowDownLeft, bonus: Gift, refund: RefreshCw, spent: ArrowUpRight };
    return map[type] || Zap;
  };

  const txColor = (type) => {
    if (type === "spent") return dark ? "text-orange-400 bg-orange-400/10" : "text-orange-600 bg-orange-50";
    return dark ? "text-emerald-400 bg-emerald-400/10" : "text-emerald-600 bg-emerald-50";
  };

  return (
    <>
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={handleCreditsUpdate}
      />

      {/* Center search */}
      <div className="relative hidden md:block" ref={dropdownRef}>
        <div className="relative flex items-center">
          <svg className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-56 h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111111]/15 focus:border-[#111111]/40 focus:bg-white transition-all"
          />
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 py-1.5 z-50 min-w-55">
            <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Search for</p>
            {searchOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSearchNavigate(opt.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-[#111111] transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                </svg>
                {opt.label}
                {searchQuery && (
                  <span className="ml-auto text-[11px] text-gray-400 truncate max-w-20">"{searchQuery}"</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

          <button
            onClick={logout}
            className={`text-[13px] font-semibold transition-colors ${dark ? "text-gray-500 hover:text-red-400" : "text-gray-500 hover:text-red-600"}`}
          >
            Log out
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
