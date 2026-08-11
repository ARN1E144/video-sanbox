import React from "react";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";

export default function AvailableCallsDebug({
  element,
  binding,
}) {
  const calls =
    useRuntimeValue("calls.available") || [];

  console.log(
    "🔥 AvailableCallsDebug",
    {
      count: calls.length,
      calls,
      binding,
    }
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 150,
        background: "#111827",
        color: "#fff",
        padding: 16,
        boxSizing: "border-box",
        overflow: "auto",
        border: "1px solid #374151",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 12,
          color: "#22c55e",
        }}
      >
        Available Calls: {calls.length}
      </div>

      {calls.length === 0 ? (
        <div style={{ color: "#9ca3af" }}>
          No available calls
        </div>
      ) : (
        calls.map((call, index) => (
          <div
            key={call.id || index}
            style={{
              padding: 8,
              marginBottom: 6,
              background: "#1f2937",
              borderRadius: 6,
            }}
          >
            <div>
              <strong>
                {call.channel || "Unknown channel"}
              </strong>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              ID: {call.id || "—"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              State: {call.state || "—"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}