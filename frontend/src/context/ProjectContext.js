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
// API
// =====================================================

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";


// =====================================================
// DEFAULT BACKGROUND
// =====================================================

export const DEFAULT_BACKGROUND_CONFIGS = {

  desktop: {
    kind:
      "color",

    color:
      "#020617",

    imageUrl:
      "",

    size:
      "cover",
  },

  tablet: {
    kind:
      "color",

    color:
      "#020617",

    imageUrl:
      "",

    size:
      "cover",
  },

  mobile: {
    kind:
      "color",

    color:
      "#020617",

    imageUrl:
      "",

    size:
      "cover",
  },

};


// =====================================================
// DEFAULT INTERVIEW CONFIG
// =====================================================

export const DEFAULT_INTERVIEW_CONFIG = {

  activeQuestionSetId:
    null,

  questionSets:
    [],

  recordingEnabled:
    true,

  transcriptionEnabled:
    true,

  evaluationEnabled:
    true,

};


// =====================================================
// QUESTION SET ID
// =====================================================

function createQuestionSetId() {

  return (
    `question-set-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
  );

}


// =====================================================
// NORMALISE QUESTION SET
// =====================================================

function normaliseQuestionSet(
  questionSet = {}
) {

  const questions =
    Array.isArray(
      questionSet?.questions
    )

      ? questionSet.questions
          .map(
            question =>
              String(
                question ?? ""
              ).trim()
          )
          .filter(Boolean)

      : [];


  return {

    id:
      questionSet?.id ||
      questionSet?._id ||
      createQuestionSetId(),

    name:
      String(
        questionSet?.name ||
        "Untitled Question Set"
      ).trim(),

    description:
      String(
        questionSet?.description ||
        ""
      ).trim(),

    questions,

    source:
      questionSet?.source ||
      "manual",

  };

}


// =====================================================
// NORMALISE INTERVIEW CONFIG
// =====================================================

export function normaliseInterviewConfig(
  config
) {

  const safeConfig =
    config &&
    typeof config ===
      "object"

      ? config

      : {};


  const sourceQuestionSets =
    Array.isArray(
      safeConfig.questionSets
    )
      ? safeConfig.questionSets
      : [];


  const questionSets =
    sourceQuestionSets
      .map(
        normaliseQuestionSet
      )
      .filter(Boolean);


  let activeQuestionSetId =
    safeConfig.activeQuestionSetId ||
    null;


  const activeExists =
    activeQuestionSetId &&
    questionSets.some(
      questionSet =>
        String(
          questionSet.id
        ) ===
        String(
          activeQuestionSetId
        )
    );


  if (
    !activeExists
  ) {

    activeQuestionSetId =
      questionSets[0]?.id ||
      null;

  }


  if (
    !activeQuestionSetId &&
    questionSets.length > 0
  ) {

    activeQuestionSetId =
      questionSets[0].id;

  }


  return {

    ...DEFAULT_INTERVIEW_CONFIG,

    ...safeConfig,

    activeQuestionSetId,

    questionSets,

    recordingEnabled:
      safeConfig.recordingEnabled !== false,

    transcriptionEnabled:
      safeConfig.transcriptionEnabled !== false,

    evaluationEnabled:
      safeConfig.evaluationEnabled !== false,

  };

}


// =====================================================
// PROJECT HELPERS
// =====================================================

function getProjectId(
  project
) {

  return (
    project?._id ||
    project?.id ||
    null
  );

}


function getProjectName(
  project
) {

  return (
    project?.name ||
    null
  );

}


// =====================================================
// HYDRATE PROJECT
// =====================================================

function hydrateProject(
  project
) {

  if (
    !project ||
    typeof project !== "object"
  ) {

    return null;

  }


  const projectId =
    getProjectId(
      project
    );


  if (
    !projectId
  ) {

    return null;

  }


  return {

    ...project,

    _id:
      projectId,

    name:
      project.name ||
      "Untitled Project",

    type:
      project.type ||
      "single",

    schema:
      project.schema ||
      makeEmptyProjectSchema(),

    backgroundConfigs:
      project.backgroundConfigs ||
      DEFAULT_BACKGROUND_CONFIGS,

    interviewConfig:
      normaliseInterviewConfig(
        project.interviewConfig
      ),

  };

}


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
  // PROJECT EDITOR STATE
  // ===================================================

  const [
    projectSchema,
    setProjectSchemaState,
  ] =
    useState(
      makeEmptyProjectSchema()
    );


  const [
    viewMode,
    setViewModeState,
  ] =
    useState(
      "preview"
    );


  const [
    projectType,
    setProjectTypeState,
  ] =
    useState(
      "single"
    );


  const [
    collapsed,
    setCollapsed,
  ] =
    useState(
      false
    );


  const [
    backgroundConfigs,
    setBackgroundConfigsState,
  ] =
    useState(
      DEFAULT_BACKGROUND_CONFIGS
    );


  // ===================================================
  // INTERVIEW CONFIGURATION
  // ===================================================

  const [
    interviewConfig,
    setInterviewConfigState,
  ] =
    useState(
      DEFAULT_INTERVIEW_CONFIG
    );


  // ===================================================
  // PROJECT DATABASE STATE
  // ===================================================

  const [
    projects,
    setProjects,
  ] =
    useState([]);


  /*
   * activeProject === null
   *     → new / unsaved project
   *
   * activeProject !== null
   *     → existing saved project
   */

  const [
    activeProject,
    setActiveProjectState,
  ] =
    useState(null);


  const [
    projectsLoading,
    setProjectsLoading,
  ] =
    useState(true);


  // ===================================================
  // DIRTY STATE
  // ===================================================
  //
  // This represents unsaved PROJECT DEFINITION changes.
  //
  // It deliberately does NOT represent business/runtime
  // data such as:
  //
  // - compliance evidence
  // - interview records
  // - recordings
  // - evaluations
  // - runtime state
  //
  // Those are persisted independently.
  //
  // ===================================================

  const [
    hasUnsavedChanges,
    setHasUnsavedChanges,
  ] =
    useState(false);


  // ===================================================
  // DIRTY HELPERS
  // ===================================================

  const markProjectDirty =
    useCallback(
      () => {

        setHasUnsavedChanges(
          true
        );

      },
      []
    );


  const markProjectSaved =
    useCallback(
      () => {

        setHasUnsavedChanges(
          false
        );

      },
      []
    );


  // ===================================================
  // BROWSER CLOSE / REFRESH PROTECTION
  // ===================================================

  useEffect(
    () => {

      const handleBeforeUnload =
        event => {

          if (
            !hasUnsavedChanges
          ) {

            return;

          }


          event.preventDefault();

          event.returnValue =
            "";

        };


      window.addEventListener(
        "beforeunload",
        handleBeforeUnload
      );


      return () => {

        window.removeEventListener(
          "beforeunload",
          handleBeforeUnload
        );

      };

    },
    [
      hasUnsavedChanges,
    ]
  );


  // ===================================================
  // DISCARD CONFIRMATION
  // ===================================================

  const confirmDiscardUnsavedChanges =
    useCallback(
      (
        message =
          "You have unsaved changes. Leave without saving?"
      ) => {

        if (
          !hasUnsavedChanges
        ) {

          return true;

        }


        return window.confirm(
          message
        );

      },
      [
        hasUnsavedChanges,
      ]
    );


  // ===================================================
  // CURRENT PROJECT
  // ===================================================

  const currentProject =
    useMemo(
      () => {

        if (
          !activeProject
        ) {

          return null;

        }


        return (
          projects.find(
            project =>
              String(
                getProjectId(
                  project
                )
              ) ===
              String(
                activeProject
              )
          ) ||
          null
        );

      },
      [
        projects,
        activeProject,
      ]
    );


  // ===================================================
  // RESET PROJECT EDITOR
  // ===================================================

  const resetProjectEditor =
    useCallback(
      () => {

        setProjectSchemaState(
          makeEmptyProjectSchema()
        );


        setProjectTypeState(
          "single"
        );


        setBackgroundConfigsState(
          DEFAULT_BACKGROUND_CONFIGS
        );


        setInterviewConfigState(
          DEFAULT_INTERVIEW_CONFIG
        );


        setHasUnsavedChanges(
          false
        );

      },
      []
    );


  // ===================================================
  // TRACKED PROJECT SCHEMA SETTER
  // ===================================================
  //
  // CanvasContext uses this for real editor changes.
  //
  // API/project hydration uses the internal setter
  // directly so hydration remains clean.
  //
  // ===================================================

  const setProjectSchema =
    useCallback(
      updater => {

        setProjectSchemaState(
          updater
        );

        markProjectDirty();

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // TRACKED PROJECT TYPE SETTER
  // ===================================================

  const setProjectType =
    useCallback(
      updater => {

        setProjectTypeState(
          updater
        );

        markProjectDirty();

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // TRACKED BACKGROUND SETTER
  // ===================================================

  const setBackgroundConfigs =
    useCallback(
      updater => {

        setBackgroundConfigsState(
          updater
        );

        markProjectDirty();

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // VIEW MODE
  // ===================================================
  //
  // UI navigation is not a project edit.
  //
  // ===================================================

  const setViewMode =
    useCallback(
      updater => {

        setViewModeState(
          updater
        );

      },
      []
    );


  // ===================================================
  // SYNC RUNTIME PROJECT
  // ===================================================

  const syncRuntimeProject =
    useCallback(
      project => {

        const hydrated =
          hydrateProject(
            project
          );


        // ------------------------------------------------
        // NEW / EMPTY PROJECT
        // ------------------------------------------------

        if (
          !hydrated
        ) {

          runtime.patch(
            "project",
            {

              id:
                null,

              name:
                null,

              type:
                "single",

              schema:
                makeEmptyProjectSchema(),

              backgroundConfigs:
                DEFAULT_BACKGROUND_CONFIGS,

              interviewConfig:
                DEFAULT_INTERVIEW_CONFIG,

              installedFromConfo:
                null,

              confoVersion:
                null,

            }
          );


          return;

        }


        // ------------------------------------------------
        // EXISTING PROJECT
        // ------------------------------------------------

        runtime.patch(
          "project",
          {

            id:
              hydrated._id,

            name:
              hydrated.name,

            type:
              hydrated.type,

            schema:
              hydrated.schema,

            backgroundConfigs:
              hydrated.backgroundConfigs,

            installedFromConfo:
              hydrated.installedFromConfo ||
              null,

            confoVersion:
              hydrated.confoVersion ||
              null,

            interviewConfig:
              hydrated.interviewConfig,

          }
        );


        console.log(
          "[Projects] Runtime project synchronised",
          {

            projectId:
              hydrated._id,

            projectName:
              hydrated.name,

            interviewConfig:
              hydrated.interviewConfig,

          }
        );

      },
      [
        runtime,
      ]
    );


    // ===================================================
  // INITIALISE NEW PROJECT
  // ===================================================
  //
  // Internal reset used by application startup.
  //
  // IMPORTANT:
  //
  // This MUST NOT depend on dirty-state confirmation.
  // Otherwise loading the project list can become coupled
  // to hasUnsavedChanges and re-run whenever the editor
  // becomes dirty.
  //
  // ===================================================

  const initialiseNewProject =
    useCallback(
      () => {

        console.log(
          "[Projects] Initialising NEW unsaved project"
        );


        setActiveProjectState(
          null
        );


        resetProjectEditor();


        runtime.patch(
          "project",
          {

            id:
              null,

            name:
              null,

            type:
              "single",

            schema:
              makeEmptyProjectSchema(),

            backgroundConfigs:
              DEFAULT_BACKGROUND_CONFIGS,

            interviewConfig:
              DEFAULT_INTERVIEW_CONFIG,

            installedFromConfo:
              null,

            confoVersion:
              null,

          }
        );

      },
      [
        resetProjectEditor,
        runtime,
      ]
    );


  // ===================================================
  // START NEW PROJECT
  // ===================================================
  //
  // User-initiated creation of a new project.
  //
  // This version is allowed to depend on the dirty-state
  // confirmation because it is called by user actions.
  //
  // ===================================================

  const startNewProject =
    useCallback(
      (
        options = {}
      ) => {

        const {
          skipConfirm =
            false,
        } = options;


        if (
          !skipConfirm
        ) {

          const allowed =
            confirmDiscardUnsavedChanges(
              "You have unsaved changes to this project. Start a new project without saving?"
            );


          if (
            !allowed
          ) {

            console.log(
              "[Projects] Starting new project cancelled"
            );


            return false;

          }

        }


        initialiseNewProject();

        return true;

      },
      [
        confirmDiscardUnsavedChanges,
        initialiseNewProject,
      ]
    );


  // ===================================================
  // SET ACTIVE EXISTING PROJECT
  // ===================================================
  //
  // Selecting a project from the sidebar should not by
  // itself create dirty state.
  //
  // Actual project loading happens through loadProject.
  //
  // ===================================================

  const setActiveProject =
    useCallback(
      (
        projectId,
        projectName = null,
        nextInterviewConfig =
          DEFAULT_INTERVIEW_CONFIG
      ) => {

        const nextId =
          projectId ||
          null;


        const normalisedConfig =
          normaliseInterviewConfig(
            nextInterviewConfig
          );


        setActiveProjectState(
          nextId
        );


        setInterviewConfigState(
          normalisedConfig
        );


        runtime.patch(
          "project",
          {

            id:
              nextId,

            name:
              projectName ||
              null,

            interviewConfig:
              normalisedConfig,

          }
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
        runtime,
      ]
    );


  // ===================================================
  // APPLY HYDRATED PROJECT
  // ===================================================
  //
  // This is the clean API → editor boundary.
  //
  // Hydrated projects are always considered saved.
  //
  // ===================================================

  const applyProject =
    useCallback(
      project => {

        const hydrated =
          hydrateProject(
            project
          );


        if (
          !hydrated
        ) {

          throw new Error(
            "Invalid project returned by API."
          );

        }


        const projectId =
          hydrated._id;


        const config =
          hydrated.interviewConfig;


        // ------------------------------------------------
        // EDITOR STATE
        // ------------------------------------------------

        setProjectSchemaState(
          hydrated.schema
        );


        setProjectTypeState(
          hydrated.type
        );


        setBackgroundConfigsState(
          hydrated.backgroundConfigs
        );


        setInterviewConfigState(
          config
        );


        // ------------------------------------------------
        // CLEAN STATE
        // ------------------------------------------------

        setHasUnsavedChanges(
          false
        );


        // ------------------------------------------------
        // ACTIVE PROJECT
        // ------------------------------------------------

        setActiveProjectState(
          projectId
        );


        // ------------------------------------------------
        // PROJECT LIST
        // ------------------------------------------------

        setProjects(
          previous => {

            const exists =
              previous.some(
                existing =>
                  String(
                    getProjectId(
                      existing
                    )
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
                    getProjectId(
                      existing
                    )
                  ) ===
                  String(
                    projectId
                  )
                    ? hydrated
                    : existing
              );

            }


            return [
              ...previous,
              hydrated,
            ];

          }
        );


        // ------------------------------------------------
        // RUNTIME
        // ------------------------------------------------

        syncRuntimeProject(
          hydrated
        );


        console.log(
          "[Projects] PROJECT HYDRATED",
          {

            id:
              hydrated._id,

            name:
              hydrated.name,

            questionSetCount:
              hydrated
                .interviewConfig
                ?.questionSets
                ?.length ||
              0,

            activeQuestionSetId:
              hydrated
                .interviewConfig
                ?.activeQuestionSetId ||
              null,

          }
        );


        return hydrated;

      },
      [
        syncRuntimeProject,
      ]
    );


  // ===================================================
  // SET INTERVIEW CONFIG
  // ===================================================

  const setInterviewConfig =
    useCallback(
      nextConfig => {

        setInterviewConfigState(
          previous => {

            const resolved =
              typeof nextConfig ===
              "function"

                ? nextConfig(
                    previous
                  )

                : nextConfig;


            return normaliseInterviewConfig(
              resolved
            );

          }
        );


        markProjectDirty();

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // UPDATE INTERVIEW CONFIG
  // ===================================================

  const updateInterviewConfig =
    useCallback(
      patch => {

        setInterviewConfigState(
          previous => {

            const resolvedPatch =
              typeof patch ===
              "function"

                ? patch(
                    previous
                  )

                : patch;


            const safePatch =
              resolvedPatch &&
              typeof resolvedPatch ===
                "object"

                ? resolvedPatch

                : {};


            return normaliseInterviewConfig({

              ...previous,

              ...safePatch,

            });

          }
        );


        markProjectDirty();

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // ADD QUESTION SET
  // ===================================================

  const addQuestionSet =
    useCallback(
      (
        questionSet = {}
      ) => {

        const newQuestionSet =
          normaliseQuestionSet(
            questionSet
          );


        setInterviewConfigState(
          previous => {

            const previousSets =
              Array.isArray(
                previous?.questionSets
              )
                ? previous.questionSets
                : [];


            return normaliseInterviewConfig({

              ...previous,

              questionSets: [
                ...previousSets,
                newQuestionSet,
              ],

              activeQuestionSetId:
                previous?.activeQuestionSetId ||
                newQuestionSet.id,

            });

          }
        );


        markProjectDirty();


        console.log(
          "[Projects] Question Set added",
          newQuestionSet
        );


        return newQuestionSet;

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // UPDATE QUESTION SET
  // ===================================================

  const updateQuestionSet =
    useCallback(
      (
        questionSetId,
        updates = {}
      ) => {

        if (
          !questionSetId
        ) {

          return false;

        }


        let changed =
          false;


        setInterviewConfigState(
          previous => {

            const questionSets =
              Array.isArray(
                previous?.questionSets
              )
                ? previous.questionSets
                : [];


            const nextQuestionSets =
              questionSets.map(
                questionSet => {

                  if (
                    String(
                      questionSet?.id
                    ) !==
                    String(
                      questionSetId
                    )
                  ) {

                    return questionSet;

                  }


                  changed =
                    true;


                  return normaliseQuestionSet({

                    ...questionSet,

                    ...updates,

                  });

                }
              );


            return normaliseInterviewConfig({

              ...previous,

              questionSets:
                nextQuestionSets,

            });

          }
        );


        if (
          changed
        ) {

          markProjectDirty();

        }


        console.log(
          "[Projects] Question Set updated",
          {

            questionSetId,

            changed,

          }
        );


        return changed;

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // REMOVE QUESTION SET
  // ===================================================

  const removeQuestionSet =
    useCallback(
      questionSetId => {

        if (
          !questionSetId
        ) {

          return false;

        }


        let removed =
          false;


        setInterviewConfigState(
          previous => {

            const questionSets =
              Array.isArray(
                previous?.questionSets
              )
                ? previous.questionSets
                : [];


            const remaining =
              questionSets.filter(
                questionSet => {

                  const keep =
                    String(
                      questionSet?.id
                    ) !==
                    String(
                      questionSetId
                    );


                  if (
                    !keep
                  ) {

                    removed =
                      true;

                  }


                  return keep;

                }
              );


            const wasActive =
              String(
                previous?.activeQuestionSetId
              ) ===
              String(
                questionSetId
              );


            return normaliseInterviewConfig({

              ...previous,

              questionSets:
                remaining,

              activeQuestionSetId:
                wasActive
                  ? (
                      remaining[0]?.id ||
                      null
                    )
                  : previous?.activeQuestionSetId,

            });

          }
        );


        if (
          removed
        ) {

          markProjectDirty();

        }


        console.log(
          "[Projects] Question Set removed",
          {

            questionSetId,

            removed,

          }
        );


        return removed;

      },
      [
        markProjectDirty,
      ]
    );


  // ===================================================
  // SET ACTIVE QUESTION SET
  // ===================================================

  const setActiveQuestionSet =
    useCallback(
      questionSetId => {

        if (
          !questionSetId
        ) {

          return false;

        }


        let activated =
          false;


        setInterviewConfigState(
          previous => {

            const questionSets =
              Array.isArray(
                previous?.questionSets
              )
                ? previous.questionSets
                : [];


            const exists =
              questionSets.some(
                questionSet =>
                  String(
                    questionSet?.id
                  ) ===
                  String(
                    questionSetId
                  )
              );


            if (
              !exists
            ) {

              console.warn(
                "[Projects] Cannot activate missing Question Set",
                {
                  questionSetId,
                }
              );


              return previous;

            }


            activated =
              true;


            return normaliseInterviewConfig({

              ...previous,

              activeQuestionSetId:
                questionSetId,

            });

          }
        );


        if (
          activated
        ) {

          markProjectDirty();

        }


        console.log(
          "[Projects] Active Question Set changed",
          {

            questionSetId,

            activated,

          }
        );


        return activated;

      },
      [
        markProjectDirty,
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


            const rawProjects =
              Array.isArray(
                response?.data?.projects
              )
                ? response.data.projects
                : [];


            const hydratedProjects =
              rawProjects
                .map(
                  hydrateProject
                )
                .filter(Boolean);


            setProjects(
              hydratedProjects
            );


            /*
            * Startup always represents a new unsaved
            * project.
            *
            * IMPORTANT:
            *
            * Use initialiseNewProject(), NOT
            * startNewProject(), so the initialisation
            * effect remains independent of dirty state.
            */

            initialiseNewProject();


            console.log(
              "[Projects] Project list loaded",
              {

                count:
                  hydratedProjects.length,

                mode:
                  "new-project",

              }
            );

          }
          catch (
            error
          ) {

            console.error(
              "[Projects] Failed to load projects",
              error
            );


            setProjects(
              []
            );


            initialiseNewProject();

          }
          finally {

            setProjectsLoading(
              false
            );

          }

        },
        [
          initialiseNewProject,
        ]
      );


  // ===================================================
  // INITIAL LOAD
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
  // SAVE INTERVIEW CONFIG
  // ===================================================
  //
  // Saving interview configuration for an EXISTING
  // project persists that specific piece of project data.
  //
  // It does NOT automatically clear hasUnsavedChanges,
  // because there could also be unsaved:
  //
  // - canvas changes
  // - background changes
  // - schema changes
  // - project type changes
  //
  // For a NEW project there is no server persistence yet,
  // so the project remains dirty.
  //
  // ===================================================

  const saveInterviewConfig =
    useCallback(
      async (
        nextInterviewConfig
      ) => {

        const normalisedConfig =
          normaliseInterviewConfig(
            nextInterviewConfig
          );


        // ------------------------------------------------
        // NEW PROJECT
        // ------------------------------------------------

        if (
          !activeProject
        ) {

          setInterviewConfigState(
            normalisedConfig
          );


          runtime.patch(
            "project",
            {

              id:
                null,

              name:
                null,

              interviewConfig:
                normalisedConfig,

            }
          );


          markProjectDirty();


          console.log(
            "[Projects] Interview config updated on NEW project"
          );


          return {

            persisted:
              false,

            newProject:
              true,

            interviewConfig:
              normalisedConfig,

          };

        }


        // ------------------------------------------------
        // EXISTING PROJECT
        // ------------------------------------------------

        console.log(
          "[Projects] Persisting interview config",
          {

            projectId:
              activeProject,

            interviewConfig:
              normalisedConfig,

          }
        );


        const response =
          await api.patch(
            `${API_URL}/api/projects/${activeProject}`,
            {
              interviewConfig:
                normalisedConfig,
            },
            {
              withCredentials:
                true,
            }
          );


        const rawProject =
          response?.data?.project;


        if (
          !rawProject
        ) {

          throw new Error(
            "Server did not return updated project."
          );

        }


        const updatedProject =
          hydrateProject(
            rawProject
          );


        if (
          !updatedProject
        ) {

          throw new Error(
            "Updated project could not be hydrated."
          );

        }


        setProjects(
          previous =>
            previous.map(
              project =>
                String(
                  getProjectId(project)
                ) ===
                String(
                  activeProject
                )
                  ? updatedProject
                  : project
            )
        );


        setProjectSchemaState(
          updatedProject.schema
        );


        setProjectTypeState(
          updatedProject.type
        );


        setBackgroundConfigsState(
          updatedProject.backgroundConfigs
        );


        setInterviewConfigState(
          updatedProject.interviewConfig
        );


        syncRuntimeProject(
          updatedProject
        );


        /*
         * IMPORTANT:
         *
         * Do not mark the complete project clean here.
         *
         * saveInterviewConfig() only guarantees that the
         * interviewConfig portion has been persisted.
         *
         * Any outstanding canvas/background/schema changes
         * must remain dirty until the full project is saved.
         */

        console.log(
          "[Projects] Interview configuration persisted",
          {

            projectId:
              updatedProject._id,

            questionSetCount:
              updatedProject
                ?.interviewConfig
                ?.questionSets
                ?.length ||
              0,

            hasUnsavedChanges,

          }
        );


        return {

          persisted:
            true,

          newProject:
            false,

          project:
            updatedProject,

          interviewConfig:
            updatedProject.interviewConfig,

        };

      },
      [
        activeProject,
        runtime,
        syncRuntimeProject,
        markProjectDirty,
        hasUnsavedChanges,
      ]
    );


  // ===================================================
  // SAVE PROJECT
  // ===================================================

  const saveProject =
    useCallback(
      async (
        name = null
      ) => {

        // =================================================
        // EXISTING PROJECT
        // =================================================

        if (
          activeProject
        ) {

          const selectedProject =
            projects.find(
              project =>
                String(
                  getProjectId(project)
                ) ===
                String(
                  activeProject
                )
            );


          if (
            !selectedProject
          ) {

            console.warn(
              "[Projects] Active project missing; reverting to NEW project"
            );


            startNewProject();

            return null;

          }


          const confirmed =
            window.confirm(
              `Save changes to "${selectedProject.name}"?\n\n` +
              `This will overwrite the existing saved version of this project.`
            );


          if (
            !confirmed
          ) {

            return null;

          }


          try {

            const payload = {

              name:
                selectedProject.name,

              type:
                projectType,

              schema:
                projectSchema,

              backgroundConfigs:
                backgroundConfigs,

              interviewConfig:
                normaliseInterviewConfig(
                  interviewConfig
                ),

            };


            const response =
              await api.patch(
                `${API_URL}/api/projects/${activeProject}`,
                payload,
                {
                  withCredentials:
                    true,
                }
              );


            const rawProject =
              response?.data?.project;


            if (
              !rawProject
            ) {

              throw new Error(
                "Server did not return updated project."
              );

            }


            const updatedProject =
              hydrateProject(
                rawProject
              );


            if (
              !updatedProject
            ) {

              throw new Error(
                "Updated project could not be hydrated."
              );

            }


            setProjects(
              previous =>
                previous.map(
                  project =>
                    String(
                      getProjectId(project)
                    ) ===
                    String(
                      activeProject
                    )
                      ? updatedProject
                      : project
                )
            );


            /*
             * Apply the server version back into the editor.
             *
             * applyProject also marks the project clean.
             */

            applyProject(
              updatedProject
            );


            console.log(
              "[Projects] Existing project saved",
              {

                projectId:
                  updatedProject._id,

                name:
                  updatedProject.name,

                questionSetCount:
                  updatedProject
                    ?.interviewConfig
                    ?.questionSets
                    ?.length ||
                  0,

              }
            );


            return updatedProject._id;

          }
          catch (
            error
          ) {

            console.error(
              "[Projects] Existing project save failed",
              error
            );


            throw error;

          }

        }


        // =================================================
        // NEW PROJECT
        // =================================================

        const trimmedName =
          String(
            name ||
            ""
          ).trim();


        if (
          !trimmedName
        ) {

          throw new Error(
            "PROJECT_NAME_REQUIRED"
          );

        }


        const duplicate =
          projects.some(
            project =>
              String(
                project?.name ||
                ""
              )
                .trim()
                .toLowerCase() ===
              trimmedName.toLowerCase()
          );


        if (
          duplicate
        ) {

          throw new Error(
            `A project named "${trimmedName}" already exists.`
          );

        }


        const projectInterviewConfig =
          normaliseInterviewConfig(
            interviewConfig
          );


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

                interviewConfig:
                  projectInterviewConfig,

              },
              {
                withCredentials:
                  true,
              }
            );


          const rawProject =
            response?.data?.project;


          if (
            !rawProject
          ) {

            throw new Error(
              "Server did not return created project."
            );

          }


          const newProject =
            hydrateProject(
              rawProject
            );


          if (
            !newProject
          ) {

            throw new Error(
              "Created project could not be hydrated."
            );

          }


          setProjects(
            previous => [
              ...previous,
              newProject,
            ]
          );


          applyProject(
            newProject
          );


          console.log(
            "[Projects] New project created",
            {

              id:
                newProject._id,

              name:
                newProject.name,

              questionSetCount:
                newProject
                  ?.interviewConfig
                  ?.questionSets
                  ?.length ||
                0,

            }
          );


          return newProject._id;

        }
        catch (
          error
        ) {

          console.error(
            "[Projects] New project creation failed",
            error
          );


          throw error;

        }

      },
      [
        activeProject,
        projects,
        projectType,
        projectSchema,
        backgroundConfigs,
        interviewConfig,
        startNewProject,
        applyProject,
      ]
    );


  // ===================================================
  // LOAD EXISTING PROJECT
  // ===================================================
  //
  // IMPORTANT:
  //
  // This method itself performs the navigation guard.
  //
  // This protects calls originating from ProjectSidebar,
  // not just MainApp.
  //
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


        const allowed =
          confirmDiscardUnsavedChanges(
            "You have unsaved changes to this project. Load another project without saving?"
          );


        if (
          !allowed
        ) {

          console.log(
            "[Projects] Project load cancelled"
          );


          return null;

        }


        console.log(
          "[Projects] Loading project",
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


        const rawProject =
          response?.data?.project;


        if (
          !rawProject
        ) {

          throw new Error(
            "Project not found."
          );

        }


        const hydratedProject =
          hydrateProject(
            rawProject
          );


        if (
          !hydratedProject
        ) {

          throw new Error(
            "Loaded project could not be hydrated."
          );

        }


        applyProject(
          hydratedProject
        );


        console.log(
          "[Projects] EXISTING PROJECT SELECTED",
          {

            id:
              hydratedProject._id,

            name:
              hydratedProject.name,

            questionSetCount:
              hydratedProject
                ?.interviewConfig
                ?.questionSets
                ?.length ||
              0,

            activeQuestionSetId:
              hydratedProject
                ?.interviewConfig
                ?.activeQuestionSetId ||
              null,

          }
        );


        return hydratedProject;

      },
      [
        applyProject,
        confirmDiscardUnsavedChanges,
      ]
    );


  // ===================================================
  // UPDATE PROJECT
  // ===================================================

  const updateProject =
    useCallback(
      async (
        id,
        updates = {}
      ) => {

        if (
          !id
        ) {

          return null;

        }


        const payload = {

          ...updates,

        };


        if (
          Object.prototype.hasOwnProperty.call(
            payload,
            "interviewConfig"
          )
        ) {

          payload.interviewConfig =
            normaliseInterviewConfig(
              payload.interviewConfig
            );

        }


        const response =
          await api.patch(
            `${API_URL}/api/projects/${id}`,
            payload,
            {
              withCredentials:
                true,
            }
          );


        const rawProject =
          response?.data?.project;


        if (
          !rawProject
        ) {

          throw new Error(
            "Server did not return updated project."
          );

        }


        const updatedProject =
          hydrateProject(
            rawProject
          );


        if (
          !updatedProject
        ) {

          throw new Error(
            "Updated project could not be hydrated."
          );

        }


        setProjects(
          previous =>
            previous.map(
              project =>
                String(
                  getProjectId(project)
                ) ===
                String(id)

                  ? updatedProject

                  : project
            )
        );


        if (
          String(
            id
          ) ===
          String(
            activeProject
          )
        ) {

          applyProject(
            updatedProject
          );

        }


        console.log(
          "[Projects] Project updated",
          {

            projectId:
              updatedProject._id,

            active:
              String(
                id
              ) ===
              String(
                activeProject
              ),

          }
        );


        return updatedProject;

      },
      [
        activeProject,
        applyProject,
      ]
    );


  // ===================================================
  // DELETE PROJECT
  // ===================================================

  const deleteProject =
    useCallback(
      async id => {

        if (
          !id
        ) {

          return false;

        }


        if (
          String(
            id
          ) ===
          String(
            activeProject
          )
        ) {

          const allowed =
            confirmDiscardUnsavedChanges(
              "You have unsaved changes to this project. Delete the project without saving?"
            );


          if (
            !allowed
          ) {

            return false;

          }

        }


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
                String(
                  getProjectId(project)
                ) !==
                String(id)
            )
        );


        if (
          String(
            id
          ) ===
          String(
            activeProject
          )
        ) {

          startNewProject({
            skipConfirm:
              true,
          });

        }


        console.log(
          "[Projects] Project deleted",
          id
        );


        return true;

      },
      [
        activeProject,
        startNewProject,
        confirmDiscardUnsavedChanges,
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

          throw new Error(
            "NO_ACTIVE_PROJECT"
          );

        }


        const selectedProject =
          projects.find(
            project =>
              String(
                getProjectId(project)
              ) ===
              String(
                activeProject
              )
          );


        if (
          !selectedProject
        ) {

          throw new Error(
            "ACTIVE_PROJECT_NOT_FOUND"
          );

        }


        return updateProject(

          activeProject,

          {

            name:
              selectedProject.name,

            schema:
              projectSchema,

            type:
              projectType,

            backgroundConfigs:
              backgroundConfigs,

            interviewConfig:
              normaliseInterviewConfig(
                interviewConfig
              ),

          }

        );

      },
      [
        activeProject,
        projects,
        projectSchema,
        projectType,
        backgroundConfigs,
        interviewConfig,
        updateProject,
      ]
    );


  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value =
    useMemo(
      () => ({

        // ------------------------------------------------
        // Project editor
        // ------------------------------------------------

        projectSchema,

        setProjectSchema,

        viewMode,

        setViewMode,

        projectType,

        setProjectType,

        backgroundConfigs,

        setBackgroundConfigs,


        // ------------------------------------------------
        // Dirty state
        // ------------------------------------------------

        hasUnsavedChanges,

        markProjectDirty,

        markProjectSaved,

        confirmDiscardUnsavedChanges,


        // ------------------------------------------------
        // Projects
        // ------------------------------------------------

        projects,

        activeProject,

        currentProject,

        projectsLoading,

        collapsed,

        setCollapsed,


        // ------------------------------------------------
        // Project operations
        // ------------------------------------------------

        setActiveProject,

        startNewProject,

        loadProjects,

        saveProject,

        loadProject,

        updateProject,

        deleteProject,

        saveCurrentProject,

        resetProjectEditor,


        // ------------------------------------------------
        // Interview configuration
        // ------------------------------------------------

        interviewConfig,

        setInterviewConfig,

        updateInterviewConfig,

        saveInterviewConfig,


        // ------------------------------------------------
        // Question sets
        // ------------------------------------------------

        addQuestionSet,

        updateQuestionSet,

        removeQuestionSet,

        setActiveQuestionSet,


        // ------------------------------------------------
        // Helpers
        // ------------------------------------------------

        normaliseInterviewConfig,

        hydrateProject,

      }),
      [
        projectSchema,

        setProjectSchema,

        viewMode,

        setViewMode,

        projectType,

        setProjectType,

        backgroundConfigs,

        setBackgroundConfigs,

        hasUnsavedChanges,

        markProjectDirty,

        markProjectSaved,

        confirmDiscardUnsavedChanges,

        projects,

        activeProject,

        currentProject,

        projectsLoading,

        collapsed,

        setActiveProject,

        startNewProject,

        loadProjects,

        saveProject,

        loadProject,

        updateProject,

        deleteProject,

        saveCurrentProject,

        resetProjectEditor,

        interviewConfig,

        setInterviewConfig,

        updateInterviewConfig,

        saveInterviewConfig,

        addQuestionSet,

        updateQuestionSet,

        removeQuestionSet,

        setActiveQuestionSet,
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


  if (
    !ctx
  ) {

    throw new Error(
      "useProjectContext must be used within ProjectProvider"
    );

  }


  return ctx;

}