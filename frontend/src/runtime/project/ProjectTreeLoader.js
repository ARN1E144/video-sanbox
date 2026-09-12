/*
========================================================
PROJECT TREE → CANVAS ELEMENTS
========================================================

Project tree:

App
├── AgoraFeed
├── Container
│   ├── ParticipantSelector
│   ├── TextBox
│   └── ControlButton
└── ChatPanel

becomes Canvas elements:

AgoraFeed
  parentId: null

Container
  parentId: null

ParticipantSelector
  parentId: Container.id

TextBox
  parentId: Container.id

ControlButton
  parentId: Container.id

ChatPanel
  parentId: null


IMPORTANT:

App is a logical project root.

It is NOT a Canvas element.

Real components such as Container / ControlPanel
ARE Canvas elements.


========================================================
POSITION CONTRACT
========================================================

Top-level element:

  x/y = relative to Canvas stage


Child of Container layout="free":

  x/y = relative to immediate parent


Child of Container layout="vertical":

  x/y are layout-managed.

  Child order controls vertical position.


Child of Container layout="horizontal":

  x/y are layout-managed.

  Child order controls horizontal position.


Child of ControlPanel:

  x/y are layout-managed by ControlPanel.


========================================================
RESPONSIBILITIES
========================================================

This loader:

- flattens the project tree
- preserves hierarchy
- resolves default sizes
- calculates sensible fallback positions
- preserves explicit dimensions
- preserves free-container coordinates
- preserves roles
- preserves metadata
- validates hierarchy

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
    width: 600,
    height: 400,
  },

  AgoraFeed: {
    width: 800,
    height: 450,
  },

  VideoFeed: {
    width: 800,
    height: 450,
  },

  RemoteVideoGrid: {
    width: 800,
    height: 500,
  },

  MediaFeed: {
    width: 600,
    height: 400,
  },

  FilePreview: {
    width: 500,
    height: 350,
  },

  ChatPanel: {
    width: 420,
    height: 360,
  },

  ParticipantSelector: {
    width: 280,
    height: 180,
  },

  ControlPanel: {
    width: 520,
    height: 72,
  },

  ControlButton: {
    width: 120,
    height: 40,
  },

  MicButton: {
    width: 120,
    height: 40,
  },

  AvailabilityButton: {
    width: 150,
    height: 40,
  },

  TextBox: {
    width: 320,
    height: 40,
  },

  Select: {
    width: 220,
    height: 40,
  },

  Input: {
    width: 320,
    height: 40,
  },

  FileUpload: {
    width: 300,
    height: 70,
  },

  ComplianceEvidence: {
    width: 600,
    height: 300,
  },

  InterviewPanel: {
    width: 600,
    height: 400,
  },

  Text: {
    width: 250,
    height: 40,
  },

  TextLabel: {
    width: 280,
    height: 32,
  },

  default: {
    width: 280,
    height: 120,
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
  16;


const DEFAULT_GRID_COLUMNS =
  2;


const DEFAULT_GRID_COLUMN_GAP =
  12;


const DEFAULT_GRID_ROW_GAP =
  12;


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


  return id ||
    null;

}


// =====================================================
// LAYOUT NORMALISATION
// =====================================================
//
// Supported:
//
//   free
//   vertical
//   horizontal
//   grid
//
// =====================================================

function normaliseLayout(
  value
) {

  if (
    typeof value !==
    "string"
  ) {

    return "free";

  }


  const layout =
    value
      .toLowerCase()
      .trim();


  if (
    layout ===
    "free"
  ) {

    return "free";

  }


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


  if (
    layout ===
    "vertical"
  ) {

    return "vertical";

  }


  return "free";

}


// =====================================================
// GET NODE LAYOUT
// =====================================================

function getNodeLayout(
  node
) {

  if (
    !node ||
    typeof node !==
      "object"
  ) {

    return "free";

  }


  return normaliseLayout(
    node.props?.layout ??
    node.meta?.layout ??
    "free"
  );

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


  const explicitWidth =
    Number(
      node?.width
    );


  const explicitHeight =
    Number(
      node?.height
    );


  const width =
    Number.isFinite(
      explicitWidth
    )
      ? explicitWidth
      : defaults.width;


  const height =
    Number.isFinite(
      explicitHeight
    )
      ? explicitHeight
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

  const numericValue =
    Number(
      value
    );


  if (
    Number.isFinite(
      numericValue
    )
  ) {

    return numericValue;

  }


  const numericFallback =
    Number(
      fallback
    );


  return Number.isFinite(
    numericFallback
  )
    ? numericFallback
    : 0;

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
    layoutManaged = false,
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
    // -------------------------------------------------
    //
    // Free-layout elements retain explicit x/y.
    //
    // Layout-managed children receive the calculated
    // position generated by the loader.
    //
    // Canvas ignores x/y for flex-managed children.
    //
    // -------------------------------------------------

    x:
      layoutManaged
        ? resolveCoordinate(
            x,
            0
          )
        : resolveCoordinate(
            node.x,
            x
          ),

    y:
      layoutManaged
        ? resolveCoordinate(
            y,
            0
          )
        : resolveCoordinate(
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
    layoutManaged = false,
    result,
  }
) {

  if (
    !node ||
    typeof node !==
      "object"
  ) {

    return null;

  }


  // ===================================================
  // APP ROOT
  // ===================================================

  if (
    node.type ===
    "App"
  ) {

    const rootLayout =
      normaliseLayout(
        node.props?.layout ||
        node.meta?.confoLayout ||
        "vertical"
      );


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


    return null;

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

        layoutManaged,

      }
    );


  if (!element) {

    return null;

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


    return null;

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
      getNodeLayout(
        node
      );


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


  return element;

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


  // ===================================================
  // FREE
  // ===================================================
  //
  // IMPORTANT:
  //
  // No artificial layout is imposed.
  //
  // Explicit child x/y values are retained.
  //
  // Missing x/y values fall back to a sensible position.
  //
  // ===================================================

  if (
    layout ===
    "free"
  ) {

    let fallbackY =
      DEFAULT_CONTAINER_PADDING;


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


        const explicitX =
          Number(
            child?.x
          );


        const explicitY =
          Number(
            child?.y
          );


        const hasExplicitX =
          Number.isFinite(
            explicitX
          );


        const hasExplicitY =
          Number.isFinite(
            explicitY
          );


        const childX =
          hasExplicitX
            ? explicitX
            : DEFAULT_CONTAINER_PADDING;


        const childY =
          hasExplicitY
            ? explicitY
            : fallbackY;


        const created =
          processNode(
            child,
            {

              parentId,

              fallbackX:
                childX,

              fallbackY:
                childY,

              layoutManaged:
                false,

              result,

            }
          );


        if (
          created &&
          created.parentId ===
            parentId
        ) {

          fallbackY =
            Math.max(
              fallbackY,
              created.y +
                created.height +
                DEFAULT_LAYOUT_GAP
            );

        }
        else {

          fallbackY +=
            childSize.height +
            DEFAULT_LAYOUT_GAP;

        }

      }
    );


    return;

  }


  // ===================================================
  // VERTICAL
  // ===================================================
  //
  // The loader establishes ordering and sensible
  // coordinates, but Canvas uses flex layout at runtime.
  //
  // Explicit x/y values are intentionally ignored.
  //
  // ===================================================

  if (
    layout ===
    "vertical"
  ) {

    let currentY =
      DEFAULT_CONTAINER_PADDING;


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


        const created =
          processNode(
            child,
            {

              parentId,

              fallbackX:
                DEFAULT_CONTAINER_PADDING,

              fallbackY:
                currentY,

              layoutManaged:
                true,

              result,

            }
          );


        if (
          created &&
          created.parentId ===
            parentId
        ) {

          currentY =
            Math.max(
              currentY,
              created.height +
                currentY +
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
      DEFAULT_CONTAINER_PADDING;


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


        const created =
          processNode(
            child,
            {

              parentId,

              fallbackX:
                currentX,

              fallbackY:
                DEFAULT_CONTAINER_PADDING,

              layoutManaged:
                true,

              result,

            }
          );


        if (
          created &&
          created.parentId ===
            parentId
        ) {

          currentX =
            Math.max(
              currentX,
              created.width +
                currentX +
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
            DEFAULT_CONTAINER_PADDING *
            2
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


        const fallbackX =
          DEFAULT_CONTAINER_PADDING +
          column *
          (
            columnWidth +
            DEFAULT_GRID_COLUMN_GAP
          );


        const fallbackY =
          DEFAULT_CONTAINER_PADDING +
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


        const created =
          processNode(
            child,
            {

              parentId,

              fallbackX,

              fallbackY,

              layoutManaged:
                true,

              result,

            }
          );


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

      layoutManaged:
        false,

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

        layout:
          element.props?.layout ||
          null,

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