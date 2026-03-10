// src/actions/call/startCall.js
import api from "../../services/api";

export default async function startCall(ctx, params = {}) {
  const { id, targetId, channel, role = "host" } = params;
  const bindId = targetId || id;

  if (!channel) {
    console.warn("No channel provided to startCall");
    return;
  }

  try {
    const { data } = await api.post("/calls/start", { channel, role });

    if (!data?.callId) {
      console.warn("[startCall] No callId returned from server");
      return;
    }

    // Update binding so AgoraFeed can join + track the call
    ctx.updateBinding(bindId, {
      callId: data.callId,
      joined: true,
      channel: channel,
      role: role,
    });

    ctx.notify(`Call started on channel "${channel}"`);
    console.log("[startCall] Call started", data);

    return data;
  } catch (err) {
    console.error("[startCall] Error starting call", err);
    ctx.notify(`Failed to start call: ${err.message || err}`);
    return null;
  }
}