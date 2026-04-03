import { createContext, useEffect, useContext } from "react";

const DarkModeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });

export const DarkModeProvider = ({ children }) => {
  const isDarkMode = false;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sb-dark-mode", "0");
    }
    document.documentElement.classList.remove("dark-mode");
  }, []);

  const toggleDarkMode = () => {};

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

export default DarkModeContext;
