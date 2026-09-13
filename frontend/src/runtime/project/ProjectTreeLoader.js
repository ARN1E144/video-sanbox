/*
========================================================
PROJECT TREE → CANVAS ELEMENTS
========================================================

Project tree:

LEGACY:

App
├── AgoraFeed
├── Container
│   ├── ParticipantSelector
│   ├── TextBox
│   └── ControlButton
└── ChatPanel


CANONICAL:

Container
├── AgoraFeed
├── Container
│   ├── ParticipantSelector
│   ├── TextBox
│   └── ControlButton
└── ChatPanel


becomes Canvas elements:

Canonical root Container
  parentId: null

AgoraFeed
  parentId: Container.id

Container
  parentId: Container.id

ParticipantSelector
  parentId: nested Container.id

TextBox
  parentId: nested Container.id

ControlButton
  parentId: nested Container.id


IMPORTANT:

A legacy App node is a logical project root.

It is NOT a Canvas element.

A canonical real root such as Container IS a
Canvas element and MUST be preserved.

Real components such as:

    Container
    ControlPanel
    AgoraFeed
    ChatPanel

ARE Canvas elements.


========================================================
RESPONSIBILITY
========================================================

This loader is responsible for:

- flattening the project tree
- preserving hierarchy
- creating Canvas elements
- resolving default element sizes
- preserving explicit dimensions
- preserving explicit coordinates
- preserving roles
- preserving props
- preserving metadata
- preserving the root layout
- validating hierarchy

This loader is NOT responsible for:

- vertical layout
- horizontal layout
- grid layout
- container auto-sizing
- child positioning
- child clamping
- overlap detection
- geometry validation

Those responsibilities belong to:

    CanvasLayoutEngine
            +
      CanvasGeometry


========================================================
ARCHITECTURE
========================================================

Project tree
     │
     ▼
ProjectTreeLoader
     │
     │ structural elements only
     ▼
CanvasLayoutEngine
     │
     │ canonical geometry
     ▼
Canvas elements


========================================================
POSITION CONTRACT
========================================================

Top-level element:

    x/y = Canvas coordinates

Child of free container:

    x/y = relative to immediate parent

Child of managed container:

    x/y = calculated by CanvasLayoutEngine

The loader does not attempt to calculate those
managed positions.


========================================================
*/


import CanvasLayoutEngine from "../canvas/CanvasLayoutEngine";


// =====================================================
// DEFAULT ELEMENT SIZES
// =====================================================
//
// These are creation defaults only.
//
// They are deliberately kept here because the loader
// must create an element with a usable size before the
// layout engine can calculate the final geometry.
//
// Layout decisions do NOT belong here.
//

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
// DEFAULT ROOT CONFIGURATION
// =====================================================

const DEFAULT_ROOT_LAYOUT =
  "free";


const DEFAULT_START_X =
  40;


const DEFAULT_START_Y =
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


  return id ||
    null;

}


// =====================================================
// NUMBER HELPERS
// =====================================================

