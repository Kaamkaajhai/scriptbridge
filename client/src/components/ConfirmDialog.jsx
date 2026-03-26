import { useEffect } from "react";

const ConfirmDialog = ({
  open,
  title = "Confirm action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDarkMode = false,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      <div
        className={`relative w-[min(92vw,430px)] rounded-2xl border p-5 shadow-2xl ${
          isDarkMode
            ? "bg-[#0d1520]/95 border-[#1e2f45] text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <p className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</p>
          <p className={`mt-1.5 text-sm leading-relaxed ${isDarkMode ? "text-[#9bb1c9]" : "text-gray-600"}`}>
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              isDarkMode ? "text-[#9bb1c9] hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#1e3a5f] text-white hover:bg-[#2a4b77] transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;