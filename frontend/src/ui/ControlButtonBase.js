import React from "react";
import * as Icons from "lucide-react";

export default function ControlButtonBase({
  icon,
  onClick,
  label,
  active = false,
}) {
  const Icon = Icons?.[icon] || Icons.Circle;

  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,

        background: "#111",   // 🔥 FIX WHITE-ON-WHITE ISSUE
        color: "#fff",

        border: "1px solid #333",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        cursor: "pointer",

        // optional but useful for V1 clarity
        transition: "transform 0.08s ease, background 0.15s ease",
      }}
    >
      <Icon size={18} color="#fff" />
    </button>
  );
}