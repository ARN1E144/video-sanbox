// src/components/ProjectSidebar.jsx

import React, {
  useState,
  useContext,
} from "react";

import {
  ProjectContext,
} from "../context/ProjectContext";


export default function ProjectSidebar() {

  const [
    newProjectName,
    setNewProjectName,
  ] = useState("");


  const {
    projects,
    loadProject,
    deleteProject,

    saveProject,

    startNewProject,

    activeProject,

    currentProject,

    projectsLoading,

    collapsed,
    setCollapsed,

    hasUnsavedChanges,
    confirmDiscardUnsavedChanges,

  } =
    useContext(
      ProjectContext
    );


  // ===================================================
  // NORMALISE PROJECT LIST
  // ===================================================

  const projectList =
    Array.isArray(projects)

      ? projects

      : (
          projects &&
          typeof projects === "object"
        )

        ? Object.values(
            projects
          )

        : [];


  // ===================================================
  // DIRTY-STATE GUARD
  // ===================================================
  //
  // All operations which replace the current project
  // now pass through one guard.
  //
  // This protects:
  //
  // - Build → another project
  // - Unsaved project → saved project
  // - Existing project → New Project
  //
  // It does NOT interfere with Save.
  //
  // ===================================================

  const canLeaveCurrentProject =
    () => {

      if (
        !hasUnsavedChanges
      ) {

        return true;

      }


      const confirmed =
        typeof confirmDiscardUnsavedChanges ===
          "function"

          ? confirmDiscardUnsavedChanges(
              "You have unsaved changes to this project. Leave without saving?"
            )

          : window.confirm(
              "You have unsaved changes to this project. Leave without saving?"
            );


      if (
        !confirmed
      ) {

        console.log(
          "[ProjectSidebar] Project navigation cancelled",
          {
            activeProject,
            hasUnsavedChanges,
          }
        );

        return false;

      }


      console.log(
        "[ProjectSidebar] Leaving project with unsaved changes discarded",
        {
          activeProject,
        }
      );


      return true;

    };


  // ===================================================
  // LOAD PROJECT
  // ===================================================
  //
  // IMPORTANT:
  //
  // Project loading always goes through this wrapper.
  //
  // loadProject() itself remains responsible for:
  //
  // API
  // ↓
  // hydrateProject()
  // ↓
  // applyProject()
  // ↓
  // Canvas hydration
  //
  // ===================================================

  const handleLoadProject =
    async (
      projectId
    ) => {

      if (
        !projectId
      ) {

        return;

      }


      // -----------------------------------------------
      // Clicking the already-active project
      // -----------------------------------------------

      if (
        String(
          projectId
        ) ===
        String(
          activeProject
        )
      ) {

        console.log(
          "[ProjectSidebar] Project already active",
          projectId
        );

        return;

      }


      // -----------------------------------------------
      // Guard navigation
      // -----------------------------------------------

      if (
        !canLeaveCurrentProject()
      ) {

        return;

      }


      try {

        console.log(
          "[ProjectSidebar] Loading project",
          {
            projectId,
          }
        );


        await loadProject(
          projectId
        );


        console.log(
          "[ProjectSidebar] Project loaded successfully",
          {
            projectId,
          }
        );

      }
      catch (
        error
      ) {

        console.error(
          "[ProjectSidebar] Load project failed",
          error
        );

        alert(
          error?.message ||
          "Failed to load project."
        );

      }

    };


  // ===================================================
  // NEW PROJECT
  // ===================================================

  const handleNewProject =
    () => {

      // -----------------------------------------------
      // Guard leaving the current project
      // -----------------------------------------------

      if (
        !canLeaveCurrentProject()
      ) {

        return;

      }


      try {

        startNewProject();

        setNewProjectName(
          ""
        );


        console.log(
          "[ProjectSidebar] New unsaved project started"
        );

      }
      catch (
        error
      ) {

        console.error(
          "[ProjectSidebar] New project failed",
          error
        );

        alert(
          "Failed to start a new project."
        );

      }

    };


  // ===================================================
  // SAVE
  // ===================================================

  const handleSave =
    async () => {

      // -------------------------------------------------
      // NEW PROJECT
      // -------------------------------------------------

      if (
        !activeProject
      ) {

        if (
          !newProjectName.trim()
        ) {

          alert(
            "Enter a project name."
          );

          return;

        }


        try {

          const projectId =
            await saveProject(
              newProjectName.trim()
            );


          if (
            projectId
          ) {

            setNewProjectName(
              ""
            );

          }

        }
        catch (
          error
        ) {

          console.error(
            "[ProjectSidebar] Create project failed",
            error
          );

          alert(
            error?.message ||
            "Failed to create project."
          );

        }

        return;

      }


      // -------------------------------------------------
      // EXISTING PROJECT
      // -------------------------------------------------

      try {

        await saveProject();

      }
      catch (
        error
      ) {

        console.error(
          "[ProjectSidebar] Save project failed",
          error
        );

        alert(
          error?.message ||
          "Failed to save project."
        );

      }

    };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete =
    async (
      event,
      projectId
    ) => {

      event.stopPropagation();


      // -----------------------------------------------
      // Prevent deleting the active project while
      // unsaved editor work exists.
      // -----------------------------------------------

      if (
        String(
          projectId
        ) ===
        String(
          activeProject
        ) &&
        hasUnsavedChanges
      ) {

        const confirmed =
          typeof confirmDiscardUnsavedChanges ===
            "function"

            ? confirmDiscardUnsavedChanges(
                "This project has unsaved changes. Delete the saved project and discard those changes?"
              )

            : window.confirm(
                "This project has unsaved changes. Delete the saved project and discard those changes?"
              );


        if (
          !confirmed
        ) {

          return;

        }

      }


      try {

        await deleteProject(
          projectId
        );

      }
      catch (
        error
      ) {

        console.error(
          "[ProjectSidebar] Delete failed",
          error
        );

        alert(
          error?.message ||
          "Failed to delete project."
        );

      }

    };


  // ===================================================
  // COLLAPSED
  // ===================================================

  if (
    collapsed
  ) {

    return (

      <div
        style={{
          width:
            40,

          height:
            "100%",

          background:
            "#141414",

          color:
            "#fff",

          overflow:
            "hidden",

          display:
            "flex",

          flexDirection:
            "column",
        }}
      >

        <button
          type="button"

          title="Project sidebar"

          aria-label="Project sidebar"

          onClick={() =>
            setCollapsed(
              false
            )
          }

          style={{
            width:
              40,

            height:
              40,

            padding:
              0,

            border:
              "none",

            borderBottom:
              "1px solid #222",

            background:
              "#0f0f0f",

            color:
              "#aaa",

            cursor:
              "pointer",

            fontSize:
              15,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",
          }}
        >

          ▶

        </button>

      </div>

    );

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        width:
          260,

        height:
          "100%",

        background:
          "#141414",

        color:
          "#fff",

        transition:
          "width 0.25s ease",

        overflow:
          "hidden",

        display:
          "flex",

        flexDirection:
          "column",

        boxSizing:
          "border-box",
      }}
    >

      {/* =============================================
          HEADER / COLLAPSE
      ============================================= */}

      <div
        style={{
          padding:
            "8px",

          borderBottom:
            "1px solid #222",

          background:
            "#0f0f0f",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",
        }}
      >

        <div
          style={{
            fontSize:
              12,

            fontWeight:
              700,

            color:
              "#aaa",
          }}
        >
          Projects
        </div>


        <button
          type="button"

          title="Collapse project sidebar"

          aria-label="Collapse project sidebar"

          onClick={() =>
            setCollapsed(
              true
            )
          }

          style={{
            border:
              "none",

            background:
              "transparent",

            color:
              "#777",

            cursor:
              "pointer",

            fontSize:
              12,
          }}
        >

          ◀

        </button>

      </div>


      {/* =============================================
          CONTENT
      ============================================= */}

      <div
        style={{
          flex:
            1,

          overflowY:
            "auto",

          padding:
            8,

          boxSizing:
            "border-box",
        }}
      >

        {/* =========================================
            CURRENT PROJECT STATE
        ========================================= */}

        <div
          style={{
            marginBottom:
              12,

            padding:
              10,

            borderRadius:
              8,

            background:
              activeProject
                ? "#161616"
                : "#121a16",

            border:
              activeProject
                ? "1px solid #292929"
                : "1px solid #21452f",
          }}
        >

          {activeProject ? (

            <>

              <div
                style={{
                  color:
                    "#777",

                  fontSize:
                    10,

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    0.5,

                  marginBottom:
                    5,
                }}
              >
                Active Project
              </div>


              <div
                style={{
                  fontWeight:
                    700,

                  fontSize:
                    13,

                  color:
                    "#fff",

                  wordBreak:
                    "break-word",
                }}
              >
                {
                  currentProject?.name ||
                  "Selected Project"
                }
              </div>


              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    10,

                  color:
                    "#777",
                }}
              >
                Changes will be saved to this project.
              </div>

            </>

          ) : (

            <>

              <div
                style={{
                  color:
                    "#86efac",

                  fontSize:
                    10,

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    0.5,

                  marginBottom:
                    5,

                  fontWeight:
                    700,
                }}
              >
                New Project
              </div>


              <div
                style={{
                  fontSize:
                    11,

                  color:
                    "#777",

                  lineHeight:
                    1.4,
                }}
              >
                This is an unsaved project.
                Give it a name when you're ready
                to save it.
              </div>

            </>

          )}

        </div>


        {/* =========================================
            EXISTING PROJECT ACTION
        ========================================= */}

        {activeProject ? (

          <button
            type="button"
            onClick={
              handleSave
            }
            style={{
              width:
                "100%",

              padding:
                "9px 10px",

              marginBottom:
                7,

              borderRadius:
                7,

              border:
                "1px solid #3b82f6",

              background:
                "#1d4ed8",

              color:
                "#fff",

              cursor:
                "pointer",

              fontSize:
                12,

              fontWeight:
                700,
            }}
          >

            Save Changes

          </button>

        ) : (

          <>
            {/* =======================================
                NEW PROJECT NAME
            ======================================= */}

            <div
              style={{
                display:
                  "flex",

                gap:
                  6,

                marginBottom:
                  7,
              }}
            >

              <input
                type="text"

                value={
                  newProjectName
                }

                placeholder=
                  "Project name"

                onChange={
                  event =>
                    setNewProjectName(
                      event.target.value
                    )
                }

                onKeyDown={
                  event => {

                    if (
                      event.key ===
                      "Enter"
                    ) {

                      handleSave();

                    }

                  }
                }

                style={{
                  flex:
                    1,

                  minWidth:
                    0,

                  padding:
                    "8px 9px",

                  borderRadius:
                    7,

                  border:
                    "1px solid #333",

                  background:
                    "#1a1a1a",

                  color:
                    "#fff",

                  outline:
                    "none",

                  boxSizing:
                    "border-box",
                }}
              />


              <button
                type="button"

                onClick={
                  handleSave
                }

                style={{
                  padding:
                    "8px 10px",

                  borderRadius:
                    7,

                  border:
                    "1px solid #3b82f6",

                  background:
                    "#1d4ed8",

                  color:
                    "#fff",

                  cursor:
                    "pointer",

                  fontSize:
                    11,

                  fontWeight:
                    700,
                }}
              >
                Save
              </button>

            </div>

          </>

        )}


        {/* =========================================
            NEW PROJECT BUTTON
        ========================================= */}

        <button
          type="button"

          onClick={
            handleNewProject
          }

          style={{
            width:
              "100%",

            padding:
              "8px 10px",

            marginBottom:
              14,

            borderRadius:
              7,

            border:
              "1px solid #333",

            background:
              "#1a1a1a",

            color:
              "#ccc",

            cursor:
              "pointer",

            fontSize:
              11,

            fontWeight:
              600,
          }}
        >

          + New Project

        </button>


        {/* =========================================
            PROJECT LIST
        ========================================= */}

        <h4
          style={{
            margin:
              "0 0 8px 0",

            color:
              "#aaa",

            fontSize:
              12,
          }}
        >
          Saved Projects
        </h4>


        {projectsLoading && (

          <div
            style={{
              color:
                "#777",

              padding:
                "8px 0",

              fontSize:
                11,
            }}
          >
            Loading projects...
          </div>

        )}


        {!projectsLoading &&
          projectList.length ===
            0 && (

            <div
              style={{
                color:
                  "#555",

                fontSize:
                  11,

                padding:
                  "8px 0",
              }}
            >
              No projects saved.
            </div>

          )}


        {!projectsLoading &&
          projectList.map(
            project => {

              const projectId =
                project?._id ||
                project?.id;


              const isActive =
                String(
                  projectId
                ) ===
                String(
                  activeProject
                );


              return (

                <div
                  key={
                    projectId
                  }

                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      6,

                    padding:
                      "7px 8px",

                    borderRadius:
                      6,

                    marginBottom:
                      4,

                    background:
                      isActive
                        ? "#26324a"
                        : "#1a1a1a",

                    border:
                      isActive
                        ? "1px solid #3b82f6"
                        : "1px solid transparent",

                  }}
                >

                  <button
                    type="button"

                    onClick={() =>
                      handleLoadProject(
                        projectId
                      )
                    }

                    style={{
                      flex:
                        1,

                      minWidth:
                        0,

                      textAlign:
                        "left",

                      border:
                        "none",

                      background:
                        "transparent",

                      color:
                        "#fff",

                      cursor:
                        "pointer",

                      padding:
                        0,

                      fontSize:
                        11,
                    }}
                  >

                    <div
                      style={{
                        fontWeight:
                          600,

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {
                        project.name
                      }
                    </div>


                    {project?.access?.role && (

                      <div
                        style={{
                          marginTop:
                            3,

                          fontSize:
                            9,

                          color:
                            isActive
                              ? "#93c5fd"
                              : "#666",
                        }}
                      >
                        {
                          project
                            .access
                            .role
                        }
                      </div>

                    )}

                  </button>


                  <button
                    type="button"

                    onClick={
                      event =>
                        handleDelete(
                          event,
                          projectId
                        )
                    }

                    title="Delete project"

                    style={{
                      flexShrink:
                        0,

                      border:
                        "none",

                      background:
                        "transparent",

                      color:
                        "#f55",

                      cursor:
                        "pointer",

                      fontSize:
                        12,
                    }}
                  >
                    ✕
                  </button>

                </div>

              );

            }
          )}

      </div>

    </div>

  );

}
