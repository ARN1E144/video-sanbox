import React from "react";
import * as Elements from "../../components/elements"; // adjust if your actual components live elsewhere

export default function ElementPreview({ type, props = {} }) {
  const Component = Elements[type];
  if (!Component) {
    return (
      <div
        style={{
          padding: 10,
          background: "#222",
          color: "#aaa",
          border: "1px solid #444",
          borderRadius: 4,
        }}
      >
        Unknown element: {type}
      </div>
    );
  }

  // Wrap real component inside a safe preview box
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #333",
        borderRadius: 8,
        overflow: "hidden",
        background: "#0f0f0f",
        margin: 6,
        minHeight: 60,
      }}
    >
      <Component {...props} />
    </div>
  );
}
