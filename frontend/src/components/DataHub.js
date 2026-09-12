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


  compliance: {

    label:
      "Compliance",

    icon:
      "🛡️",

    description:
      "Framework, controls, evidence and audit activity.",

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

    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleString();

  }
  catch {

    return "—";

  }

}


function formatShortDate(
  value
) {

  if (
    !value
  ) {

    return "—";

  }


  try {

    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleDateString();

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
    case "accepted":
    case "compliant":
    case "verified":

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
    case "requested":
    case "review_required":
    case "evidence_requested":

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
    case "rejected":
    case "remediation":

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
// HUMAN FRIENDLY LABELS
// =====================================================

function humaniseEvent(
  event
) {

  const map = {

    "compliance.evidenceRequested":
      "Evidence requested",

    "compliance.evidenceUploaded":
      "Evidence uploaded",

    "compliance.evidenceReviewRequired":
      "Evidence sent for review",

    "compliance.evidenceAccepted":
      "Evidence accepted",

    "compliance.evidenceRejected":
      "Evidence rejected",

    "compliance.evidenceUpdated":
      "Evidence updated",

    "compliance.evidenceDeleted":
      "Evidence deleted",

  };


  return (
    map[event] ||
    String(
      event ||
      "Compliance activity"
    )
      .replace(
        /^compliance\./i,
        ""
      )
      .replace(
        /([a-z])([A-Z])/g,
        "$1 $2"
      )
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /\b\w/g,
        char =>
          char.toUpperCase()
      )
  );

}


function getDecisionLabel(
  decision
) {

  const map = {

    sufficient:
      "Sufficient",

    partially_sufficient:
      "Partially sufficient",

    insufficient:
      "Insufficient",

    not_relevant:
      "Not relevant",

  };


  return (
    map[decision] ||
    decision ||
    "Not assessed"
  );

}


function getActorName(
  entry
) {

  return (
    entry?.data?.reviewer?.name ||
    entry?.reviewerName ||
    entry?.reviewedByName ||
    null
  );

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

        justifyContent:
          "center",

        padding:
          "5px 8px",

        borderRadius:
          999,

        fontSize:
          10,

        fontWeight:
          700,

        whiteSpace:
          "nowrap",

        ...style,

      }}
    >

      {
        status ||
        "Unknown"
      }

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

        {
          visible
            ? "Hide raw data"
            : "View raw data"
        }

      </button>


      {
        visible && (

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

            {
              JSON.stringify(
                record,
                null,
                2
              )
            }

          </pre>

        )
      }

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

        {
          JSON.stringify(
            record,
            null,
            2
          )
        }

      </pre>

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
          12,

        borderRadius:
          9,

        background:
          "#111",

        border:
          "1px solid #202020",

      }}
    >

      <div
        style={{

          fontSize:
            10,

          color:
            "#666",

          textTransform:
            "uppercase",

          letterSpacing:
            ".04em",

        }}
      >

        {
          label
        }

      </div>


      <div
        style={{

          marginTop:
            6,

          fontSize:
            15,

          fontWeight:
            700,

          color:
            valueColor ||
            "#ddd",

          lineHeight:
            1.4,

        }}
      >

        {
          value
        }

      </div>

    </div>

  );

}


// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  title,
  description,
  right,
}) {

  return (

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
          14,

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
              16,

            fontWeight:
              700,

            color:
              "#fff",

          }}
        >

          {
            title
          }

        </div>


        {
          description && (

            <div
              style={{

                marginTop:
                  4,

                color:
                  "#666",

                fontSize:
                  11,

                lineHeight:
                  1.5,

              }}
            >

              {
                description
              }

            </div>

          )
        }

      </div>


      {
        right && (

          <div>
            {
              right
            }
          </div>

        )
      }

    </div>

  );

}


// =====================================================
// BUTTON
// =====================================================

function ActionButton({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
}) {

  const styles = {

    primary: {

      background:
        "#1d4ed8",

      border:
        "1px solid #3b82f6",

      color:
        "#fff",

    },

    danger: {

      background:
        "#351717",

      border:
        "1px solid #6b1d1d",

      color:
        "#fca5a5",

    },

    success: {

      background:
        "#15351f",

      border:
        "1px solid #275b36",

      color:
        "#86efac",

    },

    secondary: {

      background:
        "#1a1a1a",

      border:
        "1px solid #333",

      color:
        "#ccc",

    },

  };


  return (

    <button
      type="button"

      disabled={
        disabled
      }

      onClick={
        onClick
      }

      style={{

        padding:
          "8px 11px",

        borderRadius:
          7,

        cursor:
          disabled
            ? "default"
            : "pointer",

        fontSize:
          11,

        fontWeight:
          600,

        opacity:
          disabled
            ? .55
            : 1,

        ...styles[
          variant
        ],

      }}
    >

      {
        children
      }

    </button>

  );

}


// =====================================================
// FIELD
// =====================================================

function Field({
  label,
  children,
}) {

  return (

    <label
      style={{

        display:
          "block",

        marginTop:
          12,

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

        {
          label
        }

      </div>


      {
        children
      }

    </label>

  );

}


const inputStyle = {

  width:
    "100%",

  boxSizing:
    "border-box",

  padding:
    "8px 10px",

  border:
    "1px solid #333",

  borderRadius:
    7,

  background:
    "#0f0f0f",

  color:
    "#ddd",

  outline:
    "none",

  fontSize:
    11,

};


// =====================================================
// EVALUATION LIST
// =====================================================

function EvaluationList({
  title,
  items,
}) {

  const values =
    normaliseArray(
      items
    );


  if (
    values.length ===
    0
  ) {

    return null;

  }


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

        {
          title
        }

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

        {
          values.map(
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
                        item?.feedback ||
                        JSON.stringify(
                          item
                        )
                      )
                }

              </div>

            )
          )
        }

      </div>

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

            {
              candidate?.name ||
              "Unnamed candidate"
            }

          </div>


          {
            candidate?.email && (

              <div
                style={{

                  marginTop:
                    4,

                  color:
                    "#777",

                  fontSize:
                    12,

                }}
              >

                {
                  candidate.email
                }

              </div>

            )
          }

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
            answers.length
          }
        />


        <SummaryItem
          label="Recording"
          value={
            recording?.available
              ? `Uploaded · ${formatDuration(
                  recording?.durationSeconds
                )}`
              : recording?.status ||
                "None"
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
              : transcription?.status ||
                "Pending"
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
              ? evaluation?.overallScore != null
                ? `${evaluation.overallScore}/100`
                : "Available"
              : "Not evaluated"
          }

          valueColor={
            evaluation?.available
              ? "#86efac"
              : "#aaa"
          }
        />

      </div>


      {
        answers.length > 0 && (

          <div
            style={{
              padding:
                "0 16px 16px",
            }}
          >

            <ActionButton
              onClick={() =>
                setShowAnswers(
                  current =>
                    !current
                )
              }
            >

              {
                showAnswers
                  ? "Hide answers"
                  : `View answers (${answers.length})`
              }

            </ActionButton>


            {
              showAnswers && (

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

                  {
                    answers.map(
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

                            Question{" "}
                            {
                              (
                                answer?.questionIndex ??
                                index
                              ) + 1
                            }

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

                        </div>

                      )
                    )
                  }

                </div>

              )
            }

          </div>

        )
      }


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
        {
          formatDate(
            record?.createdAt
          )
        }


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


          {
            candidate?.email && (

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

                {
                  candidate.email
                }

              </div>

            )
          }

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


      {
        (
          recording?.playbackUrl ||
          recording?.downloadUrl
        ) && (

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

            {
              recording?.playbackUrl && (

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

              )
            }


            {
              recording?.downloadUrl && (

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

              )
            }

          </div>

        )
      }


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
        {
          record?.interviewId ||
          "—"
        }

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

        <ActionButton
          onClick={() =>
            setExpanded(
              current =>
                !current
            )
          }
        >

          {
            expanded
              ? "Show less"
              : "Read transcription"
          }

        </ActionButton>

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
        {
          formatDate(
            transcription?.completedAt
          )
        }

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


        {
          evaluation?.overallScore != null && (

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

          )
        }

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


      {
        evaluation?.summary && (

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


            {
              evaluation.summary
            }

          </div>

        )
      }


      <EvaluationList
        title="Strengths"
        items={
          strengths
        }
      />


      <EvaluationList
        title="Areas to improve"
        items={
          weaknesses
        }
      />


      {
        questionFeedback.length > 0 && (

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

              {
                questionFeedback.map(
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
                )
              }

            </div>

          </div>

        )
      }


      <RawData
        record={
          record
        }
      />

    </div>

  );

}


