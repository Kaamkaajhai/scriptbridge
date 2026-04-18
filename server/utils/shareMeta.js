const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const resolveClientBaseUrl = (req) => {
  const configured = trimTrailingSlash(process.env.CLIENT_URL || "");
  if (configured) return configured;

  const originHeader = trimTrailingSlash(req.get("origin") || "");
  if (originHeader) return originHeader;

  const host = req.get("host");
  if (host) {
    const protocol = req.protocol || "https";
    return `${protocol}://${host}`;
  }

  return "http://localhost:5173";
};

const getProfilePathByRole = (role, id, username = "") => {
  const normalizedRole = String(role || "").toLowerCase();
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const profileId = String(id || "").trim();
  const profileKey = normalizedUsername || profileId;
  if (!profileKey) return "/";

  if (normalizedRole === "reader") return `/share/profile/${encodeURIComponent(profileKey)}`;

  return `/share/profile/${encodeURIComponent(profileKey)}`;
};

export const buildUserShareMeta = (req, user = {}) => {
  const baseUrl = resolveClientBaseUrl(req);
  const username = user?.writerProfile?.username || user?.username || "";
  const path = getProfilePathByRole(user.role, user._id, username);
  const url = `${baseUrl}${path}`;
  const name = user.name || "Ckript User";
  const roleLabel = String(user.role || "member").toLowerCase();

  return {
    url,
    title: `${name} | Ckript`,
    text: `Check out ${name}'s ${roleLabel} profile on Ckript.`,
  };
};

export const buildScriptShareMeta = (req, script = {}) => {
  const baseUrl = resolveClientBaseUrl(req);
  const scriptId = String(script._id || "").trim();
  const url = `${baseUrl}${scriptId ? `/share/project/${scriptId}` : "/"}`;
  const title = script.title || "Project";
  const genre = script.primaryGenre || script.genre;
  const logline = script.logline || script.synopsis || script.description || "Explore this project on Ckript.";

  return {
    url,
    title: `${title} | Ckript`,
    text: genre ? `${title} (${genre}) - ${logline}` : `${title} - ${logline}`,
  };
};