import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import BuyCreditsModal from "./BuyCreditsModal";
import api from "../services/api";
import BrandLogo from "./BrandLogo";
import ConfirmDialog from "./ConfirmDialog";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={handleCreditsUpdate}
      />

      <nav className={`flex justify-between items-center px-6 h-16 border-b ${dark ? "bg-[#0d1520] border-[#1a2e48]" : "bg-white border-gray-200"}`}>
        <BrandLogo className="h-9 w-auto" />

        {/* Search */}
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
              className={`w-56 h-9 pl-9 pr-3 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${dark ? "bg-white/[0.06] border border-white/[0.08] text-gray-200 focus:ring-blue-500/20 focus:border-blue-500/40" : "bg-gray-50 border border-gray-200 text-gray-800 focus:ring-[#1e3a5f]/15 focus:border-[#1e3a5f]/40 focus:bg-white"}`}
            />
          </div>
          {showDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl border shadow-xl py-1.5 z-50 min-w-[220px] ${dark ? "bg-[#0d1520] border-[#1a2e48]" : "bg-white border-gray-200 shadow-gray-200/50"}`}>
              <p className={`px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${dark ? "text-gray-600" : "text-gray-400"}`}>Search for</p>
              {searchOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSearchNavigate(opt.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors ${dark ? "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200" : "text-gray-700 hover:bg-gray-50 hover:text-[#1e3a5f]"}`}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                  </svg>
                  {opt.label}
                  {searchQuery && <span className="ml-auto text-[11px] text-gray-400 truncate max-w-20">"{searchQuery}"</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`text-[13px] font-medium transition-colors ${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-900"}`}>Dashboard</Link>
          <Link to={`/profile/${user?._id}`} className={`text-[13px] font-medium transition-colors ${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-900"}`}>Profile</Link>
          <Link to="/upload" className={`text-[13px] font-medium transition-colors ${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-900"}`}>Upload</Link>

          {/* Credits button + dropdown */}
          {user?.role !== "investor" && (
            <div className="relative" ref={creditsPanelRef}>
              <button
                onClick={() => { setShowCreditsPanel((v) => !v); if (!creditsData) fetchCreditsData(); }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${dark ? "bg-white/[0.05] border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/10" : "bg-white border-gray-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm hover:shadow-md"}`}
              >
                <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? "text-blue-400 group-hover:text-blue-300" : "text-sky-500 group-hover:text-sky-600"}`} />
                <span className={`font-bold text-[13px] tabular-nums tracking-tight ${dark ? "text-gray-200" : "text-gray-900"}`}>
                  {creditsData?.balance ?? 0}
                </span>
                <span className={`text-[11px] font-medium ${dark ? "text-gray-500" : "text-gray-400"}`}>CR</span>
              </button>

              {/* Credits Dropdown Panel */}
              {showCreditsPanel && (
                <div
                  className={`absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${dark ? "bg-[#0d1520] border-[#1a2e48] shadow-black/50" : "bg-white border-gray-200 shadow-gray-200/60"}`}
                >
                  {/* Panel header */}
                  <div className={`flex items-center justify-between px-4 py-3.5 border-b ${dark ? "border-[#1a2e48] bg-white/[0.02]" : "border-gray-100 bg-gray-50/60"}`}>
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${dark ? "text-blue-400" : "text-blue-600"}`} />
                      <span className={`text-[13px] font-bold ${dark ? "text-gray-100" : "text-gray-900"}`}>Credits</span>
                    </div>
                    <button
                      onClick={() => setShowCreditsPanel(false)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${dark ? "text-gray-600 hover:text-gray-400 hover:bg-white/[0.06]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {creditsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className={`w-5 h-5 animate-spin ${dark ? "text-gray-600" : "text-gray-400"}`} />
                    </div>
                  ) : (
                    <>
                      {/* Balance section */}
                      <div className={`px-4 py-4 ${dark ? "" : ""}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? "text-gray-600" : "text-gray-400"}`}>Available Balance</p>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className={`text-3xl font-black tabular-nums ${dark ? "text-white" : "text-gray-900"}`}>
                            {(creditsData?.balance || 0).toLocaleString("en-IN")}
                          </span>
                          <span className={`text-sm font-medium ${dark ? "text-gray-500" : "text-gray-400"}`}>credits</span>
                        </div>

                        {/* Mini stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`rounded-xl px-3 py-2 ${dark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <TrendingUp className={`w-3 h-3 ${dark ? "text-emerald-400" : "text-emerald-600"}`} />
                              <span className={`text-[9px] font-bold uppercase tracking-wide ${dark ? "text-gray-500" : "text-gray-400"}`}>Total Bought</span>
                            </div>
                            <span className={`text-[15px] font-black tabular-nums ${dark ? "text-gray-200" : "text-gray-800"}`}>
                              {(creditsData?.totalPurchased || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className={`rounded-xl px-3 py-2 ${dark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <TrendingDown className={`w-3 h-3 ${dark ? "text-orange-400" : "text-orange-500"}`} />
                              <span className={`text-[9px] font-bold uppercase tracking-wide ${dark ? "text-gray-500" : "text-gray-400"}`}>Total Used</span>
                            </div>
                            <span className={`text-[15px] font-black tabular-nums ${dark ? "text-gray-200" : "text-gray-800"}`}>
                              {(creditsData?.totalSpent || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recent transactions */}
                      {recentTx.length > 0 && (
                        <div className={`border-t ${dark ? "border-[#1a2e48]" : "border-gray-100"}`}>
                          <p className={`px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest ${dark ? "text-gray-600" : "text-gray-400"}`}>Recent</p>
                          {recentTx.map((tx, i) => {
                            const TxIcon = txIcon(tx.type);
                            const isCredit = tx.amount >= 0;
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-3 px-4 py-2.5 ${dark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/60"} transition-colors`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${txColor(tx.type)}`}>
                                  <TxIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[12px] font-semibold truncate ${dark ? "text-gray-300" : "text-gray-700"}`}>{tx.description}</p>
                                  <p className={`text-[10px] ${dark ? "text-gray-600" : "text-gray-400"}`}>{formatDate(tx.createdAt)}</p>
                                </div>
                                <span className={`text-[13px] font-black tabular-nums shrink-0 ${isCredit ? dark ? "text-emerald-400" : "text-emerald-600" : dark ? "text-orange-400" : "text-orange-500"}`}>
                                  {isCredit ? "+" : ""}{tx.amount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Buy Credits button */}
                      <div className={`p-3 border-t ${dark ? "border-[#1a2e48] bg-white/[0.02]" : "border-gray-100 bg-gray-50/50"}`}>
                        <button
                          onClick={() => { setShowCreditsPanel(false); setShowBuyCredits(true); }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Buy Credits
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`text-[13px] font-semibold transition-colors ${dark ? "text-gray-500 hover:text-red-400" : "text-gray-500 hover:text-red-600"}`}
          >
            Log out
          </button>
        </div>
      </nav>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log out"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        isDarkMode={dark}
      />
    </>
  );
};

export default Navbar;