// =====================================================
// COMPLIANCE HELPERS
// =====================================================

function getControlEvidence(
  control,
  evidence
) {

  const evidenceIds =
    normaliseArray(
      control?.evidenceIds
    );


  return evidence.filter(
    item =>
      item?.controlId ===
        control?.controlId ||
      evidenceIds.includes(
        item?.evidenceId
      )
  );

}


function getComplianceMetrics(
  compliance
) {

  const controls =
    normaliseArray(
      compliance?.controls
    );


  const evidence =
    normaliseArray(
      compliance?.evidence
    );


  const risks =
    normaliseArray(
      compliance?.risks
    );


  const actions =
    normaliseArray(
      compliance?.actions
    );


  const compliant =
    controls.filter(
      item =>
        item?.status ===
        "compliant"
    ).length;


  const reviewRequired =
    evidence.filter(
      item =>
        item?.status ===
        "review_required"
    ).length;


  const accepted =
    evidence.filter(
      item =>
        item?.status ===
        "accepted"
    ).length;


  const rejected =
    evidence.filter(
      item =>
        item?.status ===
        "rejected"
    ).length;


  const processing =
    evidence.filter(
      item =>
        item?.status ===
          "processing" ||
        item?.status ===
          "requested"
    ).length;


  const openRisks =
    risks.filter(
      item =>
        item?.status ===
        "open"
    ).length;


  const overdueEvidence =
    evidence.filter(
      item => {

        if (
          !item?.dueDate
        ) {

          return false;

        }


        if (
          [
            "accepted",
            "rejected",
          ].includes(
            item?.status
          )
        ) {

          return false;

        }


        return (
          new Date(
            item.dueDate
          ).getTime() <
          Date.now()
        );

      }
    ).length;


  const overallScore =
    controls.length > 0

      ? Math.round(
          (
            compliant /
            controls.length
          ) *
          100
        )

      : 0;


  return {

    controlsTotal:
      controls.length,

    compliant,

    outstanding:
      Math.max(
        controls.length -
        compliant,
        0
      ),

    evidenceTotal:
      evidence.length,

    accepted,

    reviewRequired,

    rejected,

    processing,

    openRisks,

    overdueEvidence,

    actions:
      actions.length,

    overallScore,

  };

}


// =====================================================
// COMPLIANCE OVERVIEW
// =====================================================

