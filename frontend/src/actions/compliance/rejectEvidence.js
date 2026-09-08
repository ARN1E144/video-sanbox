// src/actions/compliance/rejectEvidence.js

export default async function rejectEvidence(ctx, params = {}) {
  const evidenceId = params?.evidenceId;

  if (!evidenceId) {
    console.warn(
      "[compliance.rejectEvidence] Missing evidence ID"
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
      "[compliance.rejectEvidence] Evidence state is not an array"
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
      "[compliance.rejectEvidence] Evidence not found",
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
      "[compliance.rejectEvidence] Evidence is not awaiting review",
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

        status: "rejected",

        reviewDecision:
          "rejected",

        reviewedAt,
      };
    });

  ctx.set(
    "compliance.evidence",
    updatedEvidence
  );

  const rejectedEvidence =
    updatedEvidence.find(
      (item) =>
        String(item?.id) ===
        String(evidenceId)
    );

  console.log(
    "[compliance.rejectEvidence] Evidence rejected",
    {
      evidenceId,
    }
  );

  ctx.emit?.(
    "compliance.evidenceRejected",
    {
      evidenceId,
      evidence: rejectedEvidence,
    }
  );

  return {
    ok: true,

    evidenceId,

    status: "rejected",

    reviewDecision:
      "rejected",

    reviewedAt,
  };
}