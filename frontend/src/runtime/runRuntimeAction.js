import { getAction } from "../actions/actionsRegistry";

export async function runRuntimeAction(actionValue, ctx, params) {
  const action = getAction(actionValue);

  if (!action) {
    return { ok: false, error: "missing_action" };
  }

  return action.run(ctx, params);
}