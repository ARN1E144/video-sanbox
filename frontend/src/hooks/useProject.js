// src/hooks/useProject.js
import { useState, useEffect } from "react";

export default function useProject() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("video_sandbox_projects");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentProject, setCurrentProject] = useState(null);

  // persist whenever projects change
  useEffect(() => {
    localStorage.setItem("video_sandbox_projects", JSON.stringify(projects));
  }, [projects]);

  const saveProject = (name, template, code) => {
    const newProject = { id: Date.now(), name, template, code };
    setProjects((prev) => [...prev, newProject]);
    setCurrentProject(newProject);
  };

  const loadProject = (id) => {
    const proj = projects.find((p) => p.id === id);
    if (proj) setCurrentProject(proj);
    return proj;
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProject?.id === id) setCurrentProject(null);
  };

  return {
    projects,
    currentProject,
    saveProject,
    loadProject,
    deleteProject,
  };
}
