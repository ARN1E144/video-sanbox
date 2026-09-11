import api from "../../services/api";

export default async function analyseEvidence(ctx, params = {}) {
  try {
    const {
      evidenceId,
    } = params;

    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");

    console.log(
      "[compliance.analyseEvidence] START",
      {
        evidenceId,
        projectId,
      }
    );

    if (!projectId) {
      return {
        ok: false,
        error: "projectId is required",
      };
    }

    if (!evidenceId) {
      return {
        ok: false,
        error: "evidenceId is required",
      };
    }

    const currentEvidence =
      ctx?.get?.("compliance.evidence") || [];

    const evidence =
      currentEvidence.find((item) => {
        const itemId =
          item?.evidenceId ||
          item?.id;

        return itemId === evidenceId;
      });

    if (!evidence) {
      console.error(
        "[compliance.analyseEvidence] Evidence not found in runtime state",
        {
          evidenceId,
          evidenceCount: currentEvidence.length,
        }
      );

      return {
        ok: false,
        error: "Evidence not found in runtime state",
      };
    }

    console.log(
      "[compliance.analyseEvidence] Analysing evidence",
      {
        projectId,
        evidenceId,
        fileName: evidence.fileName,
        controlId: evidence.controlId,
        status: evidence.status,
      }
    );

    const { data } = await api.post(
      "/compliance/evidence/analyse",
      {
        projectId,
        evidenceId,
        fileName: evidence.fileName,
        controlId: evidence.controlId,
      }
    );

    const assessment =
      data?.assessment;

    if (!assessment) {
      return {
        ok: false,
        error:
          "AI assessment was not returned by the API",
      };
    }

    const updatedEvidence =
      currentEvidence.map((item) => {
        const itemId =
          item?.evidenceId ||
          item?.id;

        if (itemId !== evidenceId) {
          return item;
        }

        return {
          ...item,
          status: "review_required",
          aiAssessment: assessment,
        };
      });

    ctx?.set?.(
      "compliance.evidence",
      updatedEvidence
    );

    console.log(
      "[compliance.analyseEvidence] Runtime state updated",
      {
        projectId,
        evidenceId,
        status: "review_required",
        assessment,
      }
    );

    console.log(
      "[compliance.analyseEvidence] EMITTING DOMAIN EVENT",
      {
        event:
          "compliance.evidenceReviewRequired",
        evidenceId,
      }
    );

    ctx?.emit?.(
      "compliance.evidenceReviewRequired",
      {
        evidenceId,
        assessment,
      }
    );

    return {
      ok: true,
      result: {
        projectId,
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