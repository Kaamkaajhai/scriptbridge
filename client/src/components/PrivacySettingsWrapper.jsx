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

  // Initialize PrivacySettingsUI instance on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new PrivacySettingsUI(
      containerRef.current,
      dark,
      userId,
      api
    );

    uiInstanceRef.current = instance;

    // Set initial state from parent if provided
    if (privacySettings) {
      instance.updateState(privacySettings);
      lastSyncedStateRef.current = JSON.stringify(privacySettings);
    }

    return () => {
      uiInstanceRef.current = null;
    };
  }, [dark, userId, api]);

  // Track incoming properties and update vanilla instance
  useEffect(() => {
    if (!uiInstanceRef.current || !privacySettings) return;

    const incoming = JSON.stringify(privacySettings);
    const current = JSON.stringify(uiInstanceRef.current.getState());

    // Skip no-op updates to avoid constant DOM re-renders
    if (incoming === current) {
      lastSyncedStateRef.current = incoming;
      return;
    }

    lastSyncedStateRef.current = incoming;
    uiInstanceRef.current.updateState(privacySettings);
  }, [privacySettings]);

  // Sync state from vanilla component back to React parent (polling)
  useEffect(() => {
    if (!uiInstanceRef.current) return;

    const syncInterval = setInterval(() => {
      const currentState = uiInstanceRef.current.getState();
      const stateJSON = JSON.stringify(currentState);

      // Only update if state has actually changed
      if (stateJSON !== lastSyncedStateRef.current) {
        lastSyncedStateRef.current = stateJSON;
        setPrivacySettings(currentState);
      }
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
