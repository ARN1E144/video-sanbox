import React from "react";

export default function Container({ style }) {
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor: style?.backgroundColor || "#333",
        borderRadius: style?.borderRadius || 12,
      }}
    ></div>
  );
}
