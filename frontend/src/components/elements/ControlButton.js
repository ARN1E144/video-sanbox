// src/components/elements/ControlButton.js

import React from "react";

import {
  useActionContext,
} from "../../context/ActionContext";


export default function ControlButton(
  props
) {

  const {

    label =
      "Button",

    action,

    targetId,

    params =
      {},

    emit,

  } =
    props;


  const {
    runAction,
  } =
    useActionContext();


  // ===================================================
  // CLICK
  // ===================================================

  const handleClick =
    async () => {

      // -------------------------------------------------
      // No action
      // -------------------------------------------------

      if (
        !action
      ) {

        console.warn(
          "[ControlButton] No action configured",
          {
            label,
          }
        );


        return;

      }


      // =================================================
      // CANVAS EVENT BRIDGE
      // =================================================
      //
      // When rendered through CanvasElementRenderer,
      // `emit` is supplied by the renderer.
      //
      // This is now the preferred execution path.
      //
      // It allows the renderer to handle:
      //
      //   primary action
      //       ↓
      //   nextActions
      //       ↓
      //   conditions
      //
      // =================================================

      if (
        typeof emit ===
          "function"
      ) {

        console.log(
          "[ControlButton] Delegating click to Canvas event bridge",
          {

            action,

            targetId,

            params,

          }
        );


        try {

          return await emit(
            "onClick",
            {

              action,

              targetId,

              params,

            }
          );

        }
        catch (
          error
        ) {

          console.error(
            "[ControlButton] Canvas event failed",
            error
          );


          return {

            ok:
              false,

            error:
              error?.message ||
              "CONTROL_BUTTON_ACTION_FAILED",

          };

        }

      }


      // =================================================
      // FALLBACK DIRECT EXECUTION
      // =================================================
      //
      // Allows ControlButton to remain usable outside
      // CanvasElementRenderer.
      //
      // =================================================

      const actionParams = {

        ...(
          params &&
          typeof params ===
            "object"
            ? params
            : {}
        ),

        targetId:
          targetId ||
          null,

      };


      console.log(
        "[ControlButton] Direct action execution",
        {

          action,

          targetId,

          params:
            actionParams,

        }
      );


      try {

        return await runAction(
          action,
          actionParams
        );

      }
      catch (
        error
      ) {

        console.error(
          "[ControlButton] Action failed",
          {

            action,

            error,

          }
        );


        return {

          ok:
            false,

          error:
            error?.message ||
            "CONTROL_BUTTON_ACTION_FAILED",

        };

      }

    };


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[ControlButton PROPS]",
    {

      label,

      action,

      targetId,

      params,

      hasCanvasEmit:
        typeof emit ===
          "function",

    }
  );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <button

      type="button"

      className="
        w-full
        h-full
        px-4
        py-2
        bg-blue-500
        text-white
        rounded
      "

      onClick={
        handleClick
      }

    >

      {
        label
      }

    </button>

  );

}
