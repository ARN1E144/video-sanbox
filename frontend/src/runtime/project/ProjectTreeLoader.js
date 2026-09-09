// src/runtime/project/ProjectTreeLoader.js

/*
========================================================
PROJECT TREE → CANVAS ELEMENTS
========================================================

Project tree:

App
├── AgoraFeed
├── ControlPanel
│   ├── ControlButton
│   └── ControlButton
└── ChatPanel

becomes Canvas elements:

AgoraFeed
  parentId: null

ControlPanel
  parentId: null

ControlButton
  parentId: ControlPanel.id

ControlButton
  parentId: ControlPanel.id

ChatPanel
  parentId: null


IMPORTANT:

App is a logical project root.

It is NOT a Canvas element.

Real components such as Container / ControlPanel
ARE Canvas elements.

This loader is responsible for:

- flattening the project tree
- preserving hierarchy
- resolving default sizes
- calculating default positions
- respecting explicit x/y/width/height
- respecting vertical/horizontal/grid layout

It does NOT:

- modify the source Confo
- install the Confo
- render components
========================================================
*/


// =====================================================
// DEFAULT ELEMENT SIZES
// =====================================================

const DEFAULT_ELEMENT_SIZE = {

  App: {
    width: 1440,
    height: 900,
  },

  Container: {
    width: 1000,
    height: 700,
  },

  AgoraFeed: {
    width: 800,
    height: 450,
  },

  ControlPanel: {
    width: 300,
    height: 120,
  },

  ControlButton: {
    width: 140,
    height: 44,
  },

  Text: {
    width: 250,
    height: 50,
  },

  TextLabel: {
    width: 320,
    height: 50,
  },

  TextBox: {
    width: 400,
    height: 44,
  },

  Select: {
    width: 260,
    height: 44,
  },

  ChatPanel: {
    width: 300,
    height: 300,
  },

  VideoFeed: {
    width: 800,
    height: 450,
  },

  AvailabilityButton: {
    width: 160,
    height: 44,
  },

  MicButton: {
    width: 140,
    height: 44,
  },

  FileUpload: {
    width: 300,
    height: 80,
  },

  ComplianceEvidence: {
    width: 600,
    height: 300,
  },

  default: {
    width: 300,
    height: 150,
  },

};


// =====================================================
// LAYOUT DEFAULTS
// =====================================================

const DEFAULT_START_X = 40;

const DEFAULT_START_Y = 20;

const DEFAULT_LAYOUT_GAP = 12;

const DEFAULT_CONTAINER_PADDING = 20;

const DEFAULT_GRID_COLUMNS = 2;

const DEFAULT_GRID_COLUMN_GAP = 20;

const DEFAULT_GRID_ROW_GAP = 20;


// =====================================================
// NORMALISE LAYOUT
// =====================================================

function normaliseLayout(
  value
) {

  if (
    typeof value !== "string"
  ) {

    return "vertical";

  }


  const layout =
    value.toLowerCase();


  if (
    layout === "horizontal"
  ) {

    return "horizontal";

  }


  if (
    layout === "grid"
  ) {

    return "grid";

  }


  return "vertical";

}


// =====================================================
// GET DEFAULT SIZE
// =====================================================

function getDefaultSize(
  type
) {

  return (
    DEFAULT_ELEMENT_SIZE[type] ||
    DEFAULT_ELEMENT_SIZE.default
  );

}


// =====================================================
// RESOLVE NODE SIZE
// =====================================================

function resolveSize(
  node
) {

  const defaults =
    getDefaultSize(
      node?.type
    );


  return {

    width:
      node?.width ??
      defaults.width,

    height:
      node?.height ??
      defaults.height,

  };

}


// =====================================================
// CREATE ELEMENT
// =====================================================

