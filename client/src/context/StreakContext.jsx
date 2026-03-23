/**
 * StreakContext.jsx
 * ─────────────────
 * Tracks the reader's daily reading streak entirely in localStorage so it
 * works without any backend changes.  Exposes via React context:
 *
 *   streak         – current consecutive-day count
 *   longestStreak  – all-time best streak
 *   totalReads     – cumulative read sessions this account
 *   lastReadDate   – ISO date string (YYYY-MM-DD) of last recorded read
 *   todayRead      – boolean: has the user read anything today?
 *   recordRead()   – call this when the user opens a script
 *   resetStreak()  – for testing / logout
 */

import { createContext, useState, useEffect, useCallback, useContext } from "react";

const StreakContext = createContext(null);

const TODAY = () => new Date().toISOString().split("T")[0]; // "2026-03-05"
const YESTERDAY = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const STORAGE_KEY = "sb-streak";

const defaultState = () => ({
  streak: 0,
  longestStreak: 0,
  totalReads: 0,
  lastReadDate: null,
});

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
};

const save = (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota */ }
};

export const StreakProvider = ({ children }) => {
  const [state, setState] = useState(load);

  // Re-hydrate from storage when the tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setState(load());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const recordRead = useCallback(() => {
    setState((prev) => {
      const today     = TODAY();
      const yesterday = YESTERDAY();

      if (prev.lastReadDate === today) return prev; // already counted today

      let newStreak;
      if (prev.lastReadDate === yesterday) {
        // Extending the streak
        newStreak = prev.streak + 1;
      } else {
        // Missed a day — reset
        newStreak = 1;
      }

      const next = {
        streak:        newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        totalReads:    prev.totalReads + 1,
        lastReadDate:  today,
      };
      save(next);
      return next;
    });
  }, []);

  const resetStreak = useCallback(() => {
    const fresh = defaultState();
    save(fresh);
    setState(fresh);
  }, []);

  const todayRead = state.lastReadDate === TODAY();

  return (
    <StreakContext.Provider value={{ ...state, todayRead, recordRead, resetStreak }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error("useStreak must be used inside <StreakProvider>");
  return ctx;
};

export default StreakContext;
