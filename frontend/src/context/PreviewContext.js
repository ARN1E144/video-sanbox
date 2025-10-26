import React, { createContext, useContext, useState } from "react";

const PreviewContext = createContext();

export function PreviewProvider({ children }) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  return (
    <PreviewContext.Provider value={{ isPreviewMode, setIsPreviewMode }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreviewMode() {
  return useContext(PreviewContext);
}
