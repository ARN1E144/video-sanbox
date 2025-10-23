import React, { createContext, useContext } from "react";
import { theme as defaultTheme } from "../theme/theme";

const ThemeContext = createContext(defaultTheme);

export function ThemeProvider({ children, value = defaultTheme }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
