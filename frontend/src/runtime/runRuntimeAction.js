// src/runtime/runRuntimeAction.js

import {
  getActionByValue,
} from "../actions/getActionByValue";


// =====================================================
// CONSTANTS
// =====================================================

const MAX_AUTO_CHAIN_DEPTH =
  10;


// =====================================================
// RESULT SUCCESS HELPER
// =====================================================
//
// Treat:
//   undefined
//   null
//
// as successful only when the action itself returned
// nothing.
//
// Explicit:
//   { ok: false }
//
// is always a failure.
//
// =====================================================

function actionSucceeded(
  result
) {

  if (
    result === null ||
    result === undefined
  ) {

    return true;

  }


  if (
    typeof result === "object" &&
    result.ok === false
  ) {

    return false;

  }


  return true;

}


// =====================================================
// RUNTIME PARAMETER RESOLVER
// =====================================================
//
// Resolves runtime references inside action params.
//
// Example:
//
// {
//   controlId: {
//     "$state":
//       "compliance.selectedControlId"
//   }
// }
//
// becomes:
//
// {
//   controlId: "a-5.1"
// }
//
// This is intentionally generic.
//
// Any Confo action can reference runtime state.
//
// =====================================================

function resolveRuntimeParams(
  params,
  ctx
) {

  // ---------------------------------------------------
  // Primitive values
  // ---------------------------------------------------

  if (
    params === null ||
    params === undefined ||
    typeof params !== "object"
  ) {

    return params;

  }


  // ---------------------------------------------------
  // Arrays
  // ---------------------------------------------------

  if (
    Array.isArray(params)
  ) {

    return params.map(
      item =>
        resolveRuntimeParams(
          item,
          ctx
        )
    );

  }


  // ---------------------------------------------------
  // Object
  // ---------------------------------------------------

  const resolved = {};


  for (
    const [key, value] of
      Object.entries(params)
  ) {

    // -------------------------------------------------
    // $state reference
    // -------------------------------------------------
    //
    // Exact form:
    //
    // {
    //   "$state":
    //     "some.runtime.path"
    // }
    //
    // -------------------------------------------------

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 1 &&
      typeof value.$state === "string"
    ) {

      const statePath =
        value.$state.trim();


      if (
        !statePath
      ) {

        console.warn(
          "[RUNTIME PARAM] Empty $state path",
          {
            key,
            value,
          }
        );


        resolved[key] =
          undefined;

        continue;

      }


      if (
        typeof ctx?.get !== "function"
      ) {

        console.error(
          "[RUNTIME PARAM] Runtime get() unavailable",
          {
            key,
            statePath,
          }
        );


        resolved[key] =
          undefined;

        continue;

      }


      const runtimeValue =
        ctx.get(
          statePath
        );


      console.log(
        "[RUNTIME PARAM] $state RESOLVED",
        {
          key,
          statePath,
          value:
            runtimeValue,
        }
      );


      resolved[key] =
        runtimeValue;

      continue;

    }


    // -------------------------------------------------
    // Nested object / array
    // -------------------------------------------------

    if (
      value &&
      typeof value === "object"
    ) {

      resolved[key] =
        resolveRuntimeParams(
          value,
          ctx
        );

      continue;

    }


    // -------------------------------------------------
    // Normal value
    // -------------------------------------------------

    resolved[key] =
      value;

  }


  return resolved;

}


// =====================================================
// AUTO ACTION PARAM BUILDER
// =====================================================
//
// Automatic actions normally consume runtime state.
//
// We also forward the most useful identifiers from
// the previous action result where available.
//
// This means:
//
// createGroupCall
//      ↓
// result.callId
//      ↓
// joinGroupCall({ callId })
//
// =====================================================

function buildAutoActionParams(
  parentParams,
  parentResult
) {

  const result =
    parentResult?.result ||
    {};


  const call =
    result?.call ||
    null;


  const nextParams = {
    ...(parentParams || {}),
  };


  // ---------------------------------------------------
  // Call ID
  // ---------------------------------------------------

  const callId =
    result?.callId ||
    call?._id ||
    call?.id ||
    null;


  if (
    callId
  ) {

    nextParams.callId =
      String(
        callId
      );

  }


  // ---------------------------------------------------
  // Channel
  // ---------------------------------------------------

  const channelName =
    result?.channelName ||
    call?.channelName ||
    null;


  if (
    channelName
  ) {

    nextParams.channel =
      channelName;

  }


  return nextParams;

}


// =====================================================
// INTERNAL RUNNER
// =====================================================
//
// Keeps auto-chain depth private so public callers
// continue using:
//
// runRuntimeAction(
//   actionValue,
//   ctx,
//   params
// )
//
// =====================================================

