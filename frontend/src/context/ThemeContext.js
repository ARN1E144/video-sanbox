// src/context/ThemeContext.js

import {
  createContext,
  useContext,
  useEffect,
} from "react";

import {
  theme,
  applyTheme,
} from "../theme/theme";


const ThemeContext =
  createContext(null);


// =====================================================
// THEME PROVIDER
// =====================================================

export function ThemeProvider({
  children,
}) {

  useEffect(
    () => {

      try {

        applyTheme(
          theme
        );

      }
      catch (error) {

        console.error(
          "[ThemeProvider] applyTheme failed",
          error
        );

      }

    },
    []
  );


  return (
    <ThemeContext.Provider
      value={
        theme
      }
    >
      {children}
    </ThemeContext.Provider>
  );

}


// =====================================================
// USE THEME
// =====================================================

export function useTheme() {

  const context =
    useContext(
      ThemeContext
    );


  return (
    context ||
    theme
  );

}

export default ThemeContext;