function createElement(
  node,
  {
    x,
    y,
    parentId,
  }
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  const size =
    resolveSize(
      node
    );


  const element = {

    // -------------------------------------------------
    // ID
    // -------------------------------------------------

    id:
      node.id ||
      `${node.type || "element"}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`,

    // -------------------------------------------------
    // TYPE
    // -------------------------------------------------

    type:
      node.type ||
      "Text",

    // -------------------------------------------------
    // HIERARCHY
    // -------------------------------------------------

    parentId:
      parentId ??
      null,

    // -------------------------------------------------
    // POSITION
    //
    // Explicit Confo/project coordinates win.
    // Calculated coordinates are supplied by the
    // layout engine.
    // -------------------------------------------------

    x:
      node.x ??
      x,

    y:
      node.y ??
      y,

    // -------------------------------------------------
    // SIZE
    // -------------------------------------------------

    width:
      size.width,

    height:
      size.height,

    // -------------------------------------------------
    // PROPS
    // -------------------------------------------------

    props: {
      ...(node.props || {}),
    },

    // -------------------------------------------------
    // META
    // -------------------------------------------------

    meta: {

      ...(node.meta || {}),

      source:
        node.meta?.source ||
        "project-tree",

    },

  };


  // ---------------------------------------------------
  // Preserve explicit role
  // ---------------------------------------------------

  if (
    node.role !== undefined
  ) {

    element.role =
      node.role;

  }


  return element;

}


// =====================================================
// POSITION HELPERS
// =====================================================

function resolvePosition(
  node,
  fallback
) {

  return {

    x:
      node?.x ??
      fallback.x,

    y:
      node?.y ??
      fallback.y,

  };

}


// =====================================================
// LAYOUT CHILDREN
// =====================================================

function layoutChildren(
  children,
  {
    parentId,
    originX,
    originY,
    parentWidth,
    parentLayout,
    result,
  }
) {

  if (
    !Array.isArray(children) ||
    children.length === 0
  ) {

    return;

  }


  const layout =
    normaliseLayout(
      parentLayout
    );


  const padding =
    DEFAULT_CONTAINER_PADDING;


  // ===================================================
  // VERTICAL
  // ===================================================

  if (
    layout === "vertical"
  ) {

    let currentY =
      originY +
      padding;


    children.forEach(
      child => {

        if (
          !child ||
          typeof child !== "object"
        ) {

          return;

        }


        const childSize =
          resolveSize(
            child
          );


        const fallback =
          {
            x:
              originX +
              padding,

            y:
              currentY,

          };


        const position =
          resolvePosition(
            child,
            fallback
          );


        processNode(
          child,
          {
            parentId,

            fallbackX:
              position.x,

            fallbackY:
              position.y,

            result,

          }
        );


        const created =
          result[
            result.length - 1
          ];


        if (
          created
        ) {

          currentY =
            Math.max(
              currentY,
              created.y +
              created.height +
              DEFAULT_LAYOUT_GAP
            );

        }
        else {

          currentY +=
            childSize.height +
            DEFAULT_LAYOUT_GAP;

        }

      }
    );

    return;

  }


  // ===================================================
  // HORIZONTAL
  // ===================================================

  if (
    layout === "horizontal"
  ) {

    let currentX =
      originX +
      padding;


    let currentY =
      originY +
      padding;


    children.forEach(
      child => {

        if (
          !child ||
          typeof child !== "object"
        ) {

          return;

        }


        const childSize =
          resolveSize(
            child
          );


        const fallback =
          {
            x:
              currentX,

            y:
              currentY,

          };


        const position =
          resolvePosition(
            child,
            fallback
          );


        processNode(
          child,
          {
            parentId,

            fallbackX:
              position.x,

            fallbackY:
              position.y,

            result,

          }
        );


        const created =
          result[
            result.length - 1
          ];


        if (
          created
        ) {

          currentX =
            Math.max(
              currentX,
              created.x +
              created.width +
              DEFAULT_LAYOUT_GAP
            );

        }
        else {

          currentX +=
            childSize.width +
            DEFAULT_LAYOUT_GAP;

        }

      }
    );

    return;

  }


  // ===================================================
  // GRID
  // ===================================================

  if (
    layout === "grid"
  ) {

    const columns =
      DEFAULT_GRID_COLUMNS;


    const usableWidth =
      Math.max(
        parentWidth -
          (
            padding * 2
          ) -
          (
            DEFAULT_GRID_COLUMN_GAP *
            (columns - 1)
          ),

        200
      );


    const columnWidth =
      usableWidth /
      columns;


    children.forEach(
      (
        child,
        index
      ) => {

        if (
          !child ||
          typeof child !== "object"
        ) {

          return;

        }


        const column =
          index %
          columns;


        const row =
          Math.floor(
            index /
            columns
          );


        const fallback =
          {
            x:
              originX +
              padding +
              (
                column *
                (
                  columnWidth +
                  DEFAULT_GRID_COLUMN_GAP
                )
              ),

            y:
              originY +
              padding +
              (
                row *
                (
                  resolveSize(
                    child
                  ).height +
                  DEFAULT_GRID_ROW_GAP
                )
              ),

          };


        const position =
          resolvePosition(
            child,
            fallback
          );


        processNode(
          child,
          {
            parentId,

            fallbackX:
              position.x,

            fallbackY:
              position.y,

            result,

          }
        );

      }
    );

  }

}


