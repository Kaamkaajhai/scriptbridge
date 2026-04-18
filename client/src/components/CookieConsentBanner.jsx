import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { TRACKING_CONSENT } from "../tracking/constants";
import { getConsentStatus, setConsentStatus } from "../tracking/storage";

const CookieConsentBanner = () => {
  const location = useLocation();
  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus(getConsentStatus());
  }, []);

  const shouldShow = useMemo(() => {
    const onLanding = location.pathname === "/";
    return onLanding && !status;
  }, [location.pathname, status]);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-2xl md:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-gray-700">
          We use cookies to improve experience and analytics. Read our {" "}
          <Link to="/privacy-policy" className="font-semibold text-blue-700 underline underline-offset-2">
            privacy policy
          </Link>.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setConsentStatus(TRACKING_CONSENT.rejected);
              setStatus(TRACKING_CONSENT.rejected);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              setConsentStatus(TRACKING_CONSENT.accepted);
              setStatus(TRACKING_CONSENT.accepted);
              window.dispatchEvent(new CustomEvent("ckript-consent-updated", { detail: { status: TRACKING_CONSENT.accepted } }));
            }}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
