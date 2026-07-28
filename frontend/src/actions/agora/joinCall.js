export default {
  label: "Join Call",

  run: async (ctx, params) => {
    const agora = ctx?.agora;

    if (!agora?.joinCall) {
      ctx?.notify?.("Call engine not available (joinCall)");
      return;
    }

    if (!params?.channel) {
      ctx?.notify?.("Missing channel");
      return { ok: false, error: "missing_channel" };
    }

    const res = await agora.joinCall({
      channel: params.channel,
      tokenEndpoint: params.tokenEndpoint,
    });


    const existingCall = ctx.get?.("call") || {};

    // 🔥 CRITICAL: SYNC RUNTIME STATE
    ctx.set?.("call", {
      ...existingCall,
      channel: params.channel,
      joined: true,
      status: "connected",
    });

    return {
      ok: true,
      channel: params.channel,
      sdk: res,
    };
  },
};