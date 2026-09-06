import api from "../../services/api";

export default async function requestEvidence(ctx, params = {}) {
  try {
    const {
      controlId,
      name = "Evidence required",
      description = "",
      type = "document",
      dueDate = null,
      requestedFor = null,
    } = params;

    if (!controlId) {
      return {
        ok: false,
        error: "controlId is required",
      };
    }

    console.log("[compliance.requestEvidence] Requesting evidence", {
      controlId,
      name,
      description,
      type,
      dueDate,
      requestedFor,
    });

    const { data } = await api.post(
      "/compliance/evidence/request",
      {
        controlId,
        name,
        description,
        type,
        dueDate,
        requestedFor,
      }
    );

    const evidence = data?.evidence;

    if (!evidence) {
      return {
        ok: false,
        error: "Evidence request was not returned by the API",
      };
    }

    /*
     * Add the new evidence record to runtime state.
     */
    const currentEvidence =
      ctx.get?.("compliance.evidence") || [];

    ctx.set?.(
      "compliance.evidence",
      [...currentEvidence, evidence]
    );

    /*
     * Update the associated control.
     */
    const controls =
      ctx.get?.("compliance.controls") || [];

    const updatedControls = controls.map((control) => {
      if (control.id !== controlId) {
        return control;
      }

      const evidenceIds = Array.isArray(control.evidenceIds)
        ? control.evidenceIds
        : [];

      return {
        ...control,
        evidenceIds: evidenceIds.includes(evidence.id)
          ? evidenceIds
          : [...evidenceIds, evidence.id],
        status: "evidence_requested",
      };
    });

    ctx.set?.(
      "compliance.controls",
      updatedControls
    );

    console.log(
      "[compliance.requestEvidence] Runtime state updated",
      {
        evidenceId: evidence.id,
        controlId,
        evidenceCount: currentEvidence.length + 1,
      }
    );

    return {
      ok: true,
      result: {
        evidence,
        controlId,
      },
    };
  } catch (err) {
    console.error(
      "[compliance.requestEvidence]",
      err
    );

    return {
      ok: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to request evidence",
    };
  }
}