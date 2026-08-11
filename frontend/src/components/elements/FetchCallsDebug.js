import React from "react";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";

export default function FetchCallsDebug({
  element,
  binding,
}) {
  const calls =
    useRuntimeValue("calls.available") || [];

  console.log(
    "🔥 FetchCallsDebug",
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
            key={call._id || call.id || index}
            style={{
              padding: 10,
              marginBottom: 8,
              background: "#1f2937",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#60a5fa",
              }}
            >
              {call.channelName || "Unknown channel"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              Status: {call.status || "—"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              Client:{" "}
              {call.client
                ? `${call.client.firstName || ""} ${
                    call.client.lastName || ""
                  }`.trim()
                : "—"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              Call ID: {call._id || "—"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}