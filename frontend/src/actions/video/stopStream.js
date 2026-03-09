import api from "../../services/api";

export default async function stopStream(ctx, params = {}) {
  const { id, targetId } = params;

  if (!id) {
    console.warn("No video ID provided");
    return;
  }

  try {
    await api.get(`/videos/${id}/stop`);

    const bindId = targetId || id;

    ctx.updateBinding(bindId, {
      playing: false,
      src: null
    });

    console.log("Stream stopped");

  } catch (err) {
    console.error("Failed to stop stream:", err);
  }
}