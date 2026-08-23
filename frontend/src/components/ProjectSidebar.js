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

    activeProject,

    projectsLoading,

    collapsed,
    setCollapsed,

  } = useContext(
    ProjectContext
  );

    // ===================================================
  // NORMALIZE PROJECT LIST
  // ===================================================

  const projectList =
    Array.isArray(projects)
      ? projects
      : projects &&
        typeof projects === "object"
        ? Object.values(projects)
        : [];


  // ===================================================
  // SAVE
  // ===================================================

  const handleSave =
    async () => {

      if (
        !newProjectName.trim()
      ) {

        alert(
          "Enter a project name"
        );

        return;

      }


      try {

        await saveProject(
          newProjectName.trim()
        );


        setNewProjectName(
          ""
        );

      } catch (
        error
      ) {

        console.error(
          "[ProjectSidebar] Save failed",
          error
        );


        alert(
          "Failed to save project."
        );

      }

    };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        width:
          collapsed
            ? 40
            : 260,

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
      }}
    >

      {/* =============================================
          COLLAPSE
      ============================================= */}

      <div
        style={{
          padding:
            "8px",

          borderBottom:
            "1px solid #222",

          cursor:
            "pointer",

          textAlign:
            "center",

          background:
            "#0f0f0f",
        }}

        onClick={() =>
          setCollapsed(
            !collapsed
          )
        }
      >

        {
          collapsed
            ? "▶"
            : "◀ Collapse"
        }

      </div>


      {/* =============================================
          CONTENT
      ============================================= */}

      {!collapsed && (

        <div
          style={{
            flex:
              1,

            overflowY:
              "auto",

            padding:
              8,
          }}
        >

          {/* =========================================
              NEW PROJECT
          ========================================= */}

          <div
            style={{
              display:
                "flex",

              marginBottom:
                12,
            }}
          >

            <input
              type="text"

              placeholder=
                "Project Name"

              value={
                newProjectName
              }

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

                padding:
                  "6px 8px",

                borderRadius:
                  4,

                border:
                  "1px solid #333",

                background:
                  "#1a1a1a",

                color:
                  "#fff",
              }}
            />


            <button
              onClick={
                handleSave
              }

              style={{
                marginLeft:
                  6,

                padding:
                  "6px 12px",

                borderRadius:
                  4,

                border:
                  "1px solid #333",

                background:
                  "#333",

                color:
                  "#fff",

                cursor:
                  "pointer",
              }}
            >

              Save

            </button>

          </div>


          {/* =========================================
              PROJECTS
          ========================================= */}

          <h4
            style={{
              marginBottom:
                8,

              color:
                "#aaa",
            }}
          >
            Saved Projects
          </h4>


          {/* Loading */}

          {projectsLoading && (

            <div
              style={{
                color:
                  "#777",

                padding:
                  "8px 0",
              }}
            >
              Loading projects...
            </div>

          )}


          {/* Empty */}

          {!projectsLoading &&
            projectList.length === 0 && (

              <div
                style={{
                  color:
                    "#555",
                }}
              >
                No projects saved
              </div>

            )}


          {/* Project list */}

          {!projectsLoading &&
            projectList.map(
              project => (

                <div
                  key={
                    project._id
                  }

                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    padding:
                      "6px 8px",

                    borderRadius:
                      4,

                    cursor:
                      "pointer",

                    marginBottom:
                      4,

                    background:
                      activeProject ===
                      project._id
                        ? "#26324a"
                        : "#1a1a1a",

                    border:
                      activeProject ===
                      project._id
                        ? "1px solid #3b82f6"
                        : "1px solid transparent",
                  }}
                >

                  <div
                    style={{
                      flex:
                        1,
                    }}

                    onClick={() =>
                      loadProject(
                        project._id
                      )
                    }
                  >

                    {project.name}

                  </div>


                  <button
                    onClick={
                      async event => {

                        event.stopPropagation();

                        try {

                          await deleteProject(
                            project._id
                          );

                        } catch (
                          error
                        ) {

                          alert(
                            "Failed to delete project."
                          );

                        }

                      }
                    }

                    style={{
                      border:
                        "none",

                      background:
                        "transparent",

                      color:
                        "#f55",

                      cursor:
                        "pointer",
                    }}
                  >

                    ✕

                  </button>

                </div>

              )
            )}

        </div>

      )}

    </div>

  );

}