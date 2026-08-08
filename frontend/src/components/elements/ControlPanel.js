import React from "react";

export default function ControlPanel({
  layout = "horizontal",
  position = "bottom",
  style = {},
  children,
}) {

  const flexDirection =
    layout === "vertical"
      ? "column"
      : "row";

  return (
    <div
      style={{
        display: "flex",

        flexDirection,

        gap: 8,

        padding: 10,

        boxSizing: "border-box",

        width: "fit-content",

        minHeight: 48,

        backgroundColor: "rgba(20, 20, 20, 0.92)",

        border: "1px solid #555",

        borderRadius: 10,

        alignItems: "center",

        position: "relative",

        ...style,
      }}
    >
      {children}
    </div>
  );
}