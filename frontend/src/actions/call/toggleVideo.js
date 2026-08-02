export default async function toggleVideo(ctx) {

  const agora = ctx?.agora;


  if (!agora?.toggleVideo) {

    return {
      ok:false,
      error:"AGORA_UNAVAILABLE"
    };

  }


  const enabled =
    await agora.toggleVideo();



  ctx.patch(
    "media",
    {
      ...ctx.get("media"),
      videoEnabled: enabled
    }
  );


  console.log(
    "[toggleVideo]",
    {
      videoEnabled: enabled
    }
  );


  return {

    ok:true,

    videoEnabled: enabled

  };

}