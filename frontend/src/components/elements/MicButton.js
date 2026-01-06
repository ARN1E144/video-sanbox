// src/components/elements/MicButton.js
import React from "react";
import { useActionContext } from "../../context/ActionContext";

export default function MicButton({ label, style }) {
  const actionCtx = useActionContext();

  // Global mic state (set by ToggleMic action)
  const micState = actionCtx.get("micState") || "on";
  const isOn = micState === "on";

  return (
    <button
      className="w-full h-full flex items-center justify-center text-sm font-medium transition"
      style={{
        backgroundColor: style?.backgroundColor || "#7C3AED",
        color: style?.color || "#FFFFFF",
        borderRadius: style?.borderRadius || 8,
        padding: style?.padding || 16,

        // 🔥 Visual feedback
        opacity: isOn ? 1 : 0.5,
        filter: isOn ? "none" : "grayscale(60%)",
      }}
    >
      {isOn ? label || "Mic On" : "Mic Off"}
    </button>
  );
}
