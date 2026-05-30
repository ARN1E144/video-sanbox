// src/context/CanvasContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useProjectContext } from "./ProjectContext";
import COMPONENTS from "../components/elements/registry"; // ✅ registry keys = valid types

const CanvasContext = createContext();

function normalizeElement(el) {
  if (!el || typeof el !== "object") return null;

  // Ensure props object always exists
  const props = el.props && typeof el.props === "object" ? el.props : {};

  // (Optional) migrate any legacy props -> new props
  // Example: apiUrl -> endpoint, apiMethod -> method
  const migratedProps = { ...props };
  if (migratedProps.apiUrl && !migratedProps.endpoint) migratedProps.endpoint = migratedProps.apiUrl;
  if (migratedProps.apiMethod && !migratedProps.method) migratedProps.method = migratedProps.apiMethod;

  // Validate type against registry
  const type = el.type;
  const isKnownType = !!COMPONENTS[type];

  return {
    ...el,
    type: isKnownType ? type : "Text", // safe fallback (or keep original)
    props: migratedProps,
  };
}

function normalizeElements(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeElement).filter(Boolean);
}

export function CanvasProvider({ children }) {
  const { activeProject, projects, saveProjectElements } = useProjectContext();

  const [elements, setElements] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* ------------------------------------------------------------
   🧠 Load elements when a project becomes active
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!activeProject) {
      setElements([]);
      setIsLoaded(true);
      return;
    }

    const project = projects[activeProject];
    
    if (project && Array.isArray(project.elements)) {
      const normalized = normalizeElements(project.elements);
      setElements(normalized);
      console.log(`📂 Loaded project: ${project.name}`, {
        count: normalized.length,
        types: normalized.map((e) => e.type),
      });
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
  }, [elements, isLoaded, activeProject, saveProjectElements]);

  /* ------------------------------------------------------------
   ✨ Canvas manipulation helpers (normalized)
  ------------------------------------------------------------ */
  const addElement = useCallback((newEl) => {
    const normalized = normalizeElement(newEl);
    if (!normalized) return;

    setElements((prev) => [...prev, normalized]);
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;

        const next = {
          ...el,
          ...updates,
          props: {
            ...(el.props || {}),
            ...(updates?.props || {}),
          },
          // optional debug stamp
          updatedAt: new Date().toISOString(),
        };

        return normalizeElement(next);
      })
    );
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const clearCanvas = useCallback(() => setElements([]), []);

  const loadElements = useCallback((savedElements) => {
    if (!Array.isArray(savedElements)) {
      console.warn("⚠️ Tried to load invalid elements:", savedElements);
      return;
    }
    setElements(normalizeElements(savedElements));
  }, []);

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
  if (!ctx) throw new Error("useCanvasState must be used inside a CanvasProvider");
  return ctx;
}
