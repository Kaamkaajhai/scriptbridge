const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "scriptbridge:language";
const GOOGLE_TRANSLATE_CONTAINER_ID = "google_translate_element";
const GOOGLE_TRANSLATE_SCRIPT_ID = "google_translate_script";
const GOOGLE_TRANSLATE_READY_EVENT = "scriptbridge-google-translate-ready";
const GOOGLE_CALLBACK_NAME = "__scriptbridgeGoogleTranslateInit";
const TRANSLATE_CLEANUP_INTERVAL_MS = 250;
const TRANSLATE_CLEANUP_MAX_TICKS = 24;

let translateChromeCleanupInterval = null;

const LANGUAGE_CODE_MAP = {
  zh: "zh-CN",
};

const SUPPORTED_TRANSLATE_LANGUAGES = ["en", "hi", "es", "fr", "de", "ja", "ko", "zh-CN"];

const normalizeLanguageCode = (language) => {
  const raw = String(language || DEFAULT_LANGUAGE).trim();
  const mapped = LANGUAGE_CODE_MAP[raw] || raw;
  if (!SUPPORTED_TRANSLATE_LANGUAGES.includes(mapped)) {
    return DEFAULT_LANGUAGE;
  }
  return mapped;
};

const getCookieValue = (name) => {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

const setCookie = (name, value, domain) => {
  if (typeof document === "undefined") return;
  const domainPart = domain ? `;domain=${domain}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)};path=/${domainPart}`;
};

const setGoogleTranslateCookie = (targetLanguage) => {
  if (typeof window === "undefined") return;
  const cookieValue = `/en/${targetLanguage}`;
  setCookie("googtrans", cookieValue);

  const host = window.location.hostname;
  if (host && host.includes(".")) {
    setCookie("googtrans", cookieValue, `.${host}`);
  }
};

const hideTranslateChrome = () => {
  if (typeof document === "undefined") return;

  const selectors = [
    ".goog-te-banner-frame",
    ".goog-te-balloon-frame",
    ".VIpgJd-ZVi9od-ORHb-OEVmcd",
    ".VIpgJd-ZVi9od-aZ2wEe-wOHMyf",
    ".VIpgJd-ZVi9od-aZ2wEe-OiiCO",
    ".VIpgJd-ZVi9od-xl07Ob-OEVmcd",
    "iframe.goog-te-banner-frame",
    "iframe.VIpgJd-ZVi9od-xl07Ob-OEVmcd",
    "#goog-gt-tt",
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.style.setProperty("height", "0", "important");
    });
  });

  if (document.body) {
    document.body.style.setProperty("top", "0px", "important");
    document.body.style.setProperty("position", "static", "important");
  }

  if (document.documentElement) {
    document.documentElement.style.setProperty("top", "0px", "important");
  }
};

const scheduleTranslateChromeCleanup = () => {
  if (typeof window === "undefined") return;

  hideTranslateChrome();

  if (translateChromeCleanupInterval) {
    window.clearInterval(translateChromeCleanupInterval);
    translateChromeCleanupInterval = null;
  }

  let tick = 0;
  translateChromeCleanupInterval = window.setInterval(() => {
    hideTranslateChrome();
    tick += 1;

    if (tick >= TRANSLATE_CLEANUP_MAX_TICKS) {
      window.clearInterval(translateChromeCleanupInterval);
      translateChromeCleanupInterval = null;
    }
  }, TRANSLATE_CLEANUP_INTERVAL_MS);
};

const ensureTranslateContainer = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(GOOGLE_TRANSLATE_CONTAINER_ID)) return;

  const container = document.createElement("div");
  container.id = GOOGLE_TRANSLATE_CONTAINER_ID;
  container.style.display = "none";
  document.body.appendChild(container);
};

const notifyTranslateReady = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GOOGLE_TRANSLATE_READY_EVENT));
};

const initializeTranslateWidget = () => {
  if (!window.google?.translate?.TranslateElement) return;

  ensureTranslateContainer();

  const existingWidget = document.querySelector(".goog-te-combo");
  if (!existingWidget) {
    // This hidden widget is used only as an engine for page-wide translations.
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
        includedLanguages: SUPPORTED_TRANSLATE_LANGUAGES.join(","),
      },
      GOOGLE_TRANSLATE_CONTAINER_ID,
    );
  }

  scheduleTranslateChromeCleanup();
  notifyTranslateReady();
};

const ensureGoogleTranslateScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (window.google?.translate?.TranslateElement) {
    initializeTranslateWidget();
    return;
  }

  if (!window[GOOGLE_CALLBACK_NAME]) {
    window[GOOGLE_CALLBACK_NAME] = initializeTranslateWidget;
  }

  if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) return;

  ensureTranslateContainer();

  const script = document.createElement("script");
  script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
  script.src = `https://translate.google.com/translate_a/element.js?cb=${GOOGLE_CALLBACK_NAME}`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    notifyTranslateReady();
  };
  document.body.appendChild(script);
};

const waitForTranslateWidget = (timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.google?.translate?.TranslateElement && document.querySelector(".goog-te-combo")) {
      resolve(true);
      return;
    }

    let resolved = false;
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener(GOOGLE_TRANSLATE_READY_EVENT, onReady);
      clearTimeout(timer);
      resolve(result);
    };

    const onReady = () => {
      const hasCombo = Boolean(document.querySelector(".goog-te-combo"));
      finish(hasCombo);
    };

    window.addEventListener(GOOGLE_TRANSLATE_READY_EVENT, onReady, { once: true });
    const timer = setTimeout(() => finish(Boolean(document.querySelector(".goog-te-combo"))), timeoutMs);
  });

const applyTranslateWidgetLanguage = (languageCode) => {
  if (typeof document === "undefined") return false;
  const combo = document.querySelector(".goog-te-combo");
  if (!combo) return false;

  if (combo.value !== languageCode) {
    combo.value = languageCode;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return true;
};

export const getStoredLanguagePreference = () => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  return normalizeLanguageCode(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE);
};

export const applyLanguagePreference = async (language, options = {}) => {
  if (typeof window === "undefined") return;

  const { forceReload = false } = options;
  const targetLanguage = normalizeLanguageCode(language);

  window.localStorage.setItem(STORAGE_KEY, targetLanguage);
  document.documentElement.lang = targetLanguage;

  const previousCookie = getCookieValue("googtrans");
  const nextCookie = `/en/${targetLanguage}`;
  setGoogleTranslateCookie(targetLanguage);

  ensureGoogleTranslateScript();
  const hasWidget = await waitForTranslateWidget();
  const appliedInPlace = hasWidget ? applyTranslateWidgetLanguage(targetLanguage) : false;
  scheduleTranslateChromeCleanup();

  if (forceReload && !appliedInPlace && previousCookie !== nextCookie) {
    window.location.reload();
  }
};
