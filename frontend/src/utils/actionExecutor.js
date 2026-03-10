// src/utils/actionExecutor.js
import { actionRegistry } from "../actions/actionsRegistry";

/**
 * runAction(name, ctx, params)
 * name: "call.startCall"
 */
export async function runAction(name, ctx, params = {}) {

  console.log("[runAction] called", { name, params });

  const role = ctx?.role || "participant";

  // Resolve namespaced action
  const parts = name.split(".");
  let action = actionRegistry;

  for (const part of parts) {
    action = action?.[part];
    if (!action) break;
  }

  if (!action) {
    console.warn("[runAction] Unknown action", name);
    return null;
  }

  const { run, roles } = action;

  if (typeof run !== "function") {
    console.warn("[runAction] Invalid action format", name);
    return null;
  }

  // Role validation
  if (roles && !roles.includes(role)) {
    console.warn(`[runAction] Role "${role}" cannot run "${name}"`);
    ctx.notify?.("You don't have permission to perform this action");
    return null;
  }

  try {
    const result = await run(ctx, params);

    console.log(`[runAction:${name}] result`, result);
    return result;

  } catch (err) {

    console.error(`[runAction:${name}] failed`, err);
    ctx.notify?.(`Action "${name}" failed – see console`);
    return null;

  }
}