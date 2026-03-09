// src/components/elements/ControlButton.js
import React from "react";
import { emitEvent } from "../../utils/eventEmitter";

export default function ControlButton(props) {
  const { label = "Button" } = props;

  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={() => {
        emitEvent(props, "onClick"); // 🚀 Emit the event
      }}
    >
      {label}
    </button>
  );
}

