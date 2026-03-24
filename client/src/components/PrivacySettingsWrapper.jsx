import { useEffect, useRef } from "react";
import PrivacySettingsUI from "./PrivacySettingsVanilla";

/**
 * React wrapper for vanilla JavaScript Privacy Settings UI
 * Integrates PrivacySettingsUI class with React lifecycle
 */
const PrivacySettings = ({ dark, privacySettings, setPrivacySettings, userId, api }) => {
  const containerRef = useRef(null);
  const uiInstanceRef = useRef(null);
  const lastSyncedStateRef = useRef("");
    }

    return () => {
      uiInstanceRef.current = null;
    };
  }, [dark, userId, api]);

  useEffect(() => {
    if (!uiInstanceRef.current || !privacySettings) return;

    const incoming = JSON.stringify(privacySettings);
    const current = JSON.stringify(uiInstanceRef.current.getState());

    // Skip no-op updates to avoid constant DOM re-renders in the vanilla component.
    if (incoming === current) {
      lastSyncedStateRef.current = incoming;
      return;
    }

    lastSyncedStateRef.current = incoming;
      setPrivacySettings(currentState);
    }, 500);

    return () => clearInterval(syncInterval);
  }, [setPrivacySettings]);

  // Optional: Update blocked users when they change in parent
  useEffect(() => {
    if (uiInstanceRef.current && privacySettings?.blockedUsers) {
      uiInstanceRef.current.setBlockedUsers(privacySettings.blockedUsers);
    }
  }, [privacySettings?.blockedUsers]);

  return <div ref={containerRef} className="w-full" />;
};

export default PrivacySettings;
