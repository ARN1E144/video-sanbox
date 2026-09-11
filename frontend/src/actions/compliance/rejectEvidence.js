import api from "../../services/api";

export default async function rejectEvidence(
  ctx,
  params = {}
) {
  try {

    // ===================================================
    // IDENTIFIERS
    // ===================================================

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
      "[compliance.rejectEvidence] Rejecting evidence",
      {
        projectId,
        evidenceId,
      }
    );


    // ===================================================
    // VALIDATION
    // ===================================================

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


    // ===================================================
    // RUNTIME EVIDENCE
    // ===================================================

    const currentEvidence =
      Array.isArray(
        ctx?.get?.("compliance.evidence")
      )
        ? ctx.get(
            "compliance.evidence"
          )
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
        error:
          "Evidence not found in runtime state",
      };

    }


    // ===================================================
    // VALIDATE REVIEW STATE
    // ===================================================

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


    // ===================================================
    // API
    // ===================================================

    const {
      data,
    } =
      await api.post(
        "/compliance/evidence/reject",
        {
          projectId,
          evidenceId,
        }
      );


    if (
      !data?.evidence
    ) {

      return {
        ok: false,
        error:
          "Rejected evidence was not returned by the API",
      };

    }


    const rejectedEvidence =
      data.evidence;


    // ===================================================
    // UPDATE EVIDENCE RUNTIME STATE
    // ===================================================

    const returnedEvidenceId =
      rejectedEvidence?.evidenceId ||
      rejectedEvidence?.id ||
      evidenceId;


    const updatedEvidence =
      currentEvidence.map(
        item => {

          const itemId =
            item?.evidenceId ||
            item?.id;


          if (
            itemId !==
            evidenceId
          ) {

            return item;

          }


          return {

            ...item,

            ...rejectedEvidence,

            evidenceId:
              returnedEvidenceId,

            status:
              rejectedEvidence?.status ||
              "rejected",

            reviewDecision:
              rejectedEvidence?.reviewDecision ||
              "rejected",

          };

        }
      );


    ctx?.set?.(
      "compliance.evidence",
      updatedEvidence
    );


    // ===================================================
    // UPDATE CONTROL RUNTIME STATE
    // ===================================================
    //
    // Keep runtime aligned with the authoritative API
    // response where possible.
    //
    // ===================================================

    const currentControls =
      Array.isArray(
        ctx?.get?.("compliance.controls")
      )
        ? ctx.get(
            "compliance.controls"
          )
        : [];


    const controlId =
      rejectedEvidence?.controlId ||
      evidence?.controlId ||
      null;


    if (
      controlId
    ) {

      const updatedControls =
        currentControls.map(
          control => {

            const currentControlId =
              control?.controlId ||
              control?.id;


            if (
              String(
                currentControlId
              ) !==
              String(
                controlId
              )
            ) {

              return control;

            }


            return {

              ...control,

              status:
                "remediation",

              evidenceStatus:
                "rejected",

              evidenceVerified:
                false,

              evidenceVerifiedAt:
                null,

              lastEvidenceId:
                returnedEvidenceId,

              lastReviewedAt:
                rejectedEvidence?.reviewedAt ||
                new Date(),

            };

          }
        );


      ctx?.set?.(
        "compliance.controls",
        updatedControls
      );

    }


    console.log(
      "[compliance.rejectEvidence] Runtime state updated",
      {
        projectId,
        evidenceId:
          returnedEvidenceId,
        controlId,
        status:
          rejectedEvidence?.status ||
          "rejected",
      }
    );


    // ===================================================
    // DOMAIN EVENT
    // ===================================================

    console.log(
      "[compliance.rejectEvidence] EMITTING DOMAIN EVENT",
      {
        event:
          "compliance.evidenceRejected",

        evidenceId:
          returnedEvidenceId,

      }
    );


    ctx?.emit?.(
      "compliance.evidenceRejected",
      {
        projectId,

        evidenceId:
          returnedEvidenceId,

        controlId,

        evidence:
          rejectedEvidence,
      }
    );


    // ===================================================
    // RESULT
    // ===================================================

    return {

      ok:
        true,

      result: {

        projectId,

        evidenceId:
          returnedEvidenceId,

        controlId,

        evidence:
          rejectedEvidence,

      },

    };

  }
  catch (
    err
  ) {

    console.error(
      "[compliance.rejectEvidence]",
      err
    );


    return {

      ok:
        false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to reject evidence",

    };

  }

}