// ProjectContext.js
import React, { createContext, useState, useMemo } from "react";
import { makeEmptyProjectSchema } from "../schema/gptSchema";

export const ProjectContext = createContext(null);

const DEFAULT_BACKGROUND_CONFIGS = {
  desktop: { kind: "color", color: "#020617", imageUrl: "", size: "cover" },
  tablet: { kind: "color", color: "#020617", imageUrl: "", size: "cover" },
  mobile: { kind: "color", color: "#020617", imageUrl: "", size: "cover" },
};

export function ProjectProvider({ children }) {
  const [projectSchema, setProjectSchema] = useState(makeEmptyProjectSchema());
  const [viewMode, setViewMode] = useState("preview");
  const [projectType, setProjectType] = useState("single");

  const [backgroundConfigs, setBackgroundConfigs] = useState(
    DEFAULT_BACKGROUND_CONFIGS
  );

    const value = useMemo(
    () => ({
      projectSchema,
      setProjectSchema,
      viewMode,
      setViewMode,
      projectType,
      setProjectType,

      // ✅ add these
      backgroundConfigs,
      setBackgroundConfigs,
    }),
    [projectSchema, viewMode, projectType, backgroundConfigs]
  );


  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within a ProjectProvider");
  return ctx;
}
