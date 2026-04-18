import { TRACKING_CONSENT, TRACKING_KEYS } from "./constants";

const DAY = 60 * 60 * 24;

const canUseBrowserStorage = () => typeof window !== "undefined";

export const setCookie = (name, value, maxAgeSeconds = 365 * DAY) => {
  if (!canUseBrowserStorage()) return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
};

const readCookie = (name) => {
  if (!canUseBrowserStorage()) return "";
  const key = `${encodeURIComponent(name)}=`;
  const items = document.cookie.split(";");
  const found = items.find((item) => item.trim().startsWith(key));
  if (!found) return "";
  return decodeURIComponent(found.trim().slice(key.length));
};

const getStorage = () => {
  if (!canUseBrowserStorage()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const generateId = (prefix) => {
  const randomPart = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${randomPart}`;
};

export const getConsentStatus = () => {
  const storage = getStorage();
  const fromStorage = storage?.getItem(TRACKING_KEYS.consent);
  if (fromStorage === TRACKING_CONSENT.accepted || fromStorage === TRACKING_CONSENT.rejected) {
    return fromStorage;
  }

  const fromCookie = readCookie(TRACKING_KEYS.consent);
  if (fromCookie === TRACKING_CONSENT.accepted || fromCookie === TRACKING_CONSENT.rejected) {
    return fromCookie;
  }

  return "";
};

export const hasConsent = () => getConsentStatus() === TRACKING_CONSENT.accepted;

export const setConsentStatus = (status) => {
  if (!canUseBrowserStorage()) return;
  if (status !== TRACKING_CONSENT.accepted && status !== TRACKING_CONSENT.rejected) return;

  const storage = getStorage();
  storage?.setItem(TRACKING_KEYS.consent, status);
  setCookie(TRACKING_KEYS.consent, status);
};

export const getAnonymousId = () => {
  const storage = getStorage();
  const fromStorage = storage?.getItem(TRACKING_KEYS.anonymousId);
  if (fromStorage) return fromStorage;

  const fromCookie = readCookie(TRACKING_KEYS.anonymousId);
  if (fromCookie) {
    storage?.setItem(TRACKING_KEYS.anonymousId, fromCookie);
    return fromCookie;
  }

  return "";
};

export const ensureAnonymousId = () => {
  const storage = getStorage();
  let id = getAnonymousId();
  if (!id) {
    id = generateId("anon");
    storage?.setItem(TRACKING_KEYS.anonymousId, id);
    setCookie(TRACKING_KEYS.anonymousId, id);
  }

  if (!storage?.getItem(TRACKING_KEYS.firstSeen)) {
    storage?.setItem(TRACKING_KEYS.firstSeen, new Date().toISOString());
  }

  return id;
};

export const createSessionId = () => generateId("sess");

export const getSessionId = () => {
  const storage = getStorage();
  return storage?.getItem(TRACKING_KEYS.sessionId) || "";
};

export const ensureSessionId = () => {
  const storage = getStorage();
  let sessionId = getSessionId();
  if (!sessionId) {
    sessionId = createSessionId();
    storage?.setItem(TRACKING_KEYS.sessionId, sessionId);
  }
  return sessionId;
};

export const clearSessionId = () => {
  const storage = getStorage();
  storage?.removeItem(TRACKING_KEYS.sessionId);
};

export const wasReturnEventSentForSession = (sessionId) => {
  const storage = getStorage();
  return storage?.getItem(TRACKING_KEYS.returnEventSentForSession) === sessionId;
};

export const markReturnEventSentForSession = (sessionId) => {
  const storage = getStorage();
  storage?.setItem(TRACKING_KEYS.returnEventSentForSession, sessionId);
};

export const getLinkedUserKey = () => {
  const storage = getStorage();
  return storage?.getItem(TRACKING_KEYS.linkedUser) || "";
};

export const setLinkedUserKey = (value) => {
  const storage = getStorage();
  if (!storage) return;
  if (!value) {
    storage.removeItem(TRACKING_KEYS.linkedUser);
    return;
  }
  storage.setItem(TRACKING_KEYS.linkedUser, value);
};
