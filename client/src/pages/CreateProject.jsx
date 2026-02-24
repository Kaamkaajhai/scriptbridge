import { useState, useEffect, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

/* ── Toolbar Button ─────────────────────────────────── */
const TBtn = ({ active, onClick, title, children, dark }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-150 ${
      active
        ? "bg-[#1e3a5f] text-white shadow-md shadow-[#1e3a5f]/25"
        : dark
          ? "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    }`}
  >
    {children}
  </button>
);

/* ── Color Palette ──────────────────────────────────── */
const COLORS = [
  "#ffffff", "#f87171", "#fb923c", "#fbbf24", "#34d399",
  "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#000000",
];

/* ── Divider ────────────────────────────────────────── */
const Divider = ({ dark }) => (
  <div className={`w-px h-6 mx-1 ${dark ? "bg-white/[0.08]" : "bg-gray-200"}`} />
);

/* ── Toolbar ────────────────────────────────────────── */
const EditorToolbar = ({ editor, dark }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  if (!editor) return null;

  return (
    <div className={`flex flex-wrap items-center gap-0.5 px-3 py-2 border-b ${
      dark ? "border-[#182840] bg-[#242424]" : "border-gray-200 bg-gray-50/80"
    }`}>
      {/* Text Style */}
      <TBtn dark={dark} active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
        H1
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        H2
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        H3
      </TBtn>

      <Divider dark={dark} />

      {/* Formatting */}
      <TBtn dark={dark} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
      </TBtn>

      <Divider dark={dark} />

      {/* Color */}
      <div className="relative">
        <TBtn dark={dark} active={showColorPicker} onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }} title="Text Color">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2L5.5 16h2.25l1.12-3h6.25l1.12 3h2.25L13 2h-2zm-1.38 9L12 4.67 14.38 11H9.62z"/><path d="M5 20h14v2H5z" fill={editor.getAttributes("textStyle").color || "currentColor"}/></svg>
        </TBtn>
        <AnimatePresence>
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className={`absolute top-full left-0 mt-2 p-2 rounded-xl border shadow-xl z-50 grid grid-cols-10 gap-1 ${
                dark ? "bg-[#101e30] border-[#1d3350]" : "bg-white border-gray-200"
              }`}
            >
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                  className="w-5 h-5 rounded-md border border-white/20 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className={`col-span-10 mt-1 text-[10px] py-1 rounded-md ${dark ? "text-gray-400 hover:bg-white/[0.06]" : "text-gray-500 hover:bg-gray-100"}`}
              >
                Reset Color
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Highlight */}
      <div className="relative">
        <TBtn dark={dark} active={editor.isActive("highlight") || showHighlightPicker} onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }} title="Highlight">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 14V8c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v6l-2 4v1h16v-1l-2-4zm-4 4H10v-1h4v1z"/></svg>
        </TBtn>
        <AnimatePresence>
          {showHighlightPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className={`absolute top-full left-0 mt-2 p-2 rounded-xl border shadow-xl z-50 grid grid-cols-10 gap-1 ${
                dark ? "bg-[#101e30] border-[#1d3350]" : "bg-white border-gray-200"
              }`}
            >
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false); }}
                  className="w-5 h-5 rounded-md border border-white/20 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                className={`col-span-10 mt-1 text-[10px] py-1 rounded-md ${dark ? "text-gray-400 hover:bg-white/[0.06]" : "text-gray-500 hover:bg-gray-100"}`}
              >
                Remove Highlight
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Divider dark={dark} />

      {/* Alignment */}
      <TBtn dark={dark} active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
      </TBtn>

      <Divider dark={dark} />

      {/* Lists */}
      <TBtn dark={dark} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
      </TBtn>

      <Divider dark={dark} />

      {/* Block */}
      <TBtn dark={dark} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11h18v2H3z"/></svg>
      </TBtn>

      <Divider dark={dark} />

      {/* Undo / Redo */}
      <TBtn dark={dark} active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
      </TBtn>
      <TBtn dark={dark} active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
      </TBtn>
    </div>
  );
};

