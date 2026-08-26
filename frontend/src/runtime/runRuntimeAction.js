// src/runtime/runRuntimeAction.js

import {
  getActionByValue,
} from "../actions/getActionByValue";


export async function runRuntimeAction(
  actionValue,
  ctx,
  params = {}
) {

  console.log(
    "[RUN ACTION]",
    actionValue
  );


  console.log(
    "[ACTION AUTH CHECK]",
    {
      actionValue,

      role:
        ctx.runtimeAuth?.role,

      allowed:
        ctx.runtimeAuth?.allowedActions,
    }
  );


  // =====================================================
  // PERMISSION CHECK
  // =====================================================

  const allowedActions =
    ctx.runtimeAuth?.allowedActions || [];


  if (
    !allowedActions.includes(
      actionValue
    )
  ) {

    console.warn(
      "[ACTION BLOCKED]",
      {
        action:
          actionValue,

        role:
          ctx.runtimeAuth?.role,

        allowedActions,
      }
    );


    return {

      ok: false,

      error:
        "permission_denied",

    };

  }


  // =====================================================
  // RESOLVE ACTION
  // =====================================================

  const action =
    getActionByValue(
      actionValue
    );


  console.log(
    "[RESOLVED ACTION]",
    action
  );


  if (!action) {

    return {

      ok: false,

      error:
        "missing_action",

    };

  }


  // =====================================================
  // EXECUTE
  // =====================================================

  try {

   if (
  typeof action.run !== "function"
) {

  console.error(
    "[RUNTIME ACTION INVALID]",
    {
      actionValue,
      action,
      runType:
        typeof action.run,
    }
  );

  return {
    ok: false,
    error: "invalid_action_runner",
  };

}

return await action.run(
  ctx,
  params
);

  } catch (err) {

    console.error(
      "[RUNTIME ACTION FAILED]",
      {
        action:
          actionValue,

        error:
          err,
      }
    );


    return {

      ok: false,

      error:
        err?.message ||
        "ACTION_EXECUTION_FAILED",

    };

  }

}