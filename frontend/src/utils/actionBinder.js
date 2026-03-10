import { runAction } from "./actionExecutor";


export function bindActions(meta, ctx, elementId, userRole = "participant") {
  if (!meta?.actions) return {};
  const handlers = {};

  meta.actions.forEach((action) => {
    const trigger = action.trigger || "click";
    const name = action.name || action.action || action.value;
    if (!name) return;

    // Check registry & role
    const parts = name.split(".");
    let entry = ctx?.actionRegistry;
    for (const p of parts) entry = entry?.[p];
    if (!entry) return;
    if (entry.roles && !entry.roles.includes(userRole)) return; // skip

    const reactEvent =
      trigger === "click"
        ? "onClick"
        : trigger === "hover"
        ? "onMouseEnter"
        : trigger === "change"
        ? "onChange"
        : null;
    if (!reactEvent) return;

    handlers[reactEvent] = () =>
      ctx.runAction(name, { id: elementId, targetId: elementId, elementId });

    console.log(
      `[bindActions] Bound action "${name}" for role "${userRole}" to "${reactEvent}" on "${elementId}"`
    );
  });

  return handlers;
}