// src/utils/actionExecutor.js
import { actionRegistry } from "../actions/actionsRegistry";

/**
 * runAction(name, ctx, params)
 * - name: string (e.g. "call.startCall", "video.startStream")
 * - ctx:  ActionContext value (from useActionContext)
 * - params: extra data from the triggering element
 */
export async function runAction(name, ctx, params = {}) {
  console.log("[runAction] called", { name, params });

  // Support namespaced actions like "call.startCall"
  const parts = name.split(".");
  let actionFn = actionRegistry;

  for (const part of parts) {
    actionFn = actionFn?.[part];
    if (!actionFn) break;
  }

  if (typeof actionFn !== "function") {
    console.warn("[runAction] Unknown action", name);
    return null;
  }

  try {
    // Pass ctx and params to the action function
    const result = await actionFn(ctx, params);
    console.log(`[runAction:${name}] result`, result);
    return result;
  } catch (err) {
    console.error(`[runAction:${name}] failed`, err);
    ctx.notify?.(`Action "${name}" failed – see console`);
    return null;
  }
}