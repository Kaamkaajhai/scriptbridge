const normalizeUsernameSegment = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]+/g, "");

const looksLikeObjectId = (value = "") => /^[a-f\d]{24}$/i.test(String(value || "").trim());
const looksLikeUserSid = (value = "") => /^[a-z]{3}-[a-z0-9]{8}$/i.test(String(value || "").trim());

export const getProfileCanonicalPath = (userRef = {}, options = {}) => {
  const rawUserId =
    typeof userRef === "string"
      ? String(userRef || "").trim()
      : String(userRef?._id || userRef?.id || "").trim();
  const username =
    typeof userRef === "string"
      ? normalizeUsernameSegment(userRef)
      : normalizeUsernameSegment(userRef?.writerProfile?.username || userRef?.username || "");

  const viewerId = String(options.viewerId || "").trim();
  const viewerRole = String(options.viewerRole || "").trim().toLowerCase();
  const isCurrentReaderProfile =
    viewerRole === "reader" &&
    rawUserId &&
    viewerId &&
    rawUserId === viewerId;

  if (isCurrentReaderProfile) {
    return `/reader/profile/${rawUserId}`;
  }

  if (username && !looksLikeObjectId(username) && !looksLikeUserSid(username)) {
    return `/${encodeURIComponent(username)}`;
  }

  if (rawUserId) {
    return `/profile/${encodeURIComponent(rawUserId)}`;
  }

  return "/profile";
};

export const normalizeProfileUsernameSegment = normalizeUsernameSegment;
