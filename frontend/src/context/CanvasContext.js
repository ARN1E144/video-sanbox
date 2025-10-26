import React, { createContext, useContext, useState } from "react";

const CanvasContext = createContext();

export function CanvasProvider({ children }) {
  const [elements, setElements] = useState([
    {
      id: "el1",
      type: "VideoFeed",
      x: 100,
      y: 100,
      width: 400,
      height: 225,
      props: { label: "🎥 Host Camera" },
    },
  ]);

  const updateElement = (id, updates) => {
    setElements(prev =>
      prev.map(el =>
        el.id === id
          ? { ...el, ...updates, props: { ...el.props, ...updates.props } }
          : el
      )
    );
  };

  const removeElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
  };

  const addElement = (newEl) => {
    setElements(prev => [...prev, newEl]);
  };

  return (
    <CanvasContext.Provider
      value={{ elements, setElements, updateElement, removeElement, addElement }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasState() {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("useCanvasState must be used inside a CanvasProvider");
  }
  return ctx;
}
