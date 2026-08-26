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


export default function CanvasElementRenderer({
  Component,
  element,
  binding,
  children,
}) {

  // =====================================================
  // SAFE ELEMENT VALUES
  // =====================================================

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


  // =====================================================
  // RUNTIME PROPS
  // =====================================================

  const props =
    useRuntimeProps(
      elementProps
    );


  // =====================================================
  // ACTION CONTEXT
  // =====================================================

  const {
    runAction,
  } =
    useActionContext();


  // =====================================================
  // ELEMENT META
  // =====================================================
  //
  // IMPORTANT:
  //
  // The installer preserves:
  //
  // meta.sourceId
  //
  // The renderer must pass it through to the actual
  // component.
  //
  // =====================================================

  const resolvedMeta =
    useMemo(
      () => ({
        ...(safeElement.meta || {}),
      }),
      [
        safeElement.meta,
      ]
    );


  // =====================================================
  // EVENT → ACTION BRIDGE
  // =====================================================

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


        // ===============================================
        // ACTION EVENT
        // ===============================================

        if (
          eventName === "onClick" &&
          props.action
        ) {

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

              sourceConfoId:
                resolvedMeta?.sourceId ||
                null,

            }
          );


          try {

            const result =
              await runAction(
                props.action,
                {

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

                  payload,

                }
              );


            console.log(
              "[CANVAS ACTION RESULT]",
              {

                action:
                  props.action,

                result,

              }
            );


            return result;

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

        }


        // ===============================================
        // NO ACTION
        // ===============================================

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

      },
      [
        elementId,
        elementType,
        props,
        resolvedMeta,
        runAction,
      ]
    );


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "[CanvasElementRenderer] RESOLVED COMPONENT",
    {

      elementId,

      elementType,

      sourceId:
        resolvedMeta?.sourceId ||
        null,

      ComponentName:
        Component?.displayName ||
        Component?.name ||
        "UNKNOWN",

      props,

      binding,

      meta:
        resolvedMeta,

    }
  );


  // =====================================================
  // INVALID COMPONENT GUARD
  //
  // IMPORTANT:
  //
  // This happens AFTER all hooks have been called.
  // =====================================================

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


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <Component

      // Generated installed Canvas ID
      id={
        elementId
      }


      // Runtime-resolved props
      {...props}


      // Installed metadata
      meta={
        resolvedMeta
      }


      // Existing binding
      binding={
        binding
      }


      // Event bridge
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