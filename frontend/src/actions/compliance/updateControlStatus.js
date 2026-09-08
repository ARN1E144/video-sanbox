// src/actions/compliance/updateControlStatus.js

export default async function updateControlStatus(
  ctx,
  params = {}
) {
  const {
    controlId,
    status,
  } = params;

  // =====================================================
  // VALIDATION
  // =====================================================

  if (!controlId) {
    console.warn(
      "[compliance.updateControlStatus] Missing control ID"
    );

    return {
      ok: false,
      error: "MISSING_CONTROL_ID",
    };
  }

  if (!status) {
    console.warn(
      "[compliance.updateControlStatus] Missing status"
    );

    return {
      ok: false,
      error: "MISSING_STATUS",
    };
  }

  // =====================================================
  // GET CONTROLS
  // =====================================================

  const controls =
    ctx?.get?.("compliance.controls") || [];

  if (!Array.isArray(controls)) {
    console.warn(
      "[compliance.updateControlStatus] Control state is not an array"
    );

    return {
      ok: false,
      error: "INVALID_CONTROL_STATE",
    };
  }

  // =====================================================
  // FIND CONTROL
  // =====================================================

  const control = controls.find(
    (item) =>
      String(item?.id) === String(controlId)
  );

  if (!control) {
    console.warn(
      "[compliance.updateControlStatus] Control not found",
      {
        controlId,
      }
    );

    return {
      ok: false,
      error: "CONTROL_NOT_FOUND",
    };
  }

  // =====================================================
  // UPDATE CONTROL
  // =====================================================

  const previousStatus =
    control.status ?? null;

  const lastReviewedAt =
    new Date().toISOString();

  const updatedControls =
    controls.map((item) => {

      if (
        String(item?.id) !==
        String(controlId)
      ) {
        return item;
      }

      return {
        ...item,

        status,

        lastReviewedAt,
      };
    });

  // =====================================================
  // WRITE RUNTIME STATE
  // =====================================================

  ctx.set?.(
    "compliance.controls",
    updatedControls
  );

  const updatedControl =
    updatedControls.find(
      (item) =>
        String(item?.id) ===
        String(controlId)
    );

  console.log(
    "[compliance.updateControlStatus] Control status updated",
    {
      controlId,
      previousStatus,
      status,
    }
  );

  // =====================================================
  // DOMAIN EVENT
  // =====================================================

  ctx.emit?.(
    "compliance.controlStatusChanged",
    {
      controlId,

      previousStatus,

      status,

      control:
        updatedControl,

      changedAt:
        lastReviewedAt,
    }
  );

  // =====================================================
  // RESULT
  // =====================================================

  return {
    ok: true,

    result: {
      controlId,

      previousStatus,

      status,

      control:
        updatedControl,

      changedAt:
        lastReviewedAt,
    },
  };
}