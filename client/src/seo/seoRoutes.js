export const SITE_URL = "https://ckript.com";

export const defaultSeo = {
  title: "Ckript | Script Collaboration Platform",
  description:
    "Ckript is a collaborative platform for scriptwriters, readers, producers, and investors to discover scripts, build teams, and move film projects forward.",
  image: `${SITE_URL}/ckript.com-logo.png`,
};

// Public pages that can be indexed and included in sitemap.xml.
export const publicSeoRoutes = [
  {
    path: "/",
    title: "Ckript | Script Collaboration Platform",
    description:
      "Discover scripts, connect with creators, and collaborate with producers and investors on Ckript.",
    changefreq: "daily",
    priority: "1.0",
  },
  {
    path: "/contact",
    title: "Contact Ckript",
    description:
      "Get in touch with Ckript for support, collaboration opportunities, and partnership questions.",
    changefreq: "monthly",
    priority: "0.6",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | Ckript",
    description:
      "Read Ckript's privacy policy and learn how data is collected, used, and protected.",
    changefreq: "yearly",
    priority: "0.5",
  },
  {
    path: "/terms-of-service",
    title: "Terms of Service | Ckript",
    description:
      "Review Ckript's terms of service, platform conditions, and user responsibilities.",
    changefreq: "yearly",
    priority: "0.5",
  },
  {
    path: "/registration-privacy-policy",
    title: "Registration Privacy Policy | Ckript",
    description:
      "Understand registration-specific privacy disclosures for creating a Ckript account.",
    changefreq: "yearly",
    priority: "0.4",
  },
  {
    path: "/terms-conditions",
    title: "Terms and Conditions | Ckript",
    description:
      "Read the terms and conditions for writers and investors using Ckript.",
    changefreq: "yearly",
    priority: "0.4",
  },
  {
    path: "/script-upload-terms",
    title: "Script Upload Terms and Conditions | Ckript",
    description:
      "Review the rules and policies for uploading scripts on Ckript.",
    changefreq: "yearly",
    priority: "0.4",
  },
];

export const aliasCanonicalMap = {
  "/privacy": "/privacy-policy",
  "/terms": "/terms-of-service",
  "/t-and-c": "/terms-of-service",
};

// Authenticated and app-internal pages should not be indexed.
export const noIndexPrefixes = [
  "/login",
  "/join",
  "/signup",
  "/writer-onboarding",
  "/producer-director-onboarding",
  "/investor-onboarding",
  "/industry-onboarding",
  "/top-list",
  "/featured",
  "/trending",
  "/profile",
  "/dashboard",
  "/credits",
  "/purchase-requests",
  "/new-project",
  "/ai-tools",
  "/offer-holds",
  "/create-project",
  "/upload",
  "/search",
  "/script",
  "/mandates",
  "/writers",
  "/home",
  "/messages",
  "/reader",
  "/admin",
];