import api from "../../services/api";

export default async function loadVideo(ctx, params = {}) {
  const { id, targetId } = params;
  const { data } = await api.get(`/videos/${id}`);
  const bindId = targetId || "VideoFeed";
  ctx.updateBinding(bindId, { src: data.videoUrl });
  return data;
}