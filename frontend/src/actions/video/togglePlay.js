import api from "../../services/api";

export default async function togglePlay(ctx, params = {}) {
  const { id, targetId } = params;

  if (!id) {
    console.warn("togglePlay: id required");
    return;
  }

  const bindId = targetId || id;

  try {
    // Optional backend call if your API tracks playback
    await api.get(`/videos/${id}/toggle`);

    const current = ctx.bindings?.[bindId]?.playing ?? true;

    ctx.updateBinding(bindId, {
      playing: !current
    });

    console.log("togglePlay → playing:", !current);

  } catch (err) {
    console.error("togglePlay failed:", err);
  }
}