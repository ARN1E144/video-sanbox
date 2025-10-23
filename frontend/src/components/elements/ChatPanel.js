import React from "react";

export default function ChatPanel({ style }) {
  return (
    <div
      className="w-full h-full p-3 overflow-y-auto text-sm"
      style={{
        backgroundColor: style?.backgroundColor || "#222",
        color: style?.color || "#fff",
        borderRadius: style?.borderRadius || 8,
      }}
    >
      <div>Hello!</div>
      <div>👋 Hi!</div>
      <div>How are you?</div>
    </div>
  );
}
