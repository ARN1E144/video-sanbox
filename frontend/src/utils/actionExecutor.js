// src/utils/actionExecutor.js

import { actionRegistry } from "../actions/actionsRegistry";

/**
 * runAction("agora.togglePlay", ctx, params)
 */

export async function runAction(value, ctx = {}, params = {}) {
  /* =========================================================
   🧠 VALIDATION
  ========================================================= */

  if (!value || typeof value !== "string") {
    console.warn("⚠️ Invalid action value:", value);
    return null;
  }

  const [category, name] = value.split(".");

  if (!category || !name) {
    console.error("❌ Invalid action format. Expected category.action:", value);
    return null;
  }

  const mode = ctx?.mode || "runtime";

  console.log("%c[runAction]", "color: cyan;", {
    value,
    category,
    name,
    mode,
    params,
  });

  /* =========================================================
   🧠 NESTED REGISTRY LOOKUP (OPTION B FIX)
  ========================================================= */

  const action = actionRegistry?.[category]?.[name];

  if (!action) {
    console.error("❌ ACTION NOT FOUND:", value);

    console.log(
      "%c[AVAILABLE ACTIONS]",
      "color: orange; font-weight: bold;",
      Object.keys(actionRegistry)
    );

    ctx?.notify?.(`Unknown action: ${value}`);
    return null;
  }

  /* =========================================================
   🧠 ACTION VALIDATION
  ========================================================= */

  if (typeof action.run !== "function") {
    console.warn("⚠️ Invalid action definition:", value);

    ctx?.notify?.(`Invalid action: ${value}`);
    return null;
  }

  /* =========================================================
   🧠 MODE-BASED EXECUTION (REPLACES ROLES)
  ========================================================= */

  // If runtime mode and action explicitly blocks runtime
  if (mode === "runtime" && action.runtime === false) {
    console.warn(`[runAction] blocked in runtime mode: ${value}`);

    ctx?.notify?.("Action not allowed in runtime mode");
    return null;
  }

  /* =========================================================
   🧠 PARAM NORMALIZATION (CRITICAL FOR INSPECTOR LATER)
  ========================================================= */

  const defaultParams = action.params
    ? Object.fromEntries(
        Object.entries(action.params).map(([key, schema]) => [
          key,
          schema.default,
        ])
      )
    : {};

  const finalParams = {
    ...defaultParams,
    ...params,
  };

  /* =========================================================
   🧠 EXECUTION
  ========================================================= */

  try {
    console.log("%c[EXECUTING ACTION]", "color: lime;", {
      value,
      action: action.label,
      category,
      name,
      finalParams,
    });

    const result = await action.run(ctx, finalParams);

    console.log(
      `%c[runAction SUCCESS] ${value}`,
      "color: green;",
      result
    );

    return result;
  } catch (err) {
    console.error(
      `%c[runAction FAILED] ${value}`,
      "color: red;",
      err
    );

    ctx?.notify?.(`Action failed: ${value}`);
    return null;
  }
}