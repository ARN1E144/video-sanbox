// src/actions/compliance/acceptEvidence.js

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

        status: "accepted",

        reviewDecision:
          "accepted",

        reviewedAt,
      };
    });

  ctx.set(
    "compliance.evidence",
    updatedEvidence
  );

  const acceptedEvidence =
    updatedEvidence.find(
      (item) =>
        String(item?.id) ===
        String(evidenceId)
    );

  console.log(
    "[compliance.acceptEvidence] Evidence accepted",
    {
      evidenceId,
    }
  );

  ctx.emit?.(
    "compliance.evidenceAccepted",
    {
      evidenceId,
      evidence: acceptedEvidence,
    }
  );

  return {
    ok: true,

    evidenceId,

    status: "accepted",

    reviewDecision:
      "accepted",

    reviewedAt,
  };
}