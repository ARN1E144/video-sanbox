import React from "react";

export default function ControlButton({ label, style }) {
  return (
    <button
      className="w-full h-full flex items-center justify-center text-sm font-medium"
      style={{
        backgroundColor: style?.backgroundColor || "#6b46c1",
        color: style?.color || "#fff",
        borderRadius: style?.borderRadius || 8,
        padding: "6px 12px",
      }}
    >
      {label || "Button"}
    </button>
  );
}
