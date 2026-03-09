// src/components/elements/withActions.js
import React from "react";
import { useActionContext } from "../../context/ActionContext";
import { useCanvasState } from "../../context/CanvasContext";

export default function withActions(WrappedComponent) {
  return function ActionableComponent(props) {
    const actionCtx = useActionContext();
    const { selectedId } = useCanvasState(); // optional if needed for default target

    const emitAction = async (eventName, payload = {}) => {
  if (!actionCtx) return;

  const targetId = props.targetId || props.id || selectedId;

  console.log("[emitAction]", {
    eventName,
    payload,
    targetId,
    elementId: props.id,
  });

  const params = {
    ...payload,
    targetId,
    elementId: props.id,
  };

  // 🔹 Support pipelines OR single actions
  if (Array.isArray(eventName)) {
    await actionCtx.runActionPipeline?.(eventName, actionCtx, params);
  } else {
    await actionCtx.runAction?.(eventName, actionCtx, params);
  }
};

    return <WrappedComponent {...props} emitAction={emitAction} />;
  };
}
