const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5002")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Keep absolute and special URLs untouched.
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${path}`;
};
