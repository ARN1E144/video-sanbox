// src/utils/actionPipeline.js


// =====================================================
// CONDITION EVALUATION
// =====================================================

function getRuntimeValue(
  ctx,
  path
) {

  if (
    !path ||
    typeof path !==
      "string"
  ) {

    return undefined;

  }


  return ctx?.get?.(
    path
  );

}


// =====================================================
// SAFE VALUE COMPARISON
// =====================================================

function valuesEqual(
  actual,
  expected
) {

  // ---------------------------------------------------
  // Primitive comparison
  // ---------------------------------------------------

  if (
    actual ===
    expected
  ) {

    return true;

  }


  // ---------------------------------------------------
  // String/number normalisation
  // ---------------------------------------------------

  if (
    (
      typeof actual ===
        "string" ||
      typeof actual ===
        "number"
    ) &&
    (
      typeof expected ===
        "string" ||
      typeof expected ===
        "number"
    )
  ) {

    return (
      String(
        actual
      ) ===
      String(
        expected
      )
    );

  }


  return false;

}


// =====================================================
// CONDITION
// =====================================================

export function evaluateCondition(
  condition,
  ctx
) {

  // ---------------------------------------------------
  // No condition = pass
  // ---------------------------------------------------

  if (
    !condition
  ) {

    return true;

  }


  const path =
    condition?.path;


  if (
    typeof path !==
      "string" ||
    !path.trim()
  ) {

    console.warn(
      "[Pipeline] Invalid condition path",
      condition
    );


    return false;

  }


  const actual =
    getRuntimeValue(
      ctx,
      path
    );


  const operator =
    condition?.operator ||
    "equals";


  const expected =
    condition?.value;


  // ===================================================
  // OPERATORS
  // ===================================================

  switch (
    operator
  ) {

    case "equals":

      return valuesEqual(
        actual,
        expected
      );


    case "notEquals":

      return !valuesEqual(
        actual,
        expected
      );


    case "truthy":

      return !!actual;


    case "falsy":

      return !actual;


    default:

      console.warn(
        "[Pipeline] Unknown condition operator",
        {
          operator,
          condition,
        }
      );


      return false;

  }

}


// =====================================================
// ACTION PIPELINE
// =====================================================
//
// IMPORTANT:
//
// `runAction` is injected by ActionContext.
//
// This means the pipeline uses the exact same runtime
// execution path as:
//
//   ControlButton
//   CanvasElementRenderer
//   RuntimeTestPanel
//
// =====================================================

export async function runActionPipeline(
  actions = [],
  ctx,
  baseParams = {}
) {

  if (
    !Array.isArray(
      actions
    )
  ) {

    return {

      ok:
        false,

      error:
        "INVALID_ACTION_PIPELINE",

    };

  }


  let lastResult =
    null;


  for (
    const action of actions
  ) {

    if (
      !action?.type
    ) {

      continue;

    }


    // =================================================
    // CONDITION
    // =================================================

    const conditionPassed =
      evaluateCondition(
        action.condition,
        ctx
      );


    console.log(
      "[Pipeline] Condition",
      {

        action:
          action.type,

        condition:
          action.condition ||
          null,

        passed:
          conditionPassed,

      }
    );


    if (
      !conditionPassed
    ) {

      console.log(
        "[Pipeline] Condition failed - stopping",
        action
      );


      return {

        ok:
          true,

        stopped:
          true,

        reason:
          "CONDITION_FAILED",

        result:
          lastResult,

      };

    }


    // =================================================
    // PARAMS
    // =================================================

    const params = {

      ...baseParams,

      ...(action.params || {}),

      targetId:
        action.targetId ||
        baseParams.targetId ||
        null,

    };


    // =================================================
    // EXECUTE
    // =================================================

    console.log(
      "[Pipeline] Running",
      {

        action:
          action.type,

        params,

      }
    );


    const executeAction =
      ctx?.runAction;


    if (
      typeof executeAction !==
        "function"
    ) {

      console.error(
        "[Pipeline] Runtime action executor missing"
      );


      return {

        ok:
          false,

        error:
          "PIPELINE_EXECUTOR_MISSING",

      };

    }


    lastResult =
      await executeAction(
        action.type,
        params
      );


    console.log(
      "[Pipeline] Result",
      {

        action:
          action.type,

        result:
          lastResult,

      }
    );


    // =================================================
    // STOP ON ACTION FAILURE
    // =================================================

    if (
      !lastResult?.ok
    ) {

      console.warn(
        "[Pipeline] Action failed - stopping",
        {

          action:
            action.type,

          result:
            lastResult,

        }
      );


      return lastResult;

    }

  }


  // ===================================================
  // COMPLETE
  // ===================================================

  return (

    lastResult || {

      ok:
        true,

      result:
        null,

    }

  );

}
