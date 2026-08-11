// src/context/ProjectContext.js

import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";

import {
  makeEmptyProjectSchema,
} from "../schema/gptSchema";

import api from "../services/api";

export const ProjectContext =
  createContext(null);


// =====================================================
// DEFAULT BACKGROUND
// =====================================================

const DEFAULT_BACKGROUND_CONFIGS = {

  desktop: {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  },

  tablet: {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  },

  mobile: {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  },

};


// =====================================================
// API
// =====================================================

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";


// =====================================================
// PROVIDER
// =====================================================

export function ProjectProvider({
  children,
}) {

  // ===================================================
  // PROJECT STATE
  // ===================================================

  const [
    projectSchema,
    setProjectSchema,
  ] = useState(
    makeEmptyProjectSchema()
  );


  const [
    viewMode,
    setViewMode,
  ] = useState("preview");


  const [
    projectType,
    setProjectType,
  ] = useState("single");


  const [
    collapsed,
    setCollapsed,
  ] = useState(false);


  const [
    backgroundConfigs,
    setBackgroundConfigs,
  ] = useState(
    DEFAULT_BACKGROUND_CONFIGS
  );


  // ===================================================
  // DATABASE PROJECTS
  // ===================================================

  const [
    projects,
    setProjects,
  ] = useState([]);


  const [
    activeProject,
    setActiveProject,
  ] = useState(null);


  const [
    projectsLoading,
    setProjectsLoading,
  ] = useState(true);


  // ===================================================
  // LOAD PROJECT LIST
  // ===================================================

  const loadProjects =
    useCallback(
      async () => {

        try {

          setProjectsLoading(true);

          console.log(
            "[Projects] Loading projects..."
          );


          const response =
            await api.get(
              `${API_URL}/api/projects`,
              {
                withCredentials: true,
              }
            );


          const loadedProjects =
            response.data?.projects ||
            [];


          console.log(
            "[Projects] Loaded",
            loadedProjects
          );


          setProjects(
            loadedProjects
          );


        } catch (error) {

          console.error(
            "[Projects] Failed to load",
            error
          );

          setProjects([]);

        } finally {

          setProjectsLoading(false);

        }

      },
      []
    );


  // ===================================================
  // INITIAL PROJECT LOAD
  // ===================================================

  useEffect(() => {

    loadProjects();

  }, [
    loadProjects,
  ]);


  // ===================================================
  // CREATE PROJECT
  // ===================================================

  const saveProject = useCallback(
  async (name) => {
    if (!name?.trim()) {
      return;
    }

    const trimmedName = name.trim();

    // =====================================================
    // EXISTING PROJECT
    // =====================================================

    if (activeProject) {
      const currentProject = projects[activeProject];

      if (!currentProject) {
        console.warn(
          "[Projects] Active project not found:",
          activeProject
        );

        return;
      }

      const confirmed = window.confirm(
        `Save changes to "${currentProject.name}"?\n\n` +
        `This will overwrite the existing saved version of this project.`
      );

      if (!confirmed) {
        return;
      }

      try {
        const response = await api.put(
          `/projects/${activeProject}`,
          {
            name: currentProject.name,
            type: projectType,
            schema: projectSchema,
            backgroundConfigs,
          }
        );

        const updatedProject = response.data.project;

        setProjects((prev) => ({
          ...prev,
          [activeProject]: updatedProject,
        }));

        console.log(
          "[Projects] Updated project:",
          updatedProject
        );

        return activeProject;
      } catch (error) {
        console.error(
          "[Projects] Update failed:",
          error
        );

        alert(
          error.response?.data?.error ||
          "Failed to save project."
        );

        return;
      }
    }

    // =====================================================
    // NEW PROJECT
    // =====================================================

    const duplicate = Object.values(projects).some(
      (project) =>
        project.name.trim().toLowerCase() ===
        trimmedName.toLowerCase()
    );

    if (duplicate) {
      alert(
        `A project named "${trimmedName}" already exists.\n\n` +
        `Please choose a different project name.`
      );

      return;
    }

    try {
      const response = await api.post(
        "/projects",
        {
          name: trimmedName,
          type: projectType,
          schema: projectSchema,
          backgroundConfigs,
        }
      );

      const newProject = response.data.project;

      setProjects((prev) => ({
        ...prev,
        [newProject.id]: newProject,
      }));

      setActiveProject(newProject.id);

      console.log(
        "[Projects] Created project:",
        newProject
      );

      return newProject.id;
    } catch (error) {
      console.error(
        "[Projects] Create failed:",
        error
      );

      alert(
        error.response?.data?.error ||
        "Failed to create project."
      );
    }
  },
  [
    activeProject,
    projects,
    projectType,
    projectSchema,
    backgroundConfigs,
  ]
);


  // ===================================================
  // LOAD PROJECT
  // ===================================================

  const loadProject =
    useCallback(
      async (id) => {

        try {

          console.log(
            "[Projects] Loading",
            id
          );


          const response =
            await api.get(

              `${API_URL}/api/projects/${id}`,

              {
                withCredentials:
                  true,
              }

            );


          const project =
            response.data?.project;


          if (!project) {

            throw new Error(
              "Project not found."
            );

          }


          setActiveProject(
            project._id
          );


          setProjectType(
            project.type ||
            "single"
          );


          setProjectSchema(
            project.schema ||
            makeEmptyProjectSchema()
          );


          setBackgroundConfigs(
            project.backgroundConfigs ||
            DEFAULT_BACKGROUND_CONFIGS
          );


          console.log(
            "[Projects] Loaded project",
            project
          );


          return project;

        } catch (error) {

          console.error(
            "[Projects] Load failed",
            error
          );

          throw error;

        }

      },
      []
    );


  // ===================================================
  // UPDATE PROJECT
  //
  // This is what we'll use when Canvas changes.
  // ===================================================

  const updateProject =
    useCallback(
      async (
        id,
        updates
      ) => {

        if (!id) {

          console.warn(
            "[Projects] No project ID."
          );

          return null;

        }


        try {

          const response =
            await api.patch(

              `${API_URL}/api/projects/${id}`,

              updates,

              {
                withCredentials:
                  true,
              }

            );


          const updatedProject =
            response.data?.project;


          if (!updatedProject) {

            throw new Error(
              "Server did not return updated project."
            );

          }


          setProjects(
            prev =>
              prev.map(
                project =>
                  project._id === id
                    ? updatedProject
                    : project
              )
          );


          return updatedProject;

        } catch (error) {

          console.error(
            "[Projects] Update failed",
            error
          );

          throw error;

        }

      },
      []
    );


  // ===================================================
  // DELETE PROJECT
  // ===================================================

  const deleteProject =
    useCallback(
      async (id) => {

        if (!id) {
          return;
        }


        try {

          await api.delete(

            `${API_URL}/api/projects/${id}`,

            {
              withCredentials:
                true,
            }

          );


          setProjects(
            prev =>
              prev.filter(
                project =>
                  project._id !== id
              )
          );


          if (
            activeProject === id
          ) {

            setActiveProject(
              null
            );

            setProjectSchema(
              makeEmptyProjectSchema()
            );

          }


        } catch (error) {

          console.error(
            "[Projects] Delete failed",
            error
          );

          throw error;

        }

      },
      [
        activeProject,
      ]
    );


  // ===================================================
  // SAVE CURRENT PROJECT
  //
  // Used by Canvas / autosave.
  // ===================================================

  const saveCurrentProject =
    useCallback(
      async () => {

        if (
          !activeProject
        ) {

          console.warn(
            "[Projects] No active project."
          );

          return null;

        }


        return updateProject(
          activeProject,
          {

            schema:
              projectSchema,

            type:
              projectType,

            backgroundConfigs,

          }
        );

      },
      [
        activeProject,
        projectSchema,
        projectType,
        backgroundConfigs,
        updateProject,
      ]
    );


  // ===================================================
  // VALUE
  // ===================================================

  const value =
    useMemo(
      () => ({

        // Project schema
        projectSchema,
        setProjectSchema,

        // View
        viewMode,
        setViewMode,

        // Type
        projectType,
        setProjectType,

        // Background
        backgroundConfigs,
        setBackgroundConfigs,

        // Projects
        projects,
        activeProject,
        setActiveProject,

        // API
        loadProjects,
        saveProject,
        loadProject,
        updateProject,
        deleteProject,
        saveCurrentProject,

        // Loading
        projectsLoading,

        // UI
        collapsed,
        setCollapsed,

      }),
      [
        projectSchema,
        viewMode,
        projectType,
        backgroundConfigs,
        projects,
        activeProject,
        loadProjects,
        saveProject,
        loadProject,
        updateProject,
        deleteProject,
        saveCurrentProject,
        projectsLoading,
        collapsed,
      ]
    );


  return (
    <ProjectContext.Provider
      value={value}
    >

      {children}

    </ProjectContext.Provider>
  );

}


// =====================================================
// HOOK
// =====================================================

export function useProjectContext() {

  const ctx =
    React.useContext(
      ProjectContext
    );


  if (!ctx) {

    throw new Error(
      "useProjectContext must be used within ProjectProvider"
    );

  }


  return ctx;

}