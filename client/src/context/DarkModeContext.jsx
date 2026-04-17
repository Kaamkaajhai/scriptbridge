import { createContext, useEffect, useContext, useState } from "react";

const DarkModeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });
const DARK_MODE_STORAGE_KEY = "sb-dark-mode";
const DARK_MODE_USER_SET_KEY = "sb-dark-mode-user-set";

const isStoredDarkModeValue = (value) => value === "1" || value === "0";

const getInitialDarkMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const storedPreference = localStorage.getItem(DARK_MODE_STORAGE_KEY);
  const wasUserSet = localStorage.getItem(DARK_MODE_USER_SET_KEY) === "1";

  if (wasUserSet && isStoredDarkModeValue(storedPreference)) {
    return storedPreference === "1";
  }

  // Keep a deterministic cross-browser default unless user explicitly chooses.
  return false;
};

const getInitialUserSetPreference = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(DARK_MODE_USER_SET_KEY) === "1";
};

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [isPreferenceUserSet, setIsPreferenceUserSet] = useState(getInitialUserSetPreference);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark-mode", isDarkMode);
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window !== "undefined" && isPreferenceUserSet) {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, isDarkMode ? "1" : "0");
      localStorage.setItem(DARK_MODE_USER_SET_KEY, "1");
    }
  }, [isDarkMode, isPreferenceUserSet]);

  const toggleDarkMode = () => {
    setIsPreferenceUserSet(true);
    setIsDarkMode((prev) => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

export default DarkModeContext;
