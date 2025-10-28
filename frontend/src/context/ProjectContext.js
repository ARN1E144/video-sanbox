import React, { createContext, useContext, useState, useEffect } from "react";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState(null);
  const [projectType, setProjectType] = useState(null);
  const [activeRole, setActiveRole] = useState("all"); // "all" | "host" | "client"

  // 🧠 Load projects from localStorage on init
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("projects") || "[]");
    setProjects(saved);
  }, []);

  // 💾 Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  // ➕ New Project (clears active)
  const resetProject = () => {
    setProjectName(null);
    setProjectType(null);
    setActiveRole("all");
  };

  // 💾 Save current project (update or create)
  const saveProject = (data) => {
    if (!data.name) return;

    setProjects((prev) => {
      const existingIndex = prev.findIndex((p) => p.name === data.name);
      const newProject = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = newProject;
        return updated;
      }
      return [...prev, newProject];
    });

    setProjectName(data.name);
    setProjectType(data.type);
  };

  // 📂 Load a project
  const loadProject = (name) => {
    const proj = projects.find((p) => p.name === name);
    if (proj) {
      setProjectName(proj.name);
      setProjectType(proj.type);
      return proj;
    }
    return null;
  };

  // 🗑 Delete project
  const deleteProject = (name) => {
    setProjects((prev) => prev.filter((p) => p.name !== name));
    if (projectName === name) {
      resetProject();
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        projectName,
        projectType,
        activeRole,
        setActiveRole,
        setProjectName,
        setProjectType,
        saveProject,
        loadProject,
        deleteProject,
        resetProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
