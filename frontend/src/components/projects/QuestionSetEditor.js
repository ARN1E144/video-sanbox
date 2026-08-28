// frontend/src/components/project/QuestionSetEditor.js

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useProjectContext,
} from "../../context/ProjectContext";


// =====================================================
// ID GENERATOR
// =====================================================

function createId() {

  return (
    `question-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
  );

}


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
// NORMALISE QUESTIONS
// =====================================================
//
// IMPORTANT:
//
// The project stores questions as:
//
// [
//   "Question one",
//   "Question two"
// ]
//
// The editor temporarily uses:
//
// [
//   {
//     id: "...",
//     text: "Question one"
//   }
// ]
//
// This gives every textarea a stable React key.
// =====================================================

function normaliseQuestions(
  questions
) {

  if (
    !Array.isArray(
      questions
    ) ||
    questions.length === 0
  ) {

    return [
      {
        id:
          createId(),

        text:
          "",
      },
    ];

  }


  return questions.map(
    question => {

      // Already editor format.

      if (
        question &&
        typeof question ===
          "object"
      ) {

        return {

          id:
            question.id ||
            createId(),

          text:
            String(
              question.text ??
              ""
            ),

        };

      }


      // Project format.

      return {

        id:
          createId(),

        text:
          String(
            question ??
            ""
          ),

      };

    }
  );

}


// =====================================================
// CLEAN QUESTIONS FOR PROJECT STATE
// =====================================================

function getCleanQuestionValues(
  questions
) {

  return (
    questions

      .map(
        question =>
          String(
            question?.text ??
            ""
          ).trim()
      )

      .filter(
        Boolean
      )
  );

}


// =====================================================
// EMPTY QUESTION SET
// =====================================================

function createEmptyQuestionSet() {

  return {

    id:
      createQuestionSetId(),

    name:
      "",

    description:
      "",

    questions:
      [
        {
          id:
            createId(),

          text:
            "",
        },
      ],

    source:
      "manual",

  };

}


// =====================================================
// QUESTION SET EDITOR
// =====================================================

export default function QuestionSetEditor({
  questionSetId = null,
  onClose = null,
  onSaved = null,
}) {

  const {

    interviewConfig,

    addQuestionSet,

    updateQuestionSet,

    removeQuestionSet,

    setActiveQuestionSet,

    setInterviewConfig,
    
    saveInterviewConfig,

  } =
    useProjectContext();


  // ===================================================
  // EXISTING QUESTION SET
  // ===================================================

  const existingQuestionSet =
    useMemo(
      () => {

        if (
          !questionSetId
        ) {

          return null;

        }


        return (
          interviewConfig
            ?.questionSets
            ?.find(
              questionSet =>
                String(
                  questionSet?.id
                ) ===
                String(
                  questionSetId
                )
            ) ||
          null
        );

      },
      [
        interviewConfig,
        questionSetId,
      ]
    );


  // ===================================================
  // FORM STATE
  // ===================================================

  const [
    name,
    setName,
  ] =
    useState(
      ""
    );


  const [
    description,
    setDescription,
  ] =
    useState(
      ""
    );


  const [
    questions,
    setQuestions,
  ] =
    useState(
      () =>
        normaliseQuestions([])
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      null
    );


  // ===================================================
  // LOAD EXISTING QUESTION SET
  // ===================================================

  useEffect(
    () => {

      // -------------------------------------------------
      // EDIT MODE
      // -------------------------------------------------

      if (
        existingQuestionSet
      ) {

        setName(
          existingQuestionSet.name ||
          ""
        );


        setDescription(
          existingQuestionSet.description ||
          ""
        );


        setQuestions(
          normaliseQuestions(
            existingQuestionSet.questions
          )
        );


        setError(
          null
        );


        return;

      }


      // -------------------------------------------------
      // CREATE MODE
      // -------------------------------------------------

      const empty =
        createEmptyQuestionSet();


      setName(
        empty.name
      );


      setDescription(
        empty.description
      );


      setQuestions(
        empty.questions
      );


      setError(
        null
      );

    },
    [
      existingQuestionSet,
      questionSetId,
    ]
  );


  // ===================================================
  // UPDATE QUESTION
  // ===================================================

  const updateQuestion =
    (
      questionId,
      value
    ) => {

      setQuestions(
        previous =>
          previous.map(
            question =>
              question.id ===
              questionId

                ? {

                    ...question,

                    text:
                      value,

                  }

                : question
          )
      );

    };


  // ===================================================
  // ADD QUESTION
  // ===================================================

  const addQuestion =
    () => {

      setQuestions(
        previous => [

          ...previous,

          {

            id:
              createId(),

            text:
              "",

          },

        ]
      );

    };


  // ===================================================
  // REMOVE QUESTION
  // ===================================================

  const removeQuestion =
    questionId => {

      setQuestions(
        previous => {

          if (
            previous.length <=
            1
          ) {

            return [

              {

                id:
                  previous[0]?.id ||
                  createId(),

                text:
                  "",

              },

            ];

          }


          return previous.filter(
            question =>
              question.id !==
              questionId
          );

        }
      );

    };


  // ===================================================
  // MOVE QUESTION
  // ===================================================

  const moveQuestion =
    (
      index,
      direction
    ) => {

      setQuestions(
        previous => {

          const targetIndex =
            direction ===
            "up"

              ? index - 1

              : index + 1;


          if (
            targetIndex <
              0 ||

            targetIndex >=
              previous.length
          ) {

            return previous;

          }


          const next = [

            ...previous,

          ];


          const current =
            next[index];


          next[index] =
            next[targetIndex];


          next[targetIndex] =
            current;


          return next;

        }
      );

    };


  // ===================================================
  // VALIDATE
  // ===================================================

  const validate =
    () => {

      const trimmedName =
        name.trim();


      const cleanedQuestions =
        getCleanQuestionValues(
          questions
        );


      if (
        !trimmedName
      ) {

        return {

          valid:
            false,

          error:
            "Enter a question set name.",

        };

      }


      if (
        cleanedQuestions.length ===
        0
      ) {

        return {

          valid:
            false,

          error:
            "Add at least one interview question.",

        };

      }


      return {

        valid:
          true,

        name:
          trimmedName,

        description:
          description.trim(),

        questions:
          cleanedQuestions,

      };

    };


  // =====================================================
// SAVE QUESTION SET
// =====================================================

const handleSave =
  async () => {

    const validation =
      validate();


    if (
      !validation.valid
    ) {

      setError(
        validation.error
      );

      return;

    }


    setSaving(
      true
    );

    setError(
      null
    );


    try {

      // =================================================
      // BUILD QUESTION SET
      // =================================================

      const nextQuestionSet = {

        id:
          existingQuestionSet?.id ||
          createEmptyQuestionSet().id,

        name:
          validation.name,

        description:
          validation.description,

        questions:
          validation.questions,

        source:
          existingQuestionSet?.source ||
          "manual",

      };


      // =================================================
      // CURRENT CONFIG
      // =================================================

      const currentConfig =
        interviewConfig || {

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


      // =================================================
      // BUILD NEXT QUESTION SET ARRAY
      // =================================================

      let nextQuestionSets;


      if (
        existingQuestionSet
      ) {

        // -----------------------------------------------
        // EDIT EXISTING
        // -----------------------------------------------

        nextQuestionSets =
          (
            Array.isArray(
              currentConfig.questionSets
            )
              ? currentConfig.questionSets
              : []
          ).map(
            questionSet => {

              if (
                String(
                  questionSet?.id
                ) !==
                String(
                  existingQuestionSet.id
                )
              ) {

                return questionSet;

              }


              return nextQuestionSet;

            }
          );

      }
      else {

        // -----------------------------------------------
        // CREATE NEW
        // -----------------------------------------------

        nextQuestionSets = [

          ...(
            Array.isArray(
              currentConfig.questionSets
            )
              ? currentConfig.questionSets
              : []
          ),

          nextQuestionSet,

        ];

      }


      // =================================================
      // ACTIVE QUESTION SET
      // =================================================

      const nextActiveQuestionSetId =
        currentConfig.activeQuestionSetId ||
        nextQuestionSet.id;


      // =================================================
      // COMPLETE NEXT INTERVIEW CONFIG
      // =================================================

      const nextInterviewConfig = {

        ...currentConfig,

        questionSets:
          nextQuestionSets,

        activeQuestionSetId:
          nextActiveQuestionSetId,

      };


      console.log(
        "[QuestionSetEditor] Next Interview Config",
        nextInterviewConfig
      );


      // =================================================
      // UPDATE LOCAL RUNTIME/EDITOR STATE
      // =================================================

      setInterviewConfig(
        nextInterviewConfig
      );


      // =================================================
      // PERSIST
      // =================================================
      //
      // Existing saved project:
      //
      //     PATCH /api/projects/:id
      //
      // New project:
      //
      //     stays local until ProjectSidebar saves it
      //
      // =================================================

      const saveResult =
        await saveInterviewConfig(
          nextInterviewConfig
        );


      console.log(
        "[QuestionSetEditor] Interview config save result",
        saveResult
      );


      // =================================================
      // CALLBACK
      // =================================================

      if (
        typeof onSaved ===
        "function"
      ) {

        onSaved(
          nextQuestionSet
        );

      }


      // =================================================
      // CLOSE
      // =================================================

      if (
        typeof onClose ===
        "function"
      ) {

        onClose();

      }

    }
    catch (
      saveError
    ) {

      console.error(
        "[QuestionSetEditor] Save failed",
        saveError
      );


      setError(
        saveError?.response?.data?.message ||
        saveError?.response?.data?.error ||
        saveError?.message ||
        "Failed to save question set."
      );

    }
    finally {

      setSaving(
        false
      );

    }

  };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete =
    () => {

      if (
        !existingQuestionSet
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          `Delete "${existingQuestionSet.name}"?`
        );


      if (
        !confirmed
      ) {

        return;

      }


      try {

        removeQuestionSet(
          existingQuestionSet.id
        );


        if (
          typeof onClose ===
          "function"
        ) {

          onClose();

        }

      }
      catch (
        deleteError
      ) {

        console.error(
          "[QuestionSetEditor] Delete failed",
          deleteError
        );


        setError(
          deleteError?.message ||
          "Failed to delete question set."
        );

      }

    };


  // ===================================================
  // CANCEL
  // ===================================================

  const handleCancel =
    () => {

      if (
        typeof onClose ===
        "function"
      ) {

        onClose();

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

        maxWidth:
          760,

        color:
          "#fff",

        boxSizing:
          "border-box",
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
            12,

          marginBottom:
            20,
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
                20,

              fontWeight:
                700,
            }}
          >
            {
              existingQuestionSet
                ? "Edit Question Set"
                : "Create Question Set"
            }
          </div>


          <div
            style={{
              marginTop:
                5,

              color:
                "#777",

              fontSize:
                12,

              lineHeight:
                1.45,
            }}
          >
            Questions are stored at project level
            and copied into each new interview.
          </div>

        </div>


        {typeof onClose ===
          "function" && (

          <button
            type="button"
            onClick={
              handleCancel
            }
            style={{
              border:
                "1px solid #333",

              background:
                "#161616",

              color:
                "#aaa",

              borderRadius:
                8,

              padding:
                "6px 10px",

              cursor:
                "pointer",

              flexShrink:
                0,
            }}
          >
            ✕
          </button>

        )}

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div
          style={{
            marginBottom:
              14,

            padding:
              10,

            borderRadius:
              8,

            background:
              "#321515",

            border:
              "1px solid #6b1d1d",

            color:
              "#fca5a5",

            fontSize:
              12,
          }}
        >
          {error}
        </div>

      )}


      {/* =================================================
          NAME
      ================================================= */}

      <div
        style={{
          marginBottom:
            16,
        }}
      >

        <label
          style={{
            display:
              "block",

            marginBottom:
              6,

            color:
              "#aaa",

            fontSize:
              12,

            fontWeight:
              600,
          }}
        >
          Question Set Name
        </label>


        <input
          value={
            name
          }
          onChange={
            event =>
              setName(
                event.target.value
              )
          }
          placeholder=
            "e.g. Senior Software Engineer"
          style={{
            width:
              "100%",

            boxSizing:
              "border-box",

            padding:
              "10px 12px",

            borderRadius:
              8,

            border:
              "1px solid #333",

            background:
              "#141414",

            color:
              "#fff",

            outline:
              "none",

            fontFamily:
              "inherit",
          }}
        />

      </div>


      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <div
        style={{
          marginBottom:
            20,
        }}
      >

        <label
          style={{
            display:
              "block",

            marginBottom:
              6,

            color:
              "#aaa",

            fontSize:
              12,

            fontWeight:
              600,
          }}
        >
          Description
        </label>


        <textarea
          value={
            description
          }
          onChange={
            event =>
              setDescription(
                event.target.value
              )
          }
          placeholder=
            "Describe what this question set is for..."
          rows={
            3
          }
          style={{
            width:
              "100%",

            boxSizing:
              "border-box",

            padding:
              "10px 12px",

            borderRadius:
              8,

            border:
              "1px solid #333",

            background:
              "#141414",

            color:
              "#fff",

            resize:
              "vertical",

            fontFamily:
              "inherit",

            lineHeight:
              1.4,
          }}
        />

      </div>


      {/* =================================================
          QUESTIONS HEADER
      ================================================= */}

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            12,

          marginBottom:
            10,
        }}
      >

        <div>

          <div
            style={{
              fontSize:
                14,

              fontWeight:
                700,
            }}
          >
            Questions
          </div>


          <div
            style={{
              marginTop:
                3,

              color:
                "#666",

              fontSize:
                11,
            }}
          >
            {questions.length} question
            {questions.length ===
            1
              ? ""
              : "s"}
          </div>

        </div>


        <button
          type="button"
          onClick={
            addQuestion
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
              8,

            cursor:
              "pointer",

            fontSize:
              11,

            fontWeight:
              600,
          }}
        >
          + Add Question
        </button>

      </div>


      {/* =================================================
          QUESTION LIST
      ================================================= */}

      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            8,
        }}
      >

        {questions.map(
          (
            question,
            index
          ) => (

            <div
              key={
                question.id
              }
              style={{
                display:
                  "flex",

                gap:
                  8,

                alignItems:
                  "flex-start",

                padding:
                  10,

                borderRadius:
                  10,

                border:
                  "1px solid #292929",

                background:
                  "#151515",
              }}
            >

              {/* NUMBER */}

              <div
                style={{
                  width:
                    28,

                  flexShrink:
                    0,

                  paddingTop:
                    10,

                  textAlign:
                    "center",

                  color:
                    "#777",

                  fontSize:
                    12,

                  fontWeight:
                    700,
                }}
              >
                {index + 1}
              </div>


              {/* QUESTION */}

              <textarea
                value={
                  question.text
                }
                onChange={
                  event =>
                    updateQuestion(
                      question.id,
                      event.target.value
                    )
                }
                placeholder=
                  "Enter interview question..."
                rows={
                  3
                }
                style={{
                  flex:
                    1,

                  minWidth:
                    0,

                  padding:
                    "9px 10px",

                  borderRadius:
                    8,

                  border:
                    "1px solid #333",

                  background:
                    "#101010",

                  color:
                    "#fff",

                  resize:
                    "vertical",

                  fontFamily:
                    "inherit",

                  lineHeight:
                    1.4,

                  outline:
                    "none",
                }}
              />


              {/* ACTIONS */}

              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    4,

                  flexShrink:
                    0,
                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    moveQuestion(
                      index,
                      "up"
                    )
                  }
                  disabled={
                    index === 0
                  }
                  title=
                    "Move up"
                  style={{
                    width:
                      30,

                    height:
                      28,

                    border:
                      "1px solid #333",

                    borderRadius:
                      6,

                    background:
                      "#1b1b1b",

                    color:
                      index === 0
                        ? "#444"
                        : "#aaa",

                    cursor:
                      index === 0
                        ? "default"
                        : "pointer",
                  }}
                >
                  ↑
                </button>


                <button
                  type="button"
                  onClick={() =>
                    moveQuestion(
                      index,
                      "down"
                    )
                  }
                  disabled={
                    index ===
                    questions.length - 1
                  }
                  title=
                    "Move down"
                  style={{
                    width:
                      30,

                    height:
                      28,

                    border:
                      "1px solid #333",

                    borderRadius:
                      6,

                    background:
                      "#1b1b1b",

                    color:
                      index ===
                      questions.length - 1
                        ? "#444"
                        : "#aaa",

                    cursor:
                      index ===
                      questions.length - 1
                        ? "default"
                        : "pointer",
                  }}
                >
                  ↓
                </button>


                <button
                  type="button"
                  onClick={() =>
                    removeQuestion(
                      question.id
                    )
                  }
                  title=
                    "Delete question"
                  style={{
                    width:
                      30,

                    height:
                      28,

                    border:
                      "1px solid #4a2020",

                    borderRadius:
                      6,

                    background:
                      "#241414",

                    color:
                      "#fca5a5",

                    cursor:
                      "pointer",
                  }}
                >
                  ✕
                </button>

              </div>

            </div>

          )
        )}

      </div>


      {/* =================================================
          ACTIONS
      ================================================= */}

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            12,

          marginTop:
            20,

          paddingTop:
            16,

          borderTop:
            "1px solid #222",
        }}
      >

        {/* DELETE */}

        <div>

          {existingQuestionSet && (

            <button
              type="button"
              onClick={
                handleDelete
              }
              style={{
                border:
                  "1px solid #4a2020",

                background:
                  "#241414",

                color:
                  "#fca5a5",

                padding:
                  "8px 12px",

                borderRadius:
                  8,

                cursor:
                  "pointer",

                fontSize:
                  11,
              }}
            >
              Delete Question Set
            </button>

          )}

        </div>


        {/* SAVE / CANCEL */}

        <div
          style={{
            display:
              "flex",

            gap:
              8,
          }}
        >

          <button
            type="button"
            onClick={
              handleCancel
            }
            style={{
              border:
                "1px solid #333",

              background:
                "#151515",

              color:
                "#aaa",

              padding:
                "8px 14px",

              borderRadius:
                8,

              cursor:
                "pointer",

              fontSize:
                11,
            }}
          >
            Cancel
          </button>


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
                "8px 16px",

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

              fontSize:
                11,
            }}
          >
            {
              saving
                ? "Saving..."
                : existingQuestionSet
                  ? "Save Changes"
                  : "Create Question Set"
            }
          </button>

        </div>

      </div>

    </div>

  );

}