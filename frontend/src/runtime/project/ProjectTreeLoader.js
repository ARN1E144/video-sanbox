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

POSITION CONTRACT:

Top-level element:

  x/y = relative to Canvas stage

Child element:

  x/y = relative to immediate parent

This matches Canvas.js where child elements are rendered
inside their parent's coordinate space.

This loader is responsible for:

- flattening the project tree
- preserving hierarchy
- resolving default sizes
- calculating default positions
- respecting explicit x/y/width/height
- respecting vertical/horizontal/grid layout
- preserving roles
- preserving metadata

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

const DEFAULT_START_X =
  40;

const DEFAULT_START_Y =
  20;

const DEFAULT_LAYOUT_GAP =
  12;

const DEFAULT_CONTAINER_PADDING =
  20;

const DEFAULT_GRID_COLUMNS =
  2;

const DEFAULT_GRID_COLUMN_GAP =
  20;

const DEFAULT_GRID_ROW_GAP =
  20;


// =====================================================
// ID HELPERS
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const id =
    String(
      value
    ).trim();


  return id || null;

}


// =====================================================
// LAYOUT NORMALISATION
// =====================================================

function normaliseLayout(
  value
) {

  if (
    typeof value !==
    "string"
  ) {

    return "vertical";

  }


  const layout =
    value
      .toLowerCase()
      .trim();


  if (
    layout ===
    "horizontal"
  ) {

    return "horizontal";

  }


  if (
    layout ===
    "grid"
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
    DEFAULT_ELEMENT_SIZE[
      type
    ] ||
    DEFAULT_ELEMENT_SIZE.default
  );

}


// =====================================================
// RESOLVE SIZE
// =====================================================

function resolveSize(
  node
) {

  const defaults =
    getDefaultSize(
      node?.type
    );


  const width =
    Number.isFinite(
      Number(
        node?.width
      )
    )
      ? Number(
          node.width
        )
      : defaults.width;


  const height =
    Number.isFinite(
      Number(
        node?.height
      )
    )
      ? Number(
          node.height
        )
      : defaults.height;


  return {

    width:
      Math.max(
        1,
        width
      ),

    height:
      Math.max(
        1,
        height
      ),

  };

}


// =====================================================
// RESOLVE COORDINATE
// =====================================================

