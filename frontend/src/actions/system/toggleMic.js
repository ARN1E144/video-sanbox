export default async function toggleMic(ctx, params = {}) {
  try {
    const {
      targetId,
      bindId: paramBindId,
      id,
    } = params;

    const bindId =
      targetId ||
      paramBindId ||
      ctx.targetId ||
      ctx.agora?.userId ||
      id ||
      ctx.id;

    if (!bindId) {
      console.log("[toggleMic] Falling back to global agora state");
      return ctx.toggleMic?.();
    }

    const currentBinding =
      ctx.bindings?.[bindId] || {};

    const nextMuted =
      !(currentBinding.muted === true);

    ctx.updateBinding(bindId, {
      muted: nextMuted,
    });

    ctx.notify?.(
      nextMuted ? "Microphone muted" : "Microphone unmuted"
    );

    return { muted: nextMuted };
  } catch (err) {
    console.error("[toggleMic] failed", err);
    return null;
  }
}