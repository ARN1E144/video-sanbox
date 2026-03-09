export default async function loadRemote(ctx, params = {}) {
  const { targetId, src } = params;
  if (!src) return null;

  const normalizedSrc =
    typeof src === "string" ? src : src?.url || src?.src || "";

  if (!normalizedSrc) return null;

  const id = targetId || "VideoFeed";

  console.log("[loadRemote]", normalizedSrc);

  ctx.updateBinding(id, {
    mode: "remote",
    src: normalizedSrc,
    playing: true,
    enabled: true
  });

  return { id, src: normalizedSrc };
}