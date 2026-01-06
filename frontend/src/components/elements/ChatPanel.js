// src/components/elements/ChatPanel.js
import React from "react";

export default function ChatPanel({ style, items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div
      className="w-full h-full p-3 overflow-y-auto text-sm"
      style={{
        backgroundColor: style?.backgroundColor || "#222",
        color: style?.color || "#fff",
        borderRadius: style?.borderRadius || 8,
      }}
    >
      {list.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No messages yet…</div>
      ) : (
        list.map((msg, i) => (
          <div key={i} style={{ marginBottom: 6, lineHeight: 1.25 }}>
            {typeof msg === "string" ? msg : msg?.text ?? JSON.stringify(msg)}
          </div>
        ))
      )}
    </div>
  );
}
