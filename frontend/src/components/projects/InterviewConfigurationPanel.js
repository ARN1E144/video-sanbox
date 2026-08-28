// frontend/src/components/project/InterviewConfigurationPanel.js

import React, {
  useMemo,
  useState,
} from "react";

import {
  useProjectContext,
  normaliseInterviewConfig,
} from "../../context/ProjectContext";

import QuestionSetEditor
  from "./QuestionSetEditor";


// =====================================================
// TOGGLE
// =====================================================

function Toggle({
  checked,
  onChange,
}) {

  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
        )
      }
      aria-pressed={
        checked
      }
      style={{
        width:
          44,

        height:
          24,

        padding:
          2,

        border:
          "1px solid #333",

        borderRadius:
          999,

        background:
          checked
            ? "#2563eb"
            : "#222",

        cursor:
          "pointer",

        position:
          "relative",

        flexShrink:
          0,
      }}
    >

      <span
        style={{
          display:
            "block",

          width:
            18,

          height:
            18,

          borderRadius:
            "50%",

          background:
            "#fff",

          transform:
            checked
              ? "translateX(18px)"
              : "translateX(0)",

          transition:
            "transform 0.15s ease",
        }}
      />

    </button>
  );

}


// =====================================================
// CHILD ACCORDION
// =====================================================

function ChildSection({
  title,
  icon,
  description,
  open,
  onToggle,
  badge,
  children,
}) {

  return (
    <div
      style={{
        border:
          "1px solid #292929",

        borderRadius:
          10,

        background:
          "#111",

        overflow:
          "hidden",

        marginBottom:
          8,
      }}
    >

      <button
        type="button"
        onClick={
          onToggle
        }
        style={{
          width:
            "100%",

          display:
            "flex",

          alignItems:
            "center",

          gap:
            9,

          padding:
            "12px 14px",

          border:
            "none",

          borderBottom:
            open
              ? "1px solid #222"
              : "none",

          background:
            open
              ? "#171717"
              : "#111",

          color:
            "#fff",

          cursor:
            "pointer",

          textAlign:
            "left",
        }}
      >

        <span
          style={{
            width:
              16,

            color:
              "#666",
          }}
        >
          {
            open
              ? "▾"
              : "▸"
          }
        </span>

        <span
          style={{
            fontSize:
              16,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            flex:
              1,
          }}
        >

          <span
            style={{
              display:
                "block",

              fontSize:
                12,

              fontWeight:
                700,
            }}
          >
            {title}
          </span>

          {description && (
            <span
              style={{
                display:
                  "block",

                marginTop:
                  3,

                color:
                  "#666",

                fontSize:
                  10,
              }}
            >
              {description}
            </span>
          )}

        </span>

        {badge}

      </button>

      {open && (
        <div
          style={{
            padding:
              14,
          }}
        >
          {children}
        </div>
      )}

    </div>
  );

}


// =====================================================
// TOP LEVEL ACCORDION
// =====================================================

function TopLevelSection({
  title,
  icon,
  description,
  open,
  onToggle,
  children,
}) {

  return (
    <div
      style={{
        border:
          "1px solid #333",

        borderRadius:
          12,

        background:
          "#141414",

        overflow:
          "hidden",
      }}
    >

      <button
        type="button"
        onClick={
          onToggle
        }
        style={{
          width:
            "100%",

          display:
            "flex",

          alignItems:
            "center",

          gap:
            10,

          padding:
            "15px 16px",

          border:
            "none",

          borderBottom:
            open
              ? "1px solid #292929"
              : "none",

          background:
            open
              ? "#191919"
              : "#141414",

          color:
            "#fff",

          cursor:
            "pointer",

          textAlign:
            "left",
        }}
      >

        <span
          style={{
            width:
              18,

            color:
              "#777",

            fontSize:
              12,
          }}
        >
          {
            open
              ? "▾"
              : "▸"
          }
        </span>

        <span
          style={{
            fontSize:
              20,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            flex:
              1,
          }}
        >

          <span
            style={{
              display:
                "block",

              fontSize:
                15,

              fontWeight:
                700,
            }}
          >
            {title}
          </span>

          <span
            style={{
              display:
                "block",

              marginTop:
                4,

              color:
                "#777",

              fontSize:
                11,
            }}
          >
            {description}
          </span>

        </span>

      </button>

      {open && (
        <div
          style={{
            padding:
              12,
          }}
        >
          {children}
        </div>
      )}

    </div>
  );

}


