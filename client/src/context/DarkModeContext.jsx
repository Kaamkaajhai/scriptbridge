import { createContext, useState, useEffect, useContext } from "react";

const DarkModeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sb-dark-mode") === "1";
  });

  useEffect(() => {
    localStorage.setItem("sb-dark-mode", isDarkMode ? "1" : "0");
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  // Apply on initial mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    }
  }, []);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

export default DarkModeContext;
