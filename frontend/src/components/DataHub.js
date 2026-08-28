// src/components/DataHub.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

import {
  useProjectContext,
} from "../context/ProjectContext";


// =====================================================
// RESOURCE DEFINITIONS
// =====================================================

const RESOURCE_META = {

  interviews: {

    label:
      "Interviews",

    icon:
      "🎤",

    description:
      "Interview sessions and candidate responses.",

  },

  recordings: {

    label:
      "Recordings",

    icon:
      "🎥",

    description:
      "Recorded interview sessions.",

  },

  transcriptions: {

    label:
      "Transcriptions",

    icon:
      "📝",

    description:
      "Completed interview transcriptions.",

  },

  evaluations: {

    label:
      "Evaluations",

    icon:
      "📊",

    description:
      "AI-generated interview evaluations.",

  },

  trainingSessions: {

    label:
      "Training Sessions",

    icon:
      "🎓",

    description:
      "Remote training sessions.",

  },

  attendees: {

    label:
      "Attendees",

    icon:
      "👥",

    description:
      "People attending sessions.",

  },

};


// =====================================================
// HELPERS
// =====================================================

function getProjectName(
  project
) {

  return (
    project?.name ||
    "Untitled Project"
  );

}


function getRoleLabel(
  role
) {

  if (
    !role
  ) {

    return "Unknown";

  }


  return String(
    role
  )
    .replace(
      /[_-]/g,
      " "
    )
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );

}


function formatDate(
  value
) {

  if (
    !value
  ) {

    return "—";

  }


  try {

    return new Date(
      value
    ).toLocaleString();

  }
  catch {

    return "—";

  }

}


function formatDuration(
  value
) {

  const seconds =
    Number(
      value || 0
    );


  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds <= 0
  ) {

    return "—";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remaining =
    Math.floor(
      seconds % 60
    );


  return (
    `${minutes}:${String(
      remaining
    ).padStart(
      2,
      "0"
    )}`
  );

}


function formatBytes(
  value
) {

  const bytes =
    Number(
      value || 0
    );


  if (
    !bytes
  ) {

    return "—";

  }


  if (
    bytes < 1024
  ) {

    return `${bytes} B`;

  }


  if (
    bytes < 1024 * 1024
  ) {

    return (
      `${(
        bytes / 1024
      ).toFixed(1)} KB`
    );

  }


  return (
    `${(
      bytes /
      1024 /
      1024
    ).toFixed(2)} MB`
  );

}


function normaliseArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


function getStatusStyle(
  status
) {

  switch (
    String(
      status ||
      ""
    ).toLowerCase()
  ) {

    case "completed":

    case "uploaded":

    case "complete":

    case "success":

      return {

        color:
          "#86efac",

        background:
          "rgba(34,197,94,.08)",

        border:
          "1px solid rgba(34,197,94,.25)",

      };


    case "active":

    case "recording":

      return {

        color:
          "#fca5a5",

        background:
          "rgba(239,68,68,.08)",

        border:
          "1px solid rgba(239,68,68,.25)",

      };


    case "uploading":

    case "processing":

    case "pending":

      return {

        color:
          "#fde68a",

        background:
          "rgba(234,179,8,.08)",

        border:
          "1px solid rgba(234,179,8,.25)",

      };


    case "failed":

    case "error":

      return {

        color:
          "#fca5a5",

        background:
          "rgba(239,68,68,.08)",

        border:
          "1px solid rgba(239,68,68,.25)",

      };


    default:

      return {

        color:
          "#aaa",

        background:
          "#111",

        border:
          "1px solid #2a2a2a",

      };

  }

}


// =====================================================
// STATUS PILL
// =====================================================

function StatusPill({
  status,
}) {

  const style =
    getStatusStyle(
      status
    );


  return (

    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        padding:
          "5px 8px",

        borderRadius:
          999,

        fontSize:
          11,

        fontWeight:
          600,

        ...style,

      }}
    >
      {status || "Unknown"}
    </span>

  );

}


// =====================================================
// RAW DATA
// =====================================================

