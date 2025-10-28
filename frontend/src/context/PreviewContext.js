import React, { createContext, useContext, useState } from "react";

const PreviewContext = createContext();

export const PreviewProvider = ({ children }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 👇 NEW: previewMode lets you switch between 'single' and 'host-client'
  const [previewMode, setPreviewMode] = useState("single");

  return (
    <PreviewContext.Provider
      value={{
        isPreviewMode,
        setIsPreviewMode,
        previewMode,
        setPreviewMode,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreviewMode = () => useContext(PreviewContext);