function ComplianceOverview({
  compliance,
}) {

  const metrics =
    getComplianceMetrics(
      compliance
    );


  const framework =
    compliance?.framework ||
    {};


  const evidence =
    normaliseArray(
      compliance?.evidence
    );


  const controls =
    normaliseArray(
      compliance?.controls
    );


  const history =
    normaliseArray(
      compliance?.reviewHistory
    );


  const recentEvidence =
    evidence
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b?.createdAt ||
            0
          ) -
          new Date(
            a?.createdAt ||
            0
          )
      )
      .slice(
        0,
        5
      );


  const recentControls =
    controls
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          String(
            a?.controlId ||
            ""
          ).localeCompare(
            String(
              b?.controlId ||
              ""
            )
          )
      )
      .slice(
        0,
        8
      );


  const recentHistory =
    history
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b?.createdAt ||
            0
          ) -
          new Date(
            a?.createdAt ||
            0
          )
      )
      .slice(
        0,
        5
      );


  const readiness =
    metrics.overallScore;


  return (

    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{

          padding:
            18,

          border:
            "1px solid #292929",

          borderRadius:
            12,

          background:
            "linear-gradient(135deg, #151b27 0%, #141414 100%)",

          marginBottom:
            14,

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
                  20,

                fontWeight:
                  800,

                color:
                  "#fff",

              }}
            >

              {
                framework?.name ||
                "Compliance"
              }

            </div>


            <div
              style={{

                marginTop:
                  5,

                color:
                  "#888",

                fontSize:
                  12,

              }}
            >

              {
                framework?.version
                  ? `Version ${framework.version}`
                  : "Compliance framework"
              }

              {" · "}

              {
                metrics.controlsTotal
              }{" "}
              controls

            </div>

          </div>


          <StatusPill
            status={
              framework?.status ||
              "active"
            }
          />

        </div>


        <div
          style={{

            marginTop:
              16,

            display:
              "grid",

            gridTemplateColumns:
              "minmax(180px, 1fr) auto",

            gap:
              16,

            alignItems:
              "center",

          }}
        >

          <div>

            <div
              style={{

                color:
                  "#777",

                fontSize:
                  10,

                textTransform:
                  "uppercase",

                fontWeight:
                  700,

              }}
            >

              Overall readiness

            </div>


            <div
              style={{

                marginTop:
                  5,

                color:
                  "#fff",

                fontSize:
                  28,

                fontWeight:
                  800,

              }}
            >

              {
                readiness
              }%

            </div>

          </div>


          <div
            style={{
              width:
                220,
            }}
          >

            <div
              style={{

                height:
                  9,

                background:
                  "#252525",

                borderRadius:
                  999,

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
                        readiness
                      )
                    )}%`,

                  height:
                    "100%",

                  borderRadius:
                    999,

                  background:
                    "#16a34a",

                  transition:
                    "width .25s ease",

                }}

              />

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          METRICS
      ================================================= */}

      <div
        style={{

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",

          gap:
            10,

          marginBottom:
            14,

        }}
      >

        <SummaryItem
          label="Compliant controls"
          value={
            `${metrics.compliant} / ${metrics.controlsTotal}`
          }

          valueColor={
            "#86efac"
          }
        />


        <SummaryItem
          label="Evidence"
          value={
            metrics.evidenceTotal
          }
        />


        <SummaryItem
          label="Awaiting review"
          value={
            metrics.reviewRequired
          }

          valueColor={
            metrics.reviewRequired > 0
              ? "#fde68a"
              : "#aaa"
          }
        />


        <SummaryItem
          label="Accepted"
          value={
            metrics.accepted
          }

          valueColor={
            "#86efac"
          }
        />


        <SummaryItem
          label="Rejected"
          value={
            metrics.rejected
          }

          valueColor={
            metrics.rejected > 0
              ? "#fca5a5"
              : "#aaa"
          }
        />


        <SummaryItem
          label="Outstanding"
          value={
            metrics.outstanding
          }

          valueColor={
            metrics.outstanding > 0
              ? "#fde68a"
              : "#86efac"
          }
        />


        <SummaryItem
          label="Overdue evidence"
          value={
            metrics.overdueEvidence
          }

          valueColor={
            metrics.overdueEvidence > 0
              ? "#fca5a5"
              : "#aaa"
          }
        />


        <SummaryItem
          label="Open risks"
          value={
            metrics.openRisks
          }

          valueColor={
            metrics.openRisks > 0
              ? "#fca5a5"
              : "#86efac"
          }
        />

      </div>


      {/* =================================================
          ATTENTION PANEL
      ================================================= */}

      {
        (
          metrics.reviewRequired > 0 ||
          metrics.rejected > 0 ||
          metrics.overdueEvidence > 0
        ) && (

          <div
            style={{

              marginBottom:
                14,

              padding:
                14,

              border:
                "1px solid #3a3020",

              borderRadius:
                10,

              background:
                "#17140f",

            }}
          >

            <div
              style={{

                color:
                  "#fde68a",

                fontSize:
                  11,

                fontWeight:
                  700,

              }}
            >

              Attention required

            </div>


            <div
              style={{

                marginTop:
                  6,

                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap:
                  8,

              }}
            >

              {
                metrics.reviewRequired > 0 && (

                  <span
                    style={{
                      color:
                        "#ccc",

                      fontSize:
                        11,
                    }}
                  >

                    {
                      metrics.reviewRequired
                    } evidence item
                    {metrics.reviewRequired === 1
                      ? ""
                      : "s"} awaiting review.

                  </span>

                )
              }


              {
                metrics.rejected > 0 && (

                  <span
                    style={{
                      color:
                        "#fca5a5",

                      fontSize:
                        11,
                    }}
                  >

                    {
                      metrics.rejected
                    } rejected item
                    {metrics.rejected === 1
                      ? ""
                      : "s"} need attention.

                  </span>

                )
              }


              {
                metrics.overdueEvidence > 0 && (

                  <span
                    style={{
                      color:
                        "#fca5a5",

                      fontSize:
                        11,
                    }}
                  >

                    {
                      metrics.overdueEvidence
                    } overdue evidence item
                    {metrics.overdueEvidence === 1
                      ? ""
                      : "s"}.

                  </span>

                )
              }

            </div>

          </div>

        )
      }


      {/* =================================================
          LOWER DASHBOARD
      ================================================= */}

      <div
        style={{

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",

          gap:
            14,

        }}
      >

        {/* ===============================================
            RECENT EVIDENCE
        =============================================== */}

        <div
          style={{

            border:
              "1px solid #292929",

            borderRadius:
              10,

            background:
              "#151515",

            padding:
              14,

          }}
        >

          <SectionHeader
            title="Recent evidence"
            description="Latest evidence activity."
          />


          {
            recentEvidence.length ===
              0 && (

              <div
                style={{

                  color:
                    "#666",

                  fontSize:
                    11,

                }}
              >

                No evidence submitted yet.

              </div>

            )
          }


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

            {
              recentEvidence.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={
                      item?.evidenceId ||
                      index
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
                        "8px 0",

                      borderBottom:
                        index <
                        recentEvidence.length - 1
                          ? "1px solid #222"
                          : "none",

                    }}
                  >

                    <div
                      style={{

                        minWidth:
                          0,

                        flex:
                          1,

                      }}
                    >

                      <div
                        style={{

                          color:
                            "#bbb",

                          fontSize:
                            11,

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
                          item?.fileName ||
                          item?.name ||
                          "Evidence"
                        }

                      </div>


                      <div
                        style={{

                          marginTop:
                            2,

                          color:
                            "#555",

                          fontSize:
                            10,

                        }}
                      >

                        {
                          item?.controlId ||
                          "Unassigned"
                        }


                        {
                          item?.reviewedByName && (
                            <>
                              {" · "}
                              Reviewed by{" "}
                              {
                                item.reviewedByName
                              }
                            </>
                          )
                        }

                      </div>

                    </div>


                    <StatusPill
                      status={
                        item?.status
                      }
                    />

                  </div>

                )
              )
            }

          </div>

        </div>


        {/* ===============================================
            CONTROL REGISTER
        =============================================== */}

        <div
          style={{

            border:
              "1px solid #292929",

            borderRadius:
              10,

            background:
              "#151515",

            padding:
              14,

          }}
        >

          <SectionHeader
            title="Control register"
            description="Current control status."
          />


          <div
            style={{

              display:
                "flex",

              flexDirection:
                "column",

              gap:
                7,

            }}
          >

            {
              recentControls.map(
                (
                  control
                ) => {

                  const controlEvidence =
                    getControlEvidence(
                      control,
                      evidence
                    );


                  return (

                    <div
                      key={
                        control.controlId
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
                          "8px 0",

                        borderBottom:
                          "1px solid #222",

                      }}
                    >

                      <div
                        style={{

                          minWidth:
                            0,

                          flex:
                            1,

                        }}
                      >

                        <div
                          style={{

                            color:
                              "#bbb",

                            fontSize:
                              10,

                            fontWeight:
                              700,

                          }}
                        >

                          {
                            control.controlId
                          }

                        </div>


                        <div
                          style={{

                            marginTop:
                              2,

                            color:
                              "#777",

                            fontSize:
                              10,

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            whiteSpace:
                              "nowrap",

                          }}
                        >

                          {
                            control.name ||
                            "Control"
                          }

                        </div>

                      </div>


                      <div
                        style={{

                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            6,

                          flexShrink:
                            0,

                        }}
                      >

                        <span
                          style={{

                            color:
                              "#555",

                            fontSize:
                              10,

                          }}
                        >

                          {
                            controlEvidence.length
                          }

                        </span>


                        <StatusPill
                          status={
                            control?.status
                          }
                        />

                      </div>

                    </div>

                  );

                }
              )
            }

          </div>

        </div>


        {/* ===============================================
            RECENT AUDIT ACTIVITY
        =============================================== */}

        <div
          style={{

            border:
              "1px solid #292929",

            borderRadius:
              10,

            background:
              "#151515",

            padding:
              14,

          }}
        >

          <SectionHeader
            title="Recent activity"
            description="Latest compliance decisions and changes."
          />


          {
            recentHistory.length ===
              0 && (

              <div
                style={{

                  color:
                    "#666",

                  fontSize:
                    11,

                }}
              >

                No compliance activity yet.

              </div>

            )
          }


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

            {
              recentHistory.map(
                (
                  entry,
                  index
                ) => {

                  const actor =
                    getActorName(
                      entry
                    );


                  return (

                    <div
                      key={
                        `${entry?.event || "event"}-${entry?.createdAt || index}-${index}`
                      }

                      style={{

                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "flex-start",

                        gap:
                          12,

                        padding:
                          "8px 0",

                        borderBottom:
                          index <
                          recentHistory.length - 1
                            ? "1px solid #222"
                            : "none",

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

                            color:
                              "#bbb",

                            fontSize:
                              11,

                            fontWeight:
                              600,

                          }}
                        >

                          {
                            humaniseEvent(
                              entry?.event
                            )
                          }

                        </div>


                        {
                          actor && (

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

                              By{" "}
                              {
                                actor
                              }

                            </div>

                          )
                        }

                      </div>


                      <div
                        style={{

                          color:
                            "#555",

                          fontSize:
                            10,

                          whiteSpace:
                            "nowrap",

                        }}
                      >

                        {
                          formatShortDate(
                            entry?.createdAt
                          )
                        }

                      </div>

                    </div>

                  );

                }
              )
            }

          </div>

        </div>

      </div>

    </div>

  );

}


// =====================================================
// COMPLIANCE CONTROLS
// =====================================================

function ComplianceControls({
  compliance,
}) {

  const controls =
    normaliseArray(
      compliance?.controls
    );


  const evidence =
    normaliseArray(
      compliance?.evidence
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");


  const filteredControls =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return controls.filter(
          control => {

            const matchesSearch =
              !query ||
              String(
                control?.controlId ||
                ""
              )
                .toLowerCase()
                .includes(
                  query
                ) ||
              String(
                control?.name ||
                ""
              )
                .toLowerCase()
                .includes(
                  query
                ) ||
              String(
                control?.description ||
                ""
              )
                .toLowerCase()
                .includes(
                  query
                );


            const matchesStatus =
              statusFilter ===
                "all" ||
              control?.status ===
                statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        controls,
        search,
        statusFilter,
      ]
    );


  return (

    <div>

      <SectionHeader
        title="Controls"
        description={
          `${filteredControls.length} of ${controls.length} controls shown.`
        }
      />


      <div
        style={{

          display:
            "flex",

          gap:
            8,

          flexWrap:
            "wrap",

          marginBottom:
            14,

        }}
      >

        <input
          value={
            search
          }

          onChange={
            event =>
              setSearch(
                event.target.value
              )
          }

          placeholder=
            "Search controls..."

          style={{

            flex:
              1,

            minWidth:
              220,

            padding:
              "9px 10px",

            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#111",

            color:
              "#ddd",

          }}

        />


        <select
          value={
            statusFilter
          }

          onChange={
            event =>
              setStatusFilter(
                event.target.value
              )
          }

          style={{

            minWidth:
              180,

            padding:
              "9px 10px",

            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#111",

            color:
              "#ccc",

          }}
        >

          <option value="all">
            All statuses
          </option>

          <option value="not_started">
            Not started
          </option>

          <option value="evidence_requested">
            Evidence requested
          </option>

          <option value="review_required">
            Review required
          </option>

          <option value="compliant">
            Compliant
          </option>

          <option value="remediation">
            Remediation
          </option>

          <option value="not_applicable">
            Not applicable
          </option>

        </select>

      </div>


      <div
        style={{

          border:
            "1px solid #292929",

          borderRadius:
            10,

          overflow:
            "hidden",

          background:
            "#151515",

          overflowX:
            "auto",

        }}
      >

        <div
          style={{

            minWidth:
              820,

          }}
        >

          <div
            style={{

              display:
                "grid",

              gridTemplateColumns:
                "110px minmax(180px, 1.5fr) minmax(180px, 2fr) 100px 120px",

              padding:
                "10px 12px",

              background:
                "#111",

              borderBottom:
                "1px solid #242424",

              color:
                "#666",

              fontSize:
                9,

              fontWeight:
                700,

              textTransform:
                "uppercase",

            }}
          >

            <div>ID</div>

            <div>Control</div>

            <div>Description</div>

            <div>Evidence</div>

            <div>Status</div>

          </div>


          {
            filteredControls.length ===
              0 && (

              <div
                style={{

                  padding:
                    20,

                  color:
                    "#666",

                  fontSize:
                    11,

                }}
              >

                No matching controls.

              </div>

            )
          }


          {
            filteredControls.map(
              control => {

                const relatedEvidence =
                  getControlEvidence(
                    control,
                    evidence
                  );


                return (

                  <div
                    key={
                      control.controlId
                    }

                    style={{

                      display:
                        "grid",

                      gridTemplateColumns:
                        "110px minmax(180px, 1.5fr) minmax(180px, 2fr) 100px 120px",

                      padding:
                        "11px 12px",

                      borderBottom:
                        "1px solid #222",

                      alignItems:
                        "start",

                      minHeight:
                        58,

                    }}
                  >

                    <div
                      style={{

                        color:
                          "#93c5fd",

                        fontSize:
                          10,

                        fontWeight:
                          700,

                      }}
                    >

                      {
                        control.controlId
                      }

                    </div>


                    <div
                      style={{

                        color:
                          "#ccc",

                        fontSize:
                          11,

                        fontWeight:
                          600,

                        paddingRight:
                          10,

                      }}
                    >

                      {
                        control.name ||
                        "Unnamed control"
                      }

                    </div>


                    <div
                      style={{

                        color:
                          "#777",

                        fontSize:
                          10,

                        lineHeight:
                          1.5,

                        paddingRight:
                          10,

                      }}
                    >

                      {
                        control.description ||
                        "No description."
                      }

                    </div>


                    <div
                      style={{

                        color:
                          "#aaa",

                        fontSize:
                          10,

                      }}
                    >

                      {
                        relatedEvidence.length
                      }

                    </div>


                    <div>

                      <StatusPill
                        status={
                          control.status
                        }
                      />

                    </div>

                  </div>

                );

              }
            )
          }

        </div>

      </div>

    </div>

  );

}


// =====================================================
// COMPLIANCE EVIDENCE ROW
// =====================================================

function EvidenceRow({
  evidence,
  controls,
  onOpen,
}) {

  const control =
    controls.find(
      item =>
        item?.controlId ===
        evidence?.controlId
    );


  const ai =
    evidence?.aiAssessment ||
    null;


  return (

    <div
      style={{

        padding:
          14,

        borderBottom:
          "1px solid #222",

        display:
          "grid",

        gridTemplateColumns:
          "minmax(180px, 1.5fr) 120px minmax(150px, 1fr) 120px 180px 110px",

        gap:
          10,

        alignItems:
          "center",

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

            color:
              "#ddd",

            fontSize:
              11,

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
            evidence?.fileName ||
            evidence?.name ||
            "Evidence"
          }

        </div>


        <div
          style={{

            marginTop:
              3,

            color:
              "#555",

            fontSize:
              9,

          }}
        >

          {
            evidence?.evidenceId
          }

        </div>

      </div>


      <div>

        <div
          style={{

            color:
              "#93c5fd",

            fontSize:
              10,

            fontWeight:
              700,

          }}
        >

          {
            evidence?.controlId ||
            "—"
          }

        </div>


        <div
          style={{

            marginTop:
              2,

            color:
              "#555",

            fontSize:
              9,

            overflow:
              "hidden",

            textOverflow:
              "ellipsis",

            whiteSpace:
              "nowrap",

          }}
        >

          {
            control?.name ||
            "Control"
          }

        </div>

      </div>


      <div
        style={{

          color:
            "#888",

          fontSize:
            10,

        }}
      >

        <div>
          {
            evidence?.type ||
            "document"
          }
        </div>


        {
          ai?.relevanceScore !=
            null && (

            <div
              style={{
                marginTop:
                  3,

                color:
                  "#666",

              }}
            >

              AI relevance{" "}
              {
                ai.relevanceScore
              }%

            </div>

          )
        }

      </div>


      <div>

        <StatusPill
          status={
            evidence?.status
          }
        />

      </div>


      <div
        style={{

          color:
            "#777",

          fontSize:
            10,

        }}
      >

        {
          evidence?.reviewedByName
            ? (

              <>

                <div
                  style={{

                    color:
                      "#bbb",

                    fontWeight:
                      600,

                  }}
                >

                  {
                    evidence.reviewedByName
                  }

                </div>


                <div
                  style={{

                    marginTop:
                      2,

                    color:
                      "#555",

                  }}
                >

                  {
                    evidence.reviewDecision ===
                    "accepted"

                      ? "Accepted"

                      : evidence.reviewDecision ===
                        "rejected"

                        ? "Rejected"

                        : "Reviewed"
                  }


                  {" · "}


                  {
                    formatShortDate(
                      evidence.reviewedAt
                    )
                  }

                </div>

              </>

            )

            : (

              "Awaiting review"

            )
        }

      </div>


      <div
        style={{

          display:
            "flex",

          justifyContent:
            "flex-end",

        }}
      >

        <ActionButton
          onClick={() =>
            onOpen(
              evidence
            )
          }
        >

          View details

        </ActionButton>

      </div>

    </div>

  );

}


// =====================================================
// AI ASSESSMENT PANEL
// =====================================================

function AIAssessmentPanel({
  assessment,
}) {

  if (
    !assessment
  ) {

    return (

      <div
        style={{

          marginTop:
            14,

          padding:
            12,

          border:
            "1px dashed #292929",

          borderRadius:
            8,

          background:
            "#111",

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

          }}
        >

          AI assessment

        </div>


        <div
          style={{

            marginTop:
              6,

            color:
              "#555",

            fontSize:
              11,

          }}
        >

          No AI assessment has been run yet.

        </div>

      </div>

    );

  }


  const findings =
    normaliseArray(
      assessment?.findings
    );


  const matchedRequirements =
    normaliseArray(
      assessment?.matchedRequirements
    );


  const gaps =
    normaliseArray(
      assessment?.gaps
    );


  const relevance =
    Number(
      assessment?.relevanceScore
    );


  const confidence =
    Number(
      assessment?.confidence
    );


  return (

    <div
      style={{

        marginTop:
          14,

        padding:
          14,

        border:
          "1px solid #292929",

        borderRadius:
          9,

        background:
          "#111",

      }}
    >

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

          }}
        >

          AI assessment

        </div>


        <StatusPill
          status={
            getDecisionLabel(
              assessment?.decision
            )
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
            12,

        }}
      >

        <SummaryItem
          label="Relevance"
          value={
            Number.isFinite(
              relevance
            )
              ? `${Math.round(
                  relevance
                )}%`
              : "—"
          }

          valueColor={
            relevance >= 70
              ? "#86efac"
              : relevance >= 40
                ? "#fde68a"
                : "#fca5a5"
          }

        />


        <SummaryItem
          label="Confidence"
          value={
            Number.isFinite(
              confidence
            )
              ? `${Math.round(
                  confidence * 100
                )}%`
              : "—"
          }
        />


        <SummaryItem
          label="Decision"
          value={
            getDecisionLabel(
              assessment?.decision
            )
          }
        />


        <SummaryItem
          label="Model"
          value={
            assessment?.model ||
            "—"
          }
        />

      </div>


      {
        assessment?.summary && (

          <div
            style={{

              marginTop:
                12,

              color:
                "#aaa",

              fontSize:
                11,

              lineHeight:
                1.6,

            }}
          >

            {
              assessment.summary
            }

          </div>

        )
      }


      <EvaluationList
        title="What the document supports"
        items={
          matchedRequirements
        }
      />


      <EvaluationList
        title="Gaps identified"
        items={
          gaps
        }
      />


      <EvaluationList
        title="AI findings"
        items={
          findings
        }
      />


      {
        assessment?.analysedAt && (

          <div
            style={{

              marginTop:
                10,

              color:
                "#555",

              fontSize:
                9,

            }}
          >

            Analysed{" "}
            {
              formatDate(
                assessment.analysedAt
              )
            }

          </div>

        )
      }

    </div>

  );

}


// =====================================================
// COMPLIANCE EVIDENCE MODAL
// =====================================================

function ComplianceEvidenceModal({
  evidence,
  controls,
  onClose,
  onSave,
  onDelete,
  onAccept,
  onReject,
  saving,
}) {

  const [
    name,
    setName,
  ] =
    useState(
      evidence?.name ||
      ""
    );


  const [
    description,
    setDescription,
  ] =
    useState(
      evidence?.description ||
      ""
    );


  const [
    type,
    setType,
  ] =
    useState(
      evidence?.type ||
      "document"
    );


  const [
    controlId,
    setControlId,
  ] =
    useState(
      evidence?.controlId ||
      ""
    );


  const [
    dueDate,
    setDueDate,
  ] =
    useState(
      evidence?.dueDate
        ? String(
            evidence.dueDate
          ).slice(
            0,
            10
          )
        : ""
    );


  const [
    error,
    setError,
  ] =
    useState(
      null
    );


  if (
    !evidence
  ) {

    return null;

  }


  const isAwaitingReview =
    evidence.status ===
    "review_required";


  const handleSave =
    async () => {

      try {

        setError(
          null
        );


        await onSave({

          name,

          description,

          type,

          controlId,

          dueDate:
            dueDate ||
            null,

        });

      }
      catch (
        saveError
      ) {

        setError(
          saveError?.message ||
          "Failed to save evidence."
        );

      }

    };


  const handleDelete =
    async () => {

      const confirmed =
        window.confirm(
          "Delete this evidence from the compliance record? The audit history will be retained."
        );


      if (
        !confirmed
      ) {

        return;

      }


      try {

        setError(
          null
        );


        await onDelete(
          evidence.evidenceId
        );

      }
      catch (
        deleteError
      ) {

        setError(
          deleteError?.message ||
          "Failed to delete evidence."
        );

      }

    };


  const handleAccept =
    async () => {

      try {

        setError(
          null
        );


        await onAccept(
          evidence.evidenceId
        );

      }
      catch (
        acceptError
      ) {

        setError(
          acceptError?.message ||
          "Failed to accept evidence."
        );

      }

    };


  const handleReject =
    async () => {

      try {

        setError(
          null
        );


        await onReject(
          evidence.evidenceId
        );

      }
      catch (
        rejectError
      ) {

        setError(
          rejectError?.message ||
          "Failed to reject evidence."
        );

      }

    };


  return (

    <div
      style={{

        position:
          "fixed",

        inset:
          0,

        background:
          "rgba(0,0,0,.68)",

        zIndex:
          8000,

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          20,

      }}
    >

      <div
        style={{

          width:
            "min(760px, 100%)",

          maxHeight:
            "90vh",

          overflow:
            "auto",

          background:
            "#151515",

          border:
            "1px solid #333",

          borderRadius:
            12,

          boxShadow:
            "0 25px 80px rgba(0,0,0,.55)",

        }}
      >

        {/* =============================================
            HEADER
        ============================================= */}

        <div
          style={{

            padding:
              16,

            borderBottom:
              "1px solid #292929",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap:
              12,

          }}
        >

          <div>

            <div
              style={{

                fontSize:
                  16,

                fontWeight:
                  700,

                color:
                  "#fff",

              }}
            >

              Evidence details

            </div>


            <div
              style={{

                marginTop:
                  4,

                color:
                  "#666",

                fontSize:
                  10,

                fontFamily:
                  "monospace",

              }}
            >

              {
                evidence.evidenceId
              }

            </div>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            style={{

              border:
                "none",

              background:
                "transparent",

              color:
                "#888",

              cursor:
                "pointer",

              fontSize:
                16,

            }}
          >

            ✕

          </button>

        </div>


        {/* =============================================
            BODY
        ============================================= */}

        <div
          style={{
            padding:
              16,
          }}
        >

          {/* STATUS */}

          <div
            style={{

              display:
                "flex",

              alignItems:
                "center",

              gap:
                8,

              flexWrap:
                "wrap",

              marginBottom:
                16,

            }}
          >

            <StatusPill
              status={
                evidence.status
              }
            />


            {
              evidence?.reviewDecision && (

                <span
                  style={{

                    color:
                      "#777",

                    fontSize:
                      10,

                  }}
                >

                  Human decision:{" "}
                  {
                    evidence.reviewDecision
                  }

                </span>

              )
            }

          </div>


          {
            error && (

              <div
                style={{

                  padding:
                    10,

                  marginBottom:
                    12,

                  borderRadius:
                    8,

                  background:
                    "#321515",

                  border:
                    "1px solid #6b1d1d",

                  color:
                    "#fca5a5",

                  fontSize:
                    11,

                }}
              >

                {
                  error
                }

              </div>

            )
          }


          {/* DETAILS */}

          <div
            style={{

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                12,

            }}
          >

            <Field
              label="Evidence name"
            >

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

                style={
                  inputStyle
                }

              />

            </Field>


            <Field
              label="Control"
            >

              <select
                value={
                  controlId
                }

                onChange={
                  event =>
                    setControlId(
                      event.target.value
                    )
                }

                style={
                  inputStyle
                }
              >

                {
                  controls.map(
                    control => (

                      <option
                        key={
                          control.controlId
                        }

                        value={
                          control.controlId
                        }
                      >

                        {
                          control.controlId
                        }{" "}
                        —{" "}
                        {
                          control.name
                        }

                      </option>

                    )
                  )
                }

              </select>

            </Field>


            <Field
              label="Evidence type"
            >

              <select
                value={
                  type
                }

                onChange={
                  event =>
                    setType(
                      event.target.value
                    )
                }

                style={
                  inputStyle
                }
              >

                <option value="document">
                  Document
                </option>

                <option value="image">
                  Image
                </option>

                <option value="spreadsheet">
                  Spreadsheet
                </option>

                <option value="video">
                  Video
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </Field>


            <Field
              label="Due date"
            >

              <input
                type="date"

                value={
                  dueDate
                }

                onChange={
                  event =>
                    setDueDate(
                      event.target.value
                    )
                }

                style={
                  inputStyle
                }

              />

            </Field>

          </div>


          <Field
            label="Description"
          >

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

              rows={
                5
              }

              style={{

                ...inputStyle,

                resize:
                  "vertical",

              }}

            />

          </Field>


          {/* FILE */}

          <div
            style={{

              marginTop:
                14,

              padding:
                12,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#111",

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

              Attached file

            </div>


            <div
              style={{

                color:
                  "#bbb",

                fontSize:
                  11,

              }}
            >

              {
                evidence?.fileName ||
                "No file attached"
              }

            </div>


            {
              evidence?.fileUrl && (

                <div
                  style={{
                    marginTop:
                      8,
                  }}
                >

                  <a
                    href={
                      evidence.fileUrl
                    }

                    target="_blank"

                    rel="noreferrer"

                    style={{
                      color:
                        "#93c5fd",

                      fontSize:
                        11,

                    }}
                  >

                    Open file

                  </a>

                </div>

              )
            }

          </div>


          {/* AI ASSESSMENT */}

          <AIAssessmentPanel
            assessment={
              evidence?.aiAssessment
            }
          />


          {/* HUMAN REVIEW */}

          {
            (
              evidence?.reviewedByName ||
              evidence?.reviewedByEmail ||
              evidence?.reviewedAt
            ) && (

              <div
                style={{

                  marginTop:
                    14,

                  padding:
                    12,

                  border:
                    "1px solid #292929",

                  borderRadius:
                    8,

                  background:
                    "#111",

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

                  Human review

                </div>


                <div
                  style={{

                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",

                    gap:
                      10,

                  }}
                >

                  <SummaryItem
                    label="Reviewed by"
                    value={
                      evidence.reviewedByName ||
                      "Unknown reviewer"
                    }
                  />


                  <SummaryItem
                    label="Email"
                    value={
                      evidence.reviewedByEmail ||
                      "—"
                    }
                  />


                  <SummaryItem
                    label="Decision"
                    value={
                      evidence.reviewDecision ||
                      "—"
                    }
                  />


                  <SummaryItem
                    label="Reviewed"
                    value={
                      formatDate(
                        evidence.reviewedAt
                      )
                    }
                  />

                </div>

              </div>

            )
          }


          {/* CREATED */}

          <div
            style={{

              marginTop:
                14,

              color:
                "#555",

              fontSize:
                10,

            }}
          >

            Added{" "}
            {
              formatDate(
                evidence.createdAt
              )
            }

          </div>

        </div>


        {/* =============================================
            ACTIONS
        ============================================= */}

        <div
          style={{

            padding:
              14,

            borderTop:
              "1px solid #292929",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              8,

            flexWrap:
              "wrap",

          }}
        >

          <div
            style={{

              display:
                "flex",

              gap:
                8,

              flexWrap:
                "wrap",

            }}
          >

            {
              isAwaitingReview && (

                <>

                  <ActionButton
                    variant="success"
                    disabled={
                      saving
                    }
                    onClick={
                      handleAccept
                    }
                  >

                    Accept evidence

                  </ActionButton>


                  <ActionButton
                    variant="danger"
                    disabled={
                      saving
                    }
                    onClick={
                      handleReject
                    }
                  >

                    Reject evidence

                  </ActionButton>

                </>

              )
            }

          </div>


          <div
            style={{

              display:
                "flex",

              gap:
                8,

              marginLeft:
                "auto",

            }}
          >

            <ActionButton
              disabled={
                saving
              }
              onClick={
                handleSave
              }
            >

              Save changes

            </ActionButton>


            <ActionButton
              variant="danger"
              disabled={
                saving
              }
              onClick={
                handleDelete
              }
            >

              Delete evidence

            </ActionButton>

          </div>

        </div>

      </div>

    </div>

  );

}


// =====================================================
// COMPLIANCE EVIDENCE
// =====================================================

function ComplianceEvidence({
  compliance,
  onRefresh,
}) {

  const evidence =
    normaliseArray(
      compliance?.evidence
    );


  const controls =
    normaliseArray(
      compliance?.controls
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");


  const [
    selectedEvidence,
    setSelectedEvidence,
  ] =
    useState(null);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const filteredEvidence =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return evidence
          .filter(
            item => {

              const matchesSearch =
                !query ||
                String(
                  item?.evidenceId ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                String(
                  item?.name ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                String(
                  item?.fileName ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                String(
                  item?.controlId ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  );


              const matchesStatus =
                statusFilter ===
                  "all" ||
                item?.status ===
                  statusFilter;


              return (
                matchesSearch &&
                matchesStatus
              );

            }
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b?.createdAt ||
                0
              ) -
              new Date(
                a?.createdAt ||
                0
              )
          );

      },
      [
        evidence,
        search,
        statusFilter,
      ]
    );


  const getProjectId =
    () =>
      compliance?.projectId ||
      null;


  const saveEvidence =
    async updates => {

      if (
        !selectedEvidence
      ) {

        return;

      }


      setSaving(
        true
      );


      try {

        const projectId =
          getProjectId();


        if (
          !projectId
        ) {

          throw new Error(
            "Project ID is missing."
          );

        }


        const response =
          await api.patch(

            `/compliance/evidence/${encodeURIComponent(
              selectedEvidence.evidenceId
            )}`,

            {

              projectId,

              ...updates,

            }

          );


        if (
          !response?.data?.evidence
        ) {

          throw new Error(
            "Updated evidence was not returned by the API."
          );

        }


        setSelectedEvidence(
          null
        );


        await onRefresh();

      }
      finally {

        setSaving(
          false
        );

      }

    };


  const deleteEvidence =
    async evidenceId => {

      setSaving(
        true
      );


      try {

        const projectId =
          getProjectId();


        if (
          !projectId
        ) {

          throw new Error(
            "Project ID is missing."
          );

        }


        await api.delete(

          `/compliance/evidence/${encodeURIComponent(
            evidenceId
          )}`,

          {

            data: {

              projectId,

            },

          }

        );


        setSelectedEvidence(
          null
        );


        await onRefresh();

      }
      finally {

        setSaving(
          false
        );

      }

    };


  const reviewEvidence =
    async (
      evidenceId,
      decision
    ) => {

      setSaving(
        true
      );


      try {

        const projectId =
          getProjectId();


        if (
          !projectId
        ) {

          throw new Error(
            "Project ID is missing."
          );

        }


        await api.post(

          `/compliance/evidence/${decision}`,

          {

            projectId,

            evidenceId,

          }

        );


        setSelectedEvidence(
          null
        );


        await onRefresh();

      }
      finally {

        setSaving(
          false
        );

      }

    };


  return (

    <div>

      <SectionHeader

        title="Evidence"

        description={
          `${filteredEvidence.length} of ${evidence.length} evidence records shown.`
        }

        right={

          <ActionButton
            onClick={
              onRefresh
            }
          >

            Refresh

          </ActionButton>

        }

      />


      <div
        style={{

          display:
            "flex",

          gap:
            8,

          flexWrap:
            "wrap",

          marginBottom:
            14,

        }}
      >

        <input
          value={
            search
          }

          onChange={
            event =>
              setSearch(
                event.target.value
              )
          }

          placeholder=
            "Search evidence..."

          style={{

            flex:
              1,

            minWidth:
              220,

            padding:
              "9px 10px",

            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#111",

            color:
              "#ddd",

          }}

        />


        <select
          value={
            statusFilter
          }

          onChange={
            event =>
              setStatusFilter(
                event.target.value
              )
          }

          style={{

            minWidth:
              180,

            padding:
              "9px 10px",

            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#111",

            color:
              "#ccc",

          }}
        >

          <option value="all">
            All statuses
          </option>

          <option value="requested">
            Requested
          </option>

          <option value="processing">
            Processing
          </option>

          <option value="review_required">
            Awaiting review
          </option>

          <option value="accepted">
            Accepted
          </option>

          <option value="rejected">
            Rejected
          </option>

        </select>

      </div>


      <div
        style={{

          border:
            "1px solid #292929",

          borderRadius:
            10,

          overflow:
            "hidden",

          background:
            "#151515",

          overflowX:
            "auto",

        }}
      >

        <div
          style={{
            minWidth:
              940,
          }}
        >

          <div
            style={{

              display:
                "grid",

              gridTemplateColumns:
                "minmax(180px, 1.5fr) 120px minmax(150px, 1fr) 120px 180px 110px",

              gap:
                10,

              padding:
                "10px 14px",

              background:
                "#111",

              borderBottom:
                "1px solid #242424",

              color:
                "#666",

              fontSize:
                9,

              fontWeight:
                700,

              textTransform:
                "uppercase",

            }}
          >

            <div>
              Evidence
            </div>

            <div>
              Control
            </div>

            <div>
              Type / AI
            </div>

            <div>
              Status
            </div>

            <div>
              Human review
            </div>

            <div />

          </div>


          {
            filteredEvidence.length ===
              0 && (

              <div
                style={{

                  padding:
                    20,

                  color:
                    "#666",

                  fontSize:
                    11,

                }}
              >

                No evidence records found.

              </div>

            )
          }


          {
            filteredEvidence.map(
              item => (

                <EvidenceRow

                  key={
                    item.evidenceId
                  }

                  evidence={
                    item
                  }

                  controls={
                    controls
                  }

                  onOpen={
                    setSelectedEvidence
                  }

                />

              )
            )
          }

        </div>

      </div>


      {
        selectedEvidence && (

          <ComplianceEvidenceModal

            evidence={
              selectedEvidence
            }

            controls={
              controls
            }

            saving={
              saving
            }

            onClose={() =>
              setSelectedEvidence(
                null
              )
            }

            onSave={
              saveEvidence
            }

            onDelete={
              deleteEvidence
            }

            onAccept={
              evidenceId =>
                reviewEvidence(
                  evidenceId,
                  "accept"
                )
            }

            onReject={
              evidenceId =>
                reviewEvidence(
                  evidenceId,
                  "reject"
                )
            }

          />

        )
      }

    </div>

  );

}


// =====================================================
// COMPLIANCE HISTORY
// =====================================================

function ComplianceHistory({
  history,
}) {

  const entries =
    normaliseArray(
      history
    );


  return (

    <div>

      <SectionHeader

        title="Audit history"

        description=
          "A permanent record of compliance decisions and changes."

      />


      {
        entries.length ===
          0 && (

          <div
            style={{

              padding:
                20,

              border:
                "1px solid #292929",

              borderRadius:
                10,

              background:
                "#151515",

              color:
                "#666",

              fontSize:
                11,

            }}
          >

            No audit history yet.

          </div>

        )
      }


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

        {
          entries.map(
            (
              entry,
              index
            ) => {

              const actor =
                getActorName(
                  entry
                );


              return (

                <div
                  key={
                    `${entry?.evidenceId || "event"}-${entry?.createdAt || index}-${index}`
                  }

                  style={{

                    padding:
                      14,

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
                        12,

                    }}
                  >

                    <div
                      style={{

                        minWidth:
                          0,

                        flex:
                          1,

                      }}
                    >

                      <div
                        style={{

                          color:
                            "#ddd",

                          fontSize:
                            12,

                          fontWeight:
                            700,

                        }}
                      >

                        {
                          humaniseEvent(
                            entry?.event
                          )
                        }

                      </div>


                      <div
                        style={{

                          marginTop:
                            5,

                          color:
                            "#666",

                          fontSize:
                            10,

                        }}
                      >

                        {
                          entry?.controlId
                            ? `Control ${entry.controlId}`
                            : "Compliance activity"
                        }


                        {
                          entry?.evidenceId
                            ? ` · Evidence ${entry.evidenceId}`
                            : ""
                        }

                      </div>


                      {
                        actor && (

                          <div
                            style={{

                              marginTop:
                                6,

                              color:
                                "#888",

                              fontSize:
                                10,

                            }}
                          >

                            {
                              (
                                entry?.event ===
                                  "compliance.evidenceAccepted" ||
                                entry?.event ===
                                  "compliance.evidenceRejected"
                              )

                                ? (
                                    <>
                                      Decision recorded by{" "}
                                      <strong
                                        style={{
                                          color:
                                            "#bbb",
                                        }}
                                      >
                                        {
                                          actor
                                        }
                                      </strong>
                                    </>
                                  )

                                : (
                                    <>
                                      Changed by{" "}
                                      <strong
                                        style={{
                                          color:
                                            "#bbb",
                                        }}
                                      >
                                        {
                                          actor
                                        }
                                      </strong>
                                    </>
                                  )
                            }

                          </div>

                        )
                      }

                    </div>


                    <div
                      style={{

                        color:
                          "#555",

                        fontSize:
                          10,

                        whiteSpace:
                          "nowrap",

                      }}
                    >

                      {
                        formatDate(
                          entry?.createdAt
                        )
                      }

                    </div>

                  </div>


                  {
                    entry?.data &&
                    Object.keys(
                      entry.data
                    ).length > 0 && (

                    <div
                      style={{

                        marginTop:
                          10,

                        padding:
                          10,

                        background:
                          "#101010",

                        border:
                          "1px solid #222",

                        borderRadius:
                          7,

                      }}
                    >

                      {
                        entry?.data?.decision && (

                          <div
                            style={{

                              color:
                                "#bbb",

                              fontSize:
                                11,

                              lineHeight:
                                1.5,

                            }}
                          >

                            Decision:{" "}
                            {
                              getDecisionLabel(
                                entry.data.decision
                              )
                            }

                          </div>

                        )
                      }


                      {
                        entry?.data?.changedFields?.length > 0 && (

                          <div
                            style={{

                              color:
                                "#777",

                              fontSize:
                                10,

                              marginTop:
                                4,

                            }}
                          >

                            Updated fields:{" "}
                            {
                              entry.data.changedFields
                                .join(
                                  ", "
                                )
                            }

                          </div>

                        )
                      }


                      {
                        entry?.data?.fileName && (

                          <div
                            style={{

                              color:
                                "#777",

                              fontSize:
                                10,

                              marginTop:
                                4,

                            }}
                          >

                            File:{" "}
                            {
                              entry.data.fileName
                            }

                          </div>

                        )
                      }


                      {
                        entry?.data?.relevanceScore !=
                          null && (

                          <div
                            style={{

                              color:
                                "#777",

                              fontSize:
                                10,

                              marginTop:
                                4,

                            }}
                          >

                            AI relevance:{" "}
                            {
                              entry.data.relevanceScore
                            }%

                          </div>

                        )
                      }

                    </div>

                  )}

                </div>

              );

            }
          )
        }

      </div>

    </div>

  );

}


// =====================================================
// COMPLIANCE WORKSPACE
// =====================================================

function ComplianceWorkspace({
  compliance,
  loading,
  error,
  onRefresh,
}) {

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      "overview"
    );


  const [
    history,
    setHistory,
  ] =
    useState([]);


  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);


  const [
    historyError,
    setHistoryError,
  ] =
    useState(null);


  const projectId =
    compliance?.projectId ||
    null;


  const loadHistory =
    useCallback(
      async () => {

        if (
          !projectId
        ) {

          setHistory(
            []
          );

          return;

        }


        try {

          setHistoryLoading(
            true
          );

          setHistoryError(
            null
          );


          const response =
            await api.get(

              `/compliance/history?projectId=${encodeURIComponent(
                projectId
              )}`

            );


          setHistory(

            normaliseArray(
              response?.data?.history
            )

          );

        }
        catch (
          historyLoadError
        ) {

          console.error(
            "[DataHub] Compliance history load failed",
            historyLoadError
          );


          setHistoryError(

            historyLoadError?.response?.data?.error ||

            historyLoadError?.response?.data?.message ||

            historyLoadError?.message ||

            "Failed to load compliance history."

          );

        }
        finally {

          setHistoryLoading(
            false
          );

        }

      },
      [
        projectId,
      ]
    );


  useEffect(
    () => {

      if (
        activeTab ===
        "history"
      ) {

        loadHistory();

      }

    },
    [
      activeTab,
      loadHistory,
    ]
  );


  if (
    loading
  ) {

    return (

      <div
        style={{

          padding:
            20,

          border:
            "1px solid #292929",

          borderRadius:
            10,

          background:
            "#151515",

          color:
            "#777",

        }}
      >

        Loading compliance data...

      </div>

    );

  }


  if (
    error
  ) {

    return (

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

          fontSize:
            12,

        }}
      >

        {
          error
        }

      </div>

    );

  }


  if (
    !compliance
  ) {

    return (

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

        No compliance record exists for this project.

      </div>

    );

  }


  const tabs = [

    {
      id:
        "overview",

      label:
        "Overview",

    },

    {
      id:
        "controls",

      label:
        "Controls",

      count:
        normaliseArray(
          compliance.controls
        ).length,

    },

    {
      id:
        "evidence",

      label:
        "Evidence",

      count:
        normaliseArray(
          compliance.evidence
        ).length,

    },

    {
      id:
        "history",

      label:
        "Audit history",

      count:
        normaliseArray(
          compliance.reviewHistory
        ).length,

    },

  ];


  return (

    <div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div
        style={{

          display:
            "flex",

          gap:
            6,

          flexWrap:
            "wrap",

          padding:
            5,

          marginBottom:
            16,

          background:
            "#111",

          border:
            "1px solid #292929",

          borderRadius:
            9,

        }}
      >

        {
          tabs.map(
            tab => {

              const active =
                activeTab ===
                tab.id;


              return (

                <button
                  key={
                    tab.id
                  }

                  type="button"

                  onClick={() =>
                    setActiveTab(
                      tab.id
                    )
                  }

                  style={{

                    border:
                      active
                        ? "1px solid #3b82f6"
                        : "1px solid transparent",

                    background:
                      active
                        ? "#18243a"
                        : "transparent",

                    color:
                      active
                        ? "#fff"
                        : "#888",

                    padding:
                      "8px 11px",

                    borderRadius:
                      7,

                    cursor:
                      "pointer",

                    fontSize:
                      11,

                    fontWeight:
                      active
                        ? 700
                        : 500,

                  }}
                >

                  {
                    tab.label
                  }


                  {
                    tab.count !=
                      null && (

                      <span
                        style={{

                          marginLeft:
                            6,

                          color:
                            active
                              ? "#93c5fd"
                              : "#555",

                        }}
                      >

                        {
                          tab.count
                        }

                      </span>

                    )
                  }

                </button>

              );

            }
          )
        }

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      {
        activeTab ===
        "overview" && (

          <ComplianceOverview
            compliance={
              compliance
            }
          />

        )
      }


      {
        activeTab ===
        "controls" && (

          <ComplianceControls
            compliance={
              compliance
            }
          />

        )
      }


      {
        activeTab ===
        "evidence" && (

          <ComplianceEvidence

            compliance={
              compliance
            }

            onRefresh={
              onRefresh
            }

          />

        )
      }


      {
        activeTab ===
        "history" && (

          historyLoading

            ? (

              <div
                style={{

                  padding:
                    20,

                  color:
                    "#666",

                }}
              >

                Loading audit history...

              </div>

            )

            : historyError

              ? (

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

                  {
                    historyError
                  }

                </div>

              )

              : (

                <ComplianceHistory
                  history={
                    history.length > 0
                      ? history
                      : compliance.reviewHistory
                  }
                />

              )

        )
      }

    </div>

  );

}


// =====================================================
// NORMALISE COMPLIANCE RESPONSE
// =====================================================

function normaliseComplianceResponse(
  response
) {

  const data =
    response?.data;


  if (
    data?.compliance &&
    typeof data.compliance ===
      "object" &&
    !Array.isArray(
      data.compliance
    )
  ) {

    return data.compliance;

  }


  if (
    data?.data?.compliance &&
    typeof data.data.compliance ===
      "object" &&
    !Array.isArray(
      data.data.compliance
    )
  ) {

    return data.data.compliance;

  }


  if (
    data?.project?.compliance &&
    typeof data.project.compliance ===
      "object"
  ) {

    return data.project.compliance;

  }


  if (
    data &&
    typeof data ===
      "object" &&
    (
      data.controls ||
      data.evidence ||
      data.framework ||
      data.metrics
    )
  ) {

    return data;

  }


  return null;

}


// =====================================================
// DATA HUB
// =====================================================

export default function DataHub() {

  const {
    activeProject,
    currentProject,
  } =
    useProjectContext();


  const projectId =
    activeProject ||
    null;


  // ===================================================
  // PROJECT SUMMARY
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
  // COMPLIANCE
  // ===================================================

  const [
    complianceData,
    setComplianceData,
  ] =
    useState(null);


  const [
    complianceLoading,
    setComplianceLoading,
  ] =
    useState(false);


  const [
    complianceError,
    setComplianceError,
  ] =
    useState(null);


  // ===================================================
  // GENERIC RESOURCE
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
  // LOAD COMPLIANCE
  // ===================================================

  const loadCompliance =
    useCallback(
      async (
        nextProjectId
      ) => {

        if (
          !nextProjectId
        ) {

          setComplianceData(
            null
          );

          setComplianceLoading(
            false
          );

          setComplianceError(
            null
          );

          return null;

        }


        try {

          setComplianceLoading(
            true
          );

          setComplianceError(
            null
          );


          console.log(
            "[DataHub] Loading compliance",
            {
              projectId:
                nextProjectId,
            }
          );


          const response =
            await api.get(

              `/compliance?projectId=${encodeURIComponent(
                nextProjectId
              )}`

            );


          const compliance =
            normaliseComplianceResponse(
              response
            );


          setComplianceData(
            compliance
          );


          console.log(
            "[DataHub] Compliance loaded",
            {
              projectId:
                nextProjectId,

              compliance,
            }
          );


          return compliance;

        }
        catch (
          error
        ) {

          console.error(
            "[DataHub] Compliance load failed",
            error
          );


          setComplianceData(
            null
          );


          setComplianceError(

            error?.response?.data?.error ||

            error?.response?.data?.message ||

            error?.message ||

            "Failed to load compliance data."

          );


          return null;

        }
        finally {

          setComplianceLoading(
            false
          );

        }

      },
      []
    );


  // ===================================================
  // LOAD PROJECT DATA
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


          setComplianceData(
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


          const projectResponse =
            await api.get(

              `/data/projects/${nextProjectId}`

            );


          const project =
            projectResponse?.data?.project ||
            projectResponse?.data?.data ||
            null;


          setProjectData(
            project
          );


          await loadCompliance(
            nextProjectId
          );


          console.log(
            "[DataHub] Active project loaded",
            {

              projectId:
                nextProjectId,

              project,

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
      [
        loadCompliance,
      ]
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
  // AVAILABLE GENERIC RESOURCES
  // ===================================================

  const availableResources =
    useMemo(
      () => {

        const resources =
          projectData?.resources;


        let normalised =
          [];


        if (
          Array.isArray(
            resources
          )
        ) {

          normalised =
            resources.map(
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
            );

        }
        else if (
          resources &&
          typeof resources ===
            "object"
        ) {

          normalised =
            Object.entries(
              resources
            ).map(
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
            );

        }


        /*
         * Compliance is injected from its dedicated API.
         */

        if (
          complianceData
        ) {

          const complianceHasData =
            normaliseArray(
              complianceData.controls
            ).length > 0 ||
            normaliseArray(
              complianceData.evidence
            ).length > 0 ||
            !!complianceData.framework;


          if (
            complianceHasData
          ) {

            const existingIndex =
              normalised.findIndex(
                item =>
                  item?.type ===
                  "compliance"
              );


            if (
              existingIndex >=
              0
            ) {

              normalised[
                existingIndex
              ] = {

                ...normalised[
                  existingIndex
                ],

                count:
                  1,

                view:
                  true,

              };

            }
            else {

              normalised.push({

                type:
                  "compliance",

                count:
                  1,

                view:
                  true,

              });

            }

          }

        }


        return normalised.filter(
          resource =>

            resource?.type &&

            resource?.view !==
              false &&

            Number(
              resource?.count
            ) > 0

        );

      },
      [
        projectData,
        complianceData,
      ]
    );


  // ===================================================
  // RESOURCE SELECT
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


        setSelectedResource(
          resourceType
        );


        setResourceError(
          null
        );


        if (
          resourceType ===
          "compliance"
        ) {

          if (
            !complianceData
          ) {

            await loadCompliance(
              projectId
            );

          }


          return;

        }


        try {

          setResourceLoading(
            true
          );

          setResourceRecords(
            []
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
        complianceData,
        loadCompliance,
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
  // REFRESH COMPLIANCE
  // ===================================================

  const refreshCompliance =
    useCallback(
      async () => {

        await loadCompliance(
          projectId
        );

      },
      [
        loadCompliance,
        projectId,
      ]
    );


  // ===================================================
  // RENDER GENERIC RECORD
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
          record?.evidenceId ||
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

          Project data and resources for the active project.

        </div>


        {
          projectId && (

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

                {
                  displayProjectName
                }

              </div>


              {
                displayRole && (

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

                )
              }

            </div>

          )
        }

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
            NO PROJECT
        ================================================= */}

        {
          !projectId && (

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

                  Select a saved project from the Projects sidebar
                  to view its data.

                </div>

              </div>

            </div>

          )
        }


        {/* =================================================
            LOADING
        ================================================= */}

        {
          projectId &&
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

                {
                  displayProjectName
                }

              </strong>

              ...

            </div>

          )
        }


        {/* =================================================
            ERROR
        ================================================= */}

        {
          projectId &&
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

              {
                projectDataError
              }

            </div>

          )
        }


        {/* =================================================
            PROJECT CONTENT
        ================================================= */}

        {
          projectId &&
          !projectDataLoading &&
          !projectDataError && (

            <>

              {/* =========================================
                  RESOURCE CARDS
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

                {
                  availableResources.length ===
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

                  )
                }


                {
                  availableResources.map(
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
                              resource.type ===
                              "compliance"
                                ? "Framework"
                                : resource.count
                            }{" "}

                            {
                              resource.type ===
                              "compliance"
                                ? ""
                                : (
                                    resource.count ===
                                    1
                                      ? "record"
                                      : "records"
                                  )
                            }

                          </div>

                        </button>

                      );

                    }
                  )
                }

              </div>


              {/* =========================================
                  COMPLIANCE
              ========================================= */}

              {
                selectedResource ===
                "compliance" && (

                  <div
                    style={{
                      marginTop:
                        28,
                    }}
                  >

                    <ComplianceWorkspace

                      compliance={
                        complianceData
                      }

                      loading={
                        complianceLoading
                      }

                      error={
                        complianceError
                      }

                      onRefresh={
                        refreshCompliance
                      }

                    />

                  </div>

                )
              }


              {/* =========================================
                  GENERIC RESOURCES
              ========================================= */}

              {
                selectedResource &&
                selectedResource !==
                  "compliance" && (

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


                    {
                      resourceLoading && (

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

                      )
                    }


                    {
                      resourceError && (

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

                          {
                            resourceError
                          }

                        </div>

                      )
                    }


                    {
                      !resourceLoading &&
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

                      )
                    }


                    {
                      !resourceLoading &&
                      !resourceError &&
                      resourceRecords.length >
                        0 && (

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

                      )
                    }

                  </div>

                )
              }

            </>

          )
        }

      </div>

    </div>

  );

}