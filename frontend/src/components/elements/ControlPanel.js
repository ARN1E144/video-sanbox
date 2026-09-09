import React from "react";

export const CONTROL_PANEL_MAX_CONTROLS = 6;

export default function ControlPanel({
  children,
  layout = "vertical",
  position = "left",
}) {

  /*
  =====================================================
  CONTROL PANEL

  V1 behaviour:

  - Supports generic control children
  - Maximum 6 controls
  - Children share available space
  - Horizontal and vertical layouts
  - Panel remains visible when empty
  - Does not clip child controls
  =====================================================
  */

  const childArray =
    React.Children.toArray(children);

  const visibleChildren =
    childArray.slice(
      0,
      CONTROL_PANEL_MAX_CONTROLS
    );

  const controlCount =
    visibleChildren.length;

  const isHorizontal =
    layout === "horizontal";

  /*
  =====================================================
  BASE PANEL STYLE
  =====================================================
  */

  const panelStyle = {

    width: "100%",
    height: "100%",

    minWidth: 120,
    minHeight: 80,

    boxSizing: "border-box",

    position: "relative",

    background:
      "rgba(30, 41, 59, 0.95)",

    border:
      "3px solid #3b82f6",

    borderRadius:
      "16px",

    padding:
      "10px",

    display:
      "flex",

    flexDirection:
      isHorizontal
        ? "row"
        : "column",

    gap:
      8,

    alignItems:
      "stretch",

    justifyContent:
      "stretch",

    /*
    Do not clip controls such as Select,
    dropdowns, inputs, etc.
    */

    overflow:
      "visible",
  };

  /*
  =====================================================
  EMPTY PANEL
  =====================================================
  */

  if (!controlCount) {

    return (

      <div
        style={panelStyle}
      >

        <div
          style={{
            width: "100%",
            height: "100%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            color:
              "#94a3b8",

            fontSize:
              "13px",

            fontFamily:
              "system-ui, sans-serif",

            textAlign:
              "center",

            userSelect:
              "none",
          }}
        >

          Control Panel

        </div>

      </div>

    );

  }

  /*
  =====================================================
  PANEL WITH CONTROLS
  =====================================================
  */

  return (

    <div
      style={panelStyle}
    >

      {visibleChildren.map(
        (child, index) => (

          <div
            key={
              child?.key ??
              `control-${index}`
            }

            style={{
              flex:
                "1 1 0",

              minWidth:
                0,

              minHeight:
                0,

              width:
                isHorizontal
                  ? undefined
                  : "100%",

              height:
                isHorizontal
                  ? "100%"
                  : undefined,

              display:
                "flex",

              alignItems:
                "stretch",

              justifyContent:
                "stretch",

              boxSizing:
                "border-box",

              /*
              Do not clip child controls.
              */

              overflow:
                "visible",
            }}
          >

            {child}

          </div>

        )
      )}

    </div>

  );

}