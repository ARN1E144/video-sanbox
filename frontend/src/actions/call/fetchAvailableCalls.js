// src/actions/call/fetchAvailableCalls.js

import api from "../../services/api";

export default async function fetchAvailableCalls(ctx) {
  try {
    const { data } = await api.get(
      "/calls/available"
    );

    ctx.set?.(
      "calls.available",
      data || []
    );

    return {
      ok: true,
      calls: data,
    };
  } catch (err) {
    console.error("[fetchAvailableCalls]", err);

    return {
      ok: false,
      error: err.message,
    };
  }
}