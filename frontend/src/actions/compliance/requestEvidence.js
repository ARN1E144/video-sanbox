import api from "../../services/api";

export default async function requestEvidence(ctx, params = {}) {
  try {
    /*
     * Project ID comes from the runtime project state.
     *
     * Allow an explicit param as an override, but normally
     * Confo actions should obtain this from runtime state.
     */
    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");

    const {
      controlId,
      name = "Evidence required",
      description = "",
      type = "document",
      dueDate = null,
      requestedFor = null,
    } = params;

    if (!projectId) {
      console.error(
        "[compliance.requestEvidence] Missing projectId"
      );

      return {
        ok: false,
        error: "projectId is required",
      };
    }

    if (!controlId) {
      return {
        ok: false,
        error: "controlId is required",
      };
    }

    console.log(
      "[compliance.requestEvidence] Requesting evidence",
      {
        projectId,
        controlId,
        name,
        description,
        type,
        dueDate,
        requestedFor,
      }
    );

    /*
     * Create the persistent evidence request.
     */
    const { data } = await api.post(
      "/compliance/evidence/request",
      {
        projectId,
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
        error:
          "Evidence request was not returned by the API",
      };
    }

    /*
     * Compliance evidence uses evidenceId as its
     * persistent identifier.
     *
     * Keep a fallback to id for compatibility with
     * any older API response.
     */
    const evidenceId =
      evidence.evidenceId ||
      evidence.id;

    if (!evidenceId) {
      console.error(
        "[compliance.requestEvidence] Evidence returned without ID",
        { evidence }
      );

      return {
        ok: false,
        error: "Evidence ID was not returned by the API",
      };
    }

    /*
     * Store the newly created evidence ID as the
     * currently selected evidence in runtime state.
     */
    ctx.set?.(
      "compliance.selectedEvidenceId",
      evidenceId
    );

    /*
     * Add the new evidence record to runtime state.
     */
    const currentEvidence =
      ctx.get?.("compliance.evidence") || [];

    ctx.set?.(
      "compliance.evidence",
      [
        ...currentEvidence,
        evidence,
      ]
    );

    /*
     * Update the associated control in runtime state.
     *
     * Compliance controls use controlId in the
     * persistent model. Keep id as a compatibility
     * fallback for older runtime data.
     */
    const controls =
      ctx.get?.("compliance.controls") || [];

    const updatedControls = controls.map(
      (control) => {
        const existingControlId =
          control.controlId ||
          control.id;

        if (
          existingControlId !== controlId
        ) {
          return control;
        }

        const evidenceIds =
          Array.isArray(control.evidenceIds)
            ? control.evidenceIds
            : [];

        return {
          ...control,

          evidenceIds:
            evidenceIds.includes(evidenceId)
              ? evidenceIds
              : [
                  ...evidenceIds,
                  evidenceId,
                ],

          status:
            "evidence_requested",

          evidenceStatus:
            "requested",
        };
      }
    );

    ctx.set?.(
      "compliance.controls",
      updatedControls
    );

    console.log(
      "[compliance.requestEvidence] Runtime state updated",
      {
        projectId,
        evidenceId,
        controlId,
        evidenceCount:
          currentEvidence.length + 1,
      }
    );

    return {
      ok: true,
      result: {
        evidence,
        evidenceId,
        controlId,
        projectId,
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