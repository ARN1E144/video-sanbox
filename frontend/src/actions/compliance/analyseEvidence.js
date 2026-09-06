import api from "../../services/api";

export default async function analyseEvidence(ctx, params = {}) {
  try {
    const {
      evidenceId,
    } = params;

    if (!evidenceId) {
      return {
        ok: false,
        error: "evidenceId is required",
      };
    }

    const evidence =
      (ctx.get?.("compliance.evidence") || [])
        .find((item) => item.id === evidenceId);

    if (!evidence) {
      return {
        ok: false,
        error: "Evidence not found in runtime state",
      };
    }

    console.log(
      "[compliance.analyseEvidence] Analysing evidence",
      {
        evidenceId,
        fileName: evidence.fileName,
      }
    );

    const { data } = await api.post(
      "/compliance/evidence/analyse",
      {
        evidenceId,
        fileName: evidence.fileName,
        controlId: evidence.controlId,
      }
    );

    const assessment = data?.assessment;

    if (!assessment) {
      return {
        ok: false,
        error: "AI assessment was not returned by the API",
      };
    }

    const currentEvidence =
      ctx.get?.("compliance.evidence") || [];

    const updatedEvidence =
      currentEvidence.map((item) => {
        if (item.id !== evidenceId) {
          return item;
        }

        return {
          ...item,
          status: "review_required",
          aiAssessment: assessment,
        };
      });

    ctx.set?.(
      "compliance.evidence",
      updatedEvidence
    );

    console.log(
      "[compliance.analyseEvidence] Runtime state updated",
      {
        evidenceId,
        status: "review_required",
        assessment,
      }
    );

    console.log(
    "[compliance.analyseEvidence] EMITTING DOMAIN EVENT",
    {
        event: "compliance.evidenceReviewRequired",
        evidenceId,
    }
    );

    ctx.emit?.(
      "compliance.evidenceReviewRequired",
      {
        evidenceId,
        assessment,
      }
    );

    return {
      ok: true,
      result: {
        evidenceId,
        assessment,
      },
    };
  } catch (err) {
    console.error(
      "[compliance.analyseEvidence]",
      err
    );

    return {
      ok: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to analyse evidence",
    };
  }
}