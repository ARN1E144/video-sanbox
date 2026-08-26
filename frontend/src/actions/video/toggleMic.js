// src/actions/video/toggleMic.js

export default async function toggleMic(
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
    ctx.bindings?.[id]?.micEnabled ??
    true;


  const next =
    !current;


  ctx.updateBinding(
    id,
    {
      micEnabled:
        next,
    }
  );


  console.log(
    "[video.toggleMic]",
    {
      id,
      micEnabled: next,
    }
  );


  return {
    ok: true,
    result: {
      id,
      micEnabled: next,
    },
  };

}