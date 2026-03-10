// src/actions/call/fetchAvailableCalls.js
import api from "../../services/api";

export default async function fetchAvailableCalls(ctx, params = {}) {
  const { id, targetId } = params;
  const bindId = targetId || id;

  try {
    const { data } = await api.get("/calls/available");

    // Store available calls in the binding
    ctx.updateBinding(bindId, { availableCalls: data || [] });
    ctx.notify(`Fetched ${data?.length || 0} available calls`);

    console.log("[fetchAvailableCalls] Data:", data);
    return data;
  } catch (err) {
    console.error("[fetchAvailableCalls] Error", err);
    ctx.notify(`Failed to fetch available calls: ${err.message || err}`);
    return null;
  }
}