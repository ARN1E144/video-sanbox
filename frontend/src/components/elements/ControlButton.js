// src/components/elements/ControlButton.js
import React from "react";

export default function ControlButton(props) {
  const { label = "Button", style } = props;

  return (
    <button
      type="button"
      className="w-full h-full flex items-center justify-center text-sm font-medium transition hover:opacity-90"
      style={style}
    >
      {label || "Button"}
    </button>
  );
}