async function executeRuntimeAction(
  actionValue,
  ctx,
  params = {},
  chainDepth = 0
) {

  console.log(
    "[RUN ACTION]",
    actionValue
  );


  // ===================================================
  // AUTO CHAIN DEPTH GUARD
  // ===================================================

  if (
    chainDepth >
    MAX_AUTO_CHAIN_DEPTH
  ) {

    console.error(
      "[AUTO ACTION CHAIN BLOCKED]",
      {
        action:
          actionValue,

        chainDepth,

        maxDepth:
          MAX_AUTO_CHAIN_DEPTH,
      }
    );


    return {

      ok:
        false,

      error:
        "AUTO_ACTION_CHAIN_LIMIT",

    };

  }


  console.log(
    "[ACTION AUTH CHECK]",
    {

      actionValue,

      role:
        ctx.runtimeAuth?.role,

      allowed:
        ctx.runtimeAuth?.allowedActions,

      chainDepth,

    }
  );


  // ===================================================
  // PERMISSION CHECK
  // ===================================================

  const allowedActions =
    ctx.runtimeAuth?.allowedActions ||
    [];


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

        chainDepth,

      }
    );


    return {

      ok:
        false,

      error:
        "permission_denied",

    };

  }


  // ===================================================
  // RESOLVE ACTION
  // ===================================================

  const action =
    getActionByValue(
      actionValue
    );


  console.log(
    "[RESOLVED ACTION]",
    action
  );


  if (
    !action
  ) {

    return {

      ok:
        false,

      error:
        "missing_action",

    };

  }


  // ===================================================
  // VALIDATE RUNNER
  // ===================================================

  if (
    typeof action.run !==
    "function"
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

      ok:
        false,

      error:
        "invalid_action_runner",

    };

  }


  // ===================================================
  // RESOLVE ACTION PARAMS
  // ===================================================
  //
  // Runtime references such as:
  //
  // {
  //   "$state":
  //     "compliance.selectedControlId"
  // }
  //
  // are resolved immediately before the action runs.
  //
  // ===================================================

  const resolvedParams =
    resolveRuntimeParams(
      params,
      ctx
    );


  console.log(
    "[RUNTIME ACTION PARAMS]",
    {
      action:
        actionValue,

      originalParams:
        params,

      resolvedParams,

      chainDepth,
    }
  );


  // ===================================================
  // EXECUTE PRIMARY ACTION
  // ===================================================

  let result;


  try {

    result =
      await action.run(
        ctx,
        resolvedParams
      );

  }
  catch (
    err
  ) {

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

      ok:
        false,

      error:
        err?.message ||
        "ACTION_EXECUTION_FAILED",

    };

  }


  console.log(
    "[RUNTIME ACTION RESULT]",
    {

      action:
        actionValue,

      result,

      chainDepth,

    }
  );


  // ===================================================
  // FAILURE CHECK
  // ===================================================
  //
  // Automatic actions must NOT run after a failed
  // action.
  //
  // ===================================================

  if (
    !actionSucceeded(
      result
    )
  ) {

    return (
      result ||
      {
        ok:
          false,

        error:
          "ACTION_EXECUTION_FAILED",
      }
    );

  }


  // ===================================================
  // AUTO NEXT ACTIONS
  // ===================================================
  //
  // IMPORTANT:
  //
  // These are actual transitions.
  //
  // nextActions are NOT executed here.
  //
  // ===================================================

  const autoNextActions =
    Array.isArray(
      action.autoNextActions
    )
      ? action.autoNextActions
      : [];


  if (
    autoNextActions.length ===
    0
  ) {

    return (
      result ??
      {
        ok:
          true,
      }
    );

  }


  // ===================================================
  // AUTO CHAIN
  // ===================================================

  let finalResult =
    result;


  for (
    const nextActionValue of
      autoNextActions
  ) {

    // -------------------------------------------------
    // Validate action name
    // -------------------------------------------------

    if (
      typeof nextActionValue !==
      "string" ||
      !nextActionValue.trim()
    ) {

      console.warn(
        "[AUTO ACTION SKIPPED]",
        {

          parentAction:
            actionValue,

          nextAction:
            nextActionValue,

          reason:
            "invalid_action_value",

        }
      );


      continue;

    }


    const nextParams =
      buildAutoActionParams(
        params,
        result
      );


    console.log(
      "[AUTO ACTION]",
      {

        from:
          actionValue,

        to:
          nextActionValue,

        params:
          nextParams,

        chainDepth:
          chainDepth + 1,

      }
    );


    const nextResult =
      await executeRuntimeAction(
        nextActionValue,
        ctx,
        nextParams,
        chainDepth + 1
      );


    finalResult =
      nextResult;


    // -------------------------------------------------
    // Stop chain on failure
    // -------------------------------------------------

    if (
      !actionSucceeded(
        nextResult
      )
    ) {

      console.error(
        "[AUTO ACTION CHAIN FAILED]",
        {

          from:
            actionValue,

          failedAction:
            nextActionValue,

          result:
            nextResult,

        }
      );


      return {

        ok:
          false,

        error:
          nextResult?.error ||
          "AUTO_ACTION_FAILED",

        failedAction:
          nextActionValue,

        result: {

          previous:
            result,

          failed:
            nextResult,

        },

      };

    }

  }


  // ===================================================
  // RETURN
  // ===================================================
  //
  // Preserve the normal result shape while exposing
  // the automatically executed chain for diagnostics.
  //
  // ===================================================

  if (
    finalResult &&
    typeof finalResult ===
      "object"
  ) {

    return {

      ...finalResult,

      autoActionsExecuted:
        autoNextActions,

    };

  }


  return {

    ok:
      true,

    result:
      finalResult,

    autoActionsExecuted:
      autoNextActions,

  };

}


// =====================================================
// PUBLIC API
// =====================================================

export async function runRuntimeAction(
  actionValue,
  ctx,
  params = {}
) {

  return executeRuntimeAction(
    actionValue,
    ctx,
    params,
    0
  );

}