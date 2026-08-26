// src/actions/getActionByValue.js

import {
  getAction,
} from "./actionsRegistry";


// =====================================================
// RESOLVE ACTION BY VALUE
// =====================================================

export function getActionByValue(
  value
) {

  console.log(
    "[getActionByValue] LOOKUP",
    {
      value,
    }
  );


  // ===================================================
  // VALIDATE
  // ===================================================

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {

    console.warn(
      "[getActionByValue] Invalid action value",
      value
    );


    return null;

  }


  const actionValue =
    value.trim();


  // ===================================================
  // LOOKUP
  // ===================================================
  //
  // Use the canonical registry helper.
  //
  // This ensures:
  //
  // actionAliases
  //        +
  // actionRegistry
  //
  // are resolved in one place.
  //
  // ===================================================

  const action =
    getAction(
      actionValue
    );


  // ===================================================
  // DEBUG
  // ===================================================

  const [
    category,
    name,
  ] =
    actionValue.split(".");


  console.log(
    "[getActionByValue] PARSED",
    {

      category,

      name,

      actionFound:
        !!action,

      actionValue,

      action:

        action
          ? {
              value:
                action.value,

              label:
                action.label,

              category:
                action.category,

              targetCount:
                Array.isArray(
                  action.targets
                )
                  ? action.targets.length
                  : 0,

              runType:
                typeof action.run,

            }

          : null,

    }
  );


  // ===================================================
  // RESULT
  // ===================================================

  console.log(
    "[getActionByValue] RESULT",
    action
  );


  return action || null;

}


// =====================================================
// DEBUG: RECORDING ACTIONS
// =====================================================
//
// This runs once when the module loads and gives us an
// unambiguous confirmation of what the browser actually
// has available.
//
// =====================================================

console.log(
  "[getActionByValue] RECORDING ACTION AVAILABILITY",
  {

    startRecording:
      !!getAction(
        "video.startRecording"
      ),

    stopRecording:
      !!getAction(
        "video.stopRecording"
      ),

    uploadRecording:
      !!getAction(
        "video.uploadRecording"
      ),

    uploadRecordingRunner:
      typeof getAction(
        "video.uploadRecording"
      )?.run,

  }
);
