// src/actions/call/toggleCamera.js
export default async function toggleCamera(ctx, params = {}) {
  const { id, targetId, cameraOff } = params;
  const bindId = targetId || id;

  if (typeof cameraOff !== "boolean") {
    console.warn("[toggleCamera] 'cameraOff' must be a boolean");
    return;
  }

  // Update binding so AgoraFeed can enable/disable video track
  ctx.updateBinding(bindId, { cameraOff });

  ctx.notify(`Camera ${cameraOff ? "turned off" : "turned on"}`);
  console.log("[toggleCamera] Camera state updated", { bindId, cameraOff });

  return { cameraOff };
}