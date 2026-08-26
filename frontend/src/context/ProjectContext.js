
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

import {
  useRuntimeState,
} from "./RuntimeStateContext";


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
  // RUNTIME
  // ===================================================

  const runtime =
    useRuntimeState();


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
  ] = useState(
    "preview"
  );


  const [
    projectType,
    setProjectType,
  ] = useState(
    "single"
  );


  const [
    collapsed,
    setCollapsed,
  ] = useState(
    false
  );


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
  ] = useState(
    []
  );


  const [
    activeProject,
    setActiveProjectState,
  ] = useState(
    null
  );


  const [
    projectsLoading,
    setProjectsLoading,
  ] = useState(
    true
  );


  // ===================================================
  // SYNCHRONISE RUNTIME PROJECT
  // ===================================================

  const syncRuntimeProject =
    useCallback(
      (
        projectId,
        projectName = null
      ) => {

        runtime.patch(
          "project",
          {
            id:
              projectId ||
              null,

            name:
              projectName ||
              null,
          }
        );


        console.log(
          "[Projects] Runtime project synchronised",
          {
            projectId:
              projectId ||
              null,

            projectName:
              projectName ||
              null,
          }
        );

      },
      [
        runtime,
      ]
    );


  // ===================================================
  // CANONICAL ACTIVE PROJECT SETTER
  // ===================================================
  //
  // IMPORTANT:
  //
  // This must NOT depend on `projects`.
  //
  // Otherwise:
  //
  // projects changes
  //   ↓
  // setter identity changes
  //   ↓
  // loadProjects identity changes
  //   ↓
  // useEffect runs again
  //
  // ===================================================

  const setActiveProject =
    useCallback(
      (
        projectId,
        projectName = null
      ) => {

        const nextId =
          projectId ||
          null;


        setActiveProjectState(
          nextId
        );


        syncRuntimeProject(
          nextId,
          projectName
        );


        console.log(
          "[Projects] Active project changed",
          {
            projectId:
              nextId,

            projectName:
              projectName ||
              null,
          }
        );

      },
      [
        syncRuntimeProject,
      ]
    );


  // ===================================================
  // LOAD PROJECT LIST
  // ===================================================

  const loadProjects =
    useCallback(
      async () => {

        try {

          setProjectsLoading(
            true
          );


          console.log(
            "[Projects] Loading projects..."
          );


          const response =
            await api.get(
              `${API_URL}/api/projects`,
              {
                withCredentials:
                  true,
              }
            );


          const loadedProjects =
            Array.isArray(
              response.data?.projects
            )
              ? response.data.projects
              : [];


          console.log(
            "[Projects] Loaded",
            loadedProjects
          );


          setProjects(
            loadedProjects
          );


        }
        catch (
          error
        ) {

          console.error(
            "[Projects] Failed to load",
            error
          );


          setProjects(
            []
          );


          setActiveProject(
            null
          );


        }
        finally {

          setProjectsLoading(
            false
          );

        }

      },
      [
        setActiveProject,
      ]
    );


  // ===================================================
  // INITIAL PROJECT LOAD
  // ===================================================

  useEffect(
    () => {

      loadProjects();

    },
    [
      loadProjects,
    ]
  );


  // ===================================================
  // STALE ACTIVE PROJECT CHECK
  // ===================================================

  useEffect(
    () => {

      if (
        !activeProject ||
        projectsLoading
      ) {

        return;

      }


      const exists =
        projects.some(
          project =>
            String(
              project?._id
            ) ===
            String(
              activeProject
            )
        );


      if (
        !exists
      ) {

        console.log(
          "[Projects] Clearing stale active project:",
          activeProject
        );


        setActiveProject(
          null
        );


        setProjectSchema(
          makeEmptyProjectSchema()
        );


        setProjectType(
          "single"
        );


        setBackgroundConfigs(
          DEFAULT_BACKGROUND_CONFIGS
        );

      }

    },
    [
      projects,
      activeProject,
      projectsLoading,
      setActiveProject,
    ]
  );


  // ===================================================
  // CREATE / SAVE PROJECT
  // ===================================================

  const saveProject =
    useCallback(
      async (
        name
      ) => {

        if (
          !name?.trim()
        ) {

          return null;

        }


        const trimmedName =
          name.trim();


        // =================================================
        // EXISTING PROJECT
        // =================================================

        if (
          activeProject
        ) {

          const currentProject =
            projects.find(
              project =>
                String(
                  project?._id
                ) ===
                String(
                  activeProject
                )
            );


          // ------------------------------------------------
          // Active project no longer exists locally.
          // ------------------------------------------------

          if (
            !currentProject
          ) {

            console.warn(
              "[Projects] Active project record unavailable:",
              activeProject
            );


            setActiveProject(
              null
            );

          }

          // ------------------------------------------------
          // Existing project
          // ------------------------------------------------

          else {

            const confirmed =
              window.confirm(
                `Save changes to "${currentProject.name}"?\n\n` +
                `This will overwrite the existing saved version of this project.`
              );


            if (
              !confirmed
            ) {

              return null;

            }


            try {

              const response =
                await api.patch(
                  `${API_URL}/api/projects/${activeProject}`,
                  {

                    name:
                      currentProject.name,

                    type:
                      projectType,

                    schema:
                      projectSchema,

                    backgroundConfigs:
                      backgroundConfigs,

                  },
                  {
                    withCredentials:
                      true,
                  }
                );


              const updatedProject =
                response.data?.project;


              if (
                !updatedProject
              ) {

                throw new Error(
                  "Server did not return updated project."
                );

              }


              setProjects(
                previous =>
                  previous.map(
                    project =>
                      project._id ===
                      activeProject

                        ? updatedProject

                        : project
                  )
              );


              syncRuntimeProject(
                activeProject,
                updatedProject.name ||
                  currentProject.name ||
                  null
              );


              console.log(
                "[Projects] Updated project:",
                updatedProject
              );


              return activeProject;

            }
            catch (
              error
            ) {

              console.error(
                "[Projects] Update failed:",
                error
              );


              alert(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to save project."
              );


              return null;

            }

          }

        }


        // =================================================
        // NEW PROJECT
        // =================================================

        const duplicate =
          projects.some(
            project =>
              project.name
                ?.trim()
                .toLowerCase() ===
              trimmedName
                .toLowerCase()
          );


        if (
          duplicate
        ) {

          alert(
            `A project named "${trimmedName}" already exists.\n\n` +
            `Please choose a different project name.`
          );


          return null;

        }


        // =================================================
        // CREATE
        // =================================================

        try {

          const response =
            await api.post(
              `${API_URL}/api/projects`,
              {

                name:
                  trimmedName,

                type:
                  projectType,

                schema:
                  projectSchema,

                backgroundConfigs:
                  backgroundConfigs,

              },
              {
                withCredentials:
                  true,
              }
            );


          const newProject =
            response.data?.project;


          if (
            !newProject
          ) {

            throw new Error(
              "Server did not return created project."
            );

          }


          const newProjectId =
            newProject._id ||
            newProject.id;


          if (
            !newProjectId
          ) {

            throw new Error(
              "Created project has no ID."
            );

          }


          setProjects(
            previous => [
              ...previous,
              newProject,
            ]
          );


          setActiveProject(
            newProjectId,
            newProject.name ||
              trimmedName
          );


          if (
            newProject.schema
          ) {

            setProjectSchema(
              newProject.schema
            );

          }


          if (
            newProject.type
          ) {

            setProjectType(
              newProject.type
            );

          }


          if (
            newProject.backgroundConfigs
          ) {

            setBackgroundConfigs(
              newProject.backgroundConfigs
            );

          }


          console.log(
            "[Projects] Created project:",
            {
              id:
                newProjectId,

              name:
                newProject.name ||
                trimmedName,
            }
          );


          return newProjectId;

        }
        catch (
          error
        ) {

          console.error(
            "[Projects] Create failed:",
            error
          );


          alert(
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to create project."
          );


          return null;

        }

      },
      [
        activeProject,
        projects,
        projectType,
        projectSchema,
        backgroundConfigs,
        setActiveProject,
        syncRuntimeProject,
      ]
    );


  // ===================================================
  // LOAD PROJECT
  // ===================================================

  const loadProject =
    useCallback(
      async (
        id
      ) => {

        if (
          !id
        ) {

          throw new Error(
            "Project ID is required."
          );

        }


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


          if (
            !project
          ) {

            throw new Error(
              "Project not found."
            );

          }


          const projectId =
            project._id ||
            project.id;


          if (
            !projectId
          ) {

            throw new Error(
              "Loaded project has no ID."
            );

          }


          // ------------------------------------------------
          // Update local project list.
          // ------------------------------------------------

          setProjects(
            previous => {

              const exists =
                previous.some(
                  existing =>
                    String(
                      existing?._id
                    ) ===
                    String(
                      projectId
                    )
                );


              if (
                exists
              ) {

                return previous.map(
                  existing =>
                    String(
                      existing?._id
                    ) ===
                    String(
                      projectId
                    )

                      ? project

                      : existing
                );

              }


              return [
                ...previous,
                project,
              ];

            }
          );


          // ------------------------------------------------
          // Active project + runtime.
          // ------------------------------------------------

          setActiveProject(
            projectId,
            project.name ||
              null
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
            {
              id:
                projectId,

              name:
                project.name ||
                null,
            }
          );


          return project;

        }
        catch (
          error
        ) {

          console.error(
            "[Projects] Load failed",
            error
          );


          throw error;

        }

      },
      [
        setActiveProject,
      ]
    );


  // ===================================================
  // UPDATE PROJECT
  // ===================================================

  const updateProject =
    useCallback(
      async (
        id,
        updates
      ) => {

        if (
          !id
        ) {

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


          if (
            !updatedProject
          ) {

            throw new Error(
              "Server did not return updated project."
            );

          }


          setProjects(
            previous =>
              previous.map(
                project =>
                  project._id ===
                  id

                    ? updatedProject

                    : project
              )
          );


          if (
            String(id) ===
            String(activeProject)
          ) {

            syncRuntimeProject(
              id,
              updatedProject.name ||
                null
            );


            if (
              updatedProject.schema
            ) {

              setProjectSchema(
                updatedProject.schema
              );

            }


            if (
              updatedProject.type
            ) {

              setProjectType(
                updatedProject.type
              );

            }


            if (
              updatedProject.backgroundConfigs
            ) {

              setBackgroundConfigs(
                updatedProject.backgroundConfigs
              );

            }

          }


          console.log(
            "[Projects] Updated project:",
            updatedProject
          );


          return updatedProject;

        }
        catch (
          error
        ) {

          console.error(
            "[Projects] Update failed",
            error
          );


          throw error;

        }

      },
      [
        activeProject,
        syncRuntimeProject,
      ]
    );


  // ===================================================
  // DELETE PROJECT
  // ===================================================

  const deleteProject =
    useCallback(
      async (
        id
      ) => {

        if (
          !id
        ) {

          return false;

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
            previous =>
              previous.filter(
                project =>
                  project._id !==
                  id
              )
          );


          if (
            String(id) ===
            String(activeProject)
          ) {

            setActiveProject(
              null
            );


            setProjectSchema(
              makeEmptyProjectSchema()
            );


            setProjectType(
              "single"
            );


            setBackgroundConfigs(
              DEFAULT_BACKGROUND_CONFIGS
            );


            syncRuntimeProject(
              null,
              null
            );


            console.log(
              "[Projects] Runtime project cleared"
            );

          }


          console.log(
            "[Projects] Deleted project:",
            id
          );


          return true;

        }
        catch (
          error
        ) {

          console.error(
            "[Projects] Delete failed",
            error
          );


          throw error;

        }

      },
      [
        activeProject,
        setActiveProject,
        syncRuntimeProject,
      ]
    );


  // ===================================================
  // SAVE CURRENT PROJECT
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

            backgroundConfigs:
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

        projectSchema,
        setProjectSchema,

        viewMode,
        setViewMode,

        projectType,
        setProjectType,

        backgroundConfigs,
        setBackgroundConfigs,

        projects,

        activeProject,

        setActiveProject,

        loadProjects,

        saveProject,

        loadProject,

        updateProject,

        deleteProject,

        saveCurrentProject,

        projectsLoading,

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
        setActiveProject,
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


  // ===================================================
  // PROVIDER
  // ===================================================

  return (

    <ProjectContext.Provider
      value={
        value
      }
    >

      {
        children
      }

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

