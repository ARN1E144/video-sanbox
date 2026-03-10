// src/actions/call/acceptCall.js
import api from "../../services/api";

export default async function acceptCall(ctx, params = {}) {
  const { id, targetId, callId } = params;
  const bindId = targetId || id;

  if (!callId) {
    console.warn("No callId provided to acceptCall");
    return;
  }

  try {
    const { data } = await api.post(`/calls/${callId}/accept`);

    // Update binding to mark the call as joined
    ctx.updateBinding(bindId, { joined: true, callId: callId });
    ctx.notify(`Call ${callId} accepted`);

    console.log("[acceptCall] Call accepted", data);
    return data;
  } catch (err) {
    console.error("[acceptCall] Error", err);
    ctx.notify(`Failed to accept call: ${err.message || err}`);
    return null;
  }
}