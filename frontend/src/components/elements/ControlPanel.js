
import React from "react";

export const CONTROL_PANEL_MAX_BUTTONS = 4;

export default function ControlPanel({
  children,
  layout = "vertical",
  position = "left",
}) {

  /*
  =====================================================
  CONTROL PANEL

  V1 behaviour:

  - Maximum 4 ControlButton children
  - Children fill the available panel width
  - Children share the available panel height
  - Button dimensions are derived from the panel
  - Child positioning is controlled by this component
  - Panel remains visible when empty
  =====================================================
  */

  const childArray =
    React.Children.toArray(children);

  const visibleChildren =
    childArray.slice(
      0,
      CONTROL_PANEL_MAX_BUTTONS
    );

  const buttonCount =
    visibleChildren.length;

  const isHorizontal =
    layout === "horizontal";

  /*
  =====================================================
  BASE PANEL STYLE
  =====================================================
  */

  const panelStyle = {

    /*
    Fill the Rnd element created by Canvas.
    */

    width: "100%",
    height: "100%",

    minWidth: 120,
    minHeight: 80,

    boxSizing: "border-box",

    position: "relative",

    /*
    Make the panel visually obvious on the canvas.
    */

    background:
      "rgba(30, 41, 59, 0.95)",

    border:
      "3px solid #3b82f6",

    borderRadius:
      "16px",

    padding:
      "10px",

    /*
    Child layout.
    */

    display: "flex",

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

    overflow:
      "hidden",
  };

  /*
  =====================================================
  EMPTY PANEL

  The panel must still render visibly when there
  are no children.

  This is particularly important while building
  on the canvas.
  =====================================================
  */

  if (!buttonCount) {

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

              overflow:
                "hidden",
            }}
          >

            {child}

          </div>

        )
      )}

    </div>

  );

}
