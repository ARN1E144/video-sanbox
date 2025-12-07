// src/components/elements/ControlButton.js
import React from "react";
import { runAction } from "../../utils/actionExecutor";
import { useActionContext } from "../../context/ActionContext";

export default function ControlButton(props) {
  const {
    // note: Canvas does *not* pass id into props by default,
    // so this will usually be undefined – that's fine.
    id,
    label = "Button",
    style,

    // “New” inspector-style props
    onClick,          // "navigate" | "toggle" | "api" | "custom" | ...
    endpoint,
    target,           // e.g. target screen for navigate
    targetId,
    condition,
    method,
    headers,
    customCode,
    body,
    targetField,      // new unified prop for API result
    responsePath,     // optional nested path

    // Auth-related props
    apiIncludeAuth,
    apiAuthScheme,
    apiAuthToken,

    // Legacy props (fallbacks)
    onClickAction,
    apiUrl,
    apiMethod,
    apiHeaders,
    apiTarget,
    apiTargetField,
    apiResponsePath,
  } = props;

  const actionCtx = useActionContext();

  // Prefer new inspector props but keep backward compatibility
  const actionName = onClick || onClickAction || "";
  const url = endpoint || apiUrl || "";
  const httpMethod = method || apiMethod || "GET";
  const httpHeaders = headers || apiHeaders;
  const targetElementId = targetId || apiTarget || "";
  const finalTargetField =
    targetField || apiTargetField || props.targetField || "";
  const finalResponsePath = responsePath || apiResponsePath || "";

  const handleClick = async () => {
    if (!actionName) {
      console.log("⚠️ ControlButton clicked but no action configured");
      return;
    }

    try {
      await runAction(actionName, actionCtx, {
        // base props (for "toggle" etc.)
        ...props,

        elementId: id,
        label,

        // navigation
        targetScreen: target,

        // toggle / api
        targetId: targetElementId,
        targetField: finalTargetField,
        condition,

        // API specifics
        url,
        endpoint,
        apiUrl,
        method: httpMethod,
        headers: httpHeaders,
        body,
        responsePath: finalResponsePath,

        // Auth
        apiIncludeAuth,
        apiAuthScheme,
        apiAuthToken,

        // custom JS
        customCode,
      });
    } catch (err) {
      console.error("Action failed:", err);
      if (actionCtx?.notify) {
        actionCtx.notify(
          `Action "${actionName}" failed: ${err.message || "Unknown error"}`
        );
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full h-full flex items-center justify-center text-sm font-medium transition hover:opacity-90"
      style={style}
    >
      {label || "Button"}
    </button>
  );
}
