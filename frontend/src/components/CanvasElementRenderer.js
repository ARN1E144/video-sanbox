// src/components/CanvasElementRenderer.js

import React, {
  useCallback,
  useMemo,
} from "react";

import {
  useRuntimeProps,
} from "../hooks/useRuntimeProps";

import {
  useActionContext,
} from "../context/ActionContext";


// =====================================================
// HELPERS
// =====================================================

function normaliseNextActions(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return value.filter(
    action =>
      action &&
      typeof action ===
        "object" &&
      typeof action.type ===
        "string" &&
      action.type.trim()
  );

}


// =====================================================
// CANVAS ELEMENT RENDERER
// =====================================================

export default function CanvasElementRenderer({

  Component,

  element,

  binding,

  children,

}) {

  // ===================================================
  // SAFE ELEMENT
  // ===================================================

  const safeElement =
    element || {};


  const elementId =
    safeElement.id ||
    null;


  const elementType =
    safeElement.type ||
    null;


  const elementProps =
    safeElement.props ||
    {};


  // ===================================================
  // RUNTIME PROPS
  // ===================================================

  const props =
    useRuntimeProps(
      elementProps
    );


  // ===================================================
  // ACTION CONTEXT
  // ===================================================

  const {
    runAction,

    runActionPipeline,

  } =
    useActionContext();


  // ===================================================
  // META
  // ===================================================

  const resolvedMeta =
    useMemo(
      () => ({

        ...(safeElement.meta || {}),

      }),
      [
        safeElement.meta,
      ]
    );


  // ===================================================
  // ACTION CHAIN
  // ===================================================

  const nextActions =
    useMemo(
      () =>
        normaliseNextActions(
          props?.nextActions
        ),
      [
        props?.nextActions,
      ]
    );


  // ===================================================
  // EVENT → ACTION BRIDGE
  // ===================================================

  const emit =
    useCallback(
      async (
        eventName,
        payload = {}
      ) => {

        console.log(
          "[CANVAS EVENT]",
          {

            elementId,

            elementType,

            eventName,

            props,

            meta:
              resolvedMeta,

            payload,

          }
        );


        // =============================================
        // NO ACTION
        // =============================================

        if (
          eventName !==
            "onClick" ||
          !props?.action
        ) {

          console.log(
            "[CANVAS EVENT]",
            "No action configured for event",
            {

              eventName,

              elementId,

            }
          );


          return {

            ok:
              true,

            skipped:
              true,

            reason:
              "NO_ACTION_CONFIGURED",

          };

        }


        // =============================================
        // PRIMARY ACTION PARAMS
        // =============================================

        const actionParams = {

          // -------------------------------------------
          // Inspector-defined action parameters
          // -------------------------------------------

          ...(props?.params &&
          typeof props.params ===
            "object"
            ? props.params
            : {}),


          // -------------------------------------------
          // Canvas action context
          // -------------------------------------------

          targetId:
            props?.targetId ||
            null,

          sourceId:
            elementId,

          sourceType:
            elementType,

          sourceConfoId:
            resolvedMeta?.sourceId ||
            null,

          payload,

        };


        // =============================================
        // PRIMARY ACTION
        // =============================================

        console.log(
          "[CANVAS EVENT → ACTION]",
          {

            action:
              props.action,

            targetId:
              props.targetId ||
              null,

            sourceId:
              elementId,

            sourceType:
              elementType,

            sourceConfoId:
              resolvedMeta?.sourceId ||
              null,

            params:
              actionParams,

            nextActionCount:
              nextActions.length,

          }
        );


        try {

          const result =
            await runAction(
              props.action,
              actionParams
            );


          console.log(
            "[CANVAS PRIMARY ACTION RESULT]",
            {

              action:
                props.action,

              result,

            }
          );


          // =========================================
          // PRIMARY ACTION FAILED
          // =========================================

          if (
            !result?.ok
          ) {

            console.warn(
              "[CANVAS ACTION CHAIN]",
              "Primary action failed - chain stopped",
              {

                action:
                  props.action,

                result,

              }
            );


            return result;

          }


          // =========================================
          // NO CHAIN
          // =========================================

          if (
            nextActions.length ===
              0
          ) {

            return result;

          }


          // =========================================
          // RUN CHAIN
          // =========================================

          if (
            typeof runActionPipeline !==
              "function"
          ) {

            console.error(
              "[CANVAS ACTION CHAIN]",
              "runActionPipeline is not available"
            );


            return {

              ok:
                false,

              error:
                "ACTION_PIPELINE_UNAVAILABLE",

              primaryResult:
                result,

            };

          }


          console.log(
            "[CANVAS ACTION CHAIN]",
            {

              elementId,

              elementType,

              primaryAction:
                props.action,

              nextActions,

            }
          );


          const chainResult =
            await runActionPipeline(
              nextActions,
              {

                // -------------------------------------
                // Values inherited by every chained
                // action.
                // -------------------------------------

                sourceId:
                  elementId,

                sourceType:
                  elementType,

                sourceConfoId:
                  resolvedMeta?.sourceId ||
                  null,

                payload,

                primaryResult:
                  result,

              }
            );


          console.log(
            "[CANVAS ACTION CHAIN COMPLETE]",
            {

              primaryAction:
                props.action,

              primaryResult:
                result,

              chainResult,

            }
          );


          // =========================================
          // RETURN CHAIN RESULT
          // =========================================

          return {

            ok:
              chainResult?.ok !==
                false,

            primaryResult:
              result,

            chainResult,

          };

        }
        catch (
          error
        ) {

          console.error(
            "[CANVAS ACTION ERROR]",
            {

              action:
                props.action,

              error,

            }
          );


          return {

            ok:
              false,

            error:
              error?.message ||
              "CANVAS_ACTION_FAILED",

          };

        }

      },
      [
        elementId,

        elementType,

        props,

        resolvedMeta,

        nextActions,

        runAction,

        runActionPipeline,

      ]
    );


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
  "[CHAIN DEBUG]",
  JSON.stringify(
    {
      elementId,
      elementType,
      action: props?.action || null,
      targetId: props?.targetId || null,
      params: props?.params || null,
      nextActions: props?.nextActions || null,
      rawElementProps: element?.props || null,
    },
    null,
    2
  )
);


  // ===================================================
  // INVALID COMPONENT GUARD
  // ===================================================
  //
  // IMPORTANT:
  //
  // All hooks above execute before this guard.
  //
  // ===================================================

  if (
    !Component ||
    !element
  ) {

    console.warn(
      "[CanvasElementRenderer] Missing Component or element",
      {

        Component,

        element,

      }
    );


    return null;

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <Component

      id={
        elementId
      }

      {...props}

      meta={
        resolvedMeta
      }

      binding={
        binding
      }

      emit={
        emit
      }

    >

      {
        children
      }

    </Component>

  );

}