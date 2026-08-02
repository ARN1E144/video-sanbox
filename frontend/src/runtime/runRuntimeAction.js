import { getAction } from "../actions/actionsRegistry";

export async function runRuntimeAction(actionValue, ctx, params) {

  console.log("[RUN ACTION]", actionValue);

  const action = getAction(actionValue);

  console.log("[RESOLVED ACTION]", action);

  if (!action) {
    return { ok: false, error: "missing_action" };
  }

  return action.run(ctx, params);
}