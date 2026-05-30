import { actionRegistry } from "../actions/actionsRegistry";
import { getAction } from "../actions/actionsRegistry";

/**
 * SINGLE ENTRY POINT FOR ALL ACTIONS
 */
export async function runRuntimeAction(actionValue, runtime, payload = {}) {
  const action = getAction(actionValue);

  if (!action) {
    console.warn("[RuntimeAction] Missing action:", actionValue);
    return;
  }

  // 1. execute action logic
  const result = await action.run(runtime, payload);

  // 2. optional state patch return
  if (result?.set && runtime?.beginTransaction) {
    runtime.beginTransaction();

    for (const [key, value] of Object.entries(result.set)) {
      runtime.queueSet(key, value);
    }

    runtime.commit();
  }

  return result;
}