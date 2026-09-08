// src/components/elements/ComplianceEvidence.js

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useActionContext,
} from "../../context/ActionContext";

import {
  useRuntimeValue,
} from "../../hooks/useRuntimeValue";


// =========================================================
// ComplianceEvidence
// =========================================================
//
// Responsibilities:
//
// 1. Read compliance evidence from runtime state.
// 2. Optionally filter by controlId.
// 3. Display evidence status.
// 4. Display AI assessment.
// 5. Allow authorised human review.
// 6. Execute accept/reject through the runtime action layer.
//
// NOT responsible for:
//
// - Direct runtime-state mutation.
// - Uploading files.
// - Calling the compliance API directly.
// - Performing AI analysis.
// - Deciding whether evidence is sufficient.
//
// Workflow:
//
// compliance.evidence
//       ↓
// ComplianceEvidence
//       ↓
// review_required
//       ↓
// Human decision
//       ↓
// compliance.acceptEvidence
//       OR
// compliance.rejectEvidence
//
// =========================================================


export default function ComplianceEvidence(
  props
) {

  // =======================================================
  // PROPS
  // =======================================================

  const {

    id,

    meta = {},

    style = {},

    controlId:
      _controlId,

    showStatus:
      _showStatus,

    showAssessment:
      _showAssessment,

    showActions:
      _showActions,

    compact:
      _compact,

    ...restProps

  } = props;


  // =======================================================
  // ACTION CONTEXT
  // =======================================================

  const actionCtx =
    useActionContext() || {};


  const {
    runAction,
  } =
    actionCtx;


  // =======================================================
  // RUNTIME VALUES
  // =======================================================

  const runtimeEvidence =
    useRuntimeValue(
      "compliance.evidence"
    );


  const runtimeControls =
    useRuntimeValue(
      "compliance.controls"
    );


  const runtimeFramework =
    useRuntimeValue(
      "compliance.framework"
    );


  // =======================================================
  // DEFAULTS
  // =======================================================

  const defaults =
    meta?.editableProps ||
    {};


  // =======================================================
  // RESOLVED PROPERTIES
  // =======================================================

  const controlId =
    _controlId ??
    defaults.controlId?.default ??
    null;


  const showStatus =
    _showStatus ??
    defaults.showStatus?.default ??
    true;


  const showAssessment =
    _showAssessment ??
    defaults.showAssessment?.default ??
    true;


  const showActions =
    _showActions ??
    defaults.showActions?.default ??
    true;


  const compact =
    _compact ??
    defaults.compact?.default ??
    false;


  // =======================================================
  // NORMALISE RUNTIME DATA
  // =======================================================

  const evidenceList =
    Array.isArray(runtimeEvidence)
      ? runtimeEvidence
      : [];


  const controls =
    Array.isArray(runtimeControls)
      ? runtimeControls
      : [];


  // =======================================================
  // FILTER EVIDENCE
  // =======================================================

  const visibleEvidence =
    useMemo(
      () => {

        if (!controlId) {
          return evidenceList;
        }


        return evidenceList.filter(
          evidence =>
            String(
              evidence?.controlId
            ) ===
            String(
              controlId
            )
        );

      },
      [
        controlId,
        evidenceList,
      ]
    );


  // =======================================================
  // BUSY STATE
  // =======================================================

  const [
    busyEvidenceId,
    setBusyEvidenceId,
  ] =
    useState(null);


  // =======================================================
  // DEBUG
  // =======================================================

  useEffect(
    () => {

      console.log(
        "[ComplianceEvidence] Runtime state",
        {

          id,

          controlId,

          evidenceCount:
            evidenceList.length,

          visibleCount:
            visibleEvidence.length,

          framework:
            runtimeFramework?.id ||
            runtimeFramework?.name ||
            null,

        }
      );

    },
    [
      id,
      controlId,
      evidenceList.length,
      visibleEvidence.length,
      runtimeFramework,
    ]
  );


  // =======================================================
  // CONTROL LOOKUP
  // =======================================================

  const getControl =
    evidence => {

      if (
        !evidence?.controlId
      ) {
        return null;
      }


      return controls.find(
        control =>
          String(
            control?.id
          ) ===
          String(
            evidence.controlId
          )
      ) || null;

    };


  // =======================================================
  // HUMAN REVIEW
  // =======================================================

  const handleReview =
    async (
      evidence,
      decision
    ) => {

      const evidenceId =
        evidence?.id;


      if (!evidenceId) {

        console.warn(
          "[ComplianceEvidence] Missing evidence ID",
          {
            evidence,
          }
        );


        return;

      }


      if (
        evidence?.status !==
        "review_required"
      ) {

        console.warn(
          "[ComplianceEvidence] Evidence is not awaiting review",
          {
            evidenceId,
            status:
              evidence?.status,
          }
        );


        return;

      }


      if (
        typeof runAction !==
        "function"
      ) {

        console.error(
          "[ComplianceEvidence] Runtime action executor unavailable"
        );


        return;

      }


      const action =
        decision ===
        "accepted"

          ? "compliance.acceptEvidence"

          : "compliance.rejectEvidence";


      setBusyEvidenceId(
        evidenceId
      );


      console.log(
        "[ComplianceEvidence] Human review",
        {

          evidenceId,

          decision,

          action,

        }
      );


      try {

        const result =
          await runAction(
            action,
            {

              evidenceId,

            }
          );


        console.log(
          "[ComplianceEvidence] Review result",
          {

            evidenceId,

            decision,

            result,

          }
        );

      }
      catch (
        error
      ) {

        console.error(
          "[ComplianceEvidence] Review action failed",
          {

            evidenceId,

            decision,

            error,

          }
        );

      }
      finally {

        setBusyEvidenceId(
          null
        );

      }

    };


  // =======================================================
  // EMPTY STATE
  // =======================================================

  if (
    visibleEvidence.length ===
    0
  ) {

    return (

      <div
        {...restProps}

        style={{

          ...style,

          width:
            "100%",

          padding:
            compact
              ? 12
              : 20,

          border:
            "1px solid #e5e7eb",

          borderRadius:
            8,

          background:
            "#fff",

          boxSizing:
            "border-box",

        }}
      >

        <div
          style={{

            fontWeight:
              600,

            fontSize:
              compact
                ? 14
                : 16,

            marginBottom:
              6,

          }}
        >

          Compliance Evidence

        </div>


        <div
          style={{

            fontSize:
              13,

            color:
              "#6b7280",

          }}
        >

          No evidence available.

        </div>

      </div>

    );

  }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div
      {...restProps}

      style={{

        ...style,

        width:
          "100%",

        boxSizing:
          "border-box",

        display:
          "flex",

        flexDirection:
          "column",

        gap:
          compact
            ? 10
            : 14,

      }}
    >

      {
        visibleEvidence.map(
          evidence => {

            const control =
              getControl(
                evidence
              );


            const assessment =
              evidence?.aiAssessment;


            const isReviewRequired =
              evidence?.status ===
              "review_required";


            const isBusy =
              busyEvidenceId ===
              evidence?.id;


            const confidence =
              typeof assessment?.confidence ===
              "number"

                ? Math.round(
                    assessment.confidence *
                    100
                  )

                : null;


            return (

              <div
                key={
                  evidence?.id ||
                  `${evidence?.fileName || "evidence"}-${evidence?.controlId || "unknown"}`
                }

                style={{

                  border:
                    "1px solid #e5e7eb",

                  borderRadius:
                    10,

                  padding:
                    compact
                      ? 12
                      : 16,

                  background:
                    "#fff",

                  boxShadow:
                    "0 1px 2px rgba(0,0,0,.04)",

                }}
              >

                {/* =========================================
                    HEADER
                ========================================= */}

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

                  <div>

                    <div
                      style={{

                        fontWeight:
                          600,

                        fontSize:
                          compact
                            ? 14
                            : 15,

                      }}
                    >

                      {
                        evidence?.fileName ||
                        "Evidence"
                      }

                    </div>


                    <div
                      style={{

                        marginTop:
                          4,

                        fontSize:
                          12,

                        color:
                          "#6b7280",

                      }}
                    >

                      {
                        control?.reference ||
                        evidence?.controlId ||
                        "Unassigned control"
                      }

                      {
                        control?.title
                          ? ` — ${control.title}`
                          : ""
                      }

                    </div>

                  </div>


                  {showStatus && (

                    <span
                      style={{
                        ...getStatusStyle(
                          evidence?.status
                        ),
                      }}
                    >

                      {
                        formatStatus(
                          evidence?.status
                        )
                      }

                    </span>

                  )}

                </div>


                {/* =========================================
                    AI ASSESSMENT
                ========================================= */}

                {
                  showAssessment &&
                  assessment && (

                    <div
                      style={{

                        marginTop:
                          14,

                        padding:
                          compact
                            ? 10
                            : 12,

                        borderRadius:
                          8,

                        background:
                          "#f9fafb",

                        border:
                          "1px solid #e5e7eb",

                      }}
                    >

                      <div
                        style={{

                          fontSize:
                            12,

                          fontWeight:
                            700,

                          textTransform:
                            "uppercase",

                          letterSpacing:
                            ".04em",

                          color:
                            "#6b7280",

                          marginBottom:
                            6,

                        }}
                      >

                        AI Assessment

                      </div>


                      <div
                        style={{

                          display:
                            "flex",

                          flexWrap:
                            "wrap",

                          gap:
                            10,

                          fontSize:
                            13,

                        }}
                      >

                        {
                          assessment.decision && (

                            <strong>

                              {
                                formatDecision(
                                  assessment.decision
                                )
                              }

                            </strong>

                          )
                        }


                        {
                          confidence !== null && (

                            <span
                              style={{
                                color:
                                  "#6b7280",
                              }}
                            >

                              Confidence {
                                confidence
                              }%

                            </span>

                          )
                        }

                      </div>


                      {
                        assessment.summary && (

                          <div
                            style={{

                              marginTop:
                                8,

                              fontSize:
                                13,

                              lineHeight:
                                1.5,

                              color:
                                "#374151",

                            }}
                          >

                            {
                              assessment.summary
                            }

                          </div>

                        )
                      }


                      {
                        Array.isArray(
                          assessment.findings
                        ) &&
                        assessment.findings.length >
                          0 && (

                          <div
                            style={{

                              marginTop:
                                10,

                              fontSize:
                                12,

                              color:
                                "#4b5563",

                            }}
                          >

                            {
                              assessment.findings.map(
                                (
                                  finding,
                                  index
                                ) => (

                                  <div
                                    key={
                                      finding?.id ||
                                      `${evidence?.id}-finding-${index}`
                                    }

                                    style={{
                                      marginTop:
                                        index === 0
                                          ? 0
                                          : 5,
                                    }}
                                  >

                                    •{" "}

                                    {
                                      typeof finding ===
                                      "string"

                                        ? finding

                                        : finding?.text ||
                                          finding?.description ||
                                          JSON.stringify(
                                            finding
                                          )
                                    }

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


                {/* =========================================
                    REVIEW DECISION
                ========================================= */}

                {
                  evidence?.reviewDecision && (

                    <div
                      style={{

                        marginTop:
                          10,

                        fontSize:
                          12,

                        color:
                          "#6b7280",

                      }}
                    >

                      Human decision:{" "}

                      <strong>

                        {
                          formatStatus(
                            evidence.reviewDecision
                          )
                        }

                      </strong>

                      {
                        evidence.reviewedAt
                          ? ` · ${formatDate(evidence.reviewedAt)}`
                          : ""
                      }

                    </div>

                  )
                }


                {/* =========================================
                    ACTIONS
                ========================================= */}

                {
                  showActions &&
                  isReviewRequired && (

                    <div
                      style={{

                        display:
                          "flex",

                        gap:
                          8,

                        marginTop:
                          14,

                      }}
                    >

                      <button
                        type="button"

                        disabled={
                          isBusy
                        }

                        onClick={
                          () =>
                            handleReview(
                              evidence,
                              "accepted"
                            )
                        }

                        style={{

                          flex:
                            1,

                          padding:
                            "9px 12px",

                          border:
                            "1px solid #16a34a",

                          borderRadius:
                            6,

                          background:
                            isBusy
                              ? "#f3f4f6"
                              : "#16a34a",

                          color:
                            isBusy
                              ? "#6b7280"
                              : "#fff",

                          fontWeight:
                            600,

                          cursor:
                            isBusy
                              ? "not-allowed"
                              : "pointer",

                        }}
                      >

                        Accept Evidence

                      </button>


                      <button
                        type="button"

                        disabled={
                          isBusy
                        }

                        onClick={
                          () =>
                            handleReview(
                              evidence,
                              "rejected"
                            )
                        }

                        style={{

                          flex:
                            1,

                          padding:
                            "9px 12px",

                          border:
                            "1px solid #dc2626",

                          borderRadius:
                            6,

                          background:
                            isBusy
                              ? "#f3f4f6"
                              : "#dc2626",

                          color:
                            isBusy
                              ? "#6b7280"
                              : "#fff",

                          fontWeight:
                            600,

                          cursor:
                            isBusy
                              ? "not-allowed"
                              : "pointer",

                        }}
                      >

                        Reject Evidence

                      </button>

                    </div>

                  )
                }

              </div>

            );

          }
        )
      }

    </div>

  );

}


// =========================================================
// STATUS HELPERS
// =========================================================

function formatStatus(
  status
) {

  if (!status) {
    return "Unknown";
  }


  return String(
    status
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}


function formatDecision(
  decision
) {

  if (!decision) {
    return "";
  }


  return String(
    decision
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}


function formatDate(
  value
) {

  try {

    return new Date(
      value
    ).toLocaleString();

  }
  catch {

    return String(
      value
    );

  }

}


// =========================================================
// STATUS STYLE
// =========================================================

function getStatusStyle(
  status
) {

  const base = {

    display:
      "inline-flex",

    alignItems:
      "center",

    padding:
      "4px 8px",

    borderRadius:
      999,

    fontSize:
      11,

    fontWeight:
      600,

    whiteSpace:
      "nowrap",

  };


  switch (
    status
  ) {

    case "accepted":

      return {

        ...base,

        background:
          "#dcfce7",

        color:
          "#166534",

      };


    case "rejected":

      return {

        ...base,

        background:
          "#fee2e2",

        color:
          "#991b1b",

      };


    case "review_required":

      return {

        ...base,

        background:
          "#fef3c7",

        color:
          "#92400e",

      };


    case "processing":

      return {

        ...base,

        background:
          "#dbeafe",

        color:
          "#1e40af",

      };


    case "uploaded":

      return {

        ...base,

        background:
          "#dcfce7",

        color:
          "#166534",

      };


    case "evidence_requested":

      return {

        ...base,

        background:
          "#e0e7ff",

        color:
          "#3730a3",

      };


    default:

      return {

        ...base,

        background:
          "#f3f4f6",

        color:
          "#374151",

      };

  }

}