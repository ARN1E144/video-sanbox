import React from "react";

export default function VideoFeed({ label, style }) {
  return (
    <div
      className="flex items-center justify-center w-full h-full text-white font-medium"
      style={{
        backgroundColor: style?.backgroundColor || "#1e1e1e",
        borderRadius: style?.borderRadius || 8,
        color: style?.color || "#fff",
      }}
    >
      {label || "🎥 Video Feed"}
    </div>
  );
}
