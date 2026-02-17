import { useEffect, useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import api from "../services/api";
import ProjectCard from "../components/ProjectCard";
import { AuthContext } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [myScripts, setMyScripts] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [reviewTab, setReviewTab] = useState("ai");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scriptsRes, statsRes, reviewsRes] = await Promise.allSettled([
        api.get("/scripts"),
        api.get("/dashboard"),
        api.get("/dashboard/reviews"),
      ]);

      if (scriptsRes.status === "fulfilled") {
        const mine = scriptsRes.value.data.filter(
          (s) => s.creator?._id === user?._id || s.creator === user?._id
        );
        setMyScripts(mine);
      } else {
        setMyScripts([]);
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data);
      } else {
        // Demo stats
        setStats({
          totalScripts: 3, totalEarnings: 450, totalUnlocks: 12, holdEarnings: 360,
          totalViews: 1247, trailersGenerated: 2, scoredScripts: 3, avgScore: 84,
          auditionCount: 15, activeHolds: 1, scriptScoreCredits: 5, plan: "free",
        });
      }

      if (reviewsRes.status === "fulfilled") {
        setReviews(reviewsRes.value.data);
      } else {
        setReviews(null);
      }
    } catch { } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: "Total Views", value: stats.totalViews || 0 },
    { label: "Earnings", value: `$${(stats.totalEarnings || 0) + (stats.holdEarnings || 0)}` },
    { label: "Hold Earnings", value: `$${stats.holdEarnings || 0}` },
    { label: "Unlocks", value: stats.totalUnlocks || 0 },
    { label: "AI Trailers", value: stats.trailersGenerated || 0 },
    { label: "Avg Score", value: stats.avgScore || "N/A" },
    { label: "Auditions", value: stats.auditionCount || 0 },
    { label: "Active Holds", value: stats.activeHolds || 0 },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Page heading */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#1e3a5f] tracking-tight">
            My Dashboard
          </h1>
          {stats?.plan && (
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              stats.plan === "pro" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"
            }`}>
              {stats.plan === "pro" ? "Pro" : "Free Plan"}
            </span>
          )}
        </div>

        {/* Stats grid */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {statCards.map((card, idx) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 font-semibold">{card.label}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{card.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/upload"
            className="px-5 py-2.5 bg-[#1e3a5f] text-white rounded-lg text-base font-semibold hover:bg-[#162d4a] transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Project
          </Link>
        </div>

        {/* Content Views Chart */}
        {myScripts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Content Views</h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">How many people viewed your scripts</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e3a5f]/5 rounded-lg">
                <svg className="w-5 h-5 text-[#1e3a5f]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-base font-bold text-[#1e3a5f]">
                  {myScripts.reduce((sum, s) => sum + (s.views || 0), 0).toLocaleString()} total
                </span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={myScripts.map(s => ({
                    name: s.title?.length > 18 ? s.title.slice(0, 18) + "..." : s.title,
                    views: s.views || 0,
                  })).sort((a, b) => b.views - a.views).slice(0, 8)}
                  margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                  barSize={36}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13, fontWeight: 600, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fontWeight: 500, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value) => [value.toLocaleString() + " views", "Views"]}
                    cursor={{ fill: "rgba(30,58,95,0.04)" }}
                  />
                  <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                    {myScripts.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#1e3a5f" : i === 1 ? "#2d5a8e" : "#4a7ab5"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Section heading */}
        <h2 className="text-xl font-bold text-gray-900 mb-5">Reviews & Insights</h2>

        {/* Reviews tabs */}
        {reviews && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8">
            <div className="flex border-b border-gray-100">
              {[
                { key: "ai", label: "AI Analysis", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5", color: "#6366f1" },
                { key: "reader", label: "Reader Engagement", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", color: "#0ea5e9" },
                { key: "platform", label: "Platform Insights", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6", color: "#10b981" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setReviewTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold transition-all border-b-2 ${
                    reviewTab === tab.key
                      ? "border-[#1e3a5f] text-[#1e3a5f]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {/* AI Analysis Tab */}
              {reviewTab === "ai" && (
                <div className="space-y-4">
                  {reviews.ai?.length > 0 ? reviews.ai.map((r) => (
                    <div key={r.scriptId} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{r.scriptTitle}</h3>
                          <p className="text-sm text-gray-500 font-medium mt-0.5">AI-powered analysis</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-extrabold ${
                            r.rating >= 80 ? "text-green-600" : r.rating >= 60 ? "text-amber-600" : "text-red-500"
                          }`}>{r.rating}</span>
                          <span className="text-sm text-gray-400 font-semibold">/100</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {Object.entries(r.scores || {}).map(([key, val]) => (
                          <div key={key} className="text-center">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                              <div className="h-full rounded-full" style={{
                                width: `${val}%`,
                                backgroundColor: val >= 80 ? "#10b981" : val >= 60 ? "#f59e0b" : "#ef4444"
                              }}></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 capitalize">{key}</span>
                            <span className="text-xs font-bold text-gray-700 block">{val}</span>
                          </div>
                        ))}
                      </div>
                      {r.feedback && (
                        <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                          <p className="text-sm font-semibold text-indigo-700 mb-1">AI Feedback</p>
                          <p className="text-sm text-indigo-600 leading-relaxed">{r.feedback}</p>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" />
                      </svg>
                      <p className="text-base font-bold text-gray-500">No AI analyses yet</p>
                      <p className="text-sm text-gray-400 mt-1">Score a script to get detailed AI insights</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reader Engagement Tab */}
              {reviewTab === "reader" && (
                <div className="space-y-3">
                  {reviews.readers?.length > 0 ? reviews.readers.map((r) => (
                    <div key={r.scriptId} className="p-4 bg-gray-50 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">{r.scriptTitle}</h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{r.insight}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-xl font-extrabold text-gray-900">{r.views.toLocaleString()}</p>
                          <p className="text-xs font-semibold text-gray-400">Views</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <p className="text-xl font-extrabold text-gray-900">{r.unlocks}</p>
                          <p className="text-xs font-semibold text-gray-400">Unlocks</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <p className={`text-xl font-extrabold ${
                            r.conversionRate > 10 ? "text-green-600" : r.conversionRate > 0 ? "text-amber-600" : "text-gray-400"
                          }`}>{r.conversionRate}%</p>
                          <p className="text-xs font-semibold text-gray-400">CVR</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                      </svg>
                      <p className="text-base font-bold text-gray-500">No reader data yet</p>
                      <p className="text-sm text-gray-400 mt-1">Upload scripts to start tracking reader engagement</p>
                    </div>
                  )}
                </div>
              )}

              {/* Platform Insights Tab */}
              {reviewTab === "platform" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.platform?.length > 0 ? reviews.platform.map((p, idx) => {
                    const iconMap = {
                      quality: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
                      reach: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z",
                      deals: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
                      marketing: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.875 1.875 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m1.5-3.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m0 0c.621 0 1.125-.504 1.125-1.125",
                      genre: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
                    };
                    const colorMap = {
                      quality: "text-indigo-600 bg-indigo-50",
                      reach: "text-sky-600 bg-sky-50",
                      deals: "text-amber-600 bg-amber-50",
                      marketing: "text-purple-600 bg-purple-50",
                      genre: "text-emerald-600 bg-emerald-50",
                    };
                    return (
                      <motion.div key={p.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="p-4 bg-gray-50 rounded-xl flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[p.type] || "text-gray-600 bg-gray-100"}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[p.type] || iconMap.quality} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-gray-900">{p.title}</h3>
                            <span className="text-sm font-bold text-[#1e3a5f] bg-[#1e3a5f]/5 px-2.5 py-0.5 rounded-full">{p.label}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{p.detail}</p>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="col-span-2 text-center py-12">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                      </svg>
                      <p className="text-base font-bold text-gray-500">No platform insights yet</p>
                      <p className="text-sm text-gray-400 mt-1">Upload and score scripts to unlock insights</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section heading */}
        <h2 className="text-xl font-bold text-gray-900 mb-5">My Projects</h2>

        {/* Projects grid */}
        {myScripts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myScripts.map((script) => (
              <ProjectCard
                key={script._id}
                project={script}
                userName={
                  script.creator?.name?.toUpperCase() ||
                  user?.name?.toUpperCase() ||
                  "UNKNOWN"
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No projects yet</h2>
            <p className="text-gray-500 text-base mb-6">Upload your first script to get started</p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#162d4a] transition-all shadow-sm text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              ADD PROJECT
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