// =====================================================
// PANEL
// =====================================================

export default function InterviewConfigurationPanel() {

  const {

    activeProject,

    currentProject,

    projects,

    interviewConfig,

    setInterviewConfig,

    updateInterviewConfig,

    setActiveQuestionSet,

    saveInterviewConfig,

    saveCurrentProject,

  } =
    useProjectContext();


  // ===================================================
  // ACCORDION STATE
  // ===================================================

  const [
    aiInterviewerOpen,
    setAiInterviewerOpen,
  ] =
    useState(
      true
    );


  const [
    openSections,
    setOpenSections,
  ] =
    useState({

      questionSets:
        true,

      recording:
        false,

      transcription:
        false,

      evaluation:
        false,

      candidate:
        false,

      aiGeneration:
        false,

    });


  // ===================================================
  // EDITOR
  // ===================================================

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(
      false
    );


  const [
    editingQuestionSetId,
    setEditingQuestionSetId,
  ] =
    useState(
      null
    );


  // ===================================================
  // SAVE STATE
  // ===================================================

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      null
    );


  // ===================================================
  // AUTHORITATIVE PROJECT
  // ===================================================
  //
  // currentProject is the persisted representation of
  // the currently selected project.
  //
  // This is important because the project API response
  // already contains interviewConfig.
  //
  // ===================================================

  const resolvedCurrentProject =
    useMemo(
      () => {

        if (
          currentProject
        ) {

          return currentProject;

        }


        if (
          !activeProject
        ) {

          return null;

        }


        return (
          projects?.find(
            project =>
              String(
                project?._id ||
                project?.id
              ) ===
              String(
                activeProject
              )
          ) ||
          null
        );

      },
      [
        currentProject,
        activeProject,
        projects,
      ]
    );


  // ===================================================
  // RESOLVED INTERVIEW CONFIG
  // ===================================================
  //
  // EXISTING SAVED PROJECT:
  //
  // Prefer the configuration returned with the selected
  // project.
  //
  // NEW UNSAVED PROJECT:
  //
  // Use ProjectContext editor state.
  //
  // This removes the initial hydration race.
  // ===================================================

  const resolvedInterviewConfig =
    useMemo(
      () => {

        // ------------------------------------------------
        // Existing persisted project
        // ------------------------------------------------

        if (
          activeProject &&
          resolvedCurrentProject?.interviewConfig
        ) {

          return normaliseInterviewConfig(
            resolvedCurrentProject.interviewConfig
          );

        }


        // ------------------------------------------------
        // Local editor state
        // ------------------------------------------------

        return normaliseInterviewConfig(
          interviewConfig
        );

      },
      [
        activeProject,
        resolvedCurrentProject,
        interviewConfig,
      ]
    );


  // ===================================================
  // QUESTION SETS
  // ===================================================

  const questionSets =
    resolvedInterviewConfig
      ?.questionSets || [];


  // ===================================================
  // ACTIVE QUESTION SET
  // ===================================================

  const activeQuestionSet =
    questionSets.find(
      questionSet =>
        String(
          questionSet?.id
        ) ===
        String(
          resolvedInterviewConfig
            ?.activeQuestionSetId
        )
    ) ||
    null;


  // ===================================================
  // AI INTERVIEWER
  // ===================================================

  const hasAiInterviewer =
    Boolean(
      resolvedCurrentProject
    );


  // ===================================================
  // SECTION TOGGLE
  // ===================================================

  const toggleSection =
    section => {

      setOpenSections(
        previous => ({

          ...previous,

          [section]:
            !previous[
              section
            ],

        })
      );

    };


  // ===================================================
  // EDITOR
  // ===================================================

  const openCreateEditor =
    () => {

      setEditingQuestionSetId(
        null
      );

      setEditorOpen(
        true
      );

      setMessage(
        null
      );

    };


  const openEditEditor =
    id => {

      setEditingQuestionSetId(
        id
      );

      setEditorOpen(
        true
      );

      setMessage(
        null
      );

    };


  const closeEditor =
    () => {

      setEditorOpen(
        false
      );

      setEditingQuestionSetId(
        null
      );

    };


  // ===================================================
  // PROJECT SAVE
  // ===================================================

  const handleSave =
    async () => {

      if (
        !activeProject
      ) {

        setMessage(
          "Select a project before saving."
        );

        return;

      }


      try {

        setSaving(
          true
        );

        setMessage(
          null
        );


        await saveCurrentProject();


        setMessage(
          "Project configuration saved."
        );

      }
      catch (
        error
      ) {

        console.error(
          "[InterviewConfigurationPanel] Save failed",
          error
        );


        setMessage(
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save project."
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ===================================================
  // INTERVIEW CONFIG UPDATE
  // ===================================================
  //
  // Updates local state.
  //
  // Project Save persists the change.
  //
  // ===================================================

  const updateInterviewSetting =
    patch => {

      updateInterviewConfig(
        patch
      );


      setMessage(
        "Setting changed. Save the project to persist it."
      );

    };


  // ===================================================
  // RECORDING
  // ===================================================

  const setRecordingEnabled =
    value => {

      updateInterviewSetting({

        recordingEnabled:
          value,

      });

    };


  // ===================================================
  // TRANSCRIPTION
  // ===================================================

  const setTranscriptionEnabled =
    value => {

      updateInterviewSetting({

        transcriptionEnabled:
          value,

      });

    };


  // ===================================================
  // EVALUATION
  // ===================================================

  const setEvaluationEnabled =
    value => {

      updateInterviewSetting({

        evaluationEnabled:
          value,

      });

    };


  // ===================================================
  // SET ACTIVE QUESTION SET
  // ===================================================
  //
  // Existing project:
  //
  //     persist immediately
  //
  // New project:
  //
  //     keep in local state until project is created.
  //
  // ===================================================

  const handleSetActiveQuestionSet =
    async (
      questionSetId
    ) => {

      if (
        !questionSetId
      ) {

        return;

      }


      const nextInterviewConfig = {

        ...resolvedInterviewConfig,

        activeQuestionSetId:
          questionSetId,

      };


      try {

        setSaving(
          true
        );

        setMessage(
          null
        );


        // ------------------------------------------------
        // Update local state immediately.
        // ------------------------------------------------

        setInterviewConfig(
          nextInterviewConfig
        );


        // ------------------------------------------------
        // Persist existing project.
        // ------------------------------------------------

        const result =
          await saveInterviewConfig(
            nextInterviewConfig
          );


        console.log(
          "[InterviewConfigurationPanel] Active Question Set changed",
          {
            questionSetId,
            result,
          }
        );


        if (
          result?.persisted
        ) {

          setMessage(
            "Active Question Set saved."
          );

        }
        else {

          setMessage(
            "Active Question Set changed. Save the project to persist it."
          );

        }

      }
      catch (
        error
      ) {

        console.error(
          "[InterviewConfigurationPanel] Active Question Set save failed",
          error
        );


        setMessage(
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save Active Question Set."
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ===================================================
  // EDITOR VIEW
  // ===================================================

  if (
    editorOpen
  ) {

    return (
      <div
        style={{
          width:
            "100%",

          height:
            "100%",

          minHeight:
            0,

          overflowY:
            "auto",

          padding:
            20,

          boxSizing:
            "border-box",

          background:
            "#0f0f0f",

          color:
            "#fff",
        }}
      >

        <QuestionSetEditor

          questionSetId={
            editingQuestionSetId
          }

          onClose={
            closeEditor
          }

          onSaved={
            questionSet => {

              closeEditor();


              setMessage(
                activeProject

                  ? "Question set saved."

                  : "Question set added. Save the project to persist it."
              );


              console.log(
                "[InterviewConfigurationPanel] Question Set saved",
                questionSet
              );

            }
          }

        />

      </div>
    );

  }


  // ===================================================
  // NO PROJECT
  // ===================================================

  if (
    !activeProject ||
    !resolvedCurrentProject
  ) {

    return (
      <div
        style={{
          width:
            "100%",

          height:
            "100%",

          padding:
            24,

          boxSizing:
            "border-box",

          background:
            "#0f0f0f",

          color:
            "#fff",
        }}
      >

        <div
          style={{
            fontSize:
              20,

            fontWeight:
              700,
          }}
        >
          Project Settings
        </div>

        <div
          style={{
            marginTop:
              8,

            color:
              "#666",

            fontSize:
              12,
          }}
        >
          Select a project to configure its settings.
        </div>

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
          "100%",

        height:
          "100%",

        minWidth:
          0,

        minHeight:
          0,

        overflowY:
          "auto",

        padding:
          20,

        boxSizing:
          "border-box",

        background:
          "#0f0f0f",

        color:
          "#fff",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap:
            16,

          marginBottom:
            18,
        }}
      >

        <div
          style={{
            minWidth:
              0,
          }}
        >

          <div
            style={{
              fontSize:
                21,

              fontWeight:
                700,
            }}
          >
            Project Settings
          </div>

          <div
            style={{
              marginTop:
                5,

              color:
                "#777",

              fontSize:
                12,
            }}
          >
            {
              resolvedCurrentProject.name ||
              "Untitled Project"
            }
          </div>

        </div>


        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            saving
          }
          style={{
            border:
              "1px solid #3b82f6",

            background:
              "#1d4ed8",

            color:
              "#fff",

            padding:
              "8px 14px",

            borderRadius:
              8,

            cursor:
              saving
                ? "default"
                : "pointer",

            opacity:
              saving
                ? 0.7
                : 1,

            fontWeight:
              600,

            flexShrink:
              0,
          }}
        >
          {
            saving
              ? "Saving..."
              : "Save Project"
          }
        </button>

      </div>


      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (

        <div
          style={{
            marginBottom:
              12,

            padding:
              "9px 11px",

            border:
              "1px solid #292929",

            borderRadius:
              8,

            background:
              "#141414",

            color:
              "#999",

            fontSize:
              11,
          }}
        >
          {message}
        </div>

      )}


      {/* =================================================
          AI INTERVIEWER
      ================================================= */}

      {hasAiInterviewer && (

        <TopLevelSection

          title="AI Interviewer"

          icon="🎤"

          description="Interview behaviour, questions, recording and evaluation."

          open={
            aiInterviewerOpen
          }

          onToggle={() =>
            setAiInterviewerOpen(
              previous =>
                !previous
            )
          }

        >

          {/* =============================================
              QUESTION SETS
          ============================================= */}

          <ChildSection

            title="Question Sets"

            icon="📋"

            description="Questions used by new interviews."

            open={
              openSections.questionSets
            }

            onToggle={() =>
              toggleSection(
                "questionSets"
              )
            }

            badge={

              activeQuestionSet ? (

                <span
                  style={{
                    color:
                      "#93c5fd",

                    fontSize:
                      10,

                    fontWeight:
                      600,

                    maxWidth:
                      180,

                    overflow:
                      "hidden",

                    textOverflow:
                      "ellipsis",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {
                    activeQuestionSet.name
                  }
                </span>

              ) : (

                <span
                  style={{
                    color:
                      "#666",

                    fontSize:
                      10,
                  }}
                >
                  Not configured
                </span>

              )

            }

          >

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                marginBottom:
                  10,
              }}
            >

              <div
                style={{
                  color:
                    "#666",

                  fontSize:
                    11,
                }}
              >
                {questionSets.length}{" "}
                set
                {
                  questionSets.length ===
                  1
                    ? ""
                    : "s"
                }
              </div>


              <button
                type="button"
                onClick={
                  openCreateEditor
                }
                style={{
                  border:
                    "1px solid #333",

                  background:
                    "#1b1b1b",

                  color:
                    "#ddd",

                  padding:
                    "7px 10px",

                  borderRadius:
                    7,

                  cursor:
                    "pointer",

                  fontSize:
                    11,

                  fontWeight:
                    600,
                }}
              >
                + Create Question Set
              </button>

            </div>


            {questionSets.length ===
              0 && (

              <div
                style={{
                  padding:
                    18,

                  border:
                    "1px dashed #333",

                  borderRadius:
                    9,

                  background:
                    "#101010",

                  color:
                    "#666",

                  textAlign:
                    "center",

                  fontSize:
                    11,
                }}
              >

                No Question Sets have been
                configured for this project.

                <div>

                  <button
                    type="button"
                    onClick={
                      openCreateEditor
                    }
                    style={{
                      marginTop:
                        12,

                      border:
                        "1px solid #333",

                      background:
                        "#1b1b1b",

                      color:
                        "#ddd",

                      padding:
                        "7px 10px",

                      borderRadius:
                        7,

                      cursor:
                        "pointer",
                    }}
                  >
                    Create First Question Set
                  </button>

                </div>

              </div>

            )}


            {questionSets.map(
              questionSet => {

                const isActive =
                  String(
                    questionSet?.id
                  ) ===
                  String(
                    resolvedInterviewConfig
                      ?.activeQuestionSetId
                  );


                const count =
                  Array.isArray(
                    questionSet?.questions
                  )
                    ? questionSet.questions.length
                    : 0;


                return (

                  <div
                    key={
                      questionSet.id
                    }
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      gap:
                        10,

                      padding:
                        "10px 11px",

                      marginBottom:
                        6,

                      border:
                        isActive
                          ? "1px solid #31578f"
                          : "1px solid #292929",

                      borderRadius:
                        8,

                      background:
                        isActive
                          ? "#152137"
                          : "#111",
                    }}
                  >

                    <div
                      style={{
                        flex:
                          1,

                        minWidth:
                          0,
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            12,

                          fontWeight:
                            700,

                          overflow:
                            "hidden",

                          textOverflow:
                            "ellipsis",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          questionSet.name
                        }
                      </div>


                      <div
                        style={{
                          marginTop:
                            3,

                          color:
                            "#666",

                          fontSize:
                            10,
                        }}
                      >
                        {count}{" "}
                        question
                        {
                          count ===
                          1
                            ? ""
                            : "s"
                        }
                      </div>

                    </div>


                    <div
                      style={{
                        display:
                          "flex",

                        gap:
                          5,

                        flexShrink:
                          0,
                      }}
                    >

                      {!isActive && (

                        <button
                          type="button"
                          onClick={() =>
                            handleSetActiveQuestionSet(
                              questionSet.id
                            )
                          }
                          disabled={
                            saving
                          }
                          style={{
                            border:
                              "1px solid #333",

                            background:
                              "#1b1b1b",

                            color:
                              "#aaa",

                            padding:
                              "6px 8px",

                            borderRadius:
                              6,

                            cursor:
                              saving
                                ? "default"
                                : "pointer",

                            fontSize:
                              10,

                            opacity:
                              saving
                                ? 0.6
                                : 1,
                          }}
                        >
                          Set Active
                        </button>

                      )}


                      {isActive && (

                        <span
                          style={{
                            padding:
                              "6px 8px",

                            color:
                              "#86efac",

                            fontSize:
                              10,

                            fontWeight:
                              600,
                          }}
                        >
                          Active
                        </span>

                      )}


                      <button
                        type="button"
                        onClick={() =>
                          openEditEditor(
                            questionSet.id
                          )
                        }
                        style={{
                          border:
                            "1px solid #333",

                          background:
                            "#1b1b1b",

                          color:
                            "#ddd",

                          padding:
                            "6px 8px",

                          borderRadius:
                            6,

                          cursor:
                            "pointer",

                          fontSize:
                            10,
                        }}
                      >
                        Edit
                      </button>

                    </div>

                  </div>

                );

              }
            )}

          </ChildSection>


          {/* =============================================
              RECORDING
          ============================================= */}

          <ChildSection

            title="Recording"

            icon="🎥"

            description="Automatically record when interviews begin."

            open={
              openSections.recording
            }

            onToggle={() =>
              toggleSection(
                "recording"
              )
            }

            badge={

              <span
                style={{
                  color:
                    resolvedInterviewConfig
                      ?.recordingEnabled !== false
                      ? "#86efac"
                      : "#777",

                  fontSize:
                    10,

                  fontWeight:
                    600,
                }}
              >
                {
                  resolvedInterviewConfig
                    ?.recordingEnabled !== false
                    ? "Enabled"
                    : "Disabled"
                }
              </span>

            }

          >

            <SettingRow

              title="Automatically record"

              description="Start the VideoFeed recorder when a new interview starts."

              checked={
                resolvedInterviewConfig
                  ?.recordingEnabled !== false
              }

              onChange={
                setRecordingEnabled
              }

            />

          </ChildSection>


          {/* =============================================
              TRANSCRIPTION
          ============================================= */}

          <ChildSection

            title="Transcription"

            icon="📝"

            description="Process interview recordings into text."

            open={
              openSections.transcription
            }

            onToggle={() =>
              toggleSection(
                "transcription"
              )
            }

            badge={

              <span
                style={{
                  color:
                    resolvedInterviewConfig
                      ?.transcriptionEnabled !== false
                      ? "#86efac"
                      : "#777",

                  fontSize:
                    10,

                  fontWeight:
                    600,
                }}
              >
                {
                  resolvedInterviewConfig
                    ?.transcriptionEnabled !== false
                    ? "Enabled"
                    : "Disabled"
                }
              </span>

            }

          >

            <SettingRow

              title="Enable transcription"

              description="Enable transcription processing for completed interview recordings."

              checked={
                resolvedInterviewConfig
                  ?.transcriptionEnabled !== false
              }

              onChange={
                setTranscriptionEnabled
              }

            />

          </ChildSection>


          {/* =============================================
              AI EVALUATION
          ============================================= */}

          <ChildSection

            title="AI Evaluation"

            icon="📊"

            description="Evaluate completed interviews with AI."

            open={
              openSections.evaluation
            }

            onToggle={() =>
              toggleSection(
                "evaluation"
              )
            }

            badge={

              <span
                style={{
                  color:
                    resolvedInterviewConfig
                      ?.evaluationEnabled !== false
                      ? "#86efac"
                      : "#777",

                  fontSize:
                    10,

                  fontWeight:
                    600,
                }}
              >
                {
                  resolvedInterviewConfig
                    ?.evaluationEnabled !== false
                    ? "Enabled"
                    : "Disabled"
                }
              </span>

            }

          >

            <SettingRow

              title="Enable AI evaluation"

              description="Run the project's evaluation workflow when an interview is completed."

              checked={
                resolvedInterviewConfig
                  ?.evaluationEnabled !== false
              }

              onChange={
                setEvaluationEnabled
              }

            />

          </ChildSection>


          {/* =============================================
              CANDIDATE
          ============================================= */}

          <ChildSection

            title="Candidate Settings"

            icon="👤"

            description="Candidate access and identity."

            open={
              openSections.candidate
            }

            onToggle={() =>
              toggleSection(
                "candidate"
              )
            }

            badge={

              <span
                style={{
                  color:
                    "#666",

                  fontSize:
                    10,
                }}
              >
                Coming soon
              </span>

            }

          >

            <div
              style={{
                padding:
                  12,

                border:
                  "1px dashed #2d2d2d",

                borderRadius:
                  8,

                color:
                  "#666",

                fontSize:
                  11,

                lineHeight:
                  1.5,
              }}
            >
              Candidate authentication, invitation
              links, anonymous interviews and candidate
              profiles will be configured here.
            </div>

          </ChildSection>


          {/* =============================================
              AI QUESTION GENERATION
          ============================================= */}

          <ChildSection

            title="AI Question Generation"

            icon="✨"

            description="Generate reusable Question Sets with AI."

            open={
              openSections.aiGeneration
            }

            onToggle={() =>
              toggleSection(
                "aiGeneration"
              )
            }

            badge={

              <span
                style={{
                  color:
                    "#666",

                  fontSize:
                    10,
                }}
              >
                Coming soon
              </span>

            }

          >

            <div
              style={{
                padding:
                  12,

                border:
                  "1px dashed #2d2d2d",

                borderRadius:
                  8,

                color:
                  "#666",

                fontSize:
                  11,

                lineHeight:
                  1.5,
              }}
            >
              Generate interview questions based on
              role, experience level, skills and custom
              instructions. Generated questions will be
              saved as normal Question Sets.
            </div>

          </ChildSection>

        </TopLevelSection>

      )}


      {/* =================================================
          FUTURE SETTINGS
      ================================================= */}

      <div
        style={{
          marginTop:
            10,

          border:
            "1px solid #292929",

          borderRadius:
            12,

          background:
            "#141414",

          overflow:
            "hidden",
        }}
      >

        <div
          style={{
            padding:
              "14px 16px",

            color:
              "#777",

            fontSize:
              11,

            lineHeight:
              1.5,
          }}
        >
          More project settings can appear here as
          additional Confos expose configurable
          capabilities.
        </div>

      </div>

    </div>

  );

}


// =====================================================
// SETTING ROW
// =====================================================

function SettingRow({
  title,
  description,
  checked,
  onChange,
}) {

  return (

    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        gap:
          16,
      }}
    >

      <div
        style={{
          flex:
            1,

          minWidth:
            0,
        }}
      >

        <div
          style={{
            fontSize:
              12,

            fontWeight:
              600,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              4,

            color:
              "#666",

            fontSize:
              10,

            lineHeight:
              1.4,
          }}
        >
          {description}
        </div>

      </div>


      <Toggle
        checked={
          checked
        }
        onChange={
          onChange
        }
      />

    </div>

  );

}