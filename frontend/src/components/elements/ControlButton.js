
import React from "react";

import { useActionContext } from "../../context/ActionContext";

export default function ControlButton(props) {

  const {
    label = "Button",
    action,
    targetId
  } = props;

  const {
    runAction
  } = useActionContext();

  const handleClick = async () => {

    if (!action) {

      console.warn(
        "[ControlButton] No action configured",
        {
          label
        }
      );

      return;
    }

    console.log(
      "[CANVAS EVENT → ACTION]",
      {
        action,
        targetId
      }
    );

    await runAction(
      action,
      {
        targetId
      }
    );

  };

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
