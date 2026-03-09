export default async function conditionalAutoplay(ctx, params = {}) {
  const { targetId, condition } = params;
  const id = targetId || "VideoFeed";
  const elProps = ctx.bindings?.[id] || {};
  let shouldPlay = false;

  if (condition === "enabled") shouldPlay = elProps.enabled === true;
  else if (condition === "hasSource") shouldPlay = !!elProps.src;
  else shouldPlay = true;

  ctx.updateBinding(id, { playing: shouldPlay });
  return { id, playing: shouldPlay };
}