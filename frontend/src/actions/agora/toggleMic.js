export default async function toggleMic(ctx) {

  console.log("[toggleMic.js] Running");

  try {
    const agora = ctx?.agora;

    if (!agora?.toggleMic) {
      ctx?.notify?.("Audio controls unavailable");

      return {
        ok: false,
        error: "AGORA_NOT_READY",
      };
    }

   const enabled = await agora.toggleMic();

    if (enabled === false) {
      return {
        ok:false,
        error:"MIC_UNAVAILABLE"
      };
    }


    ctx.set?.(
      "media.micEnabled",
      enabled
    );


    return {
      ok:true,
      micEnabled: enabled
    };
  } catch (err) {
    console.error("[toggleMic]", err);

    return {
      ok: false,
      error: err.message,
    };
  }
}