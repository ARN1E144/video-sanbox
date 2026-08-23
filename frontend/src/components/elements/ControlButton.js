
import React from "react";

import { useActionContext } from "../../context/ActionContext";

export default function ControlButton(props) {

  const {
    label = "Button",
    action,
    targetId,
    params = {},
  } = props;

  const {
    runAction,
  } = useActionContext();

  const handleClick = async () => {

    if (!action) {
      console.warn(
        "[ControlButton] No action configured",
        { label }
      );
      return;
    }

    const actionParams = {
      ...params,
      targetId,
    };

    console.log(
      "[CANVAS EVENT → ACTION]",
      {
        action,
        targetId,
        params: actionParams,
      }
    );

    await runAction(
      action,
      actionParams
    );
  };

   console.log(
    "[ControlButton PROPS]",
    {
      label,
      action,
      targetId,
      params
    }
  );

  return (
    <button
      className="
        w-full
        h-full
        px-4
        py-2
        bg-blue-500
        text-white
        rounded
      "
      onClick={handleClick}
    >
      {label}
    </button>
  );
}
