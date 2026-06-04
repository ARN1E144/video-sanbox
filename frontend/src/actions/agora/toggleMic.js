export default {
  label: "Toggle Mic",

  run: async (ctx) => {
    const agora = ctx?.agora;

    if (!agora?.toggleMic) {
      ctx?.notify?.("Audio controls unavailable");
      return;
    }

    await agora.toggleMic();

    const current = ctx.get?.("media.micEnabled");
    ctx.set?.("media.micEnabled", !current);

    return { success: true };
  },
};