import { runAction } from "./actionExecutor";


export function bindActions(meta, ctx, elementId) {
  if (!meta?.actions) return {};

  const handlers = {};

  meta.actions.forEach((action) => {
    const trigger = action.trigger || "click";
    const name = action.name || action.action || action.value;

    if (!name) return;

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
      runAction(name, ctx, {
        ...action,
        id: elementId,      // 👈 add this
        targetId: elementId,
        elementId
      });

      console.log(`[bindActions] Bound action "${name}" to event "${reactEvent}" on element "${elementId}" with trigger "${trigger}"`);
  });

  return handlers;
}