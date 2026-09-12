import React from "react";

export default function Container({
  children,
  style = {},
}) {

  const layout =
    style.layout ||
    "vertical";

  const isHorizontal =
    layout === "horizontal";

  return (

    <div
      style={{
        width:
          style.width ||
          "100%",

        height:
          style.height ||
          "auto",

        minWidth:
          0,

        minHeight:
          0,

        boxSizing:
          "border-box",

        display:
          "flex",

        flexDirection:
          isHorizontal
            ? "row"
            : "column",

        alignItems:
          style.alignItems ||
          "stretch",

        justifyContent:
          style.justifyContent ||
          "flex-start",

        gap:
          style.gap ??
          8,

        padding:
          style.padding ??
          0,

        backgroundColor:
          style.backgroundColor ||
          "rgba(255,255,255,0.05)",

        borderRadius:
          style.borderRadius ??
          0,

        border:
          style.border ||
          "1px dashed rgba(255,255,255,0.12)",

        position:
          "relative",

        overflow:
          style.overflow ||
          "visible",

        ...style,
      }}
    >

      {children}

    </div>

  );

}