// src/dev/ConfoTest.jsx

import React, {
  useEffect,
  useState,
} from "react";

import ConfoLoader
  from "../runtime/confos/ConfoLoader";

import {
  useProjectContext,
} from "../context/ProjectContext";

import {
  installConfo,
} from "../runtime/confos/ConfoProjectInstaller";

import ConfosRegistry
  from "../configs/confos/ConfosRegistry";

import ConfoRuntimeTriggers
  from "../runtime/confos/ConfoRuntimeTriggers";

// =====================================================
// AVAILABLE CONFOS
// =====================================================
//
// These are the Confos currently exposed through the
// development installer.
//
// Keep this list aligned with ConfosRegistry while the
// development/test environment is being used.
//
// =====================================================

const AVAILABLE_CONFOS = [

  {
    id:
      "confo.one_to_one",

    name:
      "1-to-1 Video Call",
  },


  {
    id:
      "confo.one_to_many",

    name:
      "1-to-Many Video Call",
  },


  {
    id:
      "confo.host_to_many",

    name:
      "Host-to-Many Video Call",
  },


  {
    id:
      "confo.group_call",

    name:
      "Group Video Call",
  },


  {
    id:
      "confo.remote_training",

    name:
      "Remote Training",
  },


  {
    id:
      "confo.ai_video_interviewer",

    name:
      "AI Video Interviewer",
  },

    {
    id:
      "confo.compliance",

    name:
      "AI Compliance / ISO Management",
  },

];



// =====================================================
// DEBUG / TREE HELPERS
// =====================================================

function inspectTree(
  node,
  path = "root",
  result = []
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return result;

  }


  result.push({

    path,

    id:
      node.id ||
      null,

    type:
      node.type ||
      null,

    sourceId:
      node.meta?.sourceId ||
      null,

    source:
      node.meta?.source ||
      null,

    meta:
      node.meta ||
      {},

    props:
      node.props ||
      {},

  });


  if (
    Array.isArray(
      node.children
    )
  ) {

    node.children.forEach(
      (
        child,
        index
      ) => {

        inspectTree(
          child,
          `${path}.${index}`,
          result
        );

      }
    );

  }


  return result;

}


function findNodeBySourceId(
  node,
  sourceId
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  // ---------------------------------------------------
  // Match metadata source ID
  // ---------------------------------------------------

  if (
    node?.meta?.sourceId ===
    sourceId
  ) {

    return node;

  }


  // ---------------------------------------------------
  // Match direct node ID
  // ---------------------------------------------------

  if (
    node?.id ===
    sourceId
  ) {

    return node;

  }


  // ---------------------------------------------------
  // Search children
  // ---------------------------------------------------

  if (
    Array.isArray(
      node.children
    )
  ) {

    for (
      const child of node.children
    ) {

      const match =
        findNodeBySourceId(
          child,
          sourceId
        );


      if (
        match
      ) {

        return match;

      }

    }

  }


  return null;

}


// =====================================================
// CONFO TEST / INSTALLER
// =====================================================

