// src/actions/call/endCall.js
import api from "../../services/api";

export default async function endCall(ctx, params = {}) {
  const { id, targetId, callId } = params;
  const bindId = targetId || id;

  if (!callId) {
    console.warn("No callId provided to endCall");
    return;
  }

  try {
    const { data } = await api.post(`/calls/${callId}/end`);

    // Reset binding
    ctx.updateBinding(bindId, { joined: false, callId: null });
    ctx.notify(`Call ${callId} ended`);

    console.log("[endCall] Call ended", data);
    return data;
  } catch (err) {
    console.error("[endCall] Error", err);
    ctx.notify(`Failed to end call: ${err.message || err}`);
    return null;
  }
}