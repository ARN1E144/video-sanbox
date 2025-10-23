import React from "react";

export default function AppBar({ label, style }) {
  return (
    <div
      className="w-full h-full flex items-center px-4"
      style={{
        backgroundColor: style?.backgroundColor || "#000",
        color: style?.color || "#fff",
        fontWeight: "600",
        fontSize: style?.fontSize || 18,
      }}
    >
      {label || "App Header"}
    </div>
  );
}
