import React from "react";
import { runAction } from "../../utils/actionExecutor";

export default function ControlButton({
  label,
  style,
  onClickAction,
  apiUrl,
  apiMethod,
  apiHeaders,
  apiTarget,         // ✅ destructured properly
  apiTargetField,    // ✅ added
}) {
  console.log("🧩 ControlButton rendered", { label });

  const handleClick = () => {
    runAction(onClickAction, {
      label,
      url: apiUrl,
      method: apiMethod,
      headers: apiHeaders,
      targetId: apiTarget,
      targetField: apiTargetField,  // ✅ now defined
    });
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
