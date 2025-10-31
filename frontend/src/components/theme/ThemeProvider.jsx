/**
 * ThemeProvider Component - RE-EDUCA Store
 * 
 * Provider de tema para gerenciamento de light/dark mode.
 * 
 * Funcionalidades:
 * - Gerenciamento de tema (light/dark)
 * - Persist?ncia no localStorage
 * - Sincroniza??o entre tabs
 * - Hook useThemeContext para acesso ao tema
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Componentes filhos
 * @returns {JSX.Element} Provider de tema
 */
import React, { createContext, useContext } from "react";
import { theme } from "../../lib/theme";

// Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = React.useState(
    theme.utils.getCurrentTheme(),
  );

  React.useEffect(() => {
    theme.utils.init();

    const handleStorageChange = () => {
      setCurrentTheme(theme.utils.getCurrentTheme());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    theme.utils.setTheme(newTheme);
    setCurrentTheme(newTheme);
  };

  const setTheme = (newTheme) => {
    theme.utils.setTheme(newTheme);
    setCurrentTheme(newTheme);
  };

  const themeData = {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    colors: theme.getColors(currentTheme),
  };

  return (
    <ThemeContext.Provider value={themeData}>{children}</ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