function RawData({
  record,
}) {

  const [
    visible,
    setVisible,
  ] =
    useState(false);


  return (

    <div
      style={{
        marginTop:
          12,
      }}
    >

      <button
        type="button"

        onClick={() =>
          setVisible(
            current =>
              !current
          )
        }

        style={{
          border:
            "none",

          background:
            "transparent",

          color:
            "#666",

          fontSize:
            11,

          cursor:
            "pointer",

          padding:
            0,

        }}
      >

        {visible
          ? "Hide raw data"
          : "View raw data"}

      </button>


      {visible && (

        <pre
          style={{
            marginTop:
              8,

            padding:
              12,

            border:
              "1px solid #292929",

            borderRadius:
              8,

            background:
              "#0b0b0b",

            color:
              "#888",

            fontSize:
              10,

            lineHeight:
              1.5,

            overflow:
              "auto",

            whiteSpace:
              "pre-wrap",

            wordBreak:
              "break-word",

          }}
        >
          {JSON.stringify(
            record,
            null,
            2
          )}
        </pre>

      )}

    </div>

  );

}


// =====================================================
// INTERVIEW CARD
// =====================================================

function InterviewRecordCard({
  record,
}) {

  const [
    showAnswers,
    setShowAnswers,
  ] =
    useState(false);


  const candidate =
    record?.candidate ||
    {};


  const answers =
    normaliseArray(
      record?.answers
    );


  const questions =
    normaliseArray(
      record?.questions
    );


  const recording =
    record?.recording ||
    {};


  const transcription =
    record?.transcription ||
    {};


  const evaluation =
    record?.evaluation ||
    {};


  const answerCount =
    answers.length;


  const candidateName =
    candidate?.name ||
    "Unnamed candidate";


  const candidateEmail =
    candidate?.email ||
    "";


  return (

    <div
      style={{
        border:
          "1px solid #292929",

        borderRadius:
          10,

        background:
          "#151515",

        overflow:
          "hidden",

      }}
    >

      <div
        style={{
          padding:
            16,

          borderBottom:
            "1px solid #242424",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap:
            16,

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
                15,

              fontWeight:
                700,

              color:
                "#fff",

            }}
          >

            {candidateName}

          </div>


          {candidateEmail && (

            <div
              style={{
                marginTop:
                  4,

                color:
                  "#777",

                fontSize:
                  12,

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

              }}
            >
              {candidateEmail}
            </div>

          )}

        </div>


        <StatusPill
          status={
            record?.status
          }
        />

      </div>


      <div
        style={{
          padding:
            16,

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(145px, 1fr))",

          gap:
            10,

        }}
      >

        <SummaryItem
          label="Started"
          value={
            formatDate(
              record?.startedAt
            )
          }
        />


        <SummaryItem
          label="Questions"
          value={
            questions.length
          }
        />


        <SummaryItem
          label="Answers"
          value={
            answerCount
          }
        />


        <SummaryItem
          label="Recording"
          value={
            recording?.available
              ? `Uploaded · ${formatDuration(
                  recording?.durationSeconds
                )}`
              : (
                  recording?.status ||
                  "None"
                )
          }

          valueColor={
            recording?.available
              ? "#86efac"
              : "#aaa"
          }
        />


        <SummaryItem
          label="Transcription"
          value={
            transcription?.available
              ? "Available"
              : (
                  transcription?.status ||
                  "Pending"
                )
          }

          valueColor={
            transcription?.available
              ? "#86efac"
              : "#aaa"
          }
        />


        <SummaryItem
          label="Evaluation"
          value={
            evaluation?.available
              ? (
                  evaluation?.overallScore !=
                  null

                    ? `${evaluation.overallScore}/100`

                    : "Available"
                )
              : "Not evaluated"
          }

          valueColor={
            evaluation?.available
              ? "#86efac"
              : "#aaa"
          }
        />

      </div>


      {answers.length > 0 && (

        <div
          style={{
            padding:
              "0 16px 16px",
          }}
        >

          <button
            type="button"

            onClick={() =>
              setShowAnswers(
                current =>
                  !current
              )
            }

            style={{
              padding:
                "8px 10px",

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#1a1a1a",

              color:
                "#ccc",

              cursor:
                "pointer",

              fontSize:
                12,

            }}
          >

            {showAnswers
              ? "Hide answers"
              : `View answers (${answers.length})`}

          </button>


          {showAnswers && (

            <div
              style={{
                marginTop:
                  12,

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  10,

              }}
            >

              {answers.map(
                (
                  answer,
                  index
                ) => (

                  <div
                    key={
                      `${record?.id || record?.interviewId}-${answer?.questionIndex ?? index}`
                    }

                    style={{
                      padding:
                        12,

                      border:
                        "1px solid #292929",

                      borderRadius:
                        8,

                      background:
                        "#101010",

                    }}
                  >

                    <div
                      style={{
                        color:
                          "#666",

                        fontSize:
                          11,

                        marginBottom:
                          6,

                        fontWeight:
                          600,

                      }}
                    >
                      Question {(
                        answer?.questionIndex ??
                        index
                      ) + 1}
                    </div>


                    <div
                      style={{
                        color:
                          "#ddd",

                        fontSize:
                          12,

                        fontWeight:
                          600,

                        lineHeight:
                          1.5,

                      }}
                    >
                      {
                        answer?.question ||
                        "Question unavailable"
                      }
                    </div>


                    <div
                      style={{
                        marginTop:
                          8,

                        color:
                          "#aaa",

                        fontSize:
                          12,

                        lineHeight:
                          1.6,

                        whiteSpace:
                          "pre-wrap",

                      }}
                    >
                      {
                        answer?.text ||
                        answer?.transcript ||
                        "No answer recorded."
                      }
                    </div>


                    <div
                      style={{
                        marginTop:
                          8,

                        color:
                          "#555",

                        fontSize:
                          10,

                      }}
                    >
                      Completed{" "}
                      {formatDate(
                        answer?.completedAt
                      )}
                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}


      <div
        style={{
          padding:
            "10px 16px 14px",

          borderTop:
            "1px solid #242424",

          color:
            "#555",

          fontSize:
            10,

        }}
      >

        Created{" "}
        {formatDate(
          record?.createdAt
        )}


        <RawData
          record={
            record
          }
        />

      </div>

    </div>

  );

}


// =====================================================
// RECORDING CARD
// =====================================================

function RecordingRecordCard({
  record,
}) {

  const recording =
    record?.recording ||
    {};


  const candidate =
    record?.candidate ||
    {};


  return (

    <div
      style={{
        padding:
          16,

        border:
          "1px solid #292929",

        borderRadius:
          10,

        background:
          "#151515",

      }}
    >

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
            {
              candidate?.name ||
              "Unnamed candidate"
            }
          </div>


          {candidate?.email && (

            <div
              style={{
                marginTop:
                  4,

                color:
                  "#777",

                fontSize:
                  11,

              }}
            >
              {candidate.email}
            </div>

          )}

        </div>


        <StatusPill
          status={
            recording?.status ||
            "uploaded"
          }
        />

      </div>


      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(140px, 1fr))",

          gap:
            10,

          marginTop:
            14,

        }}
      >

        <SummaryItem
          label="Duration"
          value={
            formatDuration(
              recording?.durationSeconds
            )
          }
        />


        <SummaryItem
          label="File size"
          value={
            formatBytes(
              recording?.sizeBytes
            )
          }
        />


        <SummaryItem
          label="Uploaded"
          value={
            formatDate(
              recording?.uploadedAt
            )
          }
        />

      </div>


      {(recording?.playbackUrl ||
        recording?.downloadUrl) && (

        <div
          style={{
            display:
              "flex",

            gap:
              8,

            flexWrap:
              "wrap",

            marginTop:
              14,

          }}
        >

          {recording?.playbackUrl && (

            <a
              href={
                recording.playbackUrl
              }

              target="_blank"

              rel="noreferrer"

              style={{
                textDecoration:
                  "none",

                padding:
                  "8px 12px",

                borderRadius:
                  7,

                background:
                  "#1d4ed8",

                color:
                  "#fff",

                fontSize:
                  12,

                fontWeight:
                  600,

              }}
            >
              ▶ Play
            </a>

          )}


          {recording?.downloadUrl && (

            <a
              href={
                recording.downloadUrl
              }

              style={{
                textDecoration:
                  "none",

                padding:
                  "8px 12px",

                border:
                  "1px solid #333",

                borderRadius:
                  7,

                background:
                  "#1a1a1a",

                color:
                  "#ddd",

                fontSize:
                  12,

              }}
            >
              ↓ Download
            </a>

          )}

        </div>

      )}


      {!recording?.playbackUrl &&
        !recording?.downloadUrl && (

          <div
            style={{
              marginTop:
                14,

              padding:
                10,

              borderRadius:
                8,

              background:
                "#111",

              color:
                "#777",

              fontSize:
                11,

            }}
          >
            Recording exists, but playback access
            is not currently available.
          </div>

        )}


      <div
        style={{
          marginTop:
            12,

          color:
            "#555",

          fontSize:
            10,

        }}
      >
        Interview{" "}
        {record?.interviewId || "—"}

      </div>


      <RawData
        record={
          record
        }
      />

    </div>

  );

}


// =====================================================
// TRANSCRIPTION CARD
// =====================================================

function TranscriptionRecordCard({
  record,
}) {

  const [
    expanded,
    setExpanded,
  ] =
    useState(false);


  const transcription =
    record?.transcription ||
    {};


  const candidate =
    record?.candidate ||
    {};


  return (

    <div
      style={{
        padding:
          16,

        border:
          "1px solid #292929",

        borderRadius:
          10,

        background:
          "#151515",

      }}
    >

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
            {
              candidate?.name ||
              "Unnamed candidate"
            }
          </div>

          <div
            style={{
              marginTop:
                4,

              color:
                "#777",

              fontSize:
                11,

            }}
          >
            Transcription
          </div>

        </div>


        <StatusPill
          status={
            transcription?.status ||
            "completed"
          }
        />

      </div>


      <div
        style={{
          marginTop:
            14,

          color:
            "#aaa",

          fontSize:
            12,

          lineHeight:
            1.7,

          whiteSpace:
            "pre-wrap",

          maxHeight:
            expanded
              ? 5000
              : 100,

          overflow:
            "hidden",

        }}
      >
        {
          transcription?.text ||
          "No transcription text available."
        }
      </div>


      <div
        style={{
          marginTop:
            10,

        }}
      >

        <button
          type="button"

          onClick={() =>
            setExpanded(
              current =>
                !current
            )
          }

          style={{
            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#1a1a1a",

            color:
              "#ccc",

            padding:
              "7px 10px",

            cursor:
              "pointer",

            fontSize:
              11,

          }}
        >
          {expanded
            ? "Show less"
            : "Read transcription"}
        </button>

      </div>


      <div
        style={{
          marginTop:
            10,

          color:
            "#555",

          fontSize:
            10,

        }}
      >
        Completed{" "}
        {formatDate(
          transcription?.completedAt
        )}

      </div>


      <RawData
        record={
          record
        }
      />

    </div>

  );

}


// =====================================================
// EVALUATION CARD
// =====================================================

function EvaluationRecordCard({
  record,
}) {

  const evaluation =
    record?.evaluation ||
    {};


  const candidate =
    record?.candidate ||
    {};


  const strengths =
    normaliseArray(
      evaluation?.strengths
    );


  const weaknesses =
    normaliseArray(
      evaluation?.weaknesses
    );


  const questionFeedback =
    normaliseArray(
      evaluation?.questionFeedback
    );


  return (

    <div
      style={{
        padding:
          16,

        border:
          "1px solid #292929",

        borderRadius:
          10,

        background:
          "#151515",

      }}
    >

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
            {
              candidate?.name ||
              "Unnamed candidate"
            }
          </div>


          <div
            style={{
              marginTop:
                4,

              color:
                "#777",

              fontSize:
                11,

            }}
          >
            AI Interview Evaluation
          </div>

        </div>


        {evaluation?.overallScore != null && (

          <div
            style={{
              fontSize:
                20,

              fontWeight:
                700,

              color:
                "#86efac",

            }}
          >
            {
              evaluation.overallScore
            }/100
          </div>

        )}

      </div>


      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(140px, 1fr))",

          gap:
            10,

          marginTop:
            14,

        }}
      >

        <SummaryItem
          label="Communication"
          value={
            evaluation?.communicationScore ??
            "—"
          }
        />


        <SummaryItem
          label="Problem solving"
          value={
            evaluation?.problemSolvingScore ??
            "—"
          }
        />


        <SummaryItem
          label="Technical"
          value={
            evaluation?.technicalScore ??
            "—"
          }
        />

      </div>


      {evaluation?.summary && (

        <div
          style={{
            marginTop:
              14,

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
              1.6,

          }}
        >

          <div
            style={{
              color:
                "#666",

              fontSize:
                10,

              fontWeight:
                700,

              textTransform:
                "uppercase",

              marginBottom:
                6,

            }}
          >
            Summary
          </div>

          {evaluation.summary}

        </div>

      )}


      {strengths.length > 0 && (

        <EvaluationList
          title="Strengths"
          items={
            strengths
          }
        />

      )}


      {weaknesses.length > 0 && (

        <EvaluationList
          title="Areas to improve"
          items={
            weaknesses
          }
        />

      )}


      {questionFeedback.length > 0 && (

        <div
          style={{
            marginTop:
              14,

          }}
        >

          <div
            style={{
              color:
                "#666",

              fontSize:
                10,

              fontWeight:
                700,

              textTransform:
                "uppercase",

              marginBottom:
                8,

            }}
          >
            Question feedback
          </div>


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

            {questionFeedback.map(
              (
                item,
                index
              ) => (

                <div
                  key={
                    index
                  }

                  style={{
                    padding:
                      10,

                    border:
                      "1px solid #292929",

                    borderRadius:
                      8,

                    background:
                      "#111",

                    color:
                      "#aaa",

                    fontSize:
                      11,

                    lineHeight:
                      1.5,

                  }}
                >

                  {
                    typeof item ===
                    "string"

                      ? item

                      : (
                          item?.feedback ||
                          item?.summary ||
                          JSON.stringify(
                            item
                          )
                        )
                  }

                </div>

              )
            )}

          </div>

        </div>

      )}


      <RawData
        record={
          record
        }
      />

    </div>

  );

}


