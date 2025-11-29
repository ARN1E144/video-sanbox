// src/context/PreviewContext.js
import React, { createContext, useContext, useState } from "react";

const PreviewContext = createContext();

export const PreviewProvider = ({ children }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 'client' | 'host' | 'split'
  const [previewView, setPreviewView] = useState("client");

  // Runtime element overrides that only apply while previewing
  // shape: { [elementId]: { enabled?, playing?, muted?, mirror?, visible?, ... } }
  const [runtimeState, setRuntimeState] = useState({});

  // Merge patch for a single element's runtime state
  const setElementRuntimeState = (elementId, patch) => {
    setRuntimeState((prev) => ({
      ...prev,
      [elementId]: { ...(prev[elementId] || {}), ...patch },
    }));
  };

  // Clear ALL runtime overrides (e.g. when leaving Preview)
  const clearRuntimeState = () => setRuntimeState({});

  // When we turn preview off, wipe the overrides so Build mode
  // only sees the design-time schema again.
  const handleSetIsPreviewMode = (value) => {
    setIsPreviewMode(value);
    if (!value) {
      setRuntimeState({});
    }
  };

  return (
    <PreviewContext.Provider
      value={{
        isPreviewMode,
        setIsPreviewMode: handleSetIsPreviewMode,
        previewView,
        setPreviewView,
        runtimeState,
        setElementRuntimeState,
        clearRuntimeState,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreviewMode = () => useContext(PreviewContext);
