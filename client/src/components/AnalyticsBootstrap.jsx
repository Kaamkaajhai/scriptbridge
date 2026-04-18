import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { hasConsent } from "../tracking/storage";
import { useClickTracking } from "../tracking/useClickTracking";
import { usePageTracking } from "../tracking/usePageTracking";

const AnalyticsBootstrap = () => {
  const { user } = useContext(AuthContext);
  const [enabled, setEnabled] = useState(hasConsent());

  useEffect(() => {
    const onConsentChange = () => {
      setEnabled(hasConsent());
    };

    window.addEventListener("ckript-consent-updated", onConsentChange);
    window.addEventListener("storage", onConsentChange);

    return () => {
      window.removeEventListener("ckript-consent-updated", onConsentChange);
      window.removeEventListener("storage", onConsentChange);
    };
  }, []);

  usePageTracking({ user: enabled ? user : null, enabled });
  useClickTracking({ user: enabled ? user : null, enabled });

  return null;
};

export default AnalyticsBootstrap;
