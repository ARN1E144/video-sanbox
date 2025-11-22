import React from "react";

export default function AppContainer({ children, style }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: style?.backgroundColor || "#121212",
        color: style?.color || "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        padding: 8,
      }}
    >
      {children}
    </div>
  );
}
