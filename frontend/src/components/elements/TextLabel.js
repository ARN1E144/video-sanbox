import React from "react";

export default function TextLabel({ label, style }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        color: style?.color || "#fff",
        fontSize: style?.fontSize || 16,
        textAlign: style?.textAlign || "center",
      }}
    >
      {label || "Text Label"}
    </div>
  );
}
