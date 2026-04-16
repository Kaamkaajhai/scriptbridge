import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import { getApiBaseUrl } from "../utils/apiOrigin";
import { formatCurrency } from "../utils/currency";
import { resolveMediaUrl } from "../utils/mediaUrl";

const SCRIPT_LINES_PER_PAGE = 42;

const adminApi = axios.create({ baseURL: getApiBaseUrl() });

adminApi.interceptors.request.use((config) => {
  const adminSession = sessionStorage.getItem("admin-session");
  if (adminSession) {
    try {
      const { token } = JSON.parse(adminSession);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore malformed admin session and allow request to fail with 401.
    }
  }
  return config;
});

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPlainTextFromScriptContent = (content) => {
  const source = String(content || "");
  if (!source) return "";

  const maybeHtml = source.trimStart().startsWith("<");
  if (!maybeHtml) return source;

  // Convert common HTML boundaries to line breaks, then strip tags.
  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n");
};

const AdminScriptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [script, setScript] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  const hasAdminSession = useMemo(() => {
    const raw = sessionStorage.getItem("admin-session");
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.token);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!hasAdminSession) {
      navigate("/admin", { replace: true });
      return;
    }

    const fetchScript = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await adminApi.get(`/admin/scripts/${id}`);
        setScript(data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/admin", { replace: true });
          return;
        }
        setError(err?.response?.data?.message || "Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [hasAdminSession, id, navigate]);

  const handleDelete = async () => {
    if (!script?._id || script?.isDeleted) return;
    const confirmed = window.confirm("Delete this project from platform listings?");
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      setNotice("");
      const { data } = await adminApi.delete(`/admin/scripts/${script._id}`);
      setScript((prev) => (prev ? { ...prev, isDeleted: true, deletedAt: new Date().toISOString() } : prev));
      setNotice(data?.message || "Project deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete project.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const rawContent = typeof script?.textContent === "string" ? script.textContent : "";
  const plainScriptText = useMemo(() => getPlainTextFromScriptContent(rawContent), [rawContent]);
  const scriptPages = useMemo(() => {
    const normalized = plainScriptText.replace(/\r\n/g, "\n").trim();
    if (!normalized) return [];

    const lines = normalized.split("\n");
    const pages = [];
    for (let i = 0; i < lines.length; i += SCRIPT_LINES_PER_PAGE) {
      pages.push(lines.slice(i, i + SCRIPT_LINES_PER_PAGE).join("\n").trimEnd());
    }
    return pages;
  }, [plainScriptText]);

  const totalPages = scriptPages.length;
  const currentPage = totalPages > 0 ? scriptPages[Math.min(Math.max(activePage, 1), totalPages) - 1] : "";

  useEffect(() => {
    setActivePage(1);
  }, [script?._id, plainScriptText]);

  useEffect(() => {
    setPageInput(String(Math.min(Math.max(activePage, 1), Math.max(totalPages, 1))));
  }, [activePage, totalPages]);

  const handleJumpToPage = () => {
    if (!totalPages) return;
    const parsed = Number.parseInt(String(pageInput || "").trim(), 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(activePage));
      return;
    }
    const targetPage = Math.min(totalPages, Math.max(1, parsed));
    setActivePage(targetPage);
    setPageInput(String(targetPage));
  };

  const handleDownloadScript = () => {
    const normalized = plainScriptText.replace(/\r\n/g, "\n").trim();
    if (!normalized) return;

    const title = String(script?.title || "script").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const filename = `${title || "script"}_full_script.pdf`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 44;
    const topY = 54;
    const usableWidth = pageWidth - marginX * 2;

    const pdfPages = scriptPages.length > 0 ? scriptPages : [normalized];

    pdfPages.forEach((pageText, index) => {
      if (index > 0) doc.addPage("a4", "portrait");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(String(script?.title || "Script"), marginX, 32, { maxWidth: usableWidth });

      doc.setFont("courier", "normal");
      doc.setFontSize(11);
      const wrappedLines = doc.splitTextToSize(pageText || "", usableWidth);
      doc.text(wrappedLines, marginX, topY, { baseline: "top" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Page ${index + 1} / ${pdfPages.length}`, pageWidth - marginX, pageHeight - 24, {
        align: "right",
      });
    });

    doc.save(filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b16] text-white flex items-center justify-center px-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-white/80 animate-spin" />
      </div>
    );
  }

  if (error && !script) {
    return (
      <div className="min-h-screen bg-[#050b16] text-white px-4 py-10">
        <div className="max-w-4xl mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-200 text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b16] text-white px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold"
            >
              Back
            </button>
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold"
            >
              Admin Dashboard
            </Link>
          </div>

          {!script?.isDeleted && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-lg border border-red-400/30 bg-red-500/15 hover:bg-red-500/25 text-red-100 text-xs sm:text-sm font-bold disabled:opacity-60"
            >
              {deleteLoading ? "Deleting..." : "Delete Project"}
            </button>
          )}
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#0c1527] overflow-hidden">
          {(script?.coverImage || script?.trailerThumbnail) && (
            <div className="h-52 sm:h-72 bg-black/30">
              <img
                src={resolveMediaUrl(script?.trailerThumbnail || script?.coverImage)}
                alt={script?.title || "Project cover"}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{script?.title || "Untitled"}</h1>
                <p className="text-sm text-white/65 mt-1">Writer: {script?.creator?.name || "Unknown"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5">{script?.status || "-"}</span>
                <span className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5">{script?.format || "-"}</span>
                <span className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5">{formatCurrency(script?.price || 0)} INR</span>
                {script?.isDeleted && (
                  <span className="px-2.5 py-1 rounded-lg border border-red-400/35 bg-red-500/20 text-red-100">Deleted</span>
                )}
              </div>
            </div>

            {script?.logline && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-white/45 mb-2">Logline</p>
                <p className="text-sm text-white/85 italic">{script.logline}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/45 mb-1">Project ID</p>
                <p className="text-xs text-white/80 break-all">{script?.sid || script?._id || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/45 mb-1">Created</p>
                <p className="text-xs text-white/80">{formatDateTime(script?.createdAt)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/45 mb-1">Published</p>
                <p className="text-xs text-white/80">{formatDateTime(script?.publishedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c1527] p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-white/45 mb-3">Full Synopsis</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/90">
            {script?.synopsis || "No synopsis provided."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c1527] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-white/45">Main Script</p>
            <div className="flex items-center gap-2">
              {totalPages > 0 && (
                <p className="text-xs text-white/45">
                  Page {Math.min(activePage, totalPages)} / {totalPages}
                </p>
              )}
              <button
                type="button"
                onClick={handleDownloadScript}
                disabled={!plainScriptText.trim()}
                className="px-3 py-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download
              </button>
            </div>
          </div>

          {currentPage ? (
            <>
              <div className="mx-auto w-full max-w-[794px] aspect-[210/297] bg-white text-slate-900 rounded-md shadow-[0_18px_48px_rgba(0,0,0,0.35)] border border-slate-200 overflow-hidden">
                <div className="h-full p-6 sm:p-10 lg:p-12 overflow-hidden">
                  <pre
                    className="h-full whitespace-pre-wrap break-words text-[13px] sm:text-[14px] leading-[1.55]"
                    style={{ fontFamily: '"Courier Prime", "Courier New", Courier, monospace' }}
                  >
                    {currentPage}
                  </pre>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="admin-script-page-search" className="text-xs text-white/70 font-medium">
                      Go to page
                    </label>
                    <input
                      id="admin-script-page-search"
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={(event) => setPageInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleJumpToPage();
                        }
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                    />
                    <button
                      type="button"
                      onClick={handleJumpToPage}
                      className="px-3 py-1.5 rounded-lg border border-blue-400/40 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 text-xs font-semibold"
                    >
                      Open
                    </button>
                    <span className="text-xs text-white/50">of {totalPages}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                    disabled={activePage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="text-xs text-white/60 font-medium">Showing script page-wise preview</div>
                  <button
                    type="button"
                    onClick={() => setActivePage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={activePage >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-white/55">No script body found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminScriptView;