// =====================================================
// SUMMARY ITEM
// =====================================================

function SummaryItem({
  label,
  value,
  valueColor,
}) {

  return (

    <div
      style={{
        padding:
          10,

        borderRadius:
          8,

        background:
          "#111",

      }}
    >

      <div
        style={{
          fontSize:
            10,

          color:
            "#666",

        }}
      >
        {label}
      </div>


      <div
        style={{
          marginTop:
            5,

          fontSize:
            12,

          color:
            valueColor ||
            "#bbb",

          lineHeight:
            1.4,

        }}
      >
        {value}
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
          color:
            "#666",

          fontSize:
            10,

          fontWeight:
            700,

          textTransform:
            "uppercase",

          marginBottom:
            7,

        }}
      >
        {title}
      </div>


      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            6,

        }}
      >

        {items.map(
          (
            item,
            index
          ) => (

            <div
              key={
                index
              }

              style={{
                padding:
                  "8px 10px",

                borderRadius:
                  7,

                background:
                  "#111",

                color:
                  "#aaa",

                fontSize:
                  11,

                lineHeight:
                  1.5,

              }}
            >
              {
                typeof item ===
                "string"

                  ? item

                  : (
                      item?.text ||
                      item?.description ||
                      JSON.stringify(
                        item
                      )
                    )
              }
            </div>

          )
        )}

      </div>

    </div>

  );

}


