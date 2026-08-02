export default {
  label: "Toggle Video",

  run: async (ctx) => {

    const agora = ctx?.agora;


    if (!agora?.toggleVideo) {

      ctx?.notify?.(
        "Video controls unavailable"
      );

      return {
        ok:false,
        error:"AGORA_UNAVAILABLE"
      };

    }


    const enabled =
      await agora.toggleVideo();



    ctx.set?.(
      "call",
      {
        ...ctx.get("call"),
        videoEnabled: enabled
      }
    );



    console.log(
      "[AGORA] toggleVideo",
      {
        videoEnabled: enabled
      }
    );



    return {

      ok:true,

      videoEnabled: enabled

    };

  },
};