function resolveNumber(
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
// LAYOUT NORMALISATION
// =====================================================
//
// The loader only needs to preserve the root layout.
// CanvasLayoutEngine owns all actual layout behaviour.
//
// Supports:
//
//   free
//   vertical
//   horizontal
//   grid
//
// Also accepts:
//
//   row      → horizontal
//   column   → vertical
//
// =====================================================

function normaliseLayout(
  value
) {

  if (
    typeof value !==
    "string"
  ) {

    return DEFAULT_ROOT_LAYOUT;

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
    "horizontal" ||
    layout ===
    "row"
  ) {

    return "horizontal";

  }


  if (
    layout ===
    "vertical" ||
    layout ===
    "column"
  ) {

    return "vertical";

  }


  if (
    layout ===
    "grid"
  ) {

    return "grid";

  }


  return "free";

}


// =====================================================
// GET NODE LAYOUT
// =====================================================
//
// This is intentionally a structural helper.
//
// CanvasLayoutEngine will interpret the layout.
//

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
//
// Explicit dimensions always win.
//
// If no dimensions are supplied by the tree,
// the component creation default is used.
//
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
// RESOLVE POSITION
// =====================================================
//
// The loader preserves explicit coordinates.
//
// It does NOT calculate positions based on:
//
//   vertical
//   horizontal
//   grid
//
// CanvasLayoutEngine does that later.
//
// =====================================================

function resolvePosition(
  node,
  fallbackX,
  fallbackY
) {

  return {

    x:
      resolveNumber(
        node?.x,
        fallbackX
      ),

    y:
      resolveNumber(
        node?.y,
        fallbackY
      ),

  };

}


// =====================================================
// CREATE ELEMENT
// =====================================================

function createElement(
  node,
  {
    parentId = null,
    fallbackX = DEFAULT_START_X,
    fallbackY = DEFAULT_START_Y,
  } = {}
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


  const position =
    resolvePosition(
      node,
      fallbackX,
      fallbackY
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
    // IMPORTANT:
    //
    // These are only initial coordinates.
    //
    // CanvasLayoutEngine becomes authoritative for
    // managed layouts.
    //
    // -------------------------------------------------

    x:
      position.x,

    y:
      position.y,


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
// ROOT CONFIGURATION
// =====================================================
//
// There are now TWO supported root forms:
//
//
// 1. Legacy:
//
//      App
//       └── Container
//
//    App is logical only.
//
//
// 2. Canonical:
//
//      Container
//
//    Container IS the real Canvas root.
//
//
// For canonical roots, the root's own dimensions and
// layout become the project Canvas configuration.
//
// =====================================================

function getRootConfiguration(
  tree
) {

  if (
    !tree ||
    typeof tree !==
      "object"
  ) {

    return {

      layout:
        DEFAULT_ROOT_LAYOUT,

      width:
        DEFAULT_ELEMENT_SIZE.App.width,

      height:
        DEFAULT_ELEMENT_SIZE.App.height,

    };

  }


  // ---------------------------------------------------
  // LEGACY APP ROOT
  // ---------------------------------------------------

  if (
    tree.type ===
    "App"
  ) {

    const layout =
      normaliseLayout(
        tree.props?.layout ??
        tree.meta?.confoLayout ??
        DEFAULT_ROOT_LAYOUT
      );


    const width =
      Number.isFinite(
        Number(
          tree.width
        )
      )
        ? Number(
            tree.width
          )
        : DEFAULT_ELEMENT_SIZE.App.width;


    const height =
      Number.isFinite(
        Number(
          tree.height
        )
      )
        ? Number(
            tree.height
          )
        : DEFAULT_ELEMENT_SIZE.App.height;


    return {

      layout,

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


  // ---------------------------------------------------
  // CANONICAL REAL ROOT
  // ---------------------------------------------------
  //
  // The real root is a Canvas element.
  //
  // Its layout and geometry are preserved.
  //

  const rootSize =
    resolveSize(
      tree
    );


  const rootLayout =
    getNodeLayout(
      tree
    );


  return {

    layout:
      rootLayout,

    width:
      rootSize.width,

    height:
      rootSize.height,

  };

}


// =====================================================
// TREE WALK
// =====================================================
//
// This function does exactly one job:
//
//     tree node → Canvas element
//
// It deliberately does not calculate layout.
//
// IMPORTANT:
//
// App is special only because it is a legacy logical
// wrapper.
//
// Every other node, including a root Container, is a
// real Canvas element.
//

function walkNode(
  node,
  {
    parentId = null,
    fallbackX = DEFAULT_START_X,
    fallbackY = DEFAULT_START_Y,
    result,
    ids,
  } = {}
) {

  if (
    !node ||
    typeof node !==
      "object"
  ) {

    return null;

  }


  // ---------------------------------------------------
  // LEGACY APP ROOT
  // ---------------------------------------------------
  //
  // App remains a logical project wrapper.
  //
  // IMPORTANT:
  //
  // We do NOT create an App Canvas element.
  //
  // Its children remain top-level Canvas elements.
  //
  // ---------------------------------------------------

  if (
    node.type ===
    "App"
  ) {

    const children =
      Array.isArray(
        node.children
      )
        ? node.children
        : [];


    children.forEach(
      (
        child,
        index
      ) => {

        walkNode(
          child,
          {

            parentId:
              null,

            fallbackX:
              child?.x ??
              fallbackX,

            fallbackY:
              child?.y ??
              (
                fallbackY +
                index * 12
              ),

            result,

            ids,

          }
        );

      }
    );


    return null;

  }


  // ---------------------------------------------------
  // CREATE REAL CANVAS ELEMENT
  // ---------------------------------------------------
  //
  // This now includes a canonical real root.
  //
  // Example:
  //
  // Container
  // parentId: null
  //
  // ---------------------------------------------------

  const element =
    createElement(
      node,
      {

        parentId,

        fallbackX,

        fallbackY,

      }
    );


  if (!element) {

    return null;

  }


  // ---------------------------------------------------
  // DUPLICATE PROTECTION
  // ---------------------------------------------------

  if (
    ids.has(
      element.id
    )
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


  ids.add(
    element.id
  );


  result.push(
    element
  );


  // ---------------------------------------------------
  // RECURSE INTO CHILDREN
  // ---------------------------------------------------
  //
  // The current element is ALWAYS the parent of its
  // children.
  //
  // This is the critical hierarchy contract.
  //
  // ---------------------------------------------------

  const children =
    Array.isArray(
      node.children
    )
      ? node.children
      : [];


  children.forEach(
    (
      child,
      index
    ) => {

      walkNode(
        child,
        {

          parentId:
            element.id,

          fallbackX:
            child?.x ??
            16,

          fallbackY:
            child?.y ??
            (
              16 +
              index * 12
            ),

          result,

          ids,

        }
      );

    }
  );


  return element;

}


// =====================================================
// FLATTEN TREE
// =====================================================
//
// Output is structural Canvas elements.
//
// No layout calculations are performed here.
//
// =====================================================

function flattenTree(
  tree
) {

  const result =
    [];

  const ids =
    new Set();


  walkNode(
    tree,
    {

      parentId:
        null,

      fallbackX:
        tree?.x ??
        DEFAULT_START_X,

      fallbackY:
        tree?.y ??
        DEFAULT_START_Y,

      result,

      ids,

    }
  );


  return result;

}


// =====================================================
// HIERARCHY VALIDATION
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
// APPLY CANVAS LAYOUT
// =====================================================
//
// This is the architectural boundary.
//
// ProjectTreeLoader creates structure.
//
// CanvasLayoutEngine creates geometry.
//
// =====================================================

function applyLayout(
  elements,
  rootConfiguration
) {

  const result =
    CanvasLayoutEngine.layoutProjectElements(
      elements,
      {

        canvasWidth:
          rootConfiguration.width,

        canvasHeight:
          rootConfiguration.height,

        rootLayout:
          rootConfiguration.layout,

      }
    );


  if (
    !result ||
    !Array.isArray(
      result.elements
    )
  ) {

    console.warn(
      "[ProjectTreeLoader] CanvasLayoutEngine returned invalid result"
    );


    return elements;

  }


  return result.elements;

}


// =====================================================
// ROOT DIAGNOSTICS
// =====================================================

function getRootElements(
  elements
) {

  return elements.filter(
    element =>
      !element.parentId
  );

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


  // ---------------------------------------------------
  // 1. Read root configuration.
  // ---------------------------------------------------

  const rootConfiguration =
    getRootConfiguration(
      tree
    );


  // ---------------------------------------------------
  // 2. Convert tree to structural elements.
  // ---------------------------------------------------

  const structuralElements =
    flattenTree(
      tree
    );


  // ---------------------------------------------------
  // 3. Validate hierarchy before layout.
  // ---------------------------------------------------

  validateHierarchy(
    structuralElements
  );


  // ---------------------------------------------------
  // 4. Apply the single shared layout engine.
  // ---------------------------------------------------

  const elements =
    applyLayout(
      structuralElements,
      rootConfiguration
    );


  // ---------------------------------------------------
  // 5. Validate resulting hierarchy again.
  // ---------------------------------------------------

  validateHierarchy(
    elements
  );


  // ---------------------------------------------------
  // 6. Determine actual Canvas roots.
  // ---------------------------------------------------

  const roots =
    getRootElements(
      elements
    );


  // ---------------------------------------------------
  // 7. Root diagnostics.
  // ---------------------------------------------------

  console.log(
    "[ProjectTreeLoader] Root hierarchy",
    {

      rootCount:
        roots.length,

      roots:
        roots.map(
          root => ({

            id:
              root.id,

            type:
              root.type,

            x:
              root.x,

            y:
              root.y,

            width:
              root.width,

            height:
              root.height,

            layout:
              root.props?.layout ||
              null,

          })
        ),

    }
  );


  // ---------------------------------------------------
  // 8. Main diagnostics.
  // ---------------------------------------------------

  console.log(
    "[ProjectTreeLoader] Tree → Canvas",
    {

      rootLayout:
        rootConfiguration.layout,

      canvasWidth:
        rootConfiguration.width,

      canvasHeight:
        rootConfiguration.height,

      elementCount:
        elements.length,

      elements:
        elements.map(
          element => {

            const parent =
              elements.find(
                candidate =>
                  candidate.id ===
                  element.parentId
              );

            return {

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

              layoutManaged:
                element.meta?.layoutManaged ||
                false,

              collapsible:
                element.props?.collapsible ??
                null,

              defaultCollapsed:
                element.props?.defaultCollapsed ??
                null,

              propsWidth:
                element.props?.width ??
                null,

              propsHeight:
                element.props?.height ??
                null,

              styleWidth:
                element.props?.style?.width ??
                null,

              styleHeight:
                element.props?.style?.height ??
                null,

              parentGeometry:
                parent
                  ? {

                      id:
                        parent.id,

                      type:
                        parent.type,

                      x:
                        parent.x,

                      y:
                        parent.y,

                      width:
                        parent.width,

                      height:
                        parent.height,

                      layout:
                        parent.props?.layout ||
                        null,

                      gap:
                        parent.props?.gap ??
                        null,

                      padding:
                        parent.props?.padding ??
                        null,

                    }

                  : null,

            };

          }
        ),

    }
  );


  // ---------------------------------------------------
  // 9. Existing type diagnostics.
  // ---------------------------------------------------

  console.log(
    "%c 🌳 [PROJECT TREE TYPE CHECK] %c",
    "background-color: #DCFCE7; color: #166534; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 11px;",
    "",
    elements.map(
      element => ({

        id:
          element.id,

        sourceId:
          element.meta?.sourceId ??
          null,

        type:
          element.type,

        parentId:
          element.parentId ??
          null,

      })
    )
  );


  return elements;

}


// =====================================================
// OPTIONAL STRUCTURAL API
// =====================================================
//
// Useful for diagnostics/tests when we need the raw
// tree → element conversion without layout.
//
// Normal application code should use:
//
//     projectTreeToElements()
//
// =====================================================

export function projectTreeToStructuralElements(
  tree
) {

  if (
    !tree ||
    typeof tree !==
      "object"
  ) {

    return [];

  }


  return flattenTree(
    tree
  );

}


// =====================================================
// ROOT CONFIGURATION API
// =====================================================

export function getProjectRootConfiguration(
  tree
) {

  return getRootConfiguration(
    tree
  );

}


// =====================================================
// VALIDATION API
// =====================================================

export {
  validateHierarchy,
  getNodeLayout,
  getDefaultSize,
  resolveSize,
  normaliseLayout,
  DEFAULT_ELEMENT_SIZE,
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  projectTreeToElements,

  projectTreeToStructuralElements,

  getProjectRootConfiguration,

  validateHierarchy,

  getNodeLayout,

  getDefaultSize,

  resolveSize,

  normaliseLayout,

  DEFAULT_ELEMENT_SIZE,

};