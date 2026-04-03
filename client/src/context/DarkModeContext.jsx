import { createContext, useEffect, useContext, useState } from "react";

const DarkModeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });
const DARK_MODE_STORAGE_KEY = "sb-dark-mode";

const getInitialDarkMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const storedPreference = localStorage.getItem(DARK_MODE_STORAGE_KEY);
  if (storedPreference === "1") return true;
  if (storedPreference === "0") return false;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
};

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark-mode", isDarkMode);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, isDarkMode ? "1" : "0");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

export default DarkModeContext;
