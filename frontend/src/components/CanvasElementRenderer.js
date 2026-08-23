// src/components/CanvasElementRenderer.js

import React, { useCallback } from "react";

import { useRuntimeProps } from "../hooks/useRuntimeProps";
import { useActionContext } from "../context/ActionContext";

export default function CanvasElementRenderer({
  Component,
  element,
  binding,
  children,
}) {

  const props = useRuntimeProps(
    element?.props || {}
  );

  const {
    runAction,
  } = useActionContext();

  // =====================================================
  // EVENT → ACTION BRIDGE
  // =====================================================

  const emit = useCallback(
    async (
      eventName,
      payload = {}
    ) => {

      console.log(
        "[CANVAS EVENT]",
        {
          elementId:
            element.id,

          elementType:
            element.type,

          eventName,

          props,

          payload,
        }
      );

      // -------------------------------------------------
      // ACTION EVENT
      // -------------------------------------------------

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
                  element.id,

                sourceType:
                  element.type,

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
        catch (error) {

          console.error(
            "[CANVAS ACTION ERROR]",
            {
              action:
                props.action,

              error,
            }
          );

        }

      }

      // -------------------------------------------------
      // NO ACTION
      // -------------------------------------------------

      console.log(
        "[CANVAS EVENT]",
        "No action configured for event",
        {
          eventName,

          elementId:
            element.id,
        }
      );

    },
    [
      element.id,
      element.type,
      props,
      runAction,
    ]
  );

    console.log(
    "[CanvasElementRenderer] RESOLVED COMPONENT",
    {
        elementId: element?.id,
        elementType: element?.type,
        ComponentName:
        Component?.displayName ||
        Component?.name ||
        "UNKNOWN",
    }
    );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Component
      id={element.id}

      {...props}

      binding={binding}

      emit={emit}
    >
      {children}
    </Component>
  );
}