export default function ConfoTest() {

  // ===================================================
  // PROJECT CONTEXT
  // ===================================================

  const {
    projectSchema,
    setProjectSchema,

    activeProject,

    projects,
  } =
    useProjectContext();



  // ===================================================
  // SELECTED CONFO
  // ===================================================

  const [
    selected,
    setSelected,
  ] =
    useState(
      "confo.remote_training"
    );


  // ===================================================
  // LOADED CONFO
  // ===================================================

  const [
    confo,
    setConfo,
  ] =
    useState(
      null
    );


  // ===================================================
  // ERRORS
  // ===================================================

  const [
    errors,
    setErrors,
  ] =
    useState(
      []
    );


  // ===================================================
  // INSTALL STATE
  // ===================================================

  const [
    installing,
    setInstalling,
  ] =
    useState(
      false
    );


  const [
    installResult,
    setInstallResult,
  ] =
    useState(
      null
    );

    


  // ===================================================
  // CURRENT PROJECT
  // ===================================================

  const currentProject =
    projects?.find(
      project =>
        String(
          project?._id
        ) ===
        String(
          activeProject
        )
    ) ||
    null;


  // ===================================================
  // LOAD SELECTED CONFO
  // ===================================================

    useEffect(
      () => {

        let cancelled =
          false;


        const loadConfo =
          () => {

            try {

              console.log(
                "=============================================="
              );

              console.log(
                "[ConfoTest] Loading",
                selected
              );

              console.log(
                "=============================================="
              );


              setErrors([]);

              setInstallResult(
                null
              );


              setConfo(
                null
              );


              // =========================================
              // REGISTRY LOOKUP
              // =========================================

              const config =
                ConfosRegistry[
                  selected
                ];


              if (
                !config
              ) {

                throw new Error(
                  `Confo '${selected}' not found in ConfosRegistry.`
                );

              }


              console.log(
                "[ConfoTest] Registry config",
                config
              );


              // =========================================
              // LOAD / VALIDATE
              // =========================================

              const loader =
                new ConfoLoader();


              const result =
                loader.load(
                  config
                );


              console.log(
                "[ConfoTest] LOAD RESULT",
                result
              );


              if (
                !result?.valid
              ) {

                const validationErrors =
                  result?.errors || [
                    "Unknown Confo validation error.",
                  ];


                throw new Error(
                  validationErrors.join(
                    "\n"
                  )
                );

              }


              if (
                cancelled
              ) {

                return;

              }


              setConfo(
                result.confo
              );


              console.log(
                "[ConfoTest] Confo ready",
                {

                  id:
                    result.confo?.id,

                  name:
                    result.confo?.name,

                }
              );

            }
            catch (
              error
            ) {

              console.error(
                "[ConfoTest] Load failed",
                error
              );


              if (
                cancelled
              ) {

                return;

              }


              setConfo(
                null
              );


              setErrors([
                error?.message ||
                "Failed to load Confo.",
              ]);

            }

          };


        loadConfo();


        return () => {

          cancelled =
            true;

        };

      },
      [
        selected,
      ]
    );


  // ===================================================
  // INSTALL CONFO
  // ===================================================

  const handleInstall =
    async () => {

      setErrors([]);

      setInstallResult(
        null
      );


      // =================================================
      // VALIDATE CURRENT STATE
      // =================================================

      if (
        !confo
      ) {

        setErrors([
          "No valid Confo is loaded.",
        ]);

        return;

      }


      if (
        !activeProject
      ) {

        setErrors([
          "No active project is selected.",
          "Create or open a project before installing a Confo.",
        ]);

        return;

      }


      if (
        !currentProject
      ) {

        setErrors([
          "The active project could not be resolved.",
          "Reload the project list and try again.",
        ]);

        return;

      }


      // =================================================
      // INSTALL START
      // =================================================

      setInstalling(
        true
      );


      try {

        console.log(
          "=============================================="
        );

        console.log(
          "[ConfoTest] INSTALL START"
        );

        console.log(
          {

            confoId:
              confo.id,

            confoName:
              confo.name,

            projectId:
              activeProject,

            projectName:
              currentProject.name,

          }
        );

        console.log(
          "=============================================="
        );


        // =================================================
        // INSTALL
        // =================================================

        const result =
          installConfo(
            confo,
            projectSchema
          );


        console.log(
          "[ConfoTest] INSTALL RESULT",
          result
        );


        // =================================================
        // INSTALL FAILURE
        // =================================================

        if (
          !result?.success
        ) {

          const installerErrors =
            result?.errors || [
              "Confo installation failed.",
            ];


          console.error(
            "[ConfoTest] Installation failed",
            installerErrors
          );


          setErrors(
            installerErrors
          );


          return;

        }


        // =================================================
        // INSPECT INSTALLED TREE
        // =================================================

        const diagnostics =
          inspectTree(
            result.tree
          );


        console.group(
          "[ConfoTest] INSTALLED TREE"
        );


        console.table(
          diagnostics
        );


        console.log(
          "[ConfoTest] INSTALLED TREE OBJECT",
          result.tree
        );


        console.groupEnd();


        // =================================================
        // MEDIA DIAGNOSTICS
        // =================================================

        const mediaNodes =
          diagnostics.filter(
            item =>

              item.type ===
                "VideoFeed" ||

              item.type ===
                "AgoraFeed" ||

              item.type ===
                "MediaFeed" ||

              item.type ===
                "RemoteVideoGrid" ||

              item.type ===
                "FilePreview"

          );


        console.log(
          "[ConfoTest] MEDIA NODES",
          mediaNodes
        );


        // =================================================
        // EXISTING VIDEO DIAGNOSTIC
        // =================================================

        const interviewVideo =
          findNodeBySourceId(
            result.tree,
            "interview-video"
          );


        console.log(
          "[ConfoTest] INTERVIEW VIDEO SOURCE",
          {

            found:
              !!interviewVideo,

            id:
              interviewVideo?.id ||
              null,

            type:
              interviewVideo?.type ||
              null,

            sourceId:
              interviewVideo?.meta?.sourceId ||
              null,

            meta:
              interviewVideo?.meta ||
              null,

            props:
              interviewVideo?.props ||
              null,

          }
        );


        // =================================================
        // BUILD NEXT PROJECT SCHEMA
        // =================================================

        const nextProjectSchema = {

          ...projectSchema,

          name:
            confo.name ||
            projectSchema?.name ||
            "Untitled App",

          tree:
            result.tree,

          metadata: {

            ...(projectSchema?.metadata || {}),

            installedFromConfo:
              confo.id ||
              confo.name,

            confoVersion:
              confo.version ||
              1,

            appName:
              confo.name ||
              projectSchema?.name ||
              "Untitled App",

          },

        };


        // =================================================
        // UPDATE PROJECT CONTEXT
        // =================================================

        setProjectSchema(
          nextProjectSchema
        );


        // =================================================
        // SUCCESS
        // =================================================

        setInstallResult({

          success:
            true,

          message:
            `${confo.name} installed successfully.`,

          projectId:
            activeProject,

          projectName:
            currentProject.name,

          confoId:
            confo.id,

          confoVersion:
            confo.version ||
            1,

          mediaNodeCount:
            mediaNodes.length,

          videoFeedFound:
            !!interviewVideo,

          videoFeedId:
            interviewVideo?.id ||
            null,

          videoFeedSourceId:
            interviewVideo?.meta?.sourceId ||
            null,

        });


        console.log(
          "[ConfoTest] Confo installed into active project",
          {

            projectId:
              activeProject,

            projectName:
              currentProject.name,

            confo:
              confo.name,

            mediaNodeCount:
              mediaNodes.length,

            videoFeedFound:
              !!interviewVideo,

          }
        );


        console.log(
          "=============================================="
        );

        console.log(
          "[ConfoTest] INSTALL COMPLETE"
        );

        console.log(
          "=============================================="
        );

      }
      catch (
        error
      ) {

        console.error(
          "[ConfoTest] Installation error",
          error
        );


        setErrors([
          error?.message ||
          "Confo installation failed.",
        ]);

      }
      finally {

        setInstalling(
          false
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
          "100%",

        minHeight:
          "100vh",

        background:
          "#181818",

        color:
          "#fff",

        padding:
          20,

        boxSizing:
          "border-box",

      }}
    >

      {confo && (
        <ConfoRuntimeTriggers
          confo={confo}
        />
      )}

      <h2>
        Confo Project Installer
      </h2>


      <p
        style={{
          color:
            "#aaa",

          marginBottom:
            20,
        }}
      >

        Select a Confo, validate it, then install it
        into the current project.

      </p>
      


      {/* =================================================
          CURRENT PROJECT
      ================================================= */}

      <div
        style={{

          background:
            activeProject
              ? "#132b1c"
              : "#3b1515",

          border:
            `1px solid ${
              activeProject
                ? "#166534"
                : "#7f1d1d"
            }`,

          color:
            activeProject
              ? "#86efac"
              : "#fca5a5",

          padding:
            12,

          borderRadius:
            8,

          marginBottom:
            20,

        }}
      >

        <strong>
          Current Project
        </strong>


        <div
          style={{

            marginTop:
              6,

            fontSize:
              13,

            lineHeight:
              1.5,

          }}
        >

          {
            currentProject
              ? currentProject.name
              : "No active project"
          }

          <br />

          Project ID:
          {" "}

          {
            activeProject ||
            "null"
          }

        </div>

      </div>


      {/* =================================================
          CONFO SELECTOR
      ================================================= */}

      <select
        value={
          selected
        }
        onChange={
          e =>
            setSelected(
              e.target.value
            )
        }
        style={{

          marginBottom:
            20,

          padding:
            8,

          minWidth:
            280,

        }}
      >

        {
          AVAILABLE_CONFOS.map(
            item => (

              <option
                key={
                  item.id
                }
                value={
                  item.id
                }
              >

                {
                  item.name
                }

              </option>

            )
          )
        }

      </select>


      {/* =================================================
          CONFO INFO
      ================================================= */}

      {confo && (

        <div
          style={{

            background:
              "#202020",

            border:
              "1px solid #333",

            padding:
              15,

            borderRadius:
              8,

            marginBottom:
              20,

          }}
        >

          <div
            style={{

              fontSize:
                18,

              fontWeight:
                600,

              marginBottom:
                6,

            }}
          >

            {
              confo.name
            }

          </div>


          <div
            style={{

              color:
                "#aaa",

              marginBottom:
                12,

            }}
          >

            {
              confo.description ||
              "No description provided."
            }

          </div>


          <div
            style={{

              fontSize:
                12,

              color:
                "#777",

              marginBottom:
                12,

            }}
          >

            Confo ID:
            {" "}

            {
              confo.id
            }

            <br />

            Version:
            {" "}

            {
              confo.version ||
              1
            }

          </div>


          <button
            type="button"
            onClick={
              handleInstall
            }
            disabled={
              installing ||
              !activeProject ||
              !currentProject
            }
            style={{

              padding:
                "10px 16px",

              borderRadius:
                6,

              border:
                "none",

              background:
                installing ||
                !activeProject ||
                !currentProject
                  ? "#555"
                  : "#2563eb",

              color:
                "#fff",

              cursor:
                installing ||
                !activeProject ||
                !currentProject
                  ? "default"
                  : "pointer",

              fontWeight:
                600,

            }}
          >

            {
              installing
                ? "Installing..."
                : !activeProject
                  ? "Select a Project First"
                  : "Install Confo"
            }

          </button>

        </div>

      )}


      {/* =================================================
          ERRORS
      ================================================= */}

      {
        errors.length > 0 && (

          <div
            style={{

              background:
                "#3b1515",

              border:
                "1px solid #7f1d1d",

              color:
                "#fca5a5",

              padding:
                12,

              borderRadius:
                8,

              marginBottom:
                20,

            }}
          >

            <strong>
              Confo error
            </strong>


            <ul>

              {
                errors.map(
                  (
                    error,
                    index
                  ) => (

                    <li
                      key={
                        index
                      }
                    >

                      {
                        error
                      }

                    </li>

                  )
                )
              }

            </ul>

          </div>

        )
      }


      {/* =================================================
          SUCCESS
      ================================================= */}

      {
        installResult?.success && (

          <div
            style={{

              background:
                "#12351f",

              border:
                "1px solid #166534",

              color:
                "#86efac",

              padding:
                12,

              borderRadius:
                8,

              marginBottom:
                20,

            }}
          >

            {
              installResult.message
            }


            <div
              style={{

                marginTop:
                  6,

                color:
                  "#aaa",

                fontSize:
                  13,

                lineHeight:
                  1.6,

              }}
            >

              Confo:
              {" "}
              {
                installResult.confoId
              }

              <br />

              Version:
              {" "}
              {
                installResult.confoVersion
              }

              <br />

              Project:
              {" "}
              {
                installResult.projectName
              }

              <br />

              Project ID:
              {" "}
              {
                installResult.projectId
              }

              <br />

              Media nodes:
              {" "}
              {
                installResult.mediaNodeCount
              }

              <br />

              VideoFeed found:
              {" "}
              {
                String(
                  installResult.videoFeedFound
                )
              }

              <br />

              VideoFeed ID:
              {" "}
              {
                installResult.videoFeedId ||
                "Not found"
              }

              <br />

              VideoFeed source ID:
              {" "}
              {
                installResult.videoFeedSourceId ||
                "Not found"
              }

            </div>

          </div>

        )
      }


      {/* =================================================
          PROJECT TREE
      ================================================= */}

      <details>

        <summary
          style={{

            cursor:
              "pointer",

            color:
              "#aaa",

            marginBottom:
              10,

          }}
        >

          Project Tree

        </summary>


        <pre
          style={{

            background:
              "#101010",

            padding:
              12,

            borderRadius:
              6,

            overflow:
              "auto",

            fontSize:
              12,

            color:
              "#ccc",

          }}
        >

          {
            JSON.stringify(
              projectSchema?.tree,
              null,
              2
            )
          }

        </pre>

      </details>


    </div>

  );

}