/* ── Draft Card ─────────────────────────────────────── */
const DraftCard = ({ draft, onClick, onDelete, dark }) => {
  const wordCount = draft.textContent ? draft.textContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length : 0;
  const updated = new Date(draft.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`group rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
        dark
          ? "bg-[#101e30] border-[#182840] hover:border-[#1d3350] hover:shadow-lg hover:shadow-[#020609]/20"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/60"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className={`font-bold text-sm truncate ${dark ? "text-gray-100" : "text-gray-900"}`}>
            {draft.title || "Untitled Draft"}
          </h4>
          <p className={`text-xs mt-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
            {wordCount} words &middot; {updated}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(draft._id); }}
          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
            dark ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400" : "hover:bg-red-50 text-gray-300 hover:text-red-500"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <div className={`mt-3 flex items-center gap-2 ${dark ? "text-gray-600" : "text-gray-300"}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${draft.status === "draft" ? "bg-amber-400" : "bg-green-400"}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{draft.status || "draft"}</span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   CREATE PROJECT PAGE
   ═══════════════════════════════════════════════════════ */
const CreateProject = () => {
  const { isDarkMode: dark } = useDarkMode();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { draftId } = useParams();

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [scriptId, setScriptId] = useState(draftId || null);
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [showDrafts, setShowDrafts] = useState(!draftId);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: "Start writing your script...\n\nINT. LIVING ROOM - DAY\n\nA dimly lit room. The curtains sway gently...",
      }),
    ],
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none min-h-[500px] px-8 py-6 ${
          dark ? "prose-invert" : ""
        }`,
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(Boolean).length);
      setCharCount(text.length);
      setSaved(false);
    },
  });

  /* Load drafts */
  const fetchDrafts = useCallback(async () => {
    try {
      setLoadingDrafts(true);
      const { data } = await api.get("/scripts/my-drafts");
      setDrafts(Array.isArray(data) ? data : []);
    } catch {
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  /* Load a specific draft into editor */
  const loadDraft = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/scripts/${id}`);
      setTitle(data.title || "");
      setScriptId(data._id);
      if (editor && data.textContent) {
        editor.commands.setContent(data.textContent);
      }
      setShowDrafts(false);
    } catch {
      // Script not found
    }
  }, [editor]);

  useEffect(() => {
    if (draftId && editor) loadDraft(draftId);
  }, [draftId, editor, loadDraft]);

  /* Auto-save every 30s */
  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      if (!saved && editor.getHTML().length > 15) handleSave(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [editor, saved]);

  /* Save draft */
  const handleSave = async (auto = false) => {
    if (!editor) return;
    setSaving(true);
    try {
      const body = {
        title: title || "Untitled Draft",
        textContent: editor.getHTML(),
        ...(scriptId ? { scriptId } : {}),
      };
      const { data } = await api.post("/scripts/draft", body);
      setScriptId(data._id);
      setSaved(true);
      setLastSaved(new Date());
      if (!auto) fetchDrafts();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  /* Delete draft */
  const handleDeleteDraft = async (id) => {
    try {
      await api.delete(`/scripts/${id}`);
      setDrafts((prev) => prev.filter((d) => d._id !== id));
      if (scriptId === id) {
        setScriptId(null);
        setTitle("");
        editor?.commands.clearContent();
        setShowDrafts(true);
      }
    } catch {
      // ignore
    }
  };

  /* Publish — navigate to the full upload flow */
  const handlePublish = () => {
    if (scriptId) navigate(`/upload?draft=${scriptId}`);
    else navigate("/upload");
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate("/new-project")} className={`p-2 rounded-xl transition ${dark ? "hover:bg-white/[0.06] text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-2xl font-bold tracking-tight ${dark ? "text-gray-100" : "text-gray-900"}`}>
            Create Project
          </h1>
        </div>
        <p className={`text-sm ml-11 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          Draft your script with our rich text editor. Auto-saves every 30 seconds.
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Editor Panel ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex-1 min-w-0"
        >
          {/* Title Input */}
          <div className={`rounded-t-2xl border border-b-0 px-6 py-4 ${
            dark ? "bg-[#101e30] border-[#182840]" : "bg-white border-gray-200"
          }`}>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
              placeholder="Project Title"
              className={`w-full text-xl font-bold bg-transparent outline-none ${
                dark ? "text-gray-100 placeholder:text-gray-600" : "text-gray-900 placeholder:text-gray-300"
              }`}
            />
          </div>

          {/* Toolbar + Editor */}
          <div className={`rounded-b-2xl border overflow-hidden ${
            dark ? "bg-[#101e30] border-[#182840]" : "bg-white border-gray-200"
          }`}>
            <EditorToolbar editor={editor} dark={dark} />

            <div className={`${
              dark
                ? "[&_.tiptap]:text-gray-200 [&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-600 [&_.tiptap_h1]:text-white [&_.tiptap_h2]:text-gray-100 [&_.tiptap_h3]:text-gray-200 [&_.tiptap_blockquote]:border-[#1d3350] [&_.tiptap_blockquote]:text-gray-400 [&_.tiptap_code]:bg-white/[0.06] [&_.tiptap_pre]:bg-[#0f1e30] [&_.tiptap_pre_code]:text-gray-300 [&_.tiptap_hr]:border-[#182840]"
                : "[&_.tiptap_code]:bg-gray-100 [&_.tiptap_pre]:bg-gray-50 [&_.tiptap_blockquote]:border-gray-300 [&_.tiptap_hr]:border-gray-200"
            }`}>
              <EditorContent editor={editor} />
            </div>

            {/* Status bar */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-t text-xs ${
              dark ? "border-[#182840] bg-[#242424] text-gray-500" : "border-gray-100 bg-gray-50/80 text-gray-400"
            }`}>
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
              </div>
              <div className="flex items-center gap-3">
                {saving && (
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Saving...
                  </span>
                )}
                {saved && !saving && (
                  <span className="flex items-center gap-1.5 text-green-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved {lastSaved && `at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                dark
                  ? "border-[#1d3350] text-gray-300 hover:bg-white/[0.06] disabled:opacity-40"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              }`}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={handlePublish}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1e3a5f] text-white hover:bg-[#2a4a70] transition-all duration-200 shadow-lg shadow-[#1e3a5f]/20"
            >
              Continue to Publish
            </button>
          </div>
        </motion.div>

        {/* ── Drafts Sidebar ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:w-72 shrink-0"
        >
          <div className={`rounded-2xl border p-4 sticky top-4 ${
            dark ? "bg-[#101e30] border-[#182840]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${dark ? "text-gray-200" : "text-gray-800"}`}>
                My Drafts
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                dark ? "bg-white/[0.06] text-gray-400" : "bg-gray-100 text-gray-500"
              }`}>
                {drafts.length}
              </span>
            </div>

            {loadingDrafts ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-20 rounded-xl animate-pulse ${dark ? "bg-[#182840]" : "bg-gray-100"}`} />
                ))}
              </div>
            ) : drafts.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {drafts.map((d) => (
                  <DraftCard
                    key={d._id}
                    draft={d}
                    dark={dark}
                    onClick={() => loadDraft(d._id)}
                    onDelete={handleDeleteDraft}
                  />
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-xs font-medium">No drafts yet</p>
                <p className="text-[10px] mt-1 opacity-60">Start writing to create your first draft</p>
              </div>
            )}

            <button
              onClick={() => {
                setScriptId(null);
                setTitle("");
                editor?.commands.clearContent();
                setShowDrafts(false);
              }}
              className={`w-full mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                dark
                  ? "border-[#1d3350] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Draft
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateProject;
