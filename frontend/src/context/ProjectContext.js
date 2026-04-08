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
  const [collapsed, setCollapsed] = useState(false);

  const [backgroundConfigs, setBackgroundConfigs] = useState(DEFAULT_BACKGROUND_CONFIGS);

  // New: track all saved projects
  const [projects, setProjects] = useState([]);

  // Save current project with a name
  const saveProject = (name) => {
    if (!name.trim()) return;
    const id = Date.now(); // simple unique ID
    const newProject = {
      id,
      name,
      type: projectType,
      schema: projectSchema,
      backgroundConfigs,
    };
    setProjects((prev) => [...prev, newProject]);
  };

  // Load a project into the context
  const loadProject = (id) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    setProjectType(proj.type || "single");
    setProjectSchema(proj.schema || makeEmptyProjectSchema());
    setBackgroundConfigs(proj.backgroundConfigs || DEFAULT_BACKGROUND_CONFIGS);
  };

  // Delete a saved project
  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const value = useMemo(
  () => ({
    projectSchema,
    setProjectSchema,
    viewMode,
    setViewMode,
    projectType,
    setProjectType,
    backgroundConfigs,
    setBackgroundConfigs,
    projects,
    saveProject,
    loadProject,
    deleteProject,
    collapsed,
    setCollapsed,
  }),
  [projectSchema, viewMode, projectType, backgroundConfigs, projects, collapsed]
);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within a ProjectProvider");
  return ctx;
}