function resolveCoordinate(
  value,
  fallback
) {

  if (
    Number.isFinite(
      Number(
        value
      )
    )
  ) {

    return Number(
      value
    );

  }


  return Number(
    fallback
  ) || 0;

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
    typeof node !==
      "object"
  ) {

    return null;

  }


  const type =
    node.type ||
    "Text";


  const size =
    resolveSize(
      node
    );


  const elementId =
    normaliseId(
      node.id
    ) ||
    `${type}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;


  const element = {

    // -------------------------------------------------
    // ID
    // -------------------------------------------------

    id:
      elementId,


    // -------------------------------------------------
    // TYPE
    // -------------------------------------------------

    type,


    // -------------------------------------------------
    // HIERARCHY
    // -------------------------------------------------

    parentId:
      normaliseId(
        parentId
      ),


    // -------------------------------------------------
    // POSITION
    //
    // IMPORTANT:
    //
    // x/y are LOCAL to parent.
    //
    // For top-level elements:
    // x/y are local to Canvas stage.
    //
    // -------------------------------------------------

    x:
      resolveCoordinate(
        node.x,
        x
      ),

    y:
      resolveCoordinate(
        node.y,
        y
      ),


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
    node.role !==
    undefined
  ) {

    element.role =
      node.role;

  }


  return element;

}


// =====================================================
// RESOLVE CHILD POSITION
// =====================================================
//
// Child positions are ALWAYS local to parent.
//
// Therefore:
//
// vertical child:
//
//   x = padding
//   y = currentY
//
// NOT:
//
//   x = parentX + padding
//
// Canvas adds the parent's position during rendering.
//
// =====================================================

function resolveChildPosition(
  child,
  fallbackX,
  fallbackY
) {

  return {

    x:
      resolveCoordinate(
        child?.x,
        fallbackX
      ),

    y:
      resolveCoordinate(
        child?.y,
        fallbackY
      ),

  };

}


// =====================================================
// LAYOUT CHILDREN
// =====================================================

function layoutChildren(
  children,
  {
    parentId,
    parentWidth,
    parentLayout,
    result,
  }
) {

  if (
    !Array.isArray(
      children
    ) ||
    children.length ===
      0
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
    layout ===
    "vertical"
  ) {

    let currentY =
      padding;


    children.forEach(
      child => {

        if (
          !child ||
          typeof child !==
            "object"
        ) {

          return;

        }


        const childSize =
          resolveSize(
            child
          );


        const fallbackX =
          padding;


        const fallbackY =
          currentY;


        const position =
          resolveChildPosition(
            child,
            fallbackX,
            fallbackY
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
          created &&
          created.parentId ===
            parentId
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
    layout ===
    "horizontal"
  ) {

    let currentX =
      padding;


    let currentY =
      padding;


    children.forEach(
      child => {

        if (
          !child ||
          typeof child !==
            "object"
        ) {

          return;

        }


        const childSize =
          resolveSize(
            child
          );


        const fallbackX =
          currentX;


        const fallbackY =
          currentY;


        const position =
          resolveChildPosition(
            child,
            fallbackX,
            fallbackY
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
          created &&
          created.parentId ===
            parentId
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
    layout ===
    "grid"
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
            (
              columns -
              1
            )
          ),

        200

      );


    const columnWidth =
      usableWidth /
      columns;


    const rowHeights =
      [];


    children.forEach(
      (
        child,
        index
      ) => {

        if (
          !child ||
          typeof child !==
            "object"
        ) {

          return;

        }


        const childSize =
          resolveSize(
            child
          );


        const column =
          index %
          columns;


        const row =
          Math.floor(
            index /
            columns
          );


        const rowY =
          padding +
          row *
          (
            (
              rowHeights[
                row
              ] ||
              childSize.height
            ) +
            DEFAULT_GRID_ROW_GAP
          );


        const fallbackX =
          padding +
          column *
          (
            columnWidth +
            DEFAULT_GRID_COLUMN_GAP
          );


        const fallbackY =
          rowY;


        const position =
          resolveChildPosition(
            child,
            fallbackX,
            fallbackY
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
          created &&
          created.parentId ===
            parentId
        ) {

          rowHeights[
            row
          ] =
            Math.max(
              rowHeights[
                row
              ] ||
              0,
              created.height
            );

        }
        else {

          rowHeights[
            row
          ] =
            Math.max(
              rowHeights[
                row
              ] ||
              0,
              childSize.height
            );

        }

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
    fallbackX =
      DEFAULT_START_X,
    fallbackY =
      DEFAULT_START_Y,
    result,
  }
) {

  if (
    !node ||
    typeof node !==
      "object"
  ) {

    return;

  }


  // ===================================================
  // APP ROOT
  // ===================================================

  if (
    node.type ===
    "App"
  ) {

    const rootLayout =
      node.props?.layout ||
      node.meta?.confoLayout ||
      "vertical";


    const rootWidth =
      Number.isFinite(
        Number(
          node.width
        )
      )
        ? Number(
            node.width
          )
        : DEFAULT_ELEMENT_SIZE.App.width;


    layoutChildren(
      node.children,
      {

        parentId:
          null,

        parentWidth:
          rootWidth,

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

  const canonicalParentId =
    normaliseId(
      parentId
    );


  const element =
    createElement(
      node,
      {

        x:
          fallbackX,

        y:
          fallbackY,

        parentId:
          canonicalParentId,

      }
    );


  if (!element) {

    return;

  }


  // ---------------------------------------------------
  // Duplicate protection
  // ---------------------------------------------------

  const duplicate =
    result.some(
      existing =>
        existing.id ===
        element.id
    );


  if (
    duplicate
  ) {

    console.warn(
      "[ProjectTreeLoader] Duplicate element ID skipped",
      {
        id:
          element.id,

        type:
          element.type,

      }
    );


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
    node.children.length >
      0
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
// VALIDATE HIERARCHY
// =====================================================

function validateHierarchy(
  elements
) {

  const ids =
    new Set(
      elements.map(
        element =>
          element.id
      )
    );


  const orphaned =
    elements.filter(
      element => {

        if (
          !element.parentId
        ) {

          return false;

        }


        return !ids.has(
          element.parentId
        );

      }
    );


  const circular =
    [];


  elements.forEach(
    element => {

      const visited =
        new Set();


      let current =
        element;


      while (
        current?.parentId
      ) {

        if (
          visited.has(
            current.parentId
          )
        ) {

          circular.push(
            {
              id:
                element.id,

              parentId:
                current.parentId,
            }
          );

          break;

        }


        visited.add(
          current.parentId
        );


        current =
          elements.find(
            candidate =>
              candidate.id ===
              current.parentId
          );


        if (
          !current
        ) {

          break;

        }

      }

    }
  );


  if (
    orphaned.length
  ) {

    console.warn(
      "[ProjectTreeLoader] Orphaned elements detected",
      orphaned
    );

  }


  if (
    circular.length
  ) {

    console.warn(
      "[ProjectTreeLoader] Circular hierarchy detected",
      circular
    );

  }


  return {
    orphaned,
    circular,
  };

}


// =====================================================
// PUBLIC API
// =====================================================

export function projectTreeToElements(
  tree
) {

  if (
    !tree ||
    typeof tree !==
      "object"
  ) {

    return [];

  }


  const result =
    flattenTree(
      tree
    );


  validateHierarchy(
    result
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