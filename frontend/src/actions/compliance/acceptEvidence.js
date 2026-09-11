import api from "../../services/api";

export default async function acceptEvidence(
  ctx,
  params = {}
) {
  try {

    const evidenceId =
      params?.evidenceId ||
      params?.id ||
      null;

    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id") ||
      null;

    console.log(
      "[compliance.acceptEvidence] Accepting evidence",
      {
        projectId,
        evidenceId,
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
      Array.isArray(
        ctx?.get?.("compliance.evidence")
      )
        ? ctx.get("compliance.evidence")
        : [];

    const evidence =
      currentEvidence.find(
        item =>
          (
            item?.evidenceId ||
            item?.id
          ) === evidenceId
      );

    if (!evidence) {
      return {
        ok: false,
        error: "Evidence not found in runtime state",
      };
    }

    if (
      evidence.status !==
      "review_required"
    ) {
      return {
        ok: false,
        error:
          "Evidence is not awaiting review",
      };
    }

    const { data } =
      await api.post(
        "/compliance/evidence/accept",
        {
          projectId,
          evidenceId,
        }
      );

    if (!data?.evidence) {
      return {
        ok: false,
        error:
          "Accepted evidence was not returned by the API",
      };
    }

    const acceptedEvidence =
      data.evidence;

    const updatedEvidence =
      currentEvidence.map(
        item => {

          const itemId =
            item?.evidenceId ||
            item?.id;

          return itemId === evidenceId
            ? {
                ...item,
                ...acceptedEvidence,
                evidenceId:
                  acceptedEvidence.evidenceId ||
                  evidenceId,
              }
            : item;

        }
      );

    ctx?.set?.(
      "compliance.evidence",
      updatedEvidence
    );

    console.log(
      "[compliance.acceptEvidence] Runtime state updated",
      {
        projectId,
        evidenceId,
        status:
          acceptedEvidence.status,
      }
    );

    ctx?.emit?.(
      "compliance.evidenceAccepted",
      {
        projectId,
        evidenceId,
        evidence:
          acceptedEvidence,
      }
    );

    return {
      ok: true,

      result: {
        projectId,
        evidenceId,
        evidence:
          acceptedEvidence,
      },
    };

  }
  catch (err) {

    console.error(
      "[compliance.acceptEvidence]",
      err
    );

    return {
      ok: false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to accept evidence",
    };

  }
}