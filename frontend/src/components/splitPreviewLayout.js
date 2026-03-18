import React from "react";
import Canvas from "./Canvas";

export default function SplitPreviewLayout({
  onClientSelect,
  onHostSelect,
  onRequestBackground,
  onRequestDebug,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      {/* CLIENT SIDE */}
      <div style={{ borderRight: "1px solid #222", overflow: "hidden" }}>
        <Canvas
          role="client"
          onSelectedIdChange={onClientSelect}
          onRequestBackground={() => onRequestBackground("client")}
          onRequestDebug={() => onRequestDebug("client")}
        />
      </div>

      {/* HOST SIDE */}
      <div style={{ overflow: "hidden" }}>
        <Canvas
          role="host"
          onSelectedIdChange={onHostSelect}
          onRequestBackground={() => onRequestBackground("host")}
          onRequestDebug={() => onRequestDebug("host")}
        />
      </div>
    </div>
  );
}