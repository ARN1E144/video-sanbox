import api from "../../services/api";

export default async function acceptCall(ctx, params = {}) {
  const { callId } = params;
  if (!callId) {
    console.warn("[acceptCall] missing callId");
    return null;
  }
  const { data } = await api.post(`/calls/${callId}/accept`);
  ctx.set("activeCall", data.call);
  ctx.notify?.("Call accepted");
  return data.call;
}