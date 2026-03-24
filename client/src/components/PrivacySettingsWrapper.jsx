import { useEffect, useRef } from "react";
import PrivacySettingsUI from "./PrivacySettingsVanilla";

/**
 * React wrapper for vanilla JavaScript Privacy Settings UI
 * Integrates PrivacySettingsUI class with React lifecycle
 */
const PrivacySettings = ({ dark, privacySettings, setPrivacySettings, userId, api }) => {
  const containerRef = useRef(null);
  const uiInstanceRef = useRef(null);
<<<<<<< HEAD
  const lastSyncedStateRef = useRef("");
=======
>>>>>>> origin/master

  useEffect(() => {
    if (!containerRef.current) return;

    // Pass the DOM element directly, not a selector string, along with userId and api service
    uiInstanceRef.current = new PrivacySettingsUI(containerRef.current, dark, userId, api);

    if (privacySettings) {
      uiInstanceRef.current.updateState(privacySettings);
<<<<<<< HEAD
      lastSyncedStateRef.current = JSON.stringify(privacySettings);
=======
>>>>>>> origin/master
    }

    return () => {
      uiInstanceRef.current = null;
    };
  }, [dark, userId, api]);

  useEffect(() => {
    if (!uiInstanceRef.current || !privacySettings) return;
<<<<<<< HEAD

    const incoming = JSON.stringify(privacySettings);
    const current = JSON.stringify(uiInstanceRef.current.getState());

    // Skip no-op updates to avoid constant DOM re-renders in the vanilla component.
    if (incoming === current) {
      lastSyncedStateRef.current = incoming;
      return;
    }

    lastSyncedStateRef.current = incoming;
=======
>>>>>>> origin/master
    uiInstanceRef.current.updateState(privacySettings);
  }, [privacySettings]);

  // Sync state changes back to React parent
  useEffect(() => {
    if (!uiInstanceRef.current || !setPrivacySettings) return;

    // Create an interval to check for state changes
    const syncInterval = setInterval(() => {
      const currentState = uiInstanceRef.current.getState();
<<<<<<< HEAD
      const serialized = JSON.stringify(currentState);

      if (serialized === lastSyncedStateRef.current) return;

      lastSyncedStateRef.current = serialized;
=======
>>>>>>> origin/master
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
