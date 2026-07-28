import api from "../../services/api";

export default async function startCall(ctx, params = {}) {
  try {
    const { data } = await api.post("/calls", {
      recipientId: params.recipientId,
    });

    const call = data.call;

    // 🔥 SINGLE SOURCE OF TRUTH
    ctx.set?.("call", {
      id: call._id,
      channel: call.channelName,
      state: "ringing",
      joined: false,
      remoteUsers: [],
      createdAt: Date.now(),
    });

    console.log(
      "%c[CALL AFTER SET]%c",
      "background-color: #3B82F6; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
      "",
      ctx.get("call")
    );


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