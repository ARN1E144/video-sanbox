import api from "../../services/api";

export default async function startCall(ctx, params = {}) {
  try {
    const { data } = await api.post("/calls", {
      recipientId: params.recipientId,
    });

    const call = data.call;

    // 🔥 SINGLE SOURCE OF TRUTH
    ctx.set?.("call", {
      callId: call._id,
      channel: call.channelName,
      state: "ringing",
    });

    return {
      ok: true,
      result: {
        callId: call._id,
        channel: call.channelName,
      },
    };
  } catch (err) {
    console.error("[startCall]", err);

    return {
      ok: false,
      error: err.message,
    };
  }
}