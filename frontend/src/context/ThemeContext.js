import { useEffect, createContext } from "react";
import { theme, applyTheme } from "../theme/theme";

const ThemeContext = createContext(theme);

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => ThemeContext;