// src/utils/actionPipeline.js
import { runAction } from "./actionExecutor";

export async function runActionPipeline(actions = [], ctx, baseParams = {}) {
  let lastResult = null;

  for (const action of actions) {
    if (!action?.type) continue;

    const params = {
      ...baseParams,
      ...(action.params || {}),
      targetId: action.targetId || baseParams.targetId
    };

    console.log("[Pipeline] running", action.type, params);

    lastResult = await runAction(action.type, ctx, params);

    // optional condition support
    if (action.condition && !lastResult) {
      console.log("[Pipeline] condition failed, stopping");
      break;
    }
  }

  return lastResult;
}