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
      typeof action === "object" &&
      typeof action.type === "string" &&
      action.type.trim()
  );

}


// =====================================================
// RESOLVE COMPONENT
// =====================================================
//
// Canvas normally passes:
//
//   Component = entry.component
//
// However, this renderer is deliberately tolerant of:
//
//   Component = function
//
// or:
//
//   Component = {
//     component: function,
//     contract: ...
//   }
//
// This prevents a registry-entry object from ever being
// handed directly to React.
//
// =====================================================

function resolveComponent(
  value
) {

  // ---------------------------------------------------
  // Already a React component
  // ---------------------------------------------------

  if (
    typeof value === "function"
  ) {

    return value;

  }


  // ---------------------------------------------------
  // Registry entry
  // ---------------------------------------------------

  if (
    value &&
    typeof value === "object" &&
    typeof value.component === "function"
  ) {

    return value.component;

  }


  // ---------------------------------------------------
  // Invalid
  // ---------------------------------------------------

  return null;

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
    safeElement.props &&
    typeof safeElement.props === "object"
      ? safeElement.props
      : {};


  // ===================================================
  // RESOLVE COMPONENT
  // ===================================================

  const ResolvedComponent =
    useMemo(
      () =>
        resolveComponent(
          Component
        ),
      [
        Component,
      ]
    );


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

            payload,

          }
        );


        // =============================================
        // NO ACTION CONFIGURED
        // =============================================

        if (
          eventName !== "onClick"
        ) {

          return {

            ok:
              true,

            skipped:
              true,

            reason:
              "UNHANDLED_EVENT",

          };

        }


        if (
          !props?.action
        ) {

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
        // ACTION PARAMS
        // =============================================

        const actionParams = {

          // -------------------------------------------
          // Inspector-defined parameters
          // -------------------------------------------

          ...(props?.params &&
          typeof props.params === "object"
            ? props.params
            : {}),


          // -------------------------------------------
          // Runtime canvas context
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


        console.log(
          "[CANVAS EVENT → ACTION]",
          {

            action:
              props.action,

            targetId:
              actionParams.targetId,

            sourceId:
              elementId,

            sourceType:
              elementType,

            sourceConfoId:
              actionParams.sourceConfoId,

            params:
              actionParams,

            nextActions,

          }
        );


        // =============================================
        // PRIMARY ACTION
        // =============================================

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


          // -------------------------------------------
          // STOP ON FAILURE
          // -------------------------------------------

          if (
            !result?.ok
          ) {

            console.log(
              "[DEBUG] FULL PRIMARY ACTION FAILURE",
              JSON.stringify(
                result,
                null,
                2
              )
            );

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


          // -------------------------------------------
          // NO NEXT ACTIONS
          // -------------------------------------------

          if (
            nextActions.length === 0
          ) {

            return result;

          }


          // -------------------------------------------
          // PIPELINE UNAVAILABLE
          // -------------------------------------------

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


          // -------------------------------------------
          // RUN NEXT ACTION PIPELINE
          // -------------------------------------------

          const chainResult =
            await runActionPipeline(
              nextActions,
              {

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


          return {

            ok:
              chainResult?.ok !== false,

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
  // COMPONENT DEBUG
  // ===================================================

  console.log(
    "[CanvasElementRenderer]",
    {

      elementId,

      elementType,

      originalComponentType:
        typeof Component,

      resolvedComponentType:
        typeof ResolvedComponent,

      componentIsFunction:
        typeof ResolvedComponent ===
          "function",

      componentName:
        ResolvedComponent?.displayName ||
        ResolvedComponent?.name ||
        null,

      action:
        props?.action ||
        null,

      targetId:
        props?.targetId ||
        null,

    }
  );


  // ===================================================
  // INVALID ELEMENT
  // ===================================================

  if (
    !safeElement ||
    !element
  ) {

    console.warn(
      "[CanvasElementRenderer] Missing element",
      {
        element,
      }
    );


    return null;

  }


  // ===================================================
  // INVALID COMPONENT
  // ===================================================

  if (
    typeof ResolvedComponent !==
      "function"
  ) {

    console.error(
      "[CanvasElementRenderer] Invalid component",
      {

        elementId,

        elementType,

        originalComponent:
          Component,

        originalComponentType:
          typeof Component,

        resolvedComponent:
          ResolvedComponent,

        resolvedComponentType:
          typeof ResolvedComponent,

      }
    );


    return (

      <div
        style={{

          width:
            "100%",

          height:
            "100%",

          minHeight:
            40,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          boxSizing:
            "border-box",

          border:
            "1px solid #7f1d1d",

          background:
            "#2a1111",

          color:
            "#fca5a5",

          padding:
            12,

          fontSize:
            11,

          textAlign:
            "center",

        }}
      >

        Invalid component:
        {" "}
        {elementType || "Unknown"}

      </div>

    );

  }


  // ===================================================
  // COMPONENT PROPS
  // ===================================================
  //
  // IMPORTANT:
  //
  // These props belong to the React component.
  //
  // The component itself is responsible for deciding
  // which props belong on its DOM and which do not.
  //
  // ===================================================

  const componentProps = {

    id:
      elementId,

    ...props,

    meta:
      resolvedMeta,

    binding:
      binding,

    emit:
      emit,

  };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <ResolvedComponent
      {...componentProps}
    >

      {
        children
      }

    </ResolvedComponent>

  );

}
