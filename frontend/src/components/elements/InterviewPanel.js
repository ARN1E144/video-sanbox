import React, {
  useMemo,
  useState,
} from "react";

import {
  useRuntimeValue,
} from "../../hooks/useRuntimeValue";

import {
  useActionContext,
} from "../../context/ActionContext";


// =====================================================
// INTERVIEW PANEL
// =====================================================
//
// Platform-level interview workflow component.
//
// Runtime remains authoritative.
//
// The Confo supplies child components such as:
//
// - VideoFeed
// - TextBox
//
// InterviewPanel provides:
//
// - question presentation
// - interview lifecycle
// - submit
// - next question
// - completion
// - evaluation
// - media controls
// - evaluation presentation
//
// =====================================================

export default function InterviewPanel({
  id,
  children,
  style = {},
  videoTargetId = "interview-video",
  ...restProps
}) {

  // ===================================================
  // ACTION CONTEXT
  // ===================================================

  const {
    runAction,
  } =
    useActionContext();


  // ===================================================
  // RUNTIME INTERVIEW
  // ===================================================

  const interview =
    useRuntimeValue(
      "interview"
    ) || {};


  // ===================================================
  // RUNTIME MEDIA
  // ===================================================

  const media =
    useRuntimeValue(
      "media"
    ) || {};


  // ===================================================
  // LOCAL UI
  // ===================================================

  const [
    busy,
    setBusy,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState(null);


  // ===================================================
  // QUESTIONS
  // ===================================================

  const questions =
    Array.isArray(
      interview?.questions
    )
      ? interview.questions
      : [];


  const questionCount =
    questions.length;


  const currentIndex =
    Number(
      interview?.currentQuestionIndex ?? 0
    );


  const currentQuestion =
    interview?.currentQuestion ||
    questions[currentIndex] ||
    null;


  // ===================================================
  // LIFECYCLE
  // ===================================================

  const isActive =
    interview?.status ===
    "active";


  const isCompleted =
    interview?.status ===
    "completed";


  const hasAnswer =
    Boolean(
      String(
        interview?.answer?.text ||
        ""
      ).trim()
    );


  const isLastQuestion =
    questionCount > 0 &&
    currentIndex >=
      questionCount - 1;


  const evaluation =
    interview?.result ||
    interview?.aiEvaluation ||
    null;


  // ===================================================
  // PROGRESS
  // ===================================================

  const progress =
    questionCount > 0
      ? Math.min(
          100,
          (
            (
              currentIndex + 1
            ) /
            questionCount
          ) *
          100
        )
      : 0;


  // ===================================================
  // STATUS
  // ===================================================

  const statusText =
    useMemo(
      () => {

        if (
          isCompleted
        ) {

          return "Interview completed";

        }


        if (
          isActive &&
          questionCount > 0
        ) {

          return (
            `Question ${
              Math.min(
                currentIndex + 1,
                questionCount
              )
            } of ${
              questionCount
            }`
          );

        }


        return "Ready to begin";

      },
      [
        isCompleted,
        isActive,
        questionCount,
        currentIndex,
      ]
    );


  // ===================================================
  // ACTION EXECUTOR
  // ===================================================

  const execute =
    async (
      action,
      params = {}
    ) => {

      if (
        typeof runAction !==
        "function"
      ) {

        setError(
          "Runtime action system unavailable."
        );

        return {
          ok: false,
          error:
            "RUNTIME_ACTION_UNAVAILABLE",
        };

      }


      try {

        setBusy(
          true
        );

        setError(
          null
        );


        const result =
          await runAction(
            action,
            {

              targetId:
                params?.targetId ||
                null,

              sourceId:
                id ||
                null,

              sourceType:
                "InterviewPanel",

              payload:
                params?.payload ||
                {},

            }
          );


        if (
          result?.ok === false
        ) {

          setError(
            result.error ||
            `Action failed: ${action}`
          );

        }


        return result;

      }
      catch (
        err
      ) {

        console.error(
          "[InterviewPanel] Action failed",
          {
            action,
            error:
              err,
          }
        );


        const message =
          err?.message ||
          `Action failed: ${action}`;


        setError(
          message
        );


        return {

          ok: false,

          error:
            message,

        };

      }
      finally {

        setBusy(
          false
        );

      }

    };


  // ===================================================
  // START
  // ===================================================

  const handleStart =
    async () => {

      await execute(
        "interview.start"
      );

    };


  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit =
    async () => {

      if (
        !hasAnswer
      ) {

        setError(
          "Enter an answer before submitting."
        );

        return;

      }


      await execute(
        "interview.submitAnswer"
      );

    };


  // ===================================================
  // NEXT / COMPLETE
  // ===================================================

  const handleNext =
    async () => {

      if (
        !isActive
      ) {

        return;

      }


      if (
        !hasAnswer
      ) {

        setError(
          "Submit your answer before continuing."
        );

        return;

      }


      // -------------------------------------------------
      // FINAL QUESTION
      // -------------------------------------------------

      if (
        isLastQuestion
      ) {

        await execute(
          "interview.complete"
        );

        return;

      }


      // -------------------------------------------------
      // NORMAL QUESTION
      // -------------------------------------------------

      await execute(
        "interview.nextQuestion"
      );

    };


  // ===================================================
  // EVALUATE
  // ===================================================

  const handleEvaluate =
    async () => {

      if (
        !isCompleted
      ) {

        setError(
          "Complete the interview before evaluating it."
        );

        return;

      }


      await execute(
        "interview.evaluate"
      );

    };


  // ===================================================
  // MEDIA
  // ===================================================

  const handleToggleMic =
    async () => {

      await execute(
        "video.toggleMic",
        {
          targetId:
            videoTargetId,
        }
      );

    };


  const handleToggleVideo =
    async () => {

      await execute(
        "video.toggleVideo",
        {
          targetId:
            videoTargetId,
        }
      );

    };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      {...restProps}

      style={{
        width:
          "100%",

        minWidth:
          0,

        minHeight:
          0,

        display:
          "flex",

        flexDirection:
          "column",

        background:
          "#0f172a",

        color:
          "#fff",

        boxSizing:
          "border-box",

        overflow:
          "auto",

        ...style,
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          flexShrink:
            0,

          padding:
            "14px 16px",

          borderBottom:
            "1px solid #253047",

          background:
            "#111827",
        }}
      >

        <div
          style={{
            fontSize:
              18,

            fontWeight:
              700,
          }}
        >
          AI Video Interview
        </div>


        <div
          style={{
            marginTop:
              4,

            color:
              "#94a3b8",

            fontSize:
              11,
          }}
        >
          {statusText}
        </div>


        {questionCount > 0 && (

          <div
            style={{
              marginTop:
                10,

              height:
                4,

              borderRadius:
                999,

              background:
                "#1e293b",

              overflow:
                "hidden",
            }}
          >

            <div
              style={{
                width:
                  `${progress}%`,

                height:
                  "100%",

                background:
                  "#3b82f6",

                transition:
                  "width 0.2s ease",
              }}
            />

          </div>

        )}

      </div>


      {/* =================================================
          CONFO CHILDREN
      ================================================= */}
      //
      // VideoFeed and TextBox supplied by the Confo
      // are rendered here.
      //

      {children && (

        <div
          style={{
            flexShrink:
              0,

            padding:
              16,

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              12,

            boxSizing:
              "border-box",
          }}
        >
          {children}
        </div>

      )}


      {/* =================================================
          WORKFLOW
      ================================================= */}

      <div
        style={{
          padding:
            16,

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            14,

          boxSizing:
            "border-box",
        }}
      >

        {/* =============================================
            NOT STARTED
        ============================================= */}

        {!isActive &&
          !isCompleted && (

          <div
            style={{
              padding:
                16,

              border:
                "1px solid #293548",

              borderRadius:
                10,

              background:
                "#111827",
            }}
          >

            <div
              style={{
                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              Ready to begin?
            </div>


            <div
              style={{
                marginTop:
                  6,

                color:
                  "#94a3b8",

                fontSize:
                  12,

                lineHeight:
                  1.5,
              }}
            >
              The project's active Question Set
              will be used for this interview.
            </div>


            <button
              type="button"
              onClick={
                handleStart
              }
              disabled={
                busy
              }
              style={
                primaryButtonStyle
              }
            >
              {busy
                ? "Starting..."
                : "Start Interview"}
            </button>

          </div>

        )}


        {/* =============================================
            ACTIVE
        ============================================= */}

        {isActive && (

          <div
            style={{
              padding:
                16,

              border:
                "1px solid #293548",

              borderRadius:
                10,

              background:
                "#111827",
            }}
          >

            <div
              style={{
                color:
                  "#64748b",

                fontSize:
                  10,

                textTransform:
                  "uppercase",

                letterSpacing:
                  0.5,

                marginBottom:
                  7,
              }}
            >
              Current Question
            </div>


            <div
              style={{
                fontSize:
                  17,

                lineHeight:
                  1.45,

                fontWeight:
                  600,
              }}
            >
              {
                currentQuestion ||
                "Waiting for question..."
              }
            </div>


            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap:
                  8,

                marginTop:
                  16,
              }}
            >

              <button
                type="button"
                onClick={
                  handleSubmit
                }
                disabled={
                  busy ||
                  !hasAnswer
                }
                style={
                  disabledButton(
                    busy ||
                    !hasAnswer
                  )
                }
              >
                Submit Answer
              </button>


              <button
                type="button"
                onClick={
                  handleNext
                }
                disabled={
                  busy ||
                  !hasAnswer
                }
                style={
                  disabledButton(
                    busy ||
                    !hasAnswer
                  )
                }
              >
                {
                  isLastQuestion
                    ? "Complete Interview"
                    : "Next Question"
                }
              </button>

            </div>

          </div>

        )}


        {/* =============================================
            COMPLETED
        ============================================= */}

        {isCompleted && (

          <div
            style={{
              padding:
                16,

              border:
                "1px solid #29445f",

              borderRadius:
                10,

              background:
                "#111827",
            }}
          >

            <div
              style={{
                fontSize:
                  16,

                fontWeight:
                  700,
              }}
            >
              Interview complete
            </div>


            <div
              style={{
                marginTop:
                  6,

                color:
                  "#94a3b8",

                fontSize:
                  12,

                lineHeight:
                  1.5,
              }}
            >
              All interview responses have been
              submitted successfully.
            </div>


            {!evaluation && (

              <button
                type="button"
                onClick={
                  handleEvaluate
                }
                disabled={
                  busy
                }
                style={{
                  ...primaryButtonStyle,

                  background:
                    "#6d28d9",

                  borderColor:
                    "#7c3aed",
                }}
              >
                {
                  busy
                    ? "Evaluating..."
                    : "Evaluate Interview"
                }
              </button>

            )}

          </div>

        )}


        {/* =============================================
            EVALUATION
        ============================================= */}

        {evaluation && (

          <div
            style={{
              padding:
                16,

              border:
                "1px solid #3f3f46",

              borderRadius:
                10,

              background:
                "#18181b",
            }}
          >

            <div
              style={{
                fontSize:
                  16,

                fontWeight:
                  700,

                marginBottom:
                  14,
              }}
            >
              📊 AI Evaluation
            </div>


            <Score
              label="Overall"
              value={
                evaluation.overallScore
              }
            />


            <Score
              label="Communication"
              value={
                evaluation.communicationScore
              }
            />


            <Score
              label="Problem Solving"
              value={
                evaluation.problemSolvingScore
              }
            />


            <Score
              label="Technical"
              value={
                evaluation.technicalScore
              }
            />


            {Array.isArray(
              evaluation.strengths
            ) &&
              evaluation.strengths.length > 0 && (

              <EvaluationList
                title="Strengths"
                items={
                  evaluation.strengths
                }
              />

            )}


            {Array.isArray(
              evaluation.weaknesses
            ) &&
              evaluation.weaknesses.length > 0 && (

              <EvaluationList
                title="Areas for Improvement"
                items={
                  evaluation.weaknesses
                }
              />

            )}


            {evaluation.summary && (

              <div
                style={{
                  marginTop:
                    12,

                  padding:
                    12,

                  borderRadius:
                    8,

                  background:
                    "#111",

                  color:
                    "#bbb",

                  fontSize:
                    12,

                  lineHeight:
                    1.5,
                }}
              >
                {
                  evaluation.summary
                }
              </div>

            )}

          </div>

        )}


        {/* =============================================
            ERROR
        ============================================= */}

        {error && (

          <div
            style={{
              padding:
                10,

              borderRadius:
                8,

              border:
                "1px solid #6b1d1d",

              background:
                "#321515",

              color:
                "#fca5a5",

              fontSize:
                12,
            }}
          >
            {error}
          </div>

        )}

      </div>


      {/* =================================================
          MEDIA CONTROLS
      ================================================= */}

      {isActive && (

        <div
          style={{
            flexShrink:
              0,

            display:
              "flex",

            gap:
              8,

            padding:
              10,

            borderTop:
              "1px solid #253047",

            background:
              "#111827",
          }}
        >

          <button
            type="button"
            onClick={
              handleToggleMic
            }
            disabled={
              busy
            }
            style={
              media?.micEnabled === false
                ? disabledMediaButtonStyle
                : mediaButtonStyle
            }
          >
            🎙{" "}
            {
              media?.micEnabled === false
                ? "Mic Off"
                : "Mic On"
            }
          </button>


          <button
            type="button"
            onClick={
              handleToggleVideo
            }
            disabled={
              busy
            }
            style={
              media?.videoEnabled === false
                ? disabledMediaButtonStyle
                : mediaButtonStyle
            }
          >
            📹{" "}
            {
              media?.videoEnabled === false
                ? "Camera Off"
                : "Camera On"
            }
          </button>

        </div>

      )}

    </div>

  );

}


