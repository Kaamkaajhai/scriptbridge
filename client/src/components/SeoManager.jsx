import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SITE_URL,
  aliasCanonicalMap,
  defaultSeo,
  noIndexPrefixes,
  publicSeoRoutes,
} from "../seo/seoRoutes";

function setMetaByName(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(url) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
}

function isNoIndexPath(pathname) {
  return noIndexPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function resolveCanonicalPath(pathname) {
  return aliasCanonicalMap[pathname] || pathname;
}

function getRouteSeo(pathname) {
  const canonicalPath = resolveCanonicalPath(pathname);
  return publicSeoRoutes.find((route) => route.path === canonicalPath) || defaultSeo;
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname || "/";
    const canonicalPath = resolveCanonicalPath(pathname);
    const seo = getRouteSeo(pathname);
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    const robots = isNoIndexPath(pathname) ? "noindex, nofollow" : "index, follow";

    document.title = seo.title || defaultSeo.title;

    setMetaByName("description", seo.description || defaultSeo.description);
    setMetaByName("robots", robots);
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", seo.title || defaultSeo.title);
    setMetaByName("twitter:description", seo.description || defaultSeo.description);
    setMetaByName("twitter:image", seo.image || defaultSeo.image);

    setMetaByProperty("og:type", "website");
    setMetaByProperty("og:site_name", "Ckript");
    setMetaByProperty("og:title", seo.title || defaultSeo.title);
    setMetaByProperty("og:description", seo.description || defaultSeo.description);
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByProperty("og:image", seo.image || defaultSeo.image);

    setCanonical(canonicalUrl);
  }, [location.pathname]);

  return null;
}