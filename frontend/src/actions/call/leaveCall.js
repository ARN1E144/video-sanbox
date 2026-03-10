// src/actions/call/leaveCall.js
import api from "../../services/api";

export default async function leaveCall(ctx, params = {}) {
  const { id, targetId, callId } = params;
  const bindId = targetId || id;

  if (!callId) {
    console.warn("[leaveCall] No callId provided");
    return;
  }

  try {
    await api.post(`/calls/${callId}/end`); // Reuse your endCall API

    ctx.updateBinding(bindId, { joined: false, callId: null });
    ctx.notify(`Left call ${callId}`);

    console.log("[leaveCall] Left call", { callId, bindId });
    return { success: true };
  } catch (err) {
    console.error("[leaveCall] Error leaving call", err);
    ctx.notify(`Failed to leave call: ${err.message || err}`);
    return null;
  }
}