export default {
  label: "Toggle Video",

  run: async (ctx) => {
    const agora = ctx?.agora;

    if (!agora?.toggleVideo) {
      ctx?.notify?.("Video controls unavailable");
      return;
    }

    await agora.toggleVideo();

    const current = ctx.get?.("media.videoEnabled");
    ctx.set?.("media.videoEnabled", !current);

    return { success: true };
  },
};