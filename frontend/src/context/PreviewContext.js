import React, { createContext, useContext, useState } from "react";

const PreviewContext = createContext();

export const PreviewProvider = ({ children }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Possible values: 'client', 'host', 'split'
  const [previewView, setPreviewView] = useState("client");

  return (
    <PreviewContext.Provider
      value={{
        isPreviewMode,
        setIsPreviewMode,
        previewView,
        setPreviewView,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreviewMode = () => useContext(PreviewContext);
