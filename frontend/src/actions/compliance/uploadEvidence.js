import api from "../../services/api";

export default async function uploadEvidence(ctx, params = {}) {
  try {
    const {
      evidenceId,
      file,
      fileName,
    } = params;

    const projectId =
      params?.projectId ||
      ctx?.projectId ||
      ctx?.get?.("project.id");

    console.log(
      "[compliance.uploadEvidence] Uploading evidence",
      {
        projectId,
        evidenceId,
        fileName: fileName || file?.name || null,
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

    if (!file) {
      return {
        ok: false,
        error: "file is required",
      };
    }

    /*
     * Send the selected file to the compliance upload endpoint.
     *
     * FileUpload provides the selected File through params.file.
     */
    const formData = new FormData();

    formData.append(
      "projectId",
      projectId
    );

    formData.append(
      "evidenceId",
      evidenceId
    );

    formData.append(
      "file",
      file
    );

    /*
     * Do not manually set Content-Type here.
     *
     * The browser must generate the multipart boundary.
     */
    const { data } =
      await api.post(
        "/compliance/evidence/upload",
        formData
      );

    const evidence =
      data?.evidence;

    if (!evidence) {
      return {
        ok: false,
        error:
          "Uploaded evidence was not returned by the API",
      };
    }

    /*
     * Keep runtime state aligned with the
     * persisted compliance record.
     */
    const currentEvidence =
      ctx?.get?.(
        "compliance.evidence"
      ) || [];

    const returnedEvidenceId =
      evidence.evidenceId ||
      evidence.id ||
      evidenceId;

    const updatedEvidence =
      currentEvidence.map(
        (item) => {

          const itemId =
            item?.evidenceId ||
            item?.id;

          return itemId ===
            returnedEvidenceId
            ? {
                ...item,
                ...evidence,
              }
            : item;

        }
      );

    ctx?.set?.(
      "compliance.evidence",
      updatedEvidence
    );

    console.log(
      "[compliance.uploadEvidence] Runtime state updated",
      {
        projectId,
        evidenceId:
          returnedEvidenceId,
        evidenceCount:
          updatedEvidence.length,
        status:
          evidence.status,
      }
    );

    /*
     * -------------------------------------------------
     * DOMAIN EVENT
     * -------------------------------------------------
     *
     * This is what starts the automatic compliance
     * analysis trigger.
     *
     * ActionContext provides ctx.emit(), which forwards
     * the event to RuntimeEventContext.
     */
    console.log(
      "[compliance.uploadEvidence] EMITTING DOMAIN EVENT",
      {
        event:
          "compliance.evidenceUploaded",

        evidenceId:
          returnedEvidenceId,
      }
    );

    ctx.emit(
      "compliance.evidenceUploaded",
      {
        evidenceId:
          returnedEvidenceId,

        evidence,
      }
    );

    /*
     * Return the successful action result.
     */
    return {
      ok: true,

      result: {
        evidence,

        evidenceId:
          returnedEvidenceId,

        projectId,
      },
    };

  } catch (err) {

    console.error(
      "[compliance.uploadEvidence]",
      err
    );

    return {
      ok: false,

      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to upload evidence",
    };

  }
}