// =====================================================
// PROCESS NODE
// =====================================================

function processNode(
  node,
  {
    parentId = null,
    fallbackX = DEFAULT_START_X,
    fallbackY = DEFAULT_START_Y,
    result,
  }
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return;

  }


  // ===================================================
  // APP ROOT
  // ===================================================

  if (
    node.type === "App"
  ) {

    const rootLayout =
      node.props?.layout ||
      node.meta?.confoLayout ||
      "vertical";


    layoutChildren(
      node.children,
      {
        parentId:
          null,

        originX:
          fallbackX,

        originY:
          fallbackY,

        parentWidth:
          node.width ??
          DEFAULT_ELEMENT_SIZE.App.width,

        parentLayout:
          rootLayout,

        result,
      }
    );


    return;

  }


  // ===================================================
  // REAL CANVAS ELEMENT
  // ===================================================

  const element =
    createElement(
      node,
      {
        x:
          fallbackX,

        y:
          fallbackY,

        parentId,
      }
    );


  if (!element) {

    return;

  }


  result.push(
    element
  );


  // ===================================================
  // CHILDREN
  // ===================================================

  if (
    Array.isArray(
      node.children
    ) &&
    node.children.length > 0
  ) {

    const childLayout =
      node.props?.layout ||
      node.meta?.layout ||
      "vertical";


    layoutChildren(
      node.children,
      {
        parentId:
          element.id,

        originX:
          element.x,

        originY:
          element.y,

        parentWidth:
          element.width,

        parentLayout:
          childLayout,

        result,
      }
    );

  }

}


// =====================================================
// FLATTEN TREE
// =====================================================

function flattenTree(
  tree
) {

  const result =
    [];


  processNode(
    tree,
    {
      parentId:
        null,

      fallbackX:
        DEFAULT_START_X,

      fallbackY:
        DEFAULT_START_Y,

      result,

    }
  );


  return result;

}


// =====================================================
// PUBLIC API
// =====================================================

export function projectTreeToElements(
  tree
) {

  if (
    !tree ||
    typeof tree !== "object"
  ) {

    return [];

  }


  const result =
    flattenTree(
      tree
    );


  console.log(
    "[ProjectTreeLoader] Tree → Elements",
    result.map(
      element => ({
        id:
          element.id,

        type:
          element.type,

        parentId:
          element.parentId,

        x:
          element.x,

        y:
          element.y,

        width:
          element.width,

        height:
          element.height,
      })
    )
  );


  return result;

}


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  projectTreeToElements,
};