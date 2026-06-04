import { getAction } from "../actions/actionsRegistry";


export async function runActionTrace(actionValue, ctx, params) {
  const action = getAction(actionValue);

  if (!action?.run) {
    return {
      ok: false,
      error: "ACTION_NOT_FOUND",
      actionValue,
    };
  }

  try {
    const result = await action.run(ctx, params);

    // 🔥 GUARANTEE RETURN SHAPE
    return {
      ok: result?.ok ?? true,
      result,
      actionValue,
    };

  } catch (err) {
    console.error("[ACTION TRACE ERROR]", err);

    return {
      ok: false,
      error: err.message,
      actionValue,
    };
  }
}