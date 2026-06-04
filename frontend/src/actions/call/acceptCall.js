import api from "../../services/api";

export default async function acceptCall(ctx, params = {}) {
  try {
    const { callId } = params;

    if (!callId) {
      return {
        ok: false,
        error: "MISSING_CALL_ID",
      };
    }

    const { data } = await api.post(`/calls/${callId}/accept`);

    const call = data.call;

    const channel = call.channelName;

    // 🔥 V1 SINGLE SOURCE OF TRUTH
    ctx.set?.("call.callId", callId);
    ctx.set?.("call.channel", channel);
    ctx.set?.("call.state", "accepted");

    return {
      ok: true,
      callId,
      channel,
    };
  } catch (err) {
    console.error("[acceptCall]", err);

    return {
      ok: false,
      error: err.message,
    };
  }
}