// =====================================================
// GENERIC RESOURCE CARD
// =====================================================

function GenericRecordCard({
  record,
}) {

  return (

    <div
      style={{
        padding:
          14,

        border:
          "1px solid #292929",

        borderRadius:
          8,

        background:
          "#151515",

      }}
    >

      <pre
        style={{
          margin:
            0,

          whiteSpace:
            "pre-wrap",

          wordBreak:
            "break-word",

          color:
            "#aaa",

          fontSize:
            11,

          fontFamily:
            "monospace",

        }}
      >
        {JSON.stringify(
          record,
          null,
          2
        )}
      </pre>

    </div>

  );

}


// =====================================================
// DATA HUB
// =====================================================

export default function DataHub() {

  // ===================================================
  // ACTIVE PROJECT
  // ===================================================

  const {
    activeProject,
    currentProject,
  } =
    useProjectContext();


  const projectId =
    activeProject ||
    null;


  // ===================================================
  // PROJECT DATA
  // ===================================================

  const [
    projectData,
    setProjectData,
  ] =
    useState(null);


  const [
    projectDataLoading,
    setProjectDataLoading,
  ] =
    useState(false);


  const [
    projectDataError,
    setProjectDataError,
  ] =
    useState(null);


  // ===================================================
  // RESOURCE
  // ===================================================

  const [
    selectedResource,
    setSelectedResource,
  ] =
    useState(null);


  const [
    resourceRecords,
    setResourceRecords,
  ] =
    useState([]);


  const [
    resourceLoading,
    setResourceLoading,
  ] =
    useState(false);


  const [
    resourceError,
    setResourceError,
  ] =
    useState(null);


  // ===================================================
  // LOAD PROJECT SUMMARY
  // ===================================================

  const loadProjectData =
    useCallback(
      async (
        nextProjectId
      ) => {

        if (
          !nextProjectId
        ) {

          setProjectData(
            null
          );

          setProjectDataLoading(
            false
          );

          setProjectDataError(
            null
          );

          setSelectedResource(
            null
          );

          setResourceRecords(
            []
          );

          setResourceLoading(
            false
          );

          setResourceError(
            null
          );

          return;

        }


        try {

          setProjectDataLoading(
            true
          );

          setProjectDataError(
            null
          );


          // ------------------------------------------------
          // New project selection always resets the current
          // resource view.
          // ------------------------------------------------

          setSelectedResource(
            null
          );

          setResourceRecords(
            []
          );

          setResourceLoading(
            false
          );

          setResourceError(
            null
          );


          console.log(
            "[DataHub] Loading active project",
            {
              projectId:
                nextProjectId,
            }
          );


          const response =
            await api.get(
              `/data/projects/${nextProjectId}`
            );


          const data =
            response?.data?.project ||
            response?.data?.data ||
            null;


          setProjectData(
            data
          );


          console.log(
            "[DataHub] Active project loaded",
            {
              projectId:
                nextProjectId,

              project:
                data,

            }
          );

        }
        catch (
          error
        ) {

          console.error(
            "[DataHub] Failed to load active project data",
            error
          );


          setProjectData(
            null
          );


          setProjectDataError(
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load project data."
          );

        }
        finally {

          setProjectDataLoading(
            false
          );

        }

      },
      []
    );


  // ===================================================
  // ACTIVE PROJECT CHANGE
  // ===================================================

  useEffect(
    () => {

      loadProjectData(
        projectId
      );

    },
    [
      projectId,
      loadProjectData,
    ]
  );


  // ===================================================
  // AVAILABLE RESOURCES
  // ===================================================

  const availableResources =
    useMemo(
      () => {

        const resources =
          projectData?.resources;


        if (
          !resources
        ) {

          return [];

        }


        // ------------------------------------------------
        // Array form
        // ------------------------------------------------

        if (
          Array.isArray(
            resources
          )
        ) {

          return resources
            .map(
              resource => {

                if (
                  typeof resource ===
                  "string"
                ) {

                  return {

                    type:
                      resource,

                    count:
                      0,

                    view:
                      true,

                  };

                }


                return {

                  type:
                    resource?.type,

                  count:
                    Number(
                      resource?.count ||
                      0
                    ),

                  view:
                    resource?.view !==
                    false,

                };

              }
            )
            .filter(
              resource =>
                resource?.type &&
                resource?.view
            );

        }


        // ------------------------------------------------
        // Object form
        // ------------------------------------------------

        if (
          typeof resources ===
          "object"
        ) {

          return Object.entries(
            resources
          )
            .map(
              (
                [
                  type,
                  value,
                ]
              ) => {

                if (
                  typeof value ===
                  "number"
                ) {

                  return {

                    type,

                    count:
                      value,

                    view:
                      true,

                  };

                }


                return {

                  type,

                  count:
                    Number(
                      value?.count ||
                      0
                    ),

                  view:
                    value?.view !==
                    false,

                };

              }
            )
            .filter(
              resource =>
                resource?.view
            );

        }


        return [];

      },
      [
        projectData,
      ]
    );


  // ===================================================
  // LOAD RESOURCE
  // ===================================================

  const handleResourceSelect =
    useCallback(
      async (
        resourceType
      ) => {

        if (
          !projectId ||
          !resourceType
        ) {

          return;

        }


        try {

          setSelectedResource(
            resourceType
          );

          setResourceLoading(
            true
          );

          setResourceError(
            null
          );

          setResourceRecords(
            []
          );


          console.log(
            "[DataHub] Loading resource",
            {
              projectId,

              resourceType,
            }
          );


          const response =
            await api.get(
              `/data/projects/${projectId}/${resourceType}`
            );


          const records =
            Array.isArray(
              response?.data?.records
            )
              ? response.data.records
              : [];


          setResourceRecords(
            records
          );


          console.log(
            "[DataHub] Resource loaded",
            {

              projectId,

              resourceType,

              count:
                records.length,

            }
          );

        }
        catch (
          error
        ) {

          console.error(
            "[DataHub] Resource load failed",
            error
          );


          setResourceRecords(
            []
          );


          setResourceError(
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load resource."
          );

        }
        finally {

          setResourceLoading(
            false
          );

        }

      },
      [
        projectId,
      ]
    );


  // ===================================================
  // RESOURCE META
  // ===================================================

  const selectedResourceMeta =
    selectedResource
      ? (
          RESOURCE_META[
            selectedResource
          ] ||
          {

            label:
              selectedResource,

            icon:
              "📁",

            description:
              "Project data.",

          }
        )
      : null;


  // ===================================================
  // RENDER RECORD
  // ===================================================

  const renderRecord =
    useCallback(
      (
        record,
        index
      ) => {

        const key =
          record?.id ||
          record?.interviewId ||
          record?._id ||
          index;


        switch (
          selectedResource
        ) {

          case "interviews":

            return (

              <InterviewRecordCard
                key={
                  key
                }

                record={
                  record
                }
              />

            );


          case "recordings":

            return (

              <RecordingRecordCard
                key={
                  key
                }

                record={
                  record
                }
              />

            );


          case "transcriptions":

            return (

              <TranscriptionRecordCard
                key={
                  key
                }

                record={
                  record
                }
              />

            );


          case "evaluations":

            return (

              <EvaluationRecordCard
                key={
                  key
                }

                record={
                  record
                }
              />

            );


          default:

            return (

              <GenericRecordCard
                key={
                  key
                }

                record={
                  record
                }

              />

            );

        }

      },
      [
        selectedResource,
      ]
    );


  // ===================================================
  // ACTIVE PROJECT DISPLAY
  // ===================================================

  const displayProject =
    projectData ||
    currentProject ||
    null;


  const displayProjectName =
    getProjectName(
      displayProject
    );


  const displayRole =
    projectData?.role ||
    currentProject?.access?.role ||
    currentProject?.role ||
    null;


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

        display:
          "flex",

        flexDirection:
          "column",

        background:
          "#0f0f0f",

        color:
          "#fff",

        overflow:
          "hidden",

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
            "18px 20px",

          borderBottom:
            "1px solid #222",

        }}
      >

        <div
          style={{
            fontSize:
              22,

            fontWeight:
              700,

          }}
        >
          Data Hub
        </div>


        <div
          style={{
            marginTop:
              5,

            color:
              "#888",

            fontSize:
              13,

          }}
        >
          Project data and resources for the active
          project.
        </div>


        {/* =================================================
            ACTIVE PROJECT
        ================================================= */}

        {projectId && (

          <div
            style={{
              marginTop:
                12,

              display:
                "flex",

              alignItems:
                "center",

              gap:
                10,

              flexWrap:
                "wrap",

            }}
          >

            <div
              style={{
                padding:
                  "7px 10px",

                borderRadius:
                  8,

                background:
                  "#18243a",

                border:
                  "1px solid #29456f",

                color:
                  "#fff",

                fontSize:
                  12,

                fontWeight:
                  700,

              }}
            >
              {displayProjectName}
            </div>


            {displayRole && (

              <div
                style={{
                  padding:
                    "5px 8px",

                  borderRadius:
                    999,

                  background:
                    "#1e293b",

                  color:
                    "#93c5fd",

                  fontSize:
                    11,

                  fontWeight:
                    600,

                }}
              >
                Role:{" "}
                {
                  getRoleLabel(
                    displayRole
                  )
                }
              </div>

            )}

          </div>

        )}

      </div>


      {/* =================================================
          BODY
      ================================================= */}

      <div
        style={{
          flex:
            1,

          minWidth:
            0,

          minHeight:
            0,

          overflow:
            "auto",

          padding:
            20,

          boxSizing:
            "border-box",

        }}
      >

        {/* =================================================
            NO ACTIVE PROJECT
        ================================================= */}

        {!projectId && (

          <div
            style={{
              height:
                "100%",

              minHeight:
                240,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              color:
                "#666",

              textAlign:
                "center",

            }}
          >

            <div>

              <div
                style={{
                  fontSize:
                    15,

                  color:
                    "#aaa",

                  marginBottom:
                    6,

                }}
              >
                No active project
              </div>


              <div
                style={{
                  fontSize:
                    12,

                }}
              >
                Select a project from the Projects sidebar
                to view its data.
              </div>

            </div>

          </div>

        )}


        {/* =================================================
            PROJECT LOADING
        ================================================= */}

        {projectId &&
          projectDataLoading && (

            <div
              style={{
                padding:
                  20,

                border:
                  "1px solid #242424",

                borderRadius:
                  10,

                background:
                  "#141414",

                color:
                  "#888",

              }}
            >
              Loading data for{" "}
              <strong
                style={{
                  color:
                    "#ccc",
                }}
              >
                {displayProjectName}
              </strong>
              ...
            </div>

          )}


        {/* =================================================
            PROJECT ERROR
        ================================================= */}

        {projectId &&
          projectDataError && (

            <div
              style={{
                padding:
                  14,

                borderRadius:
                  8,

                background:
                  "#321515",

                border:
                  "1px solid #6b1d1d",

                color:
                  "#fca5a5",

              }}
            >
              {projectDataError}
            </div>

          )}


        {/* =================================================
            PROJECT DATA
        ================================================= */}

        {projectId &&
          !projectDataLoading &&
          !projectDataError && (

            <>

              {/* =========================================
                  RESOURCES
              ========================================= */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(220px, 1fr))",

                  gap:
                    12,

                }}
              >

                {availableResources.length ===
                  0 && (

                  <div
                    style={{
                      gridColumn:
                        "1 / -1",

                      padding:
                        20,

                      border:
                        "1px solid #242424",

                      borderRadius:
                        10,

                      background:
                        "#141414",

                      color:
                        "#666",

                    }}
                  >
                    This project currently has no
                    viewable data resources.
                  </div>

                )}


                {availableResources.map(
                  resource => {

                    const meta =
                      RESOURCE_META[
                        resource.type
                      ] ||
                      {

                        label:
                          resource.type,

                        icon:
                          "📁",

                        description:
                          "Project data.",

                      };


                    const active =
                      selectedResource ===
                      resource.type;


                    return (

                      <button
                        key={
                          resource.type
                        }

                        type="button"

                        onClick={() =>
                          handleResourceSelect(
                            resource.type
                          )
                        }

                        style={{
                          textAlign:
                            "left",

                          padding:
                            16,

                          borderRadius:
                            10,

                          border:
                            active

                              ? "1px solid #3b82f6"

                              : "1px solid #292929",

                          background:
                            active

                              ? "#18243a"

                              : "#151515",

                          color:
                            "#fff",

                          cursor:
                            "pointer",

                        }}
                      >

                        <div
                          style={{
                            fontSize:
                              22,

                            marginBottom:
                              9,

                          }}
                        >
                          {
                            meta.icon
                          }
                        </div>


                        <div
                          style={{
                            fontWeight:
                              700,

                            fontSize:
                              14,

                          }}
                        >
                          {
                            meta.label
                          }
                        </div>


                        <div
                          style={{
                            marginTop:
                              5,

                            color:
                              "#777",

                            fontSize:
                              11,

                            minHeight:
                              28,

                          }}
                        >
                          {
                            meta.description
                          }
                        </div>


                        <div
                          style={{
                            marginTop:
                              12,

                            color:
                              "#aaa",

                            fontSize:
                              12,

                          }}
                        >
                          {
                            resource.count
                          }{" "}
                          records
                        </div>

                      </button>

                    );

                  }
                )}

              </div>


              {/* =========================================
                  RECORDS
              ========================================= */}

              {selectedResource && (

                <div
                  style={{
                    marginTop:
                      28,

                  }}
                >

                  <div
                    style={{
                      marginBottom:
                        12,

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
                      {
                        selectedResourceMeta?.icon
                      }{" "}
                      {
                        selectedResourceMeta?.label
                      }
                    </div>


                    <div
                      style={{
                        marginTop:
                          3,

                        color:
                          "#666",

                        fontSize:
                          12,

                      }}
                    >
                      {
                        selectedResourceMeta?.description
                      }
                    </div>

                  </div>


                  {resourceLoading && (

                    <div
                      style={{
                        padding:
                          20,

                        color:
                          "#777",

                      }}
                    >
                      Loading records...
                    </div>

                  )}


                  {resourceError && (

                    <div
                      style={{
                        padding:
                          14,

                        borderRadius:
                          8,

                        background:
                          "#321515",

                        border:
                          "1px solid #6b1d1d",

                        color:
                          "#fca5a5",

                      }}
                    >
                      {resourceError}
                    </div>

                  )}


                  {!resourceLoading &&
                    !resourceError &&
                    resourceRecords.length ===
                      0 && (

                    <div
                      style={{
                        padding:
                          20,

                        border:
                          "1px solid #242424",

                        borderRadius:
                          10,

                        background:
                          "#141414",

                        color:
                          "#666",

                      }}
                    >
                      No records available.
                    </div>

                  )}


                  {!resourceLoading &&
                    !resourceError &&
                    resourceRecords.length > 0 && (

                    <div
                      style={{
                        display:
                          "flex",

                        flexDirection:
                          "column",

                        gap:
                          10,

                      }}
                    >

                      {
                        resourceRecords.map(
                          renderRecord
                        )
                      }

                    </div>

                  )}

                </div>

              )}

            </>

          )}

      </div>

    </div>

  );

}