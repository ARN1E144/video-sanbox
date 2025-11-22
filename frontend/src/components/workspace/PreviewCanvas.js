import React from "react";
import ElementPreview from "./ElementPreview";

export default function PreviewCanvas({ zoom }) {
  const elements = [
    { type: "AppBar", props: { label: "App Header" } },
    { type: "MicButton", props: { label: "Record" } },
    { type: "TextLabel", props: { text: "Hello world" } },
  ];

  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        border: "1px solid #333",
        margin: 12,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top center",
        padding: 20,
        minHeight: 500,
      }}
    >
      {elements.map((el, i) => (
        <ElementPreview key={i} {...el} />
      ))}
    </div>
  );
}
