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
// - Updating control status.
// - Creating corrective actions.
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
//       ↓
// Runtime domain event
//
// =========================================================


export default function ComplianceEvidence(props) {

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
  } = actionCtx;


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
    busyEvidence,
    setBusyEvidence,
  ] =
    useState(null);


  // =======================================================
  // REJECTION CONFIRMATION
  // =======================================================

  const [
    rejectConfirmation,
    setRejectConfirmation,
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


      // -----------------------------------------------------
      // Validate evidence
      // -----------------------------------------------------

      if (!evidenceId) {

        console.warn(
          "[ComplianceEvidence] Missing evidence ID",
          {
            evidence,
          }
        );

        return;

      }


      // -----------------------------------------------------
      // Validate current state
      // -----------------------------------------------------

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


      // -----------------------------------------------------
      // Validate decision
      // -----------------------------------------------------

      let action;

      if (
        decision ===
        "accepted"
      ) {

        action =
          "compliance.acceptEvidence";

      }
      else if (
        decision ===
        "rejected"
      ) {

        action =
          "compliance.rejectEvidence";

      }
      else {

        console.warn(
          "[ComplianceEvidence] Invalid review decision",
          {
            evidenceId,
            decision,
          }
        );

        return;

      }


      // -----------------------------------------------------
      // Validate runtime executor
      // -----------------------------------------------------

      if (
        typeof runAction !==
        "function"
      ) {

        console.error(
          "[ComplianceEvidence] Runtime action executor unavailable"
        );

        return;

      }


      // -----------------------------------------------------
      // Prevent duplicate clicks
      // -----------------------------------------------------

      if (
        busyEvidence?.id ===
        evidenceId
      ) {

        return;

      }


      // -----------------------------------------------------
      // Busy state
      // -----------------------------------------------------

      setBusyEvidence({
        id:
          evidenceId,

        decision,
      });


      console.log(
        "[ComplianceEvidence] Human review",
        {
          evidenceId,

          decision,

          action,
        }
      );


      // -----------------------------------------------------
      // Execute runtime action
      // -----------------------------------------------------

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

        setBusyEvidence(
          null
        );

      }

    };


  // =======================================================
  // REJECT REQUEST
  // =======================================================

  const requestReject =
    evidence => {

      if (
        !evidence?.id
      ) {
        return;
      }

      setRejectConfirmation(
        evidence
      );

    };


  // =======================================================
  // CANCEL REJECTION
  // =======================================================

  const cancelReject =
    () => {

      setRejectConfirmation(
        null
      );

    };


  // =======================================================
  // CONFIRM REJECTION
  // =======================================================

  const confirmReject =
    async () => {

      const evidence =
        rejectConfirmation;


      if (!evidence) {
        return;
      }


      setRejectConfirmation(
        null
      );


      await handleReview(
        evidence,
        "rejected"
      );

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


            const isAccepted =
              evidence?.status ===
              "accepted";


            const isRejected =
              evidence?.status ===
              "rejected";


            const isBusy =
              busyEvidence?.id ===
              evidence?.id;


            const busyDecision =
              isBusy
                ? busyEvidence?.decision
                : null;


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

                  boxSizing:
                    "border-box",
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
                        fontWeight:
                          600,

                        fontSize:
                          compact
                            ? 14
                            : 15,

                        wordBreak:
                          "break-word",
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

                        lineHeight:
                          1.45,
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
                    HUMAN REVIEW REQUIRED
                ========================================= */}

                {
                  isReviewRequired && (

                    <div
                      style={{
                        marginTop:
                          14,

                        padding:
                          compact
                            ? 10
                            : 12,

                        border:
                          "1px solid #f59e0b",

                        borderRadius:
                          8,

                        background:
                          "#fffbeb",

                        boxSizing:
                          "border-box",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            8,

                          fontWeight:
                            700,

                          fontSize:
                            13,

                          color:
                            "#92400e",
                        }}
                      >

                        <span
                          aria-hidden="true"
                        >
                          ⚠
                        </span>

                        Human review required

                      </div>


                      <div
                        style={{
                          marginTop:
                            5,

                          fontSize:
                            12,

                          lineHeight:
                            1.5,

                          color:
                            "#78350f",
                        }}
                      >

                        AI has analysed this evidence.
                        Review the assessment below before
                        accepting or rejecting the evidence.

                      </div>

                    </div>

                  )
                }


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
                            : 14,

                        borderRadius:
                          8,

                        background:
                          "#f9fafb",

                        border:
                          "1px solid #e5e7eb",

                        boxSizing:
                          "border-box",
                      }}
                    >

                      {/* AI LABEL */}

                      <div
                        style={{
                          fontSize:
                            11,

                          fontWeight:
                            700,

                          textTransform:
                            "uppercase",

                          letterSpacing:
                            ".05em",

                          color:
                            "#6b7280",

                          marginBottom:
                            10,
                        }}
                      >

                        AI Assessment

                      </div>


                      {/* DECISION + CONFIDENCE */}

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "space-between",

                          gap:
                            12,

                          flexWrap:
                            "wrap",
                        }}
                      >

                        {
                          assessment.decision && (

                            <div
                              style={{
                                display:
                                  "inline-flex",

                                alignItems:
                                  "center",

                                gap:
                                  7,

                                fontWeight:
                                  700,

                                fontSize:
                                  compact
                                    ? 14
                                    : 15,

                                color:
                                  getDecisionColour(
                                    assessment.decision
                                  ),
                              }}
                            >

                              <span
                                style={{
                                  ...getDecisionBadgeStyle(
                                    assessment.decision
                                  ),
                                }}
                              >

                                {
                                  formatDecision(
                                    assessment.decision
                                  )
                                }

                              </span>

                            </div>

                          )
                        }


                        {
                          confidence !== null && (

                            <div
                              style={{
                                display:
                                  "flex",

                                flexDirection:
                                  "column",

                                alignItems:
                                  "flex-end",

                                gap:
                                  2,
                              }}
                            >

                              <span
                                style={{
                                  fontSize:
                                    11,

                                  color:
                                    "#6b7280",
                                }}
                              >

                                AI confidence

                              </span>


                              <strong
                                style={{
                                  fontSize:
                                    14,

                                  color:
                                    "#374151",
                                }}
                              >

                                {
                                  confidence
                                }%

                              </strong>

                            </div>

                          )
                        }

                      </div>


                      {/* CONFIDENCE BAR */}

                      {
                        confidence !== null && (

                          <div
                            style={{
                              marginTop:
                                10,

                              width:
                                "100%",

                              height:
                                6,

                              borderRadius:
                                999,

                              background:
                                "#e5e7eb",

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
                                      confidence
                                    )
                                  )}%`,

                                height:
                                  "100%",

                                borderRadius:
                                  999,

                                background:
                                  getConfidenceColour(
                                    confidence
                                  ),

                                transition:
                                  "width 200ms ease",
                              }}
                            />

                          </div>

                        )
                      }


                      {/* SUMMARY */}

                      {
                        assessment.summary && (

                          <div
                            style={{
                              marginTop:
                                14,
                            }}
                          >

                            <div
                              style={{
                                fontSize:
                                  11,

                                fontWeight:
                                  700,

                                textTransform:
                                  "uppercase",

                                letterSpacing:
                                  ".04em",

                                color:
                                  "#6b7280",

                                marginBottom:
                                  5,
                              }}
                            >

                              Summary

                            </div>


                            <div
                              style={{
                                fontSize:
                                  13,

                                lineHeight:
                                  1.55,

                                color:
                                  "#374151",
                              }}
                            >

                              {
                                assessment.summary
                              }

                            </div>

                          </div>

                        )
                      }


                      {/* FINDINGS */}

                      {
                        Array.isArray(
                          assessment.findings
                        ) &&
                        assessment.findings.length >
                          0 && (

                          <div
                            style={{
                              marginTop:
                                14,
                            }}
                          >

                            <div
                              style={{
                                fontSize:
                                  11,

                                fontWeight:
                                  700,

                                textTransform:
                                  "uppercase",

                                letterSpacing:
                                  ".04em",

                                color:
                                  "#6b7280",

                                marginBottom:
                                  7,
                              }}
                            >

                              Findings

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
                                        display:
                                          "flex",

                                        alignItems:
                                          "flex-start",

                                        gap:
                                          7,

                                        fontSize:
                                          12,

                                        lineHeight:
                                          1.5,

                                        color:
                                          "#4b5563",
                                      }}
                                    >

                                      <span
                                        aria-hidden="true"
                                        style={{
                                          flex:
                                            "0 0 auto",

                                          marginTop:
                                            1,
                                        }}
                                      >

                                        {getFindingIcon(
                                          finding
                                        )}

                                      </span>


                                      <span>

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

                                      </span>

                                    </div>

                                  )
                                )
                              }

                            </div>

                          </div>

                        )
                      }


                      {/* AI DISCLAIMER */}

                      <div
                        style={{
                          marginTop:
                            14,

                          paddingTop:
                            10,

                          borderTop:
                            "1px solid #e5e7eb",

                          fontSize:
                            11,

                          lineHeight:
                            1.45,

                          color:
                            "#6b7280",
                        }}
                      >

                        AI assessment is advisory only.
                        A human reviewer must make the final
                        evidence decision.

                      </div>

                    </div>

                  )
                }


                {/* =========================================
                    COMPLETED HUMAN DECISION
                ========================================= */}

                {
                  (
                    isAccepted ||
                    isRejected
                  ) &&
                  evidence?.reviewDecision && (

                    <div
                      style={{
                        marginTop:
                          12,

                        padding:
                          compact
                            ? 9
                            : 11,

                        border:
                          `1px solid ${
                            isAccepted
                              ? "#bbf7d0"
                              : "#fecaca"
                          }`,

                        borderRadius:
                          8,

                        background:
                          isAccepted
                            ? "#f0fdf4"
                            : "#fef2f2",

                        color:
                          isAccepted
                            ? "#166534"
                            : "#991b1b",

                        fontSize:
                          12,

                        lineHeight:
                          1.45,
                      }}
                    >

                      <strong>

                        Human decision:{" "}

                        {
                          formatStatus(
                            evidence.reviewDecision
                          )
                        }

                      </strong>


                      {
                        evidence.reviewedAt && (

                          <span
                            style={{
                              color:
                                isAccepted
                                  ? "#4b7a5a"
                                  : "#7f4a4a",
                            }}
                          >

                            {" · "}

                            {
                              formatDate(
                                evidence.reviewedAt
                              )
                            }

                          </span>

                        )
                      }

                    </div>

                  )
                }


                {/* =========================================
                    REVIEW ACTIONS
                ========================================= */}

                {
                  showActions &&
                  isReviewRequired && (

                    <div
                      style={{
                        marginTop:
                          14,

                        paddingTop:
                          14,

                        borderTop:
                          "1px solid #e5e7eb",
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            12,

                          fontWeight:
                            600,

                          color:
                            "#374151",

                          marginBottom:
                            8,
                        }}
                      >

                        Human decision

                      </div>


                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            8,

                          flexDirection:
                            compact
                              ? "column"
                              : "row",
                        }}
                      >

                        {/* ACCEPT */}

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

                            minHeight:
                              40,

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

                            transition:
                              "opacity 150ms ease",
                          }}
                        >

                          {
                            busyDecision ===
                            "accepted"

                              ? "Accepting…"

                              : "Accept Evidence"
                          }

                        </button>


                        {/* REJECT */}

                        <button
                          type="button"

                          disabled={
                            isBusy
                          }

                          onClick={
                            () =>
                              requestReject(
                                evidence
                              )
                          }

                          style={{
                            flex:
                              1,

                            minHeight:
                              40,

                            padding:
                              "9px 12px",

                            border:
                              "1px solid #dc2626",

                            borderRadius:
                              6,

                            background:
                              isBusy
                                ? "#f3f4f6"
                                : "#fff",

                            color:
                              isBusy
                                ? "#6b7280"
                                : "#dc2626",

                            fontWeight:
                              600,

                            cursor:
                              isBusy
                                ? "not-allowed"
                                : "pointer",

                            transition:
                              "opacity 150ms ease",
                          }}
                        >

                          {
                            busyDecision ===
                            "rejected"

                              ? "Rejecting…"

                              : "Reject Evidence"
                          }

                        </button>

                      </div>

                    </div>

                  )
                }


                {/* =========================================
                    REJECTION CONFIRMATION
                ========================================= */}

                {
                  rejectConfirmation?.id ===
                  evidence?.id && (

                    <div
                      role="dialog"
                      aria-modal="false"

                      style={{
                        marginTop:
                          12,

                        padding:
                          compact
                            ? 11
                            : 14,

                        border:
                          "1px solid #fecaca",

                        borderRadius:
                          8,

                        background:
                          "#fff7f7",

                        boxSizing:
                          "border-box",
                      }}
                    >

                      <div
                        style={{
                          fontWeight:
                            700,

                          fontSize:
                            13,

                          color:
                            "#991b1b",
                        }}
                      >

                        Reject this evidence?

                      </div>


                      <div
                        style={{
                          marginTop:
                            5,

                          fontSize:
                            12,

                          lineHeight:
                            1.5,

                          color:
                            "#7f1d1d",
                        }}
                      >

                        This will mark the evidence as
                        rejected. The compliance workflow can
                        then determine whether corrective
                        action is required.

                      </div>


                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "flex-end",

                          gap:
                            8,

                          marginTop:
                            12,
                        }}
                      >

                        <button
                          type="button"

                          onClick={
                            cancelReject
                          }

                          style={{
                            padding:
                              "8px 12px",

                            border:
                              "1px solid #d1d5db",

                            borderRadius:
                              6,

                            background:
                              "#fff",

                            color:
                              "#374151",

                            fontWeight:
                              600,

                            cursor:
                              "pointer",
                          }}
                        >

                          Cancel

                        </button>


                        <button
                          type="button"

                          onClick={
                            confirmReject
                          }

                          style={{
                            padding:
                              "8px 12px",

                            border:
                              "1px solid #dc2626",

                            borderRadius:
                              6,

                            background:
                              "#dc2626",

                            color:
                              "#fff",

                            fontWeight:
                              600,

                            cursor:
                              "pointer",
                          }}
                        >

                          Reject Evidence

                        </button>

                      </div>

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


// =========================================================
// DECISION FORMATTER
// =========================================================

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


// =========================================================
// DATE FORMATTER
// =========================================================

function formatDate(
  value
) {

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

      return String(
        value
      );

    }

    return date.toLocaleString();

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


// =========================================================
// DECISION BADGE STYLE
// =========================================================

function getDecisionBadgeStyle(
  decision
) {

  const base = {

    display:
      "inline-flex",

    alignItems:
      "center",

    padding:
      "5px 9px",

    borderRadius:
      6,

    fontSize:
      12,

    fontWeight:
      700,
  };


  switch (
    decision
  ) {

    case "likely_sufficient":

      return {
        ...base,

        background:
          "#dcfce7",

        color:
          "#166534",
      };


    case "likely_insufficient":

      return {
        ...base,

        background:
          "#fee2e2",

        color:
          "#991b1b",
      };


    case "needs_review":

      return {
        ...base,

        background:
          "#fef3c7",

        color:
          "#92400e",
      };


    default:

      return {
        ...base,

        background:
          "#e5e7eb",

        color:
          "#374151",
      };

  }

}


// =========================================================
// DECISION COLOUR
// =========================================================

function getDecisionColour(
  decision
) {

  switch (
    decision
  ) {

    case "likely_sufficient":
      return "#166534";

    case "likely_insufficient":
      return "#991b1b";

    case "needs_review":
      return "#92400e";

    default:
      return "#374151";

  }

}


// =========================================================
// CONFIDENCE COLOUR
// =========================================================

function getConfidenceColour(
  confidence
) {

  if (
    confidence >=
    80
  ) {

    return "#16a34a";

  }

  if (
    confidence >=
    60
  ) {

    return "#d97706";

  }

  return "#dc2626";

}


// =========================================================
// FINDING ICON
// =========================================================

function getFindingIcon(
  finding
) {

  const text =
    typeof finding ===
    "string"

      ? finding

      : finding?.text ||
        finding?.description ||
        "";


  const normalised =
    String(
      text
    ).toLowerCase();


  if (
    normalised.includes(
      "missing"
    ) ||
    normalised.includes(
      "insufficient"
    ) ||
    normalised.includes(
      "gap"
    ) ||
    normalised.includes(
      "risk"
    )
  ) {

    return "⚠";

  }


  if (
    normalised.includes(
      "sufficient"
    ) ||
    normalised.includes(
      "compliant"
    ) ||
    normalised.includes(
      "present"
    )
  ) {

    return "✓";

  }


  return "•";

}