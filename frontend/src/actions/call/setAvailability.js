import api from "../../services/api";

export default async function setAvailability(ctx, params = {}) {
  try {
    const isAvailable = Boolean(params.isAvailable);

    console.log(
      "[setAvailability] Setting availability:",
      isAvailable
    );

    const { data } = await api.patch(
      "/tenant/members/me/availability",
      {
        isAvailable,
      }
    );

    // Keep runtime state in sync with backend
    ctx.patch?.("availability", {
      isAvailable,
    });

    console.log(
      "[setAvailability] Availability updated:",
      data
    );

    return {
      ok: true,
      result: {
        isAvailable,
      },
    };
  } catch (err) {
    console.error(
      "[setAvailability] Failed:",
      err
    );

    return {
      ok: false,
      error:
        err.response?.data?.error ||
        err.message ||
        "Failed to update availability",
    };
  }
}