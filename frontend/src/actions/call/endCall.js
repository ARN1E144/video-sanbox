// src/actions/call/endCall.js

import api from "../../services/api";

export default async function endCall(ctx, params = {}) {
  try {
    const callId =
      params.callId ||
      ctx.get?.("call.id");

    if (!callId) {
      return {
        ok: false,
        error: "MISSING_CALL_ID",
      };
    }

    await api.post(`/calls/${callId}/end`);

    ctx.set?.("call.id", null);
    ctx.set?.("call.channel", null);
    ctx.set?.("call.joined", false);
    ctx.set?.("call.state", "ended");

    return {
      ok: true,
    };
  } catch (err) {
    console.error("[endCall]", err);

    return {
      ok: false,
      error: err.message,
    };
  }
}