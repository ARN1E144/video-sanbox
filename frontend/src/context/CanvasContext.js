import React, { createContext, useContext, useState, useEffect } from "react";
import { useProjectContext } from "./ProjectContext";

const CanvasContext = createContext();

export function CanvasProvider({ children }) {
  const { activeProject, projects, saveProjectElements } = useProjectContext();

  const [elements, setElements] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* ------------------------------------------------------------
   🧠 Load elements when a project becomes active
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!activeProject) {
      // No active project → clear canvas for new or start screen
      setElements([]);
      setIsLoaded(true);
      return;
    }

    const project = projects[activeProject];
    if (project && Array.isArray(project.elements)) {
      setElements(project.elements);
      console.log(`📂 Loaded project: ${project.name}`);
    } else {
      console.log("🆕 Starting fresh project...");
      setElements([]);
    }

    setIsLoaded(true);
  }, [activeProject, projects]);

  /* ------------------------------------------------------------
   💾 Auto-save whenever elements change
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!isLoaded || !activeProject) return;
    saveProjectElements(elements);
  }, [elements, isLoaded, activeProject]);

  /* ------------------------------------------------------------
   ✨ Canvas manipulation helpers
  ------------------------------------------------------------ */
  const addElement = (newEl) => setElements((prev) => [...prev, newEl]);

  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, ...updates, props: { ...el.props, ...updates.props } }
          : el
      )
    );
  };

  const removeElement = (id) =>
    setElements((prev) => prev.filter((el) => el.id !== id));

  const clearCanvas = () => setElements([]);

  const loadElements = (savedElements) => {
    if (Array.isArray(savedElements)) {
      setElements(savedElements);
    } else {
      console.warn("⚠️ Tried to load invalid elements:", savedElements);
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        elements,
        addElement,
        updateElement,
        removeElement,
        clearCanvas,
        loadElements,
      }}
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
