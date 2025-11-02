import React, { createContext, useContext, useState, useEffect } from "react";

const CanvasContext = createContext();

export function CanvasProvider({ children }) {
  const [elements, setElements] = useState([]);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  /* ------------------------------------------------------------
   🧠 Load from Local Storage (on App Start)
  ------------------------------------------------------------ */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("soReal_currentProject");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.elements)) {
          setElements(parsed.elements);
          console.log("🪄 Restored project from localStorage");
        } else {
          console.warn("⚠️ Invalid project data found in storage.");
        }
      } else {
        // ✅ Default element (fresh start)
        setElements([
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
      }
    } catch (err) {
      console.error("❌ Failed to load from localStorage:", err);
    } finally {
      setIsLoadedFromStorage(true);
    }
  }, []);

  /* ------------------------------------------------------------
   💾 Auto-Save to Local Storage on Change
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    const projectData = {
      elements,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem("soReal_currentProject", JSON.stringify(projectData));
  }, [elements, isLoadedFromStorage]);

  /* ------------------------------------------------------------
   ✨ Canvas Manipulation Methods
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
        setElements,
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
