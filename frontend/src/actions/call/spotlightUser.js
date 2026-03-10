// src/actions/call/spotlightUser.js
import api from "../../services/api";

export default async function spotlightUser(ctx, params = {}) {
  const { callId, userId } = params;

  if (!callId || !userId) {
    console.warn("[spotlightUser] callId and userId required");
    return;
  }

  try {
    const { data } = await api.post(`/calls/${callId}/spotlight`, { userId });

    ctx.notify(`User ${userId} spotlighted in call ${callId}`);
    console.log("[spotlightUser] Spotlight applied", data);

    return data;
  } catch (err) {
    console.error("[spotlightUser] Error spotlighting user", err);
    ctx.notify(`Failed to spotlight user: ${err.message || err}`);
    return null;
  }
}