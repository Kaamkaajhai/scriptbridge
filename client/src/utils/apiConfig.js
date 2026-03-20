const normalizeOrigin = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  // Accept either origin (http://host) or API base (http://host/api) from env.
  return trimmed.replace(/\/api\/?$/i, "").replace(/\/$/, "");
};

export const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_URL);
export const API_BASE_URL = `${API_ORIGIN}/api`;

export const toAbsoluteApiUrl = (path = "") => {
  const safePath = String(path);
  if (!safePath) return API_ORIGIN;
  if (safePath.startsWith("http://") || safePath.startsWith("https://")) return safePath;
  return `${API_ORIGIN}${safePath.startsWith("/") ? "" : "/"}${safePath}`;
};
