// src/actions/video/toggleVideo.js

export default async function toggleVideo(
  ctx,
  params = {}
) {

  const id =
    params.targetId ||
    params.id;


  if (!id) {

    return {
      ok: false,
      error: "VIDEO_TARGET_REQUIRED",
    };

  }


  const current =
    ctx.bindings?.[id]?.videoEnabled ??
    true;


  const next =
    !current;


  ctx.updateBinding(
    id,
    {
      videoEnabled:
        next,
    }
  );


  console.log(
    "[video.toggleVideo]",
    {
      id,
      videoEnabled: next,
    }
  );


  return {
    ok: true,
    result: {
      id,
      videoEnabled: next,
    },
  };

}