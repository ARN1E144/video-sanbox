import React, { useEffect, useState } from "react";
import { useRuntimeState } from "../../context/RuntimeStateContext";

export default function ChatPanel({ style, bindKey = "chat.messages" }) {
  const runtimeState = useRuntimeState();

  const [messages, setMessages] = useState([]);

  // pull initial state
  useEffect(() => {
    setMessages(runtimeState.get(bindKey) || []);

    return runtimeState.subscribe(bindKey, (value) => {
      setMessages(value || []);
    });
  }, [bindKey, runtimeState]);

  return (
    <div
      className="w-full h-full p-3 overflow-y-auto text-sm"
      style={{
        backgroundColor: style?.backgroundColor || "#222",
        color: style?.color || "#fff",
        borderRadius: style?.borderRadius || 8,
      }}
    >
      {messages.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No messages yet…</div>
      ) : (
        messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            {typeof msg === "string"
              ? msg
              : msg?.text ?? JSON.stringify(msg)}
          </div>
        ))
      )}
    </div>
  );
}