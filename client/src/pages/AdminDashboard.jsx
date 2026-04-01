import { useState, useEffect, useRef } from "react";
import { useDarkMode } from "../context/DarkModeContext";
import axios from "axios";
import { jsPDF } from "jspdf";
import BrandLogo from "../components/BrandLogo";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatCurrency } from "../utils/currency";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(/\/api\/?$/, "").replace(/\/$/, "");
const API_BASE_URL = `${API_ORIGIN}/api`;

// Admin-specific API — uses admin token from sessionStorage, separate from user session
const adminApi = axios.create({ baseURL: API_BASE_URL });
adminApi.interceptors.request.use((config) => {
    const adminSession = sessionStorage.getItem("admin-session");
    if (adminSession) {
        try {
            const { token } = JSON.parse(adminSession);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch { }
    }
    return config;
});

const TABS = [
    { key: "overview", label: "Overview", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
    { key: "investors", label: "Investors", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "writers", label: "Writers", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
    { key: "readers", label: "Readers", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
    { key: "projects", label: "Projects", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
    { key: "ai-usage", label: "AI Usage", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
    { key: "evaluations", label: "Evaluations", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
    { key: "investor-purchases", label: "Purchases", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" },
    { key: "invoices", label: "Invoices", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H6.75A2.25 2.25 0 004.5 4.5v15A2.25 2.25 0 006.75 21.75h10.5A2.25 2.25 0 0019.5 19.5v-1.125M15 12h-6m6 3h-6m3-6h.008v.008H12V9z" },
    { key: "payments", label: "Payments", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
    { key: "scores", label: "Scores", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" },
    { key: "approvals", label: "Approvals", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "trailers", label: "AI Trailers", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375V5.625A1.125 1.125 0 016 4.5h12a1.125 1.125 0 011.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125h1.5" },
    { key: "messages", label: "Messages", icon: "M7.5 8.25h9m-9 3h6m-9 9h12A2.25 2.25 0 0018.75 18V6A2.25 2.25 0 0016.5 3.75h-9A2.25 2.25 0 005.25 6v12A2.25 2.25 0 007.5 20.25z" },
    { key: "pending-investors", label: "Investor Requests", icon: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" },
    { key: "bank-reviews", label: "Bank Reviews", icon: "M3.75 4.5h16.5A1.5 1.5 0 0121.75 6v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zM6 9h12M6 13.5h5.25" },
    { key: "queries", label: "Queries", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
    { key: "discount-codes", label: "Discount Codes", icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" },
];

const Icon = ({ d, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const DownloadIconButton = ({ onClick, title, disabled, className = "" }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4.5 15.75v1.5A2.25 2.25 0 006.75 19.5h10.5a2.25 2.25 0 002.25-2.25v-1.5" />
        </svg>
    </button>
);

// ─── Stat Card ───
const StatCard = ({ label, value, icon, color, isDark }) => (
    <div className={`rounded-2xl p-5 border transition-all hover:scale-[1.02] ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon d={icon} className="w-5 h-5" />
            </div>
        </div>
        <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
        <p className={`text-sm font-medium mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{label}</p>
    </div>
);

// ─── User Table ───
const UserTable = ({ users, isDark, onLoginAs, onViewUser }) => (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>User</th>
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Email</th>
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Role</th>
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Joined</th>
                        {(onLoginAs || onViewUser) && <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Actions</th>}
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                    {users.map((u) => (
                        <tr key={u._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                            <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                    {u.profileImage ? (
                                        <img src={u.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-[#1e3a5f]/10 text-[#1e3a5f]"}`}>
                                            {u.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <span className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{u.name}</span>
                                </div>
                            </td>
                            <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{u.email}</td>
                            <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === "investor" ? "bg-emerald-100 text-emerald-700" :
                                    u.role === "writer" || u.role === "creator" ? "bg-blue-100 text-blue-700" :
                                        "bg-purple-100 text-purple-700"
                                    }`}>{u.role}</span>
                            </td>
                            <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(u.createdAt).toLocaleDateString()}</td>
                            {(onLoginAs || onViewUser) && (
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        {onViewUser && (
                                            <button onClick={() => onViewUser(u)} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10">View Details</button>
                                        )}
                                        {onLoginAs && (
                                            <button onClick={() => onLoginAs(u._id)} className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10">Login As</button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan={(onLoginAs || onViewUser) ? 5 : 4} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No users found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// ─── Script Table ───
const ScriptTable = ({ scripts, isDark, actions, showScore, showCreator = true }) => (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Title</th>
                        {showCreator && <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Creator</th>}
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Genre</th>
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Status</th>
                        {showScore && <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Score</th>}
                        <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Date</th>
                        {actions && <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>Actions</th>}
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                    {scripts.map((s) => (
                        <tr key={s._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                            <td className="px-5 py-3.5">
                                <p className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{s.title}</p>
                                <p className={`text-[11px] mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                    SID: {s.sid || "Pending"}
                                </p>
                            </td>
                            {showCreator && (
                                <td className="px-5 py-3.5">
                                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{s.creator?.name || "—"}</span>
                                </td>
                            )}
                            <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{s.genre || s.primaryGenre || "—"}</td>
                            <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.status === "published" ? "bg-emerald-100 text-emerald-700" :
                                    s.status === "pending_approval" ? "bg-amber-100 text-amber-700" :
                                        s.status === "rejected" ? "bg-red-100 text-red-700" :
                                            "bg-gray-100 text-gray-600"
                                    }`}>{s.status?.replace("_", " ") || "draft"}</span>
                            </td>
                            {showScore && (
                                <td className={`px-5 py-3.5 text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                    {s.scriptScore?.overall || s.platformScore?.overall || s.rating || "—"}
                                </td>
                            )}
                            <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(s.createdAt).toLocaleDateString()}</td>
                            {actions && <td className="px-5 py-3.5">{actions(s)}</td>}
                        </tr>
                    ))}
                    {scripts.length === 0 && (
                        <tr><td colSpan={7} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No scripts found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// ─── Transaction Table ───
const TransactionTable = ({ transactions, isDark }) => (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                        {["User", "Type", "Amount", "Status", "Description", "Transaction / Pay ID", "Date"].map((h) => (
                            <th key={h} className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                    {transactions.map((t) => (
                        <tr key={t._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                            <td className={`px-5 py-3.5 text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{t.user?.name || "—"}</td>
                            <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${t.type === "credit" || t.type === "payment" ? "bg-emerald-100 text-emerald-700" : t.type === "debit" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{t.type}</span></td>
                            <td className={`px-5 py-3.5 text-sm font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{formatCurrency(t.amount || 0, t.currency || "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${t.status === "completed" ? "bg-emerald-100 text-emerald-700" : t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{t.status}</span></td>
                            <td className={`px-5 py-3.5 text-sm max-w-[200px] truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t.description}</td>
                            <td className="px-5 py-3.5">
                                <div className={`text-xs leading-5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    <p className="break-all"><span className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Txn:</span> {getTransactionIdLabel(t) || "-"}</p>
                                    <p className="break-all"><span className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Pay:</span> {getPaymentIdLabel(t) || "-"}</p>
                                </div>
                            </td>
                            <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr><td colSpan={7} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No transactions found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// ─── Score Modal ───
const ScoreModal = ({ script, isDark, onClose, onSave }) => {
    const [scores, setScores] = useState({ content: 0, trailer: 0, title: 0, synopsis: 0, tags: 0, feedback: "", strengths: "", weaknesses: "", prospects: "" });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(script._id, scores);
        setSaving(false);
        onClose();
    };

    const dims = [
        { key: "content", label: "Main Content", color: "from-blue-500 to-cyan-500" },
        { key: "trailer", label: "Trailer", color: "from-purple-500 to-pink-500" },
        { key: "title", label: "Title", color: "from-amber-500 to-orange-500" },
        { key: "synopsis", label: "Synopsis", color: "from-emerald-500 to-teal-500" },
        { key: "tags", label: "Tags & Meta", color: "from-rose-500 to-red-500" },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className={`w-full max-w-lg mx-4 rounded-2xl p-6 max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#0f1d35] border border-[#1a3050]" : "bg-white shadow-2xl"}`} onClick={(e) => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Score: {script?.title}</h3>
                <p className={`text-sm mb-5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Rate each dimension from 0 to 100</p>
                <div className="space-y-4">
                    {dims.map((d) => (
                        <div key={d.key}>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{d.label}</label>
                                <span className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>{scores[d.key]}</span>
                            </div>
                            <input type="range" min="0" max="100" value={scores[d.key]}
                                onChange={(e) => setScores((p) => ({ ...p, [d.key]: Number(e.target.value) }))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                                style={{ background: `linear-gradient(to right, #3b82f6 ${scores[d.key]}%, ${isDark ? "#1a3050" : "#e5e7eb"} ${scores[d.key]}%)` }}
                            />
                        </div>
                    ))}
                    <div>
                        <label className={`text-sm font-semibold block mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Feedback</label>
                        <textarea rows={3} value={scores.feedback} onChange={(e) => setScores((p) => ({ ...p, feedback: e.target.value }))}
                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`}
                            placeholder="Write your feedback..."
                        />
                    </div>
                    {[{ key: "strengths", label: "Strengths", placeholder: "What are the script's strongest elements?" }, { key: "weaknesses", label: "Weaknesses", placeholder: "What areas need improvement?" }, { key: "prospects", label: "Prospects", placeholder: "Commercial potential, market fit, next steps..." }].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className={`text-sm font-semibold block mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>{label}</label>
                            <textarea rows={4} value={scores[key]} onChange={(e) => setScores((p) => ({ ...p, [key]: e.target.value }))}
                                className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`}
                                placeholder={placeholder}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-end gap-3 mt-5">
                    <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:bg-[#1a3050]" : "text-gray-500 hover:bg-gray-100"}`}>Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50">
                        {saving ? "Saving..." : "Save Score"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Search Bar ───
const SearchBar = ({ value, onChange, placeholder, isDark }) => (
    <div className={`flex items-center rounded-xl overflow-hidden border ${isDark ? "bg-[#0b1426] border-[#1a3050]" : "bg-gray-50 border-gray-200"}`}>
        <div className="pl-3.5">
            <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        </div>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Search..."} className={`flex-1 px-3 py-2.5 text-sm font-medium outline-none bg-transparent ${isDark ? "text-gray-200 placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`} />
        {value && (
            <button
                type="button"
                onClick={() => onChange("")}
                className={`mr-2 h-7 w-7 rounded-md flex items-center justify-center transition-colors ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/70"}`}
                aria-label="Clear search"
                title="Clear search"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
    </div>
);

// ─── Pagination ───
const Pagination = ({ page, totalPages, onPageChange, isDark }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 ${isDark ? "text-gray-400 hover:bg-[#1a3050]" : "text-gray-500 hover:bg-gray-100"}`}>Prev</button>
            <span className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{page} / {totalPages}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 ${isDark ? "text-gray-400 hover:bg-[#1a3050]" : "text-gray-500 hover:bg-gray-100"}`}>Next</button>
        </div>
    );
};

// ═══════════════════════════════════════════════
// Main Admin Dashboard
// ═══════════════════════════════════════════════
const BADGE_WATCH_KEYS = ["approvals", "trailers", "pending-investors", "bank-reviews", "queries"];

const formatBadgeCount = (count) => {
    if (!count || count <= 0) return "";
    if (count > 99) return "+99";
    return `+${count}`;
};

const SEARCH_PLACEHOLDER_BY_TAB = {
    overview: "Search everything in admin...",
    investors: "Search investors...",
    writers: "Search writers...",
    readers: "Search readers...",
    projects: "Search projects...",
    "ai-usage": "Search AI usage...",
    evaluations: "Search evaluations...",
    "investor-purchases": "Search purchases...",
    invoices: "Search invoices...",
    payments: "Search payments...",
    scores: "Search scores...",
    "discount-codes": "Search discount codes...",
    approvals: "Search approvals...",
    trailers: "Search AI trailers...",
    messages: "Search writer messages...",
    "pending-investors": "Search investor requests...",
    "bank-reviews": "Search bank review requests...",
    queries: "Search queries...",
};

const EMPTY_GLOBAL_RESULTS = {
    users: [],
    scripts: [],
    transactions: [],
    invoices: [],
    pendingInvestors: [],
    bankReviews: [],
    contacts: [],
};

const formatExportDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const buildChatId = (id1, id2) => {
    const [a, b] = [String(id1), String(id2)].sort();
    return `${a}_${b}`;
};

const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_ORIGIN}${url}`;
};

const formatFileSize = (bytes = 0) => {
    const size = Number(bytes || 0);
    if (!size) return "0 B";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getTransactionMetadataValue = (transaction, key) => {
    const metadata = transaction?.metadata;
    if (!metadata) return "";
    if (typeof metadata.get === "function") {
        return metadata.get(key) || "";
    }
    return metadata[key] || "";
};

const getTransactionIdLabel = (transaction) => {
    const reference = String(transaction?.reference || "").trim();
    if (reference) return reference;
    return String(transaction?._id || "").trim();
};

const getPaymentIdLabel = (transaction) => {
    const keys = [
        "razorpay_payment_id",
        "paymentGatewayPaymentId",
        "gatewayPaymentId",
        "stripePaymentId",
        "stripeChargeId",
    ];

    for (const key of keys) {
        const value = String(getTransactionMetadataValue(transaction, key) || transaction?.[key] || "").trim();
        if (value) return value;
    }

    return "";
};

const getMessagePreview = (msg) =>
    msg?.text ||
    (msg?.fileType === "video"
        ? "Trailer Video"
        : msg?.fileType === "image"
            ? "Image"
            : msg?.fileUrl
                ? "File"
                : "Sent a message");

const writePdfSections = ({ fileName, title, sections }) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 40;
    const maxWidth = 515;
    let y = 44;

    const addWrappedText = (text, opts = {}) => {
        const lines = doc.splitTextToSize(String(text), opts.maxWidth || maxWidth);
        if (y + lines.length * 13 > 790) {
            doc.addPage();
            y = 44;
        }
        doc.text(lines, marginX, y);
        y += lines.length * 13 + (opts.gap || 0);
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    addWrappedText(title, { gap: 6 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    addWrappedText(`Generated: ${new Date().toLocaleString()}`, { gap: 10 });

    sections.forEach((section) => {
        if (!section?.title) return;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        addWrappedText(section.title, { gap: 4 });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = Array.isArray(section.lines) && section.lines.length > 0 ? section.lines : ["No records"];
        lines.forEach((line) => addWrappedText(line));
        y += 8;
    });

    doc.save(fileName);
};

const DiscountCodeFormModal = ({ initial, onClose, onSave, isDark }) => {
    const isEdit = Boolean(initial && initial._id);
    const [formData, setFormData] = useState({
        code: initial?.code || "",
        discountType: initial?.discountType || "percentage",
        discountValue: initial?.discountValue || "",
        maxUses: initial?.maxUses || 0,
        maxUsesPerUser: initial?.maxUsesPerUser || 1,
        minPurchaseAmount: initial?.minPurchaseAmount || 0,
        maxDiscountAmount: initial?.maxDiscountAmount || 0,
        validUntil: initial?.validUntil ? new Date(initial.validUntil).toISOString().split('T')[0] : "",
        description: initial?.description || "",
        isActive: initial?.isActive !== undefined ? initial.isActive : true,
        ...(isEdit ? { _id: initial._id } : {}),
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
            <div className={`w-full max-w-xl mx-auto rounded-2xl p-6 ${isDark ? "bg-[#0f1d35] border border-[#1a3050]" : "bg-white shadow-2xl"}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{isEdit ? "Edit Discount Code" : "Create Discount Code"}</h3>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? "text-gray-400 hover:bg-[#1a3050] hover:text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Code (e.g. WELCOME50)</label>
                            <input required type="text" name="code" value={formData.code} onChange={handleChange} className={`w-full uppercase rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} placeholder="DISCOUNT20" />
                        </div>
                        
                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Type</label>
                            <select name="discountType" value={formData.discountType} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Value</label>
                            <input required type="number" min="1" step="any" name="discountValue" value={formData.discountValue} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} placeholder={formData.discountType === "percentage" ? "1-100" : "Amount in ₹"} />
                        </div>

                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Max Uses Globally (0 = unlimited)</label>
                            <input type="number" min="0" name="maxUses" value={formData.maxUses} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} />
                        </div>

                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Max Uses Per User (0 = unlimited)</label>
                            <input type="number" min="0" name="maxUsesPerUser" value={formData.maxUsesPerUser} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} />
                        </div>

                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Min Purchase (₹) (0 = none)</label>
                            <input type="number" min="0" name="minPurchaseAmount" value={formData.minPurchaseAmount} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} />
                        </div>

                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Max Discount (₹) (0 = none)</label>
                            <input type="number" min="0" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} disabled={formData.discountType === 'flat'} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border disabled:opacity-50 ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} />
                        </div>

                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Valid Until</label>
                            <input required type="date" name="validUntil" value={formData.validUntil} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} />
                        </div>

                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Description (Optional)</label>
                            <input type="text" name="description" value={formData.description} onChange={handleChange} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-blue-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400"}`} placeholder="e.g. Winter Sale 2024" />
                        </div>

                        {isEdit && (
                            <div className="col-span-2 flex items-center mt-2">
                                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="isActive" className={`ml-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>Active</label>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#1a3050]">
                        <button type="button" onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:bg-[#1a3050]" : "text-gray-500 hover:bg-gray-100"}`}>Cancel</button>
                        <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20">{isEdit ? "Update Code" : "Create Code"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { isDarkMode: isDark } = useDarkMode();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);

    // ─── Code Gate — always prompt on every visit ───
    const [authorized, setAuthorized] = useState(false);
    const [codeInput, setCodeInput] = useState("");
    const [codeError, setCodeError] = useState("");
    const [codeLoading, setCodeLoading] = useState(false);

    // ─── Data state ───
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [scripts, setScripts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [scoreModal, setScoreModal] = useState(null);
    const [scoreSubTab, setScoreSubTab] = useState("ai");
    const [total, setTotal] = useState(0);
    const [pendingInvestors, setPendingInvestors] = useState([]);
    const [bankReviews, setBankReviews] = useState([]);
    const [rejectModal, setRejectModal] = useState(null); // investor object
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [discountCodes, setDiscountCodes] = useState([]);
    const [discountCodeModal, setDiscountCodeModal] = useState(null); // null = closed, {} = create, {_id:...} = edit
    const [alertSummary, setAlertSummary] = useState({});
    const previousAlertSummaryRef = useRef(null);
    const [exportingCurrent, setExportingCurrent] = useState(false);
    const [exportingAll, setExportingAll] = useState(false);
    const [globalResults, setGlobalResults] = useState(EMPTY_GLOBAL_RESULTS);
    const [adminConversations, setAdminConversations] = useState([]);
    const [messageUsers, setMessageUsers] = useState([]);
    const [activeMessageUser, setActiveMessageUser] = useState(null);
    const [activeMessageChatId, setActiveMessageChatId] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messageAttachment, setMessageAttachment] = useState(null);
    const [uploadingMessageAttachment, setUploadingMessageAttachment] = useState(false);
    const [showAdminScrollToBottomButton, setShowAdminScrollToBottomButton] = useState(false);
    const messageFileInputRef = useRef(null);
    const messageListContainerRef = useRef(null);
    const messageListEndRef = useRef(null);
    const shouldAutoScrollAdminMessagesRef = useRef(false);
    const previousAdminChatIdRef = useRef("");
    const scrollAdminMessagesToBottom = (behavior = "smooth") => {
        messageListEndRef.current?.scrollIntoView({ behavior, block: "end" });
        setShowAdminScrollToBottomButton(false);
    };
    const handleAdminMessageScroll = () => {
        const container = messageListContainerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowAdminScrollToBottomButton(distanceFromBottom > 96);
    };
    const trailerFileInputRef = useRef(null);
    const [trailerUploadTargetScript, setTrailerUploadTargetScript] = useState(null);
    const [uploadingTrailerScriptId, setUploadingTrailerScriptId] = useState("");

    // ─── Toast notification system ───
    const [toast, setToast] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAlertSummary = async ({ silent = false } = {}) => {
        if (!authorized) return;
        try {
            const { data } = await adminApi.get("/admin/alerts/summary");
            const summary = data || {};
            setAlertSummary(summary);

            const previous = previousAlertSummaryRef.current;
            if (!silent && previous) {
                const increasedSections = BADGE_WATCH_KEYS.filter((key) => (summary[key] || 0) > (previous[key] || 0));
                if (increasedSections.length > 0) {
                    const sectionLabelMap = {
                        approvals: "Project approvals",
                        trailers: "AI trailer requests",
                        "pending-investors": "Investor requests",
                        "bank-reviews": "Bank detail reviews",
                        queries: "Queries",
                    };
                    const text = increasedSections.map((key) => sectionLabelMap[key] || key).join(" • ");
                    showToast(`New admin requests: ${text}`, "info");
                }
            }
            previousAlertSummaryRef.current = summary;
        } catch (err) {
            console.error("Admin alert summary fetch error:", err);
        }
    };

    const getBadgeCountForTab = (tabKey) => {
        if (!BADGE_WATCH_KEYS.includes(tabKey)) return 0;
        const count = Number(alertSummary?.[tabKey] || 0);
        return Number.isFinite(count) ? count : 0;
    };

    const searchTerm = search.trim().toLowerCase();
    const hasSearch = searchTerm.length > 0;
    const isGlobalSearchMode = activeTab === "overview" && hasSearch;
    const matchesSearch = (...values) => !hasSearch || values.some((value) => String(value ?? "").toLowerCase().includes(searchTerm));

    const sourceUsers = isGlobalSearchMode ? globalResults.users : users;
    const sourceScripts = isGlobalSearchMode ? globalResults.scripts : scripts;
    const sourceTransactions = isGlobalSearchMode ? globalResults.transactions : transactions;
    const sourceInvoices = isGlobalSearchMode ? globalResults.invoices : invoices;
    const sourcePendingInvestors = isGlobalSearchMode ? globalResults.pendingInvestors : pendingInvestors;
    const sourceBankReviews = isGlobalSearchMode ? globalResults.bankReviews : bankReviews;
    const sourceContacts = isGlobalSearchMode ? globalResults.contacts : contacts;
    const sourceMessageUsers = messageUsers;

    const filteredUsers = sourceUsers.filter((u) => matchesSearch(u.name, u.email, u.role, u.sid));
    const filteredScripts = sourceScripts.filter((s) => matchesSearch(s.title, s.sid, s.genre, s.primaryGenre, s.status, s.creator?.name));
    const filteredTransactions = sourceTransactions.filter((t) =>
        matchesSearch(
            t.user?.name,
            t.type,
            t.status,
            t.description,
            t.amount,
            t.currency,
            t.createdAt,
            t.reference,
            getTransactionIdLabel(t),
            getPaymentIdLabel(t)
        )
    );
    const filteredInvoices = sourceInvoices.filter((inv) => matchesSearch(inv.invoiceNumber, inv.creator?.name, inv.creatorSid, inv.creator?.sid, inv.script?.title, inv.scriptSid, inv.script?.sid, inv.accessType));
    const filteredPendingInvestors = sourcePendingInvestors.filter((inv) => matchesSearch(inv.name, inv.email, inv.createdAt));
    const filteredBankReviews = sourceBankReviews.filter((review) => matchesSearch(review.name, review.email, review.sid, review.requestedDetails?.bankName, review.status));
    const filteredContacts = sourceContacts.filter((c) => matchesSearch(c.name, c.email, c.reason, c.message, c.createdAt));
    const filteredMessageUsers = sourceMessageUsers.filter((u) => matchesSearch(u.name, u.email, u.sid));

    const buildCurrentSectionPayload = () => {
        switch (activeTab) {
            case "overview":
                return {
                    title: "Platform Overview",
                    lines: stats
                        ? [
                            `Total Users: ${stats.totalUsers || 0}`,
                            `Total Scripts: ${stats.totalScripts || 0}`,
                            `Writers: ${stats.totalWriters || 0}`,
                            `Investors: ${stats.totalInvestors || 0}`,
                            `Readers: ${stats.totalReaders || 0}`,
                            `Pending Approvals: ${stats.pendingApprovals || 0}`,
                            `Transactions: ${stats.totalTransactions || 0}`,
                            `Total Revenue: ${formatCurrency(stats.totalRevenue || 0, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        ]
                        : ["No records"],
                };
            case "investors":
            case "writers":
            case "readers":
                return {
                    title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${users.length})`,
                    lines: users.map((u, idx) => `${idx + 1}. ${u.name || "-"} | ${u.email || "-"} | Role: ${u.role || "-"} | SID: ${u.sid || "-"} | Joined: ${formatExportDate(u.createdAt)}`),
                };
            case "projects":
            case "ai-usage":
            case "evaluations":
            case "investor-purchases":
            case "scores":
            case "approvals":
            case "trailers":
                return {
                    title: `${TABS.find((tab) => tab.key === activeTab)?.label || "Scripts"} (${scripts.length})`,
                    lines: scripts.map((s, idx) => `${idx + 1}. ${s.title || "-"} | SID: ${s.sid || "-"} | Creator: ${s.creator?.name || "-"} | Genre: ${s.genre || s.primaryGenre || "-"} | Status: ${s.status || "-"} | Score: ${s.scriptScore?.overall || s.platformScore?.overall || s.rating || "-"} | Date: ${formatExportDate(s.createdAt)}`),
                };
            case "payments":
                return {
                    title: `Payments (${transactions.length})`,
                    lines: transactions.map((t, idx) => `${idx + 1}. ${t.user?.name || "-"} | ${t.type || "-"} | ${formatCurrency(t.amount || 0, t.currency || "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ${t.status || "-"} | ${t.description || "-"} | Txn: ${getTransactionIdLabel(t) || "-"} | Pay ID: ${getPaymentIdLabel(t) || "-"} | ${formatExportDate(t.createdAt)}`),
                };
            case "invoices":
                return {
                    title: `Invoices (${invoices.length})`,
                    lines: invoices.map((inv, idx) => `${idx + 1}. ${inv.invoiceNumber || "-"} | Creator: ${inv.creator?.name || "-"} (${inv.creatorSid || inv.creator?.sid || "-"}) | Project: ${inv.script?.title || "-"} (${inv.scriptSid || inv.script?.sid || "-"}) | Access: ${inv.accessType || "-"} | Credits: ${inv.totalCreditsRequired || 0} | Date: ${formatExportDate(inv.invoiceDate || inv.createdAt)}`),
                };
            case "pending-investors":
                return {
                    title: `Investor Requests (${pendingInvestors.length})`,
                    lines: pendingInvestors.map((inv, idx) => `${idx + 1}. ${inv.name || "-"} | ${inv.email || "-"} | Date: ${formatExportDate(inv.createdAt)} | Status: pending`),
                };
            case "bank-reviews":
                return {
                    title: `Bank Detail Reviews (${bankReviews.length})`,
                    lines: bankReviews.map((review, idx) => `${idx + 1}. ${review.name || "-"} | ${review.email || "-"} | Bank: ${review.requestedDetails?.bankName || "-"} | Status: ${review.status || "-"} | Attempts: ${review.bankSecurity?.invalidAttempts || 0} | Locked: ${review.bankSecurity?.isLocked ? "Yes" : "No"} | Submitted: ${formatExportDate(review.submittedAt)}`),
                };
            case "queries":
                return {
                    title: `Queries (${contacts.length})`,
                    lines: contacts.map((c, idx) => `${idx + 1}. ${c.name || "-"} | ${c.email || "-"} | Reason: ${c.reason || "-"} | Message: ${c.message || "-"} | Date: ${formatExportDate(c.createdAt)}`),
                };
            case "messages":
                return {
                    title: `Admin Messages (${messageUsers.length})`,
                    lines: messageUsers.map((u, idx) => `${idx + 1}. ${u.name || "-"} | ${u.email || "-"} | SID: ${u.sid || "-"}`),
                };
            default:
                return { title: "Section", lines: ["No records"] };
        }
    };

    const handleDownloadCurrentSectionPdf = async () => {
        try {
            setExportingCurrent(true);
            const section = buildCurrentSectionPayload();
            writePdfSections({
                fileName: `admin-${activeTab}-report-${Date.now()}.pdf`,
                title: `Admin ${section.title} Report`,
                sections: [section],
            });
            showToast("Section PDF downloaded");
        } catch (err) {
            console.error(err);
            showToast("Failed to download section PDF", "error");
        } finally {
            setExportingCurrent(false);
        }
    };

    const fetchList = async (url, key) => {
        const { data } = await adminApi.get(url);
        return key ? (data?.[key] || []) : data;
    };

    const fetchMessagesDirectory = async ({ silent = false } = {}) => {
        if (!authorized) return;
        if (!silent) setMessagesLoading(true);

        try {
            const [conversationsRes, writersRes, creatorsRes] = await Promise.all([
                adminApi.get("/messages/conversations"),
                adminApi.get("/admin/users?role=writer&page=1&limit=1000"),
                adminApi.get("/admin/users?role=creator&page=1&limit=1000"),
            ]);

            const writerConversations = (conversationsRes.data || []).filter((conv) => ["writer", "creator"].includes(conv?.user?.role));
            const writerMap = new Map();

            [...(writersRes.data?.users || []), ...(creatorsRes.data?.users || [])].forEach((user) => {
                if (user?._id) writerMap.set(String(user._id), user);
            });

            writerConversations.forEach((conv) => {
                if (conv?.user?._id && !writerMap.has(String(conv.user._id))) {
                    writerMap.set(String(conv.user._id), conv.user);
                }
            });

            const conversationByUserId = new Map(
                writerConversations
                    .filter((conv) => conv?.user?._id)
                    .map((conv) => [String(conv.user._id), conv])
            );

            const writersWithConversation = Array.from(writerMap.values())
                .map((user) => ({
                    ...user,
                    conversation: conversationByUserId.get(String(user._id)) || null,
                }))
                .sort((a, b) => {
                    const aTs = a.conversation?.timestamp ? new Date(a.conversation.timestamp).getTime() : 0;
                    const bTs = b.conversation?.timestamp ? new Date(b.conversation.timestamp).getTime() : 0;
                    if (aTs !== bTs) return bTs - aTs;
                    return String(a.name || "").localeCompare(String(b.name || ""));
                });

            setAdminConversations(writerConversations);
            setMessageUsers(writersWithConversation);
            setTotalPages(1);
            setTotal(writersWithConversation.length);

            if (activeMessageUser?._id) {
                const selectedUserId = String(activeMessageUser._id);
                const refreshedSelectedUser = writersWithConversation.find((user) => String(user._id) === selectedUserId);
                if (refreshedSelectedUser) {
                    setActiveMessageUser(refreshedSelectedUser);
                }

                const refreshedConversation = writerConversations.find((conv) => String(conv?.user?._id) === selectedUserId);
                const nextChatId = refreshedConversation?.chatId || "";
                if (nextChatId !== activeMessageChatId) {
                    setActiveMessageChatId(nextChatId);
                }
            }
        } catch (err) {
            console.error("Admin message directory fetch error:", err);
            if (!silent) {
                showToast("Failed to load messages", "error");
            }
        } finally {
            if (!silent) setMessagesLoading(false);
        }
    };

    const handleDownloadWholeDashboardPdf = async () => {
        try {
            setExportingAll(true);

            const [
                overview,
                investorsData,
                writersData,
                creatorsData,
                readersData,
                projectsData,
                aiUsageData,
                evaluationsData,
                purchasesData,
                invoicesData,
                paymentsData,
                aiScoresData,
                platformScoresData,
                readerScoresData,
                approvalsData,
                trailersData,
                pendingInvestorsData,
                bankReviewsData,
                queriesData,
            ] = await Promise.all([
                fetchList("/admin/stats"),
                fetchList("/admin/users?role=investor&page=1&limit=1000", "users"),
                fetchList("/admin/users?role=writer&page=1&limit=1000", "users"),
                fetchList("/admin/users?role=creator&page=1&limit=1000", "users"),
                fetchList("/admin/users?role=reader&page=1&limit=1000", "users"),
                fetchList("/admin/scripts?page=1&limit=1000", "scripts"),
                fetchList("/admin/scripts/ai-usage?page=1&limit=1000", "scripts"),
                fetchList("/admin/scripts/evaluation-purchases?page=1&limit=1000", "scripts"),
                fetchList("/admin/scripts/investor-purchases?page=1&limit=1000", "scripts"),
                fetchList("/admin/invoices?page=1&limit=1000", "invoices"),
                fetchList("/admin/payments?page=1&limit=1000", "transactions"),
                fetchList("/admin/scores/ai?page=1&limit=1000", "scripts"),
                fetchList("/admin/scores/platform?page=1&limit=1000", "scripts"),
                fetchList("/admin/scores/reader?page=1&limit=1000", "scripts"),
                fetchList("/admin/scripts/pending?page=1&limit=1000", "scripts"),
                fetchList("/admin/scripts/trailer-requests?page=1&limit=1000", "scripts"),
                fetchList("/admin/investors/pending?page=1&limit=1000", "investors"),
                fetchList("/admin/bank-details/reviews?page=1&limit=1000", "reviews"),
                fetchList("/admin/queries?page=1&limit=1000", "submissions"),
            ]);

            const sectionFromUsers = (title, list) => ({
                title: `${title} (${list.length})`,
                lines: list.map((u, idx) => `${idx + 1}. ${u.name || "-"} | ${u.email || "-"} | Role: ${u.role || "-"} | SID: ${u.sid || "-"} | Joined: ${formatExportDate(u.createdAt)}`),
            });

            const sectionFromScripts = (title, list) => ({
                title: `${title} (${list.length})`,
                lines: list.map((s, idx) => `${idx + 1}. ${s.title || "-"} | SID: ${s.sid || "-"} | Creator: ${s.creator?.name || "-"} | Genre: ${s.genre || s.primaryGenre || "-"} | Status: ${s.status || "-"} | Score: ${s.scriptScore?.overall || s.platformScore?.overall || s.rating || "-"} | Date: ${formatExportDate(s.createdAt)}`),
            });

            writePdfSections({
                fileName: `admin-complete-report-${Date.now()}.pdf`,
                title: "Admin Complete Dashboard Report",
                sections: [
                    {
                        title: "Overview",
                        lines: [
                            `Total Users: ${overview?.totalUsers || 0}`,
                            `Total Scripts: ${overview?.totalScripts || 0}`,
                            `Writers: ${overview?.totalWriters || 0}`,
                            `Investors: ${overview?.totalInvestors || 0}`,
                            `Readers: ${overview?.totalReaders || 0}`,
                            `Pending Approvals: ${overview?.pendingApprovals || 0}`,
                            `Transactions: ${overview?.totalTransactions || 0}`,
                            `Total Revenue: ${formatCurrency(overview?.totalRevenue || 0, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        ],
                    },
                    sectionFromUsers("Investors", investorsData),
                    sectionFromUsers("Writers", [...writersData, ...creatorsData]),
                    sectionFromUsers("Readers", readersData),
                    sectionFromScripts("Projects", projectsData),
                    sectionFromScripts("AI Usage", aiUsageData),
                    sectionFromScripts("Evaluation Purchases", evaluationsData),
                    sectionFromScripts("Investor Purchases", purchasesData),
                    {
                        title: `Invoices (${invoicesData.length})`,
                        lines: invoicesData.map((inv, idx) => `${idx + 1}. ${inv.invoiceNumber || "-"} | Creator: ${inv.creator?.name || "-"} (${inv.creatorSid || inv.creator?.sid || "-"}) | Project: ${inv.script?.title || "-"} (${inv.scriptSid || inv.script?.sid || "-"}) | Access: ${inv.accessType || "-"} | Credits: ${inv.totalCreditsRequired || 0} | Date: ${formatExportDate(inv.invoiceDate || inv.createdAt)}`),
                    },
                    {
                        title: `Payments (${paymentsData.length})`,
                        lines: paymentsData.map((t, idx) => `${idx + 1}. ${t.user?.name || "-"} | ${t.type || "-"} | ${formatCurrency(t.amount || 0, t.currency || "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ${t.status || "-"} | ${t.description || "-"} | Txn: ${getTransactionIdLabel(t) || "-"} | Pay ID: ${getPaymentIdLabel(t) || "-"} | ${formatExportDate(t.createdAt)}`),
                    },
                    sectionFromScripts("AI Scores", aiScoresData),
                    sectionFromScripts("Platform Scores", platformScoresData),
                    sectionFromScripts("Reader Scores", readerScoresData),
                    sectionFromScripts("Pending Approvals", approvalsData),
                    sectionFromScripts("AI Trailers", trailersData),
                    {
                        title: `Investor Requests (${pendingInvestorsData.length})`,
                        lines: pendingInvestorsData.map((inv, idx) => `${idx + 1}. ${inv.name || "-"} | ${inv.email || "-"} | Date: ${formatExportDate(inv.createdAt)} | Status: pending`),
                    },
                    {
                        title: `Bank Detail Reviews (${bankReviewsData.length})`,
                        lines: bankReviewsData.map((review, idx) => `${idx + 1}. ${review.name || "-"} | ${review.email || "-"} | Bank: ${review.requestedDetails?.bankName || "-"} | Status: ${review.status || "-"} | Attempts: ${review.bankSecurity?.invalidAttempts || 0} | Locked: ${review.bankSecurity?.isLocked ? "Yes" : "No"} | Submitted: ${formatExportDate(review.submittedAt)}`),
                    },
                    {
                        title: `Queries (${queriesData.length})`,
                        lines: queriesData.map((c, idx) => `${idx + 1}. ${c.name || "-"} | ${c.email || "-"} | Reason: ${c.reason || "-"} | Message: ${c.message || "-"} | Date: ${formatExportDate(c.createdAt)}`),
                    },
                ],
            });
            showToast("Complete dashboard PDF downloaded");
        } catch (err) {
            console.error(err);
            showToast("Failed to download full dashboard PDF", "error");
        } finally {
            setExportingAll(false);
        }
    };

    // ─── Fetch data function ───
    const fetchData = async (searchValue = "") => {
        if (!authorized) return;
        setLoading(true);
        const activeSearch = searchValue.trim();
        try {
            switch (activeTab) {
                case "overview": {
                    const { data } = await adminApi.get("/admin/stats");
                    setStats(data);
                    break;
                }
                case "investors": {
                    const { data } = await adminApi.get(`/admin/users?role=investor&page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    setUsers(data.users); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "writers": {
                    const { data } = await adminApi.get(`/admin/users?role=writer&page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    const { data: data2 } = await adminApi.get(`/admin/users?role=creator&page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    setUsers([...data.users, ...data2.users]); setTotalPages(Math.max(data.totalPages, data2.totalPages)); setTotal(data.total + data2.total);
                    break;
                }
                case "readers": {
                    const { data } = await adminApi.get(`/admin/users?role=reader&page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    setUsers(data.users); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "projects": {
                    const { data } = await adminApi.get(`/admin/scripts?page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "ai-usage": {
                    const { data } = await adminApi.get(`/admin/scripts/ai-usage?page=${page}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "evaluations": {
                    const { data } = await adminApi.get(`/admin/scripts/evaluation-purchases?page=${page}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "investor-purchases": {
                    const { data } = await adminApi.get(`/admin/scripts/investor-purchases?page=${page}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "payments": {
                    const { data } = await adminApi.get(`/admin/payments?page=${page}`);
                    setTransactions(data.transactions); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "invoices": {
                    const { data } = await adminApi.get(`/admin/invoices?page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    setInvoices(data.invoices); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "scores": {
                    const endpoint = scoreSubTab === "ai" ? "/admin/scores/ai" : scoreSubTab === "platform" ? "/admin/scores/platform" : "/admin/scores/reader";
                    const { data } = await adminApi.get(`${endpoint}?page=${page}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "approvals": {
                    const { data } = await adminApi.get(`/admin/scripts/pending?page=${page}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "trailers": {
                    const { data } = await adminApi.get(`/admin/scripts/trailer-requests?page=${page}`);
                    setScripts(data.scripts); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "messages": {
                    await fetchMessagesDirectory();
                    break;
                }
                case "pending-investors": {
                    const { data } = await adminApi.get(`/admin/investors/pending?page=${page}`);
                    setPendingInvestors(data.investors); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "bank-reviews": {
                    const { data } = await adminApi.get(`/admin/bank-details/reviews?page=${page}&status=pending&search=${encodeURIComponent(activeSearch)}`);
                    setBankReviews(data.reviews); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "queries": {
                    const { data } = await adminApi.get(`/admin/queries?page=${page}`);
                    setContacts(data.submissions); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
                case "discount-codes": {
                    const { data } = await adminApi.get(`/admin/discount-codes?page=${page}&search=${encodeURIComponent(activeSearch)}`);
                    setDiscountCodes(data.codes); setTotalPages(data.totalPages); setTotal(data.total);
                    break;
                }
            }
        } catch (err) {
            console.error("Admin fetch error:", err);
            if (err.response?.status === 401) {
                sessionStorage.removeItem("admin-session");
                setAuthorized(false);
                showToast("Session expired. Please re-enter the access code.", "error");
            }
        }
        setMessagesLoading(false);
        await fetchAlertSummary({ silent: true });
        setLoading(false);
    };

    const fetchGlobalSearchData = async (searchValue = "") => {
        if (!authorized) return;
        const activeSearch = searchValue.trim();
        if (!activeSearch) {
            setGlobalResults(EMPTY_GLOBAL_RESULTS);
            return;
        }

        setLoading(true);
        try {
            const [
                investorsRes,
                writersRes,
                creatorsRes,
                readersRes,
                scriptsRes,
                invoicesRes,
                paymentsRes,
                pendingInvestorsRes,
                bankReviewsRes,
                queriesRes,
            ] = await Promise.all([
                adminApi.get(`/admin/users?role=investor&page=1&limit=100&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/users?role=writer&page=1&limit=100&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/users?role=creator&page=1&limit=100&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/users?role=reader&page=1&limit=100&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/scripts?page=1&limit=100&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/invoices?page=1&limit=100&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/payments?page=1&limit=200`),
                adminApi.get(`/admin/investors/pending?page=1&limit=200`),
                adminApi.get(`/admin/bank-details/reviews?page=1&limit=200&search=${encodeURIComponent(activeSearch)}`),
                adminApi.get(`/admin/queries?page=1&limit=200`),
            ]);

            setGlobalResults({
                users: [
                    ...(investorsRes.data?.users || []),
                    ...(writersRes.data?.users || []),
                    ...(creatorsRes.data?.users || []),
                    ...(readersRes.data?.users || []),
                ],
                scripts: scriptsRes.data?.scripts || [],
                transactions: paymentsRes.data?.transactions || [],
                invoices: invoicesRes.data?.invoices || [],
                pendingInvestors: pendingInvestorsRes.data?.investors || [],
                bankReviews: bankReviewsRes.data?.reviews || [],
                contacts: queriesRes.data?.submissions || [],
            });
        } catch (err) {
            console.error("Admin global search fetch error:", err);
            if (err.response?.status === 401) {
                sessionStorage.removeItem("admin-session");
                setAuthorized(false);
                showToast("Session expired. Please re-enter the access code.", "error");
            }
        }
        setLoading(false);
    };

    // ─── Effects ───
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (authorized) setPage(1);
    }, [activeTab, scoreSubTab, authorized]);

    useEffect(() => {
        if (authorized) setPage(1);
    }, [search, authorized]);

    useEffect(() => {
        if (!authorized) return;
        if (activeTab === "overview" && hasSearch) return;
        fetchData(search);
    }, [activeTab, page, scoreSubTab, authorized, search, hasSearch]);

    useEffect(() => {
        if (!authorized || activeTab !== "overview") return;
        if (!hasSearch) {
            setGlobalResults(EMPTY_GLOBAL_RESULTS);
            return;
        }
        fetchGlobalSearchData(search);
    }, [authorized, activeTab, hasSearch, search]);

    useEffect(() => {
        if (authorized && searchInput !== search) {
            setLoading(true);
        }
    }, [searchInput, search, authorized]);
    useEffect(() => {
        if (!authorized) return;
        fetchAlertSummary({ silent: true });
        const interval = setInterval(() => {
            fetchAlertSummary({ silent: false });
        }, 30000);
        return () => clearInterval(interval);
    }, [authorized]);

    useEffect(() => {
        if (!authorized || activeTab !== "messages") return;

        const interval = setInterval(async () => {
            await fetchMessagesDirectory({ silent: true });
            if (activeMessageChatId) {
                await fetchMessagesForChat(activeMessageChatId, { silent: true });
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [authorized, activeTab, activeMessageChatId, activeMessageUser?._id]);

    useEffect(() => {
        if (!authorized || activeTab !== "messages" || !activeMessageChatId) return;
        fetchMessagesForChat(activeMessageChatId, { silent: true });
    }, [authorized, activeTab, activeMessageChatId]);

    useEffect(() => {
        if (activeTab !== "messages" || !activeMessageChatId) {
            previousAdminChatIdRef.current = "";
            shouldAutoScrollAdminMessagesRef.current = false;
            setShowAdminScrollToBottomButton(false);
            return;
        }

        const chatChanged = previousAdminChatIdRef.current !== activeMessageChatId;
        if (chatChanged) {
            previousAdminChatIdRef.current = activeMessageChatId;
            shouldAutoScrollAdminMessagesRef.current = true;
            scrollAdminMessagesToBottom("auto");
            return;
        }

        if (!shouldAutoScrollAdminMessagesRef.current) return;
        shouldAutoScrollAdminMessagesRef.current = false;
        scrollAdminMessagesToBottom("smooth");
    }, [activeTab, activeMessageChatId, messageList.length]);

    useEffect(() => {
        const container = messageListContainerRef.current;
        if (activeTab !== "messages" || !activeMessageChatId || !container) {
            setShowAdminScrollToBottomButton(false);
            return;
        }
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowAdminScrollToBottomButton(distanceFromBottom > 96);
    }, [activeTab, activeMessageChatId, messageList.length]);

    const fetchMessagesForChat = async (chatId, { silent = false } = {}) => {
        if (!chatId) {
            setMessageList([]);
            return;
        }
        if (!silent) setMessagesLoading(true);
        try {
            const { data } = await adminApi.get(`/messages/${chatId}`);
            const next = Array.isArray(data) ? data : [];
            setMessageList((prev) => {
                const sameLength = prev.length === next.length;
                const sameFirst = prev[0]?._id === next[0]?._id;
                const sameLast = prev[prev.length - 1]?._id === next[next.length - 1]?._id;
                if (sameLength && sameFirst && sameLast) return prev;
                return next;
            });
        } catch (err) {
            console.error("Admin messages fetch error:", err);
            if (!silent) showToast("Failed to load messages", "error");
            setMessageList([]);
        } finally {
            if (!silent) setMessagesLoading(false);
        }
    };

    const openWriterConversation = async (writerUser) => {
        if (!writerUser?._id) return;

        const writerId = String(writerUser._id);
        const existingConversation = adminConversations.find((conv) => String(conv?.user?._id) === writerId);

        setActiveTab("messages");
        setActiveMessageUser(writerUser);
        setMessageText("");
        setMessageAttachment(null);
        if (messageFileInputRef.current) messageFileInputRef.current.value = "";

        if (existingConversation?.chatId) {
            setActiveMessageChatId(existingConversation.chatId);
            await fetchMessagesForChat(existingConversation.chatId);
            return;
        }

        setActiveMessageChatId("");
        setMessageList([]);
    };

    const handlePickMessageAttachment = () => {
        if (!activeMessageUser || uploadingMessageAttachment) return;
        messageFileInputRef.current?.click();
    };

    const handleAdminAttachmentChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingMessageAttachment(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const { data } = await adminApi.post("/messages/upload", formData);
            setMessageAttachment(data || null);
        } catch (err) {
            console.error("Admin attachment upload error:", err);
            showToast(err?.response?.data?.message || "Failed to upload attachment", "error");
            if (messageFileInputRef.current) messageFileInputRef.current.value = "";
        } finally {
            setUploadingMessageAttachment(false);
        }
    };

    const handleSendAdminMessage = async () => {
        if (!activeMessageUser?._id) return;

        const trimmedText = messageText.trim();
        const attachmentPayload = messageAttachment
            ? {
                fileUrl: messageAttachment.fileUrl,
                fileType: messageAttachment.fileType,
                fileName: messageAttachment.fileName,
                fileSize: messageAttachment.fileSize,
            }
            : {};

        if (!trimmedText && !attachmentPayload.fileUrl) return;

        try {
            const { data: saved } = await adminApi.post("/messages/send", {
                receiverId: activeMessageUser._id,
                text: trimmedText,
                ...attachmentPayload,
            });

            setMessageText("");
            setMessageAttachment(null);
            if (messageFileInputRef.current) messageFileInputRef.current.value = "";
            shouldAutoScrollAdminMessagesRef.current = true;
            setMessageList((prev) => [...prev, saved]);

            const nextChatId = saved?.chatId || activeMessageChatId || buildChatId(saved?.sender?._id, activeMessageUser._id);
            if (nextChatId) setActiveMessageChatId(nextChatId);
            const previewText = getMessagePreview(saved);

            setAdminConversations((prev) => {
                const conversation = {
                    chatId: nextChatId,
                    user: activeMessageUser,
                    lastMessage: previewText,
                    timestamp: saved?.createdAt || new Date().toISOString(),
                    unreadCount: 0,
                };
                const rest = prev.filter((conv) => conv.chatId !== conversation.chatId);
                return [conversation, ...rest];
            });

            setMessageUsers((prev) => {
                const withoutCurrent = prev.filter((u) => String(u._id) !== String(activeMessageUser._id));
                return [{ ...activeMessageUser, conversation: { chatId: nextChatId, timestamp: saved?.createdAt || new Date().toISOString(), lastMessage: previewText, unreadCount: 0 } }, ...withoutCurrent];
            });
        } catch (err) {
            console.error("Admin send message error:", err);
            showToast(err?.response?.data?.message || "Failed to send message", "error");
        }
    };

    // ─── Action handlers (all use adminApi) ───
    const handleApprove = async (id) => {
        try {
            await adminApi.put(`/admin/scripts/${id}/approve`);
            showToast("Script approved and published successfully");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("Failed to approve script", "error");
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Rejection reason (optional — the writer will see this):");
        if (reason === null) return; // cancelled
        try {
            await adminApi.put(`/admin/scripts/${id}/reject`, { reason: reason.trim() || undefined });
            showToast("Script rejected");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("Failed to reject script", "error");
        }
    };

    const handleScore = async (id, scores) => {
        try {
            await adminApi.put(`/admin/scripts/${id}/score`, scores);
            showToast("Platform score saved successfully");
            setScoreModal(null);
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("Failed to save score", "error");
        }
    };

    const handleTrailerApprove = async (script) => {
        const isRegeneration = script?.trailerWriterFeedback?.status === "revision_requested";
        const trimmedTrailerUrl = String(script?.trailerUrl || "").trim();
        if (!trimmedTrailerUrl) {
            if (!script?.creator?._id) {
                showToast("No trailer URL available for this script", "error");
                return;
            }

            const draft = isRegeneration
                ? `Hi ${script.creator?.name || "writer"}, please review this updated trailer for "${script?.title || "this script"}".\nTrailer URL: `
                : `Hi ${script.creator?.name || "writer"}, your trailer for "${script?.title || "this script"}" is ready.\nTrailer URL: `;

            await openWriterConversation(script.creator);
            setMessageText(draft);
            showToast("No trailer URL on script. Send trailer URL/file from Admin Messages.", "info");
            return;
        }

        const trailerThumbnail = script?.trailerThumbnail || "";
        const caption = isRegeneration
            ? `We've updated your AI trailer for \"${script?.title || "this script"}\". Please review this version.`
            : `Your AI trailer for \"${script?.title || "this script"}\" is ready.`;

        try {
            await adminApi.put(`/admin/scripts/${script._id}/trailer-approve`, {
                trailerUrl: trimmedTrailerUrl,
                trailerThumbnail: trailerThumbnail.trim() || undefined,
                caption: caption.trim() || undefined,
            });
            showToast(isRegeneration
                ? "Regenerated trailer sent to writer via message"
                : "Trailer approved and sent to writer via message");
            fetchData();
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || (isRegeneration ? "Failed to regenerate trailer" : "Failed to approve trailer");
            showToast(msg, "error");
        }
    };

    const handleOpenTrailerUpload = (script) => {
        if (!script?._id || uploadingTrailerScriptId) return;
        setTrailerUploadTargetScript(script);
        if (trailerFileInputRef.current) {
            trailerFileInputRef.current.value = "";
            trailerFileInputRef.current.click();
        }
    };

    const handleAdminTrailerFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !trailerUploadTargetScript?._id) return;

        const scriptId = trailerUploadTargetScript._id;
        setUploadingTrailerScriptId(scriptId);

        try {
            const formData = new FormData();
            formData.append("trailer", file);

            const { data } = await adminApi.post(`/admin/scripts/${scriptId}/upload-trailer`, formData);

            if (data?.script?._id) {
                setScripts((prev) => prev.map((s) => (String(s._id) === String(data.script._id) ? { ...s, ...data.script } : s)));
            }

            showToast(data?.message || "Trailer uploaded and published successfully");
            if (activeTab === "trailers") {
                fetchData(search);
            }
        } catch (err) {
            console.error("Admin trailer upload error:", err);
            showToast(err?.response?.data?.message || "Failed to upload trailer", "error");
        } finally {
            setUploadingTrailerScriptId("");
            setTrailerUploadTargetScript(null);
            if (trailerFileInputRef.current) trailerFileInputRef.current.value = "";
        }
    };

    const handleApproveInvestor = async (id) => {
        try {
            await adminApi.put(`/admin/investors/${id}/approve`);
            showToast("Investor approved — they can now log in");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("Failed to approve investor", "error");
        }
    };

    const handleRejectInvestor = async (id, note) => {
        try {
            await adminApi.put(`/admin/investors/${id}/reject`, { note });
            showToast("Investor rejected");
            setRejectModal(null);
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("Failed to reject investor", "error");
        }
    };

    const handleApproveBankReview = async (id) => {
        try {
            await adminApi.put(`/admin/bank-details/reviews/${id}/approve`);
            showToast("Bank details approved and activated");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast(err?.response?.data?.message || "Failed to approve bank details", "error");
        }
    };

    const handleRejectBankReview = async (id) => {
        const note = window.prompt("Rejection reason (optional):") || "";
        try {
            await adminApi.put(`/admin/bank-details/reviews/${id}/reject`, { note });
            showToast("Bank details request rejected");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast(err?.response?.data?.message || "Failed to reject bank details", "error");
        }
    };

    const handleUnblockBankReview = async (id) => {
        try {
            await adminApi.put(`/admin/bank-details/reviews/${id}/unblock`);
            showToast("User bank-detail lock removed");
            fetchData();
        } catch (err) {
            console.error(err);
            showToast(err?.response?.data?.message || "Failed to unblock user", "error");
        }
    };

    // ─── Discount Code Handlers ───
    const handleSaveDiscountCode = async (formData) => {
        try {
            if (formData._id) {
                await adminApi.put(`/admin/discount-codes/${formData._id}`, formData);
                showToast("Discount code updated");
            } else {
                await adminApi.post("/admin/discount-codes", formData);
                showToast("Discount code created");
            }
            setDiscountCodeModal(null);
            fetchData(search);
        } catch (err) {
            console.error(err);
            showToast(err?.response?.data?.message || "Failed to save discount code", "error");
        }
    };

    const handleDeleteDiscountCode = async (id) => {
        if (!window.confirm("Deactivate this discount code?")) return;
        try {
            await adminApi.delete(`/admin/discount-codes/${id}`);
            showToast("Discount code deactivated");
            fetchData(search);
        } catch (err) {
            console.error(err);
            showToast("Failed to deactivate discount code", "error");
        }
    };

    const handleLoginAs = async (userId) => {
        try {
            const { data } = await adminApi.post(`/admin/login-as/${userId}`);
            const encoded = encodeURIComponent(JSON.stringify(data));
            window.open(`/dashboard?adminLogin=${encoded}`, "_blank");
            showToast(`Opened session as ${data.name || data.email}`);
        } catch (err) {
            console.error(err);
            showToast("Failed to login as user", "error");
        }
    };

    const handleInvoicePdfAction = async (invoice, action = "open") => {
        try {
            const { data } = await adminApi.get(`/invoices/${invoice._id}/pdf`, {
                params: action === "download" ? { download: 1 } : {},
                responseType: "blob",
            });
            const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));

            if (action === "download") {
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                return;
            }

            window.open(blobUrl, "_blank", "noopener,noreferrer");
            setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
        } catch (err) {
            console.error(err);
            showToast("Failed to open invoice PDF", "error");
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setCodeError("");
        const enteredCode = codeInput.trim();
        if (!enteredCode) {
            setCodeError("Access code is required");
            return;
        }
        setCodeLoading(true);
        try {
            // Login as admin — store token ONLY in sessionStorage (does NOT affect user's localStorage session)
            const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: "admin@ckript.com",
                password: "admin123",
                adminCode: enteredCode,
            });
            sessionStorage.setItem("admin-session", JSON.stringify(data));
            setAuthorized(true);
            setCodeInput("");
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            setCodeError(apiMessage || "Admin login failed. Admin account may be missing after DB reset.");
        }
        setCodeLoading(false);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        sessionStorage.removeItem("admin-session");
        setAuthorized(false);
        previousAlertSummaryRef.current = null;
        setAlertSummary({});
    };

    // ═══════════════════════════════════════════════
    // If not authorized, show code entry screen
    // ═══════════════════════════════════════════════
    if (!authorized) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#050d1a] via-[#0b1a30] to-[#0a1628]">
                <div className="w-full max-w-md mx-4 rounded-2xl p-8 border bg-[#0f1d35]/80 border-[#1a3050] backdrop-blur-xl shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-extrabold text-white">Admin Panel</h1>
                        <p className="text-sm mt-1 text-gray-500">Enter access code to continue</p>
                    </div>
                    <form onSubmit={handleCodeSubmit}>
                        <input
                            type="password"
                            value={codeInput}
                            onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                            placeholder="Access Code"
                            autoFocus
                            className="w-full px-4 py-3.5 rounded-xl text-center text-lg font-bold tracking-[0.3em] outline-none border bg-[#0b1426] border-[#1a3050] text-white placeholder-gray-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        {codeError && (
                            <p className="text-red-400 text-sm font-semibold mt-2 text-center">{codeError}</p>
                        )}
                        <button
                            type="submit"
                            disabled={codeLoading || !codeInput}
                            className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                        >
                            {codeLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verifying...
                                </span>
                            ) : "Access Admin Panel"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── Render Content ───
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            );
        }

        switch (activeTab) {
            case "overview":
                if (!stats) return null;
                if (hasSearch) {
                    const totalMatches =
                        filteredUsers.length +
                        filteredScripts.length +
                        filteredInvoices.length +
                        filteredTransactions.length +
                        filteredPendingInvestors.length +
                        filteredContacts.length;

                    const resultBlocks = [
                        {
                            key: "users",
                            title: "Users",
                            count: filteredUsers.length,
                            lines: filteredUsers.slice(0, 6).map((u) => `${u.name || "-"} • ${u.email || "-"} • ${u.role || "-"}`),
                        },
                        {
                            key: "projects",
                            title: "Projects",
                            count: filteredScripts.length,
                            lines: filteredScripts.slice(0, 6).map((s) => `${s.title || "-"} • SID: ${s.sid || "-"} • ${s.creator?.name || "-"}`),
                        },
                        {
                            key: "invoices",
                            title: "Invoices",
                            count: filteredInvoices.length,
                            lines: filteredInvoices.slice(0, 6).map((inv) => `${inv.invoiceNumber || "-"} • ${inv.creator?.name || "-"} • ${inv.script?.title || "-"}`),
                        },
                        {
                            key: "payments",
                            title: "Payments",
                            count: filteredTransactions.length,
                            lines: filteredTransactions.slice(0, 6).map((t) => `${t.user?.name || "-"} • ${t.type || "-"} • ${formatCurrency(t.amount || 0, t.currency || "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
                        },
                        {
                            key: "requests",
                            title: "Investor Requests",
                            count: filteredPendingInvestors.length,
                            lines: filteredPendingInvestors.slice(0, 6).map((inv) => `${inv.name || "-"} • ${inv.email || "-"}`),
                        },
                        {
                            key: "queries",
                            title: "Queries",
                            count: filteredContacts.length,
                            lines: filteredContacts.slice(0, 6).map((c) => `${c.name || "-"} • ${c.reason || "-"} • ${c.email || "-"}`),
                        },
                    ];

                    return (
                        <div>
                            <div className="flex items-end justify-between mb-5 gap-4">
                                <div>
                                    <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>Search Results</h2>
                                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                        Showing cross-section matches for "{search.trim()}"
                                    </p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                                    {totalMatches} match{totalMatches === 1 ? "" : "es"}
                                </span>
                            </div>

                            {totalMatches === 0 ? (
                                <div className={`rounded-2xl border p-10 text-center ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                                    <p className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                        No results found. Try a different keyword.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {resultBlocks.filter((block) => block.count > 0).map((block) => (
                                        <div key={block.key} className={`rounded-2xl border p-4 ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className={`text-sm font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{block.title}</h3>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-700"}`}>{block.count}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {block.lines.map((line, index) => (
                                                    <p key={`${block.key}-${index}`} className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Platform Overview</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard isDark={isDark} label="Total Users" value={stats.totalUsers} icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" color="bg-blue-500/15 text-blue-500" />
                            <StatCard isDark={isDark} label="Total Scripts" value={stats.totalScripts} icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" color="bg-purple-500/15 text-purple-500" />
                            <StatCard isDark={isDark} label="Writers" value={stats.totalWriters} icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" color="bg-amber-500/15 text-amber-500" />
                            <StatCard isDark={isDark} label="Investors" value={stats.totalInvestors} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-emerald-500/15 text-emerald-500" />
                            <StatCard isDark={isDark} label="Readers" value={stats.totalReaders} icon="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" color="bg-cyan-500/15 text-cyan-500" />
                            <StatCard isDark={isDark} label="Pending Approvals" value={stats.pendingApprovals} icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-orange-500/15 text-orange-500" />
                            <StatCard isDark={isDark} label="Transactions" value={stats.totalTransactions} icon="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" color="bg-pink-500/15 text-pink-500" />
                            <StatCard isDark={isDark} label="Total Revenue" value={`₹${stats.totalRevenue?.toFixed(2) || "0.00"}`} icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-green-500/15 text-green-500" />
                        </div>
                    </div>
                );

            case "investors":
            case "writers":
            case "readers":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                                {activeTab === "investors" ? "Investors" : activeTab === "writers" ? "Writers" : "Readers"}
                                <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredUsers.length : total})</span>
                            </h2>
                        </div>
                        <UserTable
                            users={filteredUsers}
                            isDark={isDark}
                            onLoginAs={null}
                            onViewUser={setSelectedUserDetail}
                        />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "projects":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>All Projects<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredScripts.length : total})</span></h2>
                        </div>
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={true}
                            actions={(s) => (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setScoreModal(s)} className="text-xs font-bold text-purple-500 hover:text-purple-400 px-2.5 py-1 rounded-lg hover:bg-purple-500/10 transition-colors">Score</button>
                                    <a href={`/script/${s._id}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-500/10 transition-colors">View</a>
                                </div>
                            )}
                        />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "ai-usage":
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>AI Usage in Projects<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredScripts.length : total})</span></h2>
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={true} />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "evaluations":
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Evaluation Purchases<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredScripts.length : total})</span></h2>
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={true} />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "investor-purchases":
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Investor Purchases<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredScripts.length : total})</span></h2>
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={false}
                            actions={(s) => (
                                <div className="flex flex-wrap gap-1">
                                    {s.unlockedBy?.map((u) => (
                                        <span key={u._id || u} className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                                            {u.name || "Investor"}
                                        </span>
                                    ))}
                                </div>
                            )}
                        />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "payments":
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>Payment Transactions<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredTransactions.length : total})</span></h2>
                        <TransactionTable transactions={filteredTransactions} isDark={isDark} />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "invoices":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>Invoices<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredInvoices.length : total})</span></h2>
                        </div>
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                                            {[
                                                "Invoice #",
                                                "Creator",
                                                "Project",
                                                "Access",
                                                "Credits",
                                                "Date",
                                                "Actions",
                                            ].map((h) => (
                                                <th key={h} className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                                        {filteredInvoices.map((inv) => (
                                            <tr key={inv._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                                                <td className={`px-5 py-3.5 text-sm font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{inv.invoiceNumber}</td>
                                                <td className="px-5 py-3.5">
                                                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{inv.creator?.name || "-"}</p>
                                                    <p className={`text-[11px] mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                        SID: {inv.creatorSid || inv.creator?.sid || "-"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{inv.script?.title || "-"}</p>
                                                    <p className={`text-[11px] mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                        SID: {inv.scriptSid || inv.script?.sid || "-"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${inv.accessType === "premium" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                                        {inv.accessType === "premium" ? "Premium" : "Free"}
                                                    </span>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{inv.totalCreditsRequired || 0} cr</td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleInvoicePdfAction(inv, "open")}
                                                            className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10"
                                                        >
                                                            Open PDF
                                                        </button>
                                                        <button
                                                            onClick={() => handleInvoicePdfAction(inv, "download")}
                                                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10"
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredInvoices.length === 0 && (
                                            <tr><td colSpan={7} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No invoices found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "scores":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>Score Rankings</h2>
                            <div className={`flex rounded-xl overflow-hidden border ${isDark ? "border-[#1a3050] bg-[#0b1426]" : "border-gray-200 bg-gray-50"}`}>
                                {[{ k: "ai", l: "AI Scores" }, { k: "platform", l: "Platform" }, { k: "reader", l: "Reader" }].map((t) => (
                                    <button key={t.k} onClick={() => setScoreSubTab(t.k)}
                                        className={`px-4 py-2 text-sm font-bold transition-all ${scoreSubTab === t.k
                                            ? isDark ? "bg-blue-500/15 text-blue-400" : "bg-[#1e3a5f] text-white"
                                            : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                                            }`}>{t.l}</button>
                                ))}
                            </div>
                        </div>
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={true}
                            actions={(s) => (
                                <button onClick={() => setScoreModal(s)} className="text-xs font-bold text-purple-500 hover:text-purple-400 px-2.5 py-1 rounded-lg hover:bg-purple-500/10 transition-colors">Score</button>
                            )}
                        />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "approvals":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Pending Approvals
                                <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredScripts.length : total})</span>
                            </h2>
                        </div>
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={false}
                            actions={(s) => (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleApprove(s._id)} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">✓ Approve</button>
                                    <button onClick={() => handleReject(s._id)} className="text-xs font-bold text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">✕ Reject</button>
                                    <button onClick={() => setScoreModal(s)} className="text-xs font-bold text-purple-500 hover:text-purple-400 px-2.5 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors">Score</button>
                                    <a href={`/script/${s._id}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:text-blue-400 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">View</a>
                                </div>
                            )}
                        />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "trailers":
                const regenerationRequests = filteredScripts.filter((s) => s.trailerWriterFeedback?.status === "revision_requested");
                return (
                    <div>
                        <input
                            ref={trailerFileInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleAdminTrailerFileChange}
                        />
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>AI Trailer Requests<span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredScripts.length : total})</span></h2>
                        </div>
                        {regenerationRequests.length > 0 && (
                            <div className={`rounded-2xl border p-5 mb-5 ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200/60"}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <Icon d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865A8.25 8.25 0 0117.834 6.165l3.181 3.183" className={`w-5 h-5 ${isDark ? "text-amber-300" : "text-amber-700"}`} />
                                    <h3 className={`text-sm font-bold ${isDark ? "text-amber-200" : "text-amber-900"}`}>Writer Requested Better Trailer</h3>
                                </div>
                                <div className="space-y-3">
                                    {regenerationRequests.map((script) => (
                                        <div key={script._id} className={`rounded-xl border px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-white border-amber-100"}`}>
                                            <div>
                                                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{script.title}</p>
                                                <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                    Writer: {script.creator?.name || "Unknown"}
                                                    {script.trailerWriterFeedback?.updatedAt ? ` • ${new Date(script.trailerWriterFeedback.updatedAt).toLocaleString()}` : ""}
                                                </p>
                                                <p className={`text-xs mt-1.5 ${isDark ? "text-amber-200" : "text-amber-800"}`}>
                                                    {script.trailerWriterFeedback?.note || "Writer requested a better AI trailer version."}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openWriterConversation(script.creator)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDark ? "text-blue-300 hover:text-blue-200 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50"}`}>Write Message</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <ScriptTable scripts={filteredScripts} isDark={isDark} showScore={false}
                            actions={(s) => (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.trailerStatus === "ready" ? "bg-emerald-100 text-emerald-700" :
                                        s.trailerStatus === "generating" ? "bg-amber-100 text-amber-700" :
                                            "bg-gray-100 text-gray-600"
                                        }`}>{s.trailerStatus || "none"}</span>
                                    {s.trailerWriterFeedback?.status === "revision_requested" && (
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700"}`}>writer requested changes</span>
                                    )}
                                    {s.trailerStatus !== "ready" && (
                                        <button onClick={() => handleTrailerApprove(s)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDark ? "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10" : "text-emerald-700 hover:bg-emerald-100"}`}>Send Trailer</button>
                                    )}
                                    <button
                                        onClick={() => handleOpenTrailerUpload(s)}
                                        disabled={uploadingTrailerScriptId === String(s._id)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${uploadingTrailerScriptId === String(s._id)
                                            ? isDark ? "text-gray-500 bg-white/[0.03]" : "text-gray-400 bg-gray-100"
                                            : isDark ? "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10" : "text-amber-700 hover:bg-amber-100"
                                            }`}
                                    >
                                        {uploadingTrailerScriptId === String(s._id) ? "Uploading..." : "Add Trailer"}
                                    </button>
                                    <a href={`/script/${s._id}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:text-blue-400 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">View</a>
                                </div>
                            )}
                        />
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "messages": {
                const selectedWriterId = String(activeMessageUser?._id || "");
                const selectedConversation = adminConversations.find((conv) => String(conv?.user?._id) === selectedWriterId);

                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Admin Messages
                                <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                    ({hasSearch ? filteredMessageUsers.length : messageUsers.length})
                                </span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className={`lg:col-span-1 h-[240px] sm:h-[280px] lg:h-[calc(100vh-240px)] lg:min-h-[520px] lg:max-h-[760px] rounded-2xl border flex flex-col overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                                <div className={`px-4 py-3 border-b ${isDark ? "border-[#1a3050]" : "border-gray-100"}`}>
                                    <p className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Writers</p>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {messagesLoading && filteredMessageUsers.length === 0 ? (
                                        <p className={`px-4 py-5 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading conversations...</p>
                                    ) : filteredMessageUsers.length === 0 ? (
                                        <p className={`px-4 py-5 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No writers found.</p>
                                    ) : (
                                        filteredMessageUsers.map((writer) => {
                                            const isSelected = String(writer._id) === selectedWriterId;
                                            const conversation = writer.conversation;
                                            return (
                                                <button
                                                    key={writer._id}
                                                    onClick={() => openWriterConversation(writer)}
                                                    className={`w-full text-left px-4 py-3 border-b transition-colors ${isDark ? "border-[#1a3050]" : "border-gray-100"} ${isSelected ? (isDark ? "bg-blue-500/10" : "bg-blue-50") : (isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50")}`}
                                                >
                                                    <p className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}>{writer.name || "Unknown"}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{writer.email || "No email"}</p>
                                                    {conversation?.lastMessage && (
                                                        <p className={`text-xs mt-1 truncate ${isDark ? "text-gray-500" : "text-gray-500"}`}>{conversation.lastMessage}</p>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className={`relative lg:col-span-2 h-[62vh] sm:h-[66vh] lg:h-[calc(100vh-240px)] lg:min-h-[520px] lg:max-h-[760px] rounded-2xl border flex flex-col overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                                {!activeMessageUser ? (
                                    <div className="flex-1 py-20 flex items-center justify-center px-6 text-center">
                                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Select a writer to start or continue a trailer discussion.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`px-4 py-3 border-b ${isDark ? "border-[#1a3050]" : "border-gray-100"}`}>
                                            <p className={`text-sm font-bold ${isDark ? "text-gray-100" : "text-gray-800"}`}>{activeMessageUser.name || "Writer"}</p>
                                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                {activeMessageUser.email || "No email"}
                                                {selectedConversation?.timestamp ? ` • Last active ${new Date(selectedConversation.timestamp).toLocaleString()}` : ""}
                                            </p>
                                        </div>

                                        <div
                                            ref={messageListContainerRef}
                                            onScroll={handleAdminMessageScroll}
                                            className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto"
                                        >
                                            {messagesLoading ? (
                                                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading thread...</p>
                                            ) : messageList.length === 0 ? (
                                                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No messages yet. Send the first message to start this conversation.</p>
                                            ) : (
                                                messageList.map((msg) => {
                                                    const isWriterMessage = String(msg?.sender?._id || "") === String(activeMessageUser._id || "");
                                                    return (
                                                        <div key={msg._id} className={`flex ${isWriterMessage ? "justify-start" : "justify-end"}`}>
                                                            <div className={`max-w-[80%] px-3 py-2 rounded-xl ${isWriterMessage ? (isDark ? "bg-[#132744] text-gray-100" : "bg-gray-100 text-gray-800") : (isDark ? "bg-blue-500/20 text-blue-100" : "bg-blue-50 text-blue-900")}`}>
                                                                {msg.fileUrl && msg.fileType === "image" ? (
                                                                    <div className="space-y-2">
                                                                        <img src={resolveMediaUrl(msg.fileUrl)} alt="attachment" className="max-w-full rounded-xl" />
                                                                        {msg.text ? <p className="text-sm whitespace-pre-wrap">{msg.text}</p> : null}
                                                                    </div>
                                                                ) : msg.fileUrl && msg.fileType === "video" ? (
                                                                    <div className="space-y-2">
                                                                        <video src={resolveMediaUrl(msg.fileUrl)} controls preload="metadata" className="w-full rounded-xl max-h-72" />
                                                                        <a href={resolveMediaUrl(msg.fileUrl)} target="_blank" rel="noreferrer" className={`text-xs underline ${isDark ? "text-blue-200" : "text-blue-700"}`}>Open video in new tab</a>
                                                                        {msg.text ? <p className="text-sm whitespace-pre-wrap">{msg.text}</p> : null}
                                                                    </div>
                                                                ) : msg.fileUrl ? (
                                                                    <div className="space-y-2">
                                                                        <div className={`rounded-lg px-2.5 py-2 ${isWriterMessage ? (isDark ? "bg-[#0b1426]" : "bg-white") : (isDark ? "bg-blue-900/25" : "bg-blue-100/60")}`}>
                                                                            <p className="text-xs font-semibold truncate">{msg.fileName || "Attachment"}</p>
                                                                            <p className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatFileSize(msg.fileSize)}</p>
                                                                            <a href={resolveMediaUrl(msg.fileUrl)} target="_blank" rel="noreferrer" className={`inline-block mt-1 text-xs underline ${isDark ? "text-blue-200" : "text-blue-700"}`}>Open file</a>
                                                                        </div>
                                                                        {msg.text ? <p className="text-sm whitespace-pre-wrap">{msg.text}</p> : null}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm whitespace-pre-wrap">{msg.text || "(attachment)"}</p>
                                                                )}
                                                                <p className={`text-[11px] mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <div ref={messageListEndRef} />
                                        </div>

                                        {showAdminScrollToBottomButton && (
                                            <button
                                                type="button"
                                                onClick={() => scrollAdminMessagesToBottom("smooth")}
                                                aria-label="Scroll to latest message"
                                                title="Scroll to latest"
                                                className={`absolute right-4 bottom-[78px] z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-md border ${isDark ? "bg-[#132744] border-[#1c2a3a] text-gray-200 hover:bg-[#1a3354]" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        )}

                                        <div className={`p-3 border-t ${isDark ? "border-[#1a3050]" : "border-gray-100"}`}>
                                            {messageAttachment && (
                                                <div className={`mb-2 rounded-xl border px-3 py-2 flex items-center justify-between ${isDark ? "border-[#1a3050] bg-[#132744]" : "border-gray-200 bg-gray-50"}`}>
                                                    <div>
                                                        <p className={`text-xs font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}>{messageAttachment.fileName || "Attachment"}</p>
                                                        <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{messageAttachment.fileType || "file"} • {formatFileSize(messageAttachment.fileSize)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setMessageAttachment(null);
                                                            if (messageFileInputRef.current) messageFileInputRef.current.value = "";
                                                        }}
                                                        className={`text-xs font-bold px-2 py-1 rounded-lg ${isDark ? "text-red-300 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}

                                            <input
                                                ref={messageFileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleAdminAttachmentChange}
                                            />

                                            <div className={`rounded-2xl border p-2 flex items-center gap-2 ${isDark ? "bg-[#0b1628] border-[#1a3050]" : "bg-gray-50 border-gray-200"}`}>
                                                <button
                                                    type="button"
                                                    onClick={handlePickMessageAttachment}
                                                    disabled={uploadingMessageAttachment || !activeMessageUser}
                                                    className={`w-12 h-12 shrink-0 rounded-full inline-flex items-center justify-center transition-colors ${uploadingMessageAttachment || !activeMessageUser ? (isDark ? "bg-[#122540] text-gray-500" : "bg-gray-200 text-gray-400") : (isDark ? "bg-[#10233f] text-gray-200 hover:bg-[#153156]" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100")}`}
                                                    title={uploadingMessageAttachment ? "Uploading..." : "Attach file"}
                                                >
                                                    {uploadingMessageAttachment ? (
                                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v4m0 8v4m8-8h-4M8 12H4m12.364-5.657l-2.828 2.828M10.464 13.536l-2.828 2.828m0-9.9l2.828 2.828m5.072 5.072l2.828 2.828" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 114.95 4.95l-9.19 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.49" />
                                                        </svg>
                                                    )}
                                                </button>

                                                <textarea
                                                    rows={1}
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendAdminMessage();
                                                        }
                                                    }}
                                                    placeholder="Reply with text or attach file..."
                                                    className={`flex-1 resize-none h-12 rounded-xl px-4 py-3 text-base border focus:outline-none focus:ring-2 ${isDark ? "bg-[#061327] border-[#204777] text-gray-100 placeholder:text-[#5c7190] focus:ring-blue-500/30" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:ring-blue-200"}`}
                                                />
                                                <button
                                                    onClick={handleSendAdminMessage}
                                                    disabled={uploadingMessageAttachment || (!messageText.trim() && !messageAttachment)}
                                                    className={`w-12 h-12 shrink-0 rounded-full inline-flex items-center justify-center transition-colors ${(!uploadingMessageAttachment && (messageText.trim() || messageAttachment)) ? (isDark ? "bg-[#10233f] text-blue-200 hover:bg-[#153156]" : "bg-blue-600 text-white hover:bg-blue-700") : (isDark ? "bg-[#122540] text-gray-500" : "bg-gray-200 text-gray-400")}`}
                                                    title="Send message"
                                                >
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L15 22 11 13 2 9 22 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            case "pending-investors":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Investor Account Requests
                                <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredPendingInvestors.length : total})</span>
                            </h2>
                        </div>
                        {filteredPendingInvestors.length === 0 ? (
                            <div className={`rounded-2xl border p-12 text-center ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                                    <svg className={`w-6 h-6 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>No pending investor requests</p>
                            </div>
                        ) : (
                            <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                                <table className="w-full">
                                    <thead>
                                        <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                                            {["Investor", "Email", "Signed Up", "Actions"].map((h) => (
                                                <th key={h} className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                                        {filteredPendingInvestors.map((inv) => (
                                            <tr key={inv._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        {inv.profileImage ? (
                                                            <img src={inv.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                                                                {inv.name?.charAt(0)?.toUpperCase() || "?"}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{inv.name}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700`}>pending</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{inv.email}</td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setSelectedUserDetail(inv)}
                                                            className="text-xs font-bold text-blue-500 hover:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">
                                                            View Details
                                                        </button>
                                                        <button onClick={() => handleApproveInvestor(inv._id)}
                                                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
                                                            ✓ Approve
                                                        </button>
                                                        <button onClick={() => setRejectModal(inv)}
                                                            className="text-xs font-bold text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "bank-reviews":
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>
                            Bank Detail Reviews
                            <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredBankReviews.length : total})</span>
                        </h2>
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                                            {["Writer", "Requested Details", "Active Details", "Security", "Submitted", "Due", "Actions"].map((h) => (
                                                <th key={h} className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                                        {filteredBankReviews.map((review) => (
                                            <tr key={review._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                                                <td className="px-5 py-3.5">
                                                    <p className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{review.name || "-"}</p>
                                                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{review.email || "-"}</p>
                                                    <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>SID: {review.sid || "-"}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className={`text-xs leading-5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Holder:</span> {review.requestedDetails?.accountHolderName || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Bank:</span> {review.requestedDetails?.bankName || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Account #:</span> {review.requestedDetails?.accountNumber || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Routing:</span> {review.requestedDetails?.routingNumber || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Type:</span> {review.requestedDetails?.accountType || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Country/Currency:</span> {review.requestedDetails?.country || "-"} / {review.requestedDetails?.currency || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>SWIFT:</span> {review.requestedDetails?.swiftCode || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>IBAN:</span> {review.requestedDetails?.iban || "-"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {review.activeDetails ? (
                                                        <div className={`text-xs leading-5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Holder:</span> {review.activeDetails?.accountHolderName || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Bank:</span> {review.activeDetails?.bankName || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Account #:</span> {review.activeDetails?.accountNumber || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Routing:</span> {review.activeDetails?.routingNumber || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Type:</span> {review.activeDetails?.accountType || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Country/Currency:</span> {review.activeDetails?.country || "-"} / {review.activeDetails?.currency || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>SWIFT:</span> {review.activeDetails?.swiftCode || "-"}</p>
                                                            <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>IBAN:</span> {review.activeDetails?.iban || "-"}</p>
                                                        </div>
                                                    ) : (
                                                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>No active bank details yet</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className={`text-xs leading-5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Attempts:</span> {Number(review.bankSecurity?.invalidAttempts || 0)} / 5</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Locked:</span> {review.bankSecurity?.isLocked ? "Yes" : "No"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Last invalid:</span> {review.bankSecurity?.lastInvalidAttemptAt ? new Date(review.bankSecurity.lastInvalidAttemptAt).toLocaleString() : "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Reason:</span> {review.bankSecurity?.lastInvalidReason || "-"}</p>
                                                        <p><span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Review status:</span> {review.status || "-"}</p>
                                                    </div>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{review.submittedAt ? new Date(review.submittedAt).toLocaleString() : "-"}</td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{review.dueAt ? new Date(review.dueAt).toLocaleString() : "-"}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {review.status === "pending" && (
                                                            <>
                                                                <button onClick={() => handleApproveBankReview(review._id)} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">✓ Approve</button>
                                                                <button onClick={() => handleRejectBankReview(review._id)} className="text-xs font-bold text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">✕ Reject</button>
                                                            </>
                                                        )}
                                                        {review.bankSecurity?.isLocked && (
                                                            <button onClick={() => handleUnblockBankReview(review._id)} className="text-xs font-bold text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">Unblock User</button>
                                                        )}
                                                    </div>
                                                    {review.adminNote ? (
                                                        <p className={`text-xs mt-2 max-w-[200px] ${isDark ? "text-gray-500" : "text-gray-500"}`}>Note: {review.adminNote}</p>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredBankReviews.length === 0 && (
                                            <tr><td colSpan={7} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No bank detail reviews found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "queries":
                return (
                    <div>
                        <h2 className={`text-xl font-extrabold mb-5 ${isDark ? "text-white" : "text-gray-900"}`}>
                            Contact Queries
                            <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({hasSearch ? filteredContacts.length : total})</span>
                        </h2>
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                                            {["Name", "Email", "Reason", "Message", "Date"].map((h) => (
                                                <th key={h} className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                                        {filteredContacts.map((c) => (
                                            <tr key={c._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                                                <td className={`px-5 py-3.5 text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{c.name}</td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{c.email}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        c.reason === "doubt" ? "bg-blue-100 text-blue-700" :
                                                        c.reason === "team" ? "bg-purple-100 text-purple-700" :
                                                        c.reason === "general" ? "bg-gray-100 text-gray-600" :
                                                        "bg-amber-100 text-amber-700"
                                                    }`}>
                                                        {c.reason === "doubt" ? "Question" : c.reason === "team" ? "Join Team" : c.reason === "general" ? "Feedback" : "Email"}
                                                    </span>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm max-w-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                    <p className="line-clamp-2">{c.message}</p>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {filteredContacts.length === 0 && (
                                            <tr><td colSpan={5} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No queries yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                    </div>
                );

            case "discount-codes":
                return (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Discount Codes
                                <span className={`ml-2 text-sm font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>({total})</span>
                            </h2>
                            <button
                                onClick={() => setDiscountCodeModal({})}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all"
                            >+ Create Code</button>
                        </div>
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200/60 shadow-sm"}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={isDark ? "bg-[#132744]" : "bg-gray-50"}>
                                            {["Code", "Type", "Value", "Used / Max", "Min Purchase", "Valid Until", "Status", "Actions"].map((h) => (
                                                <th key={h} className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? "divide-[#1a3050]" : "divide-gray-100"}`}>
                                        {discountCodes.map((dc) => (
                                            <tr key={dc._id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                                                <td className={`px-5 py-3.5 text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>{dc.code}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${dc.discountType === "percentage" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                        {dc.discountType === "percentage" ? "%" : "₹"}
                                                    </span>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                                    {dc.discountType === "percentage" ? `${dc.discountValue}%` : `₹${dc.discountValue}`}
                                                    {dc.maxDiscountAmount > 0 && dc.discountType === "percentage" && <span className={`text-xs ml-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>(max ₹{dc.maxDiscountAmount})</span>}
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{dc.usedCount} / {dc.maxUses || "∞"}</td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{dc.minPurchaseAmount > 0 ? `₹${dc.minPurchaseAmount}` : "—"}</td>
                                                <td className={`px-5 py-3.5 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{new Date(dc.validUntil).toLocaleDateString()}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${dc.isActive && new Date(dc.validUntil) > new Date() ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                        {dc.isActive && new Date(dc.validUntil) > new Date() ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setDiscountCodeModal(dc)} className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-500/10">Edit</button>
                                                        {dc.isActive && <button onClick={() => handleDeleteDiscountCode(dc._id)} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">Deactivate</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {discountCodes.length === 0 && (
                                            <tr><td colSpan={8} className={`px-5 py-10 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No discount codes yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isDark={isDark} />
                        {discountCodeModal !== null && <DiscountCodeFormModal initial={discountCodeModal} onClose={() => setDiscountCodeModal(null)} onSave={handleSaveDiscountCode} isDark={isDark} />}
                    </div>
                );

            default:
                return null;
        }
    };

    // ─── Reject Investor Modal ───
    const RejectInvestorModal = ({ investor, onClose, onConfirm }) => {
        const [note, setNote] = useState("");
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <div className={`w-full max-w-md mx-4 rounded-2xl p-6 ${isDark ? "bg-[#0f1d35] border border-[#1a3050]" : "bg-white shadow-2xl"}`} onClick={(e) => e.stopPropagation()}>
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Reject Investor</h3>
                    <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Rejecting <strong>{investor.name}</strong> ({investor.email}). They will not be able to log in.<br />
                        Optionally add a reason (visible to the user on login attempt).
                    </p>
                    <textarea
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Rejection reason (optional)..."
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border ${isDark ? "bg-[#0b1426] border-[#1a3050] text-gray-200 focus:border-red-500/50" : "bg-gray-50 border-gray-200 text-gray-800 focus:border-red-400"}`}
                    />
                    <div className="flex items-center justify-end gap-3 mt-4">
                        <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:bg-[#1a3050]" : "text-gray-500 hover:bg-gray-100"}`}>Cancel</button>
                        <button onClick={() => onConfirm(investor._id, note.trim())}
                            className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition-all">
                            Confirm Reject
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const UserDetailsModal = ({ user, onClose }) => {
        const writerLinks = user?.writerProfile?.links || {};
        const investorLinks = user?.industryProfile?.socialLinks || {};
        const mandates = user?.industryProfile?.mandates || {};
        const addressLine = [
            user?.address?.street,
            user?.address?.city,
            user?.address?.state,
            user?.address?.zipCode,
        ].filter(Boolean).join(", ");

        const detailRows = [
            { label: "Name", value: user?.name },
            { label: "Email", value: user?.email },
            { label: "Phone", value: user?.phone },
            { label: "Role", value: user?.role },
            { label: "SID", value: user?.sid },
            { label: "Date of Birth", value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "" },
            { label: "Address", value: addressLine || user?.address?.formatted },
            { label: "Joined", value: user?.createdAt ? new Date(user.createdAt).toLocaleString() : "" },
        ].filter((row) => row.value);

        const writerRows = [
            { label: "Username", value: user?.writerProfile?.username },
            { label: "Representation", value: user?.writerProfile?.representationStatus },
            { label: "Agency", value: user?.writerProfile?.agencyName },
            { label: "Demographic Privacy", value: user?.writerProfile?.demographicPrivacy },
            { label: "Gender", value: user?.writerProfile?.diversity?.gender },
            { label: "Nationality", value: user?.writerProfile?.diversity?.nationality },
            { label: "Ethnicity", value: user?.writerProfile?.diversity?.ethnicity },
            { label: "LGBTQ+", value: user?.writerProfile?.diversity?.lgbtqStatus },
            { label: "Disability", value: user?.writerProfile?.diversity?.disabilityStatus },
            { label: "Portfolio", value: writerLinks?.portfolio },
            { label: "Instagram", value: writerLinks?.instagram },
            { label: "Twitter", value: writerLinks?.twitter },
            { label: "LinkedIn", value: writerLinks?.linkedin },
            { label: "IMDb", value: writerLinks?.imdb },
            { label: "Facebook", value: writerLinks?.facebook },
            { label: "Accomplishments", value: Array.isArray(user?.writerProfile?.accomplishments) ? user.writerProfile.accomplishments.join(", ") : "" },
        ].filter((row) => row.value);

        const investorRows = [
            { label: "Sub Role", value: user?.industryProfile?.subRole },
            { label: "Company", value: user?.industryProfile?.company },
            { label: "Job Title", value: user?.industryProfile?.jobTitle },
            { label: "Investment Range", value: user?.industryProfile?.investmentRange },
            { label: "Previous Credits", value: user?.industryProfile?.previousCredits },
            { label: "Other URL", value: user?.industryProfile?.otherUrl },
            { label: "LinkedIn", value: user?.industryProfile?.linkedInUrl },
            { label: "IMDb", value: user?.industryProfile?.imdbUrl },
            { label: "Website", value: investorLinks?.website },
            { label: "Instagram", value: investorLinks?.instagram },
            { label: "Twitter", value: investorLinks?.twitter },
            { label: "YouTube", value: investorLinks?.youtube },
            { label: "Facebook", value: investorLinks?.facebook },
            { label: "Mandates Formats", value: Array.isArray(mandates?.formats) ? mandates.formats.join(", ") : "" },
            { label: "Mandates Genres", value: Array.isArray(mandates?.genres) ? mandates.genres.join(", ") : "" },
            { label: "Mandates Budget", value: Array.isArray(mandates?.budgetTiers) ? mandates.budgetTiers.join(", ") : "" },
        ].filter((row) => row.value);

        const sectionClass = `rounded-xl border p-4 ${isDark ? "border-[#1a3050] bg-[#0b1426]" : "border-gray-200 bg-gray-50"}`;

        return (
            <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <div className={`w-full max-w-3xl mx-4 rounded-2xl border max-h-[88vh] overflow-hidden ${isDark ? "bg-[#0f1d35] border-[#1a3050]" : "bg-white border-gray-200"}`} onClick={(e) => e.stopPropagation()}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-[#1a3050]" : "border-gray-200"}`}>
                        <div>
                            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>User Full Profile</h3>
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Writer / Investor complete details for admin review</p>
                        </div>
                        <button onClick={onClose} className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${isDark ? "text-gray-300 hover:bg-white/[0.08]" : "text-gray-600 hover:bg-gray-100"}`}>Close</button>
                    </div>

                    <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(88vh-74px)]">
                        <div className={sectionClass}>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Basic Info</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {detailRows.map((row) => (
                                    <div key={row.label}>
                                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>{row.label}</p>
                                        <p className={`text-sm mt-0.5 break-words ${isDark ? "text-gray-200" : "text-gray-800"}`}>{String(row.value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {writerRows.length > 0 && (
                            <div className={sectionClass}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Writer Profile</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {writerRows.map((row) => (
                                        <div key={row.label}>
                                            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>{row.label}</p>
                                            <p className={`text-sm mt-0.5 break-words ${isDark ? "text-gray-200" : "text-gray-800"}`}>{String(row.value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {investorRows.length > 0 && (
                            <div className={sectionClass}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Investor / Industry Profile</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {investorRows.map((row) => (
                                        <div key={row.label}>
                                            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>{row.label}</p>
                                            <p className={`text-sm mt-0.5 break-words ${isDark ? "text-gray-200" : "text-gray-800"}`}>{String(row.value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <>
        <div className="fixed inset-0 z-[9999] flex flex-col bg-[#060e1a] text-white overflow-hidden">
            {/* ─── Admin Header ─── */}
            <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-[#1a3050] bg-[#0b1628]">
                <div className="flex items-center gap-3">
                    <BrandLogo className="h-9 w-auto" />
                    <div>
                        <h1 className="text-sm font-extrabold tracking-tight text-white">Ckript Admin</h1>
                        <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Management Console</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:block w-72">
                        <SearchBar
                            value={searchInput}
                            onChange={setSearchInput}
                            placeholder={SEARCH_PLACEHOLDER_BY_TAB[activeTab] || "Search current section..."}
                            isDark={true}
                        />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden sm:block">Admin Mode</span>
                    <DownloadIconButton
                        onClick={handleDownloadWholeDashboardPdf}
                        disabled={exportingAll}
                        title={exportingAll ? "Preparing full dashboard PDF..." : "Download Complete Dashboard PDF"}
                        className="text-gray-400 hover:text-blue-300 hover:bg-blue-500/10 border-[#1a3050]"
                    />
                    <div className="w-px h-5 bg-[#1a3050] hidden sm:block"></div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Exit Admin
                    </button>
                </div>
            </header>

            {/* ─── Body ─── */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-[#1a3050] bg-[#0b1628] overflow-y-auto">
                    <div className="px-3 pt-4 pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 px-2">Navigation</p>
                    </div>
                    <nav className="flex-1 px-2 pb-4 space-y-0.5">
                        {TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === tab.key
                                    ? "bg-blue-500/15 text-blue-400"
                                    : "text-gray-400 hover:bg-[#132744] hover:text-gray-200"
                                    }`}>
                                <Icon d={tab.icon} className="w-4 h-4" />
                                <span className="flex-1 text-left">{tab.label}</span>
                                {getBadgeCountForTab(tab.key) > 0 && (
                                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-400/20 text-blue-300" : "bg-white/10 text-gray-200"}`}>
                                        {formatBadgeCount(getBadgeCountForTab(tab.key))}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Mobile tab bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a3050] bg-[#0b1628]/95 backdrop-blur-md">
                    <div className="flex overflow-x-auto gap-1 p-1.5">
                        {TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key
                                    ? "bg-blue-500/15 text-blue-400"
                                    : "text-gray-500"
                                    }`}>{tab.label}{getBadgeCountForTab(tab.key) > 0 ? ` ${formatBadgeCount(getBadgeCountForTab(tab.key))}` : ""}</button>
                        ))}
                    </div>
                </div>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="flex items-center justify-end mb-4">
                        <DownloadIconButton
                            onClick={handleDownloadCurrentSectionPdf}
                            disabled={loading || exportingCurrent}
                            title={exportingCurrent ? "Preparing section PDF..." : "Download This Section PDF"}
                            className={`${isDark ? "text-gray-300 hover:text-blue-300 hover:bg-blue-500/10 border-[#1a3050]" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-300"}`}
                        />
                    </div>
                    {renderContent()}
                </main>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[300] animate-[slideUp_0.3s_ease-out]">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm ${toast.type === "error"
                        ? "bg-red-500/90 border-red-400/30 text-white"
                        : toast.type === "info"
                            ? "bg-blue-500/90 border-blue-400/30 text-white"
                        : "bg-emerald-500/90 border-emerald-400/30 text-white"
                        }`}>
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={
                                toast.type === "error"
                                    ? "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                    : toast.type === "info"
                                        ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    : "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            } />
                        </svg>
                        <span className="text-sm font-semibold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Score Modal */}
            {scoreModal && <ScoreModal script={scoreModal} isDark={true} onClose={() => setScoreModal(null)} onSave={handleScore} />}

            {/* Reject Investor Modal */}
            {rejectModal && <RejectInvestorModal investor={rejectModal} onClose={() => setRejectModal(null)} onConfirm={handleRejectInvestor} />}

            {/* User Details Modal */}
            {selectedUserDetail && <UserDetailsModal user={selectedUserDetail} onClose={() => setSelectedUserDetail(null)} />}

        </div>

        <ConfirmDialog
            open={showLogoutConfirm}
            title="Exit admin mode"
            message="Are you sure you want to log out from admin mode?"
            confirmText="Exit"
            cancelText="Cancel"
            onConfirm={confirmLogout}
            onCancel={() => setShowLogoutConfirm(false)}
            isDarkMode={true}
        />
        </>
    );
};

export default AdminDashboard;
