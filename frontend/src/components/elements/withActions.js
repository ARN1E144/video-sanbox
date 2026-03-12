import React from "react";
import { runAction } from "../../utils/actionExecutor";
import { useActionContext } from "../../context/ActionContext";

export default function withActions(Component) {

  return function ActionWrapped(props) {

    const actionCtx = useActionContext();

    const emitAction = (action, params = {}) => {

      console.log("[emitAction]", action);

      runAction(action, actionCtx, {
        ...params,
        id: props.id,
        targetId: props.id
      });

    };

    return (
      <Component
        {...props}
        emitAction={emitAction}
      />
    );

  };
}