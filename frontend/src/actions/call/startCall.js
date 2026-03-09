import api from "../../services/api";

export default async function startCall(ctx, params = {}) {
  console.log("[startCall] firing");
  const { data } = await api.post("/calls");
  ctx.set("activeCall", data.call);
  ctx.notify?.("Call created");
  return data.call;
}