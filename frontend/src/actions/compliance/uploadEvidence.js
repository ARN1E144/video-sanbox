import api from "../../services/api";

export default async function uploadEvidence(ctx, params = {}) {
  try {
    const {
      evidenceId,
      fileName,
    } = params;

    if (!evidenceId) {
      return {
        ok: false,
        error: "evidenceId is required",
      };
    }

    if (!fileName) {
      return {
        ok: false,
        error: "fileName is required",
      };
    }

    console.log(
      "[compliance.uploadEvidence] Uploading evidence",
      {
        evidenceId,
        fileName,
      }
    );

    const { data } = await api.post(
      "/compliance/evidence/upload",
      {
        evidenceId,
        fileName,
      }
    );

    const evidence = data?.evidence;

    if (!evidence) {
      return {
        ok: false,
        error: "Uploaded evidence was not returned by the API",
      };
    }

    const currentEvidence =
      ctx.get?.("compliance.evidence") || [];

    const updatedEvidence = currentEvidence.map((item) => {
      if (item.id !== evidenceId) {
        return item;
      }

      return {
        ...item,
        ...evidence,
        status: "processing",
      };
    });

    ctx.set?.(
      "compliance.evidence",
      updatedEvidence
    );

    console.log(
      "[compliance.uploadEvidence] Runtime state updated",
      {
        evidenceId,
        fileName,
        status: "processing",
      }
    );

    console.log(
      "[compliance.uploadEvidence] EMITTING DOMAIN EVENT",
      {
        event: "compliance.evidenceUploaded",
        evidenceId,
      }
    );

    ctx.emit?.(
      "compliance.evidenceUploaded",
      {
        evidenceId,
        evidence,
      }
    );

    return {
      ok: true,
      result: {
        evidence,
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