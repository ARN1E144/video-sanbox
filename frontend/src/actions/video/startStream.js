import api from "../../services/api";

export default async function startStream(ctx, params = {}) {
  const { id, targetId } = params;

  if (!id) {
    console.warn("No video ID provided");
    return;
  }

  const bindId = targetId || id;

  try {
    const { data } = await api.get(`/videos/${id}/start`);

    if (!data?.videoUrl) {
      console.warn("No stream URL returned");
      return;
    }

    const currentMode =
      ctx.bindings?.[bindId]?.mode ||
      ctx.elements?.find?.((e) => e.id === bindId)?.props?.mode;

    // If the feed is LOCAL, just resume playback instead of switching to remote
    if (currentMode === "local") {
      ctx.updateBinding(bindId, { playing: true });
      console.log("Local camera resumed");
      return;
    }

    // Remote mode → start stream
    ctx.updateBinding(bindId, {
      src: data.videoUrl,
      playing: true
    });

    console.log("Remote stream started:", data.videoUrl);

  } catch (err) {
    console.error("Failed to start stream:", err);
  }
}