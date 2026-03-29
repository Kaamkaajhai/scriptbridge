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

const getProfilePathByRole = (role, id) => {
  const normalizedRole = String(role || "").toLowerCase();
  const profileId = String(id || "").trim();
  if (!profileId) return "/profile";

  if (normalizedRole === "reader") {
    return `/reader/profile/${profileId}`;
  }

  return `/profile/${profileId}`;
};

export const buildUserShareMeta = (req, user = {}) => {
  const baseUrl = resolveClientBaseUrl(req);
  const path = getProfilePathByRole(user.role, user._id);
  const url = `${baseUrl}${path}`;
  const name = user.name || "ScriptBridge User";
  const roleLabel = String(user.role || "member").toLowerCase();

  return {
    url,
    title: `${name} | ScriptBridge`,
    text: `Check out ${name}'s ${roleLabel} profile on ScriptBridge.`,
  };
};

export const buildScriptShareMeta = (req, script = {}) => {
  const baseUrl = resolveClientBaseUrl(req);
  const scriptId = String(script._id || "").trim();
  const url = `${baseUrl}${scriptId ? `/script/${scriptId}` : "/"}`;
  const title = script.title || "Project";
  const genre = script.primaryGenre || script.genre;
  const logline = script.logline || script.synopsis || script.description || "Explore this project on ScriptBridge.";

  return {
    url,
    title: `${title} | ScriptBridge`,
    text: genre ? `${title} (${genre}) - ${logline}` : `${title} - ${logline}`,
  };
};