import api from "../../services/api";

export default async function endCall(ctx, params = {}) {
  const callId = params?.callId || ctx.get("activeCall")?._id;
  if (!callId) {
    console.warn("[endCall] missing callId");
    return null;
  }
  const { data } = await api.post(`/calls/${callId}/end`);
  ctx.set("activeCall", data.call);
  ctx.notify?.("Call ended");
  return data.call;
}