// =====================================================
// SCORE
// =====================================================

function Score({
  label,
  value,
}) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const numericValue =
    Number(value);


  return (

    <div
      style={{
        marginBottom:
          10,
      }}
    >

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          fontSize:
            11,

          marginBottom:
            4,
        }}
      >

        <span>
          {label}
        </span>

        <strong>
          {numericValue}/100
        </strong>

      </div>


      <div
        style={{
          height:
            5,

          borderRadius:
            999,

          background:
            "#27272a",

          overflow:
            "hidden",
        }}
      >

        <div
          style={{
            width:
              `${Math.max(
                0,
                Math.min(
                  100,
                  numericValue
                )
              )}%`,

            height:
              "100%",

            background:
              "#8b5cf6",
          }}
        />

      </div>

    </div>

  );

}


// =====================================================
// EVALUATION LIST
// =====================================================

function EvaluationList({
  title,
  items,
}) {

  return (

    <div
      style={{
        marginTop:
          14,
      }}
    >

      <div
        style={{
          fontSize:
            12,

          fontWeight:
            700,

          marginBottom:
            6,
        }}
      >
        {title}
      </div>


      <ul
        style={{
          margin:
            0,

          paddingLeft:
            18,

          color:
            "#bbb",

          fontSize:
            11,

          lineHeight:
            1.5,
        }}
      >

        {items.map(
          (
            item,
            index
          ) => (

            <li
              key={
                `${title}-${index}`
              }
            >
              {item}
            </li>

          )
        )}

      </ul>

    </div>

  );

}


// =====================================================
// BUTTON HELPERS
// =====================================================

function disabledButton(
  disabled
) {

  return {

    ...secondaryButtonStyle,

    opacity:
      disabled
        ? 0.5
        : 1,

    cursor:
      disabled
        ? "default"
        : "pointer",

  };

}


const primaryButtonStyle = {

  marginTop:
    14,

  border:
    "1px solid #3b82f6",

  background:
    "#1d4ed8",

  color:
    "#fff",

  padding:
    "9px 14px",

  borderRadius:
    8,

  cursor:
    "pointer",

  fontWeight:
    600,

};


const secondaryButtonStyle = {

  border:
    "1px solid #334155",

  background:
    "#1e293b",

  color:
    "#fff",

  padding:
    "8px 12px",

  borderRadius:
    8,

};


const mediaButtonStyle = {

  border:
    "1px solid #334155",

  background:
    "#1e293b",

  color:
    "#fff",

  padding:
    "7px 10px",

  borderRadius:
    7,

  cursor:
    "pointer",

  fontSize:
    11,

};


const disabledMediaButtonStyle = {

  ...mediaButtonStyle,

  background:
    "#3f1d1d",

  border:
    "1px solid #6b1d1d",

};