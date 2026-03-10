// src/actions/call/toggleMic.js
export default async function toggleMic(ctx, params = {}) {
  const { id, targetId, muted } = params;
  const bindId = targetId || id;

  if (typeof muted !== "boolean") {
    console.warn("[toggleMic] 'muted' must be a boolean");
    return;
  }

  // Update binding so AgoraFeed can enable/disable audio track
  ctx.updateBinding(bindId, { muted });

  ctx.notify(`Microphone ${muted ? "muted" : "unmuted"}`);
  console.log("[toggleMic] Mic state updated", { bindId, muted });

  return { muted };
}