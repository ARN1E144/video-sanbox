import api from "../../services/api";

export default async function acceptEvidence(ctx, params = {}) {
  const evidenceId = params?.evidenceId;

  if (!evidenceId) {
    console.warn(
      "[compliance.acceptEvidence] Missing evidence ID"
    );

    return {
      ok: false,
      error: "MISSING_EVIDENCE_ID",
    };
  }

  const evidenceList =
    ctx?.get?.("compliance.evidence") || [];

  if (!Array.isArray(evidenceList)) {
    console.warn(
      "[compliance.acceptEvidence] Evidence state is not an array"
    );

    return {
      ok: false,
      error: "INVALID_EVIDENCE_STATE",
    };
  }

  const evidence = evidenceList.find(
    (item) =>
      String(item?.id) === String(evidenceId)
  );

  if (!evidence) {
    console.warn(
      "[compliance.acceptEvidence] Evidence not found",
      {
        evidenceId,
      }
    );

    return {
      ok: false,
      error: "EVIDENCE_NOT_FOUND",
    };
  }

  if (
    evidence.status !==
    "review_required"
  ) {
    console.warn(
      "[compliance.acceptEvidence] Evidence is not awaiting review",
      {
        evidenceId,
        status: evidence.status,
      }
    );

    return {
      ok: false,
      error: "EVIDENCE_NOT_REVIEWABLE",
      status: evidence.status,
    };
  }

  const reviewedAt =
    new Date().toISOString();

  // =====================================================
  // UPDATE EVIDENCE
  // =====================================================

  const updatedEvidence =
    evidenceList.map((item) => {

      if (
        String(item?.id) !==
        String(evidenceId)
      ) {
        return item;
      }

      return {
        ...item,

        status:
          "accepted",

        reviewDecision:
          "accepted",

        reviewedAt,
      };
    });

  ctx.set(
    "compliance.evidence",
    updatedEvidence
  );


  // =====================================================
  // UPDATE CONTROL
  // =====================================================

  const controlId =
    evidence?.controlId;

  const controls =
    ctx?.get?.(
      "compliance.controls"
    ) || [];

  let updatedControls =
    controls;

  if (
    controlId &&
    Array.isArray(controls)
  ) {

    updatedControls =
      controls.map(
        (control) => {

          if (
            String(control?.id) !==
            String(controlId)
          ) {
            return control;
          }

          return {
            ...control,

            status:
              "compliant",

            evidenceStatus:
              "verified",

            evidenceVerified:
              true,

            evidenceVerifiedAt:
              reviewedAt,

            lastEvidenceId:
              evidenceId,
          };
        }
      );

    ctx.set(
      "compliance.controls",
      updatedControls
    );
  }


  // =====================================================
  // GET UPDATED EVIDENCE
  // =====================================================

  const acceptedEvidence =
    updatedEvidence.find(
      (item) =>
        String(item?.id) ===
        String(evidenceId)
    );


  // =====================================================
  // DOMAIN EVENT
  // =====================================================

  console.log(
    "[compliance.acceptEvidence] Evidence accepted",
    {
      evidenceId,
      controlId,
    }
  );

  ctx.emit?.(
    "compliance.evidenceAccepted",
    {
      evidenceId,

      controlId,

      evidence:
        acceptedEvidence,
    }
  );


  // =====================================================
  // RESULT
  // =====================================================

  return {
    ok: true,

    evidenceId,

    controlId,

    status:
      "accepted",

    reviewDecision:
      "accepted",

    reviewedAt,
  };
}