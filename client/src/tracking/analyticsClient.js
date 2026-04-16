import { getApiBaseUrl } from "../utils/apiOrigin";
import { ensureAnonymousId, ensureSessionId, hasConsent } from "./storage";
import { trackFirebaseEvent } from "./firebaseTracking";

const API_BASE_URL = getApiBaseUrl();

const syncFirebaseTracking = (kind, payload) => {
  if (!hasConsent()) return;

  const baseName = kind === "session" ? "session_event" : (payload?.eventType || "event");

  void trackFirebaseEvent(baseName, {
    session_id: payload?.sessionId || "",
    anonymous_id: payload?.anonymousId || "",
    action: payload?.action || "",
    path: payload?.path || "",
    event_kind: kind,
    user_id: payload?.userContext?.userId || "",
    is_returning: Boolean(payload?.isReturning),
  });
};

const getAuthHeader = () => {
  try {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return {};
    const parsed = JSON.parse(userRaw);
    if (!parsed?.token) return {};
    return { Authorization: `Bearer ${parsed.token}` };
  } catch {
    return {};
  }
};

const postJson = async (url, payload, { preferBeacon = false } = {}) => {
  if (!hasConsent()) return;

  const body = JSON.stringify(payload);

  if (preferBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      credentials: "include",
      keepalive: preferBeacon,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body,
    });
  } catch {
    // Best effort analytics.
  }
};

const getDeviceType = () => {
  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  if (width && width <= 768) return "mobile";
  if (width && width <= 1024) return "tablet";
  return "desktop";
};

const getDeviceInfo = () => {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";

  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return {
    deviceType: getDeviceType(),
    browser,
    os,
    userAgent: ua,
  };
};

export const getTrackingContext = () => ({
  anonymousId: ensureAnonymousId(),
  sessionId: ensureSessionId(),
  consent: hasConsent(),
  device: getDeviceInfo(),
});

export const sendTrackEvent = async (payload, options = {}) => {
  const context = getTrackingContext();
  const outboundPayload = {
    ...context,
    ...payload,
    timestamp: payload?.timestamp || new Date().toISOString(),
  };

  await postJson(`${API_BASE_URL}/track-event`, {
    ...outboundPayload,
  }, options);

  syncFirebaseTracking("event", outboundPayload);
};

export const sendTrackSession = async (payload, options = {}) => {
  const context = getTrackingContext();
  const outboundPayload = {
    ...context,
    ...payload,
  };

  await postJson(`${API_BASE_URL}/track-session`, {
    ...outboundPayload,
  }, options);

  syncFirebaseTracking("session", outboundPayload);
};
