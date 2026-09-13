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
- preserving the App root layout
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
// APP ROOT EXTRACTION
// =====================================================
//
// The App node is never inserted into Canvas elements.
//
// We only extract:
//
//   - root layout
//   - root dimensions
//   - root children
//
// =====================================================

function getRootConfiguration(
  tree
) {

  if (
    !tree ||
    tree.type !==
      "App"
  ) {

    return {

      layout:
        "free",

      width:
        DEFAULT_ELEMENT_SIZE.App.width,

      height:
        DEFAULT_ELEMENT_SIZE.App.height,

    };

  }


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
// =====================================================

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
  // App is logical only.
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
              fallbackX,

            fallbackY:
              fallbackY +
              index * 12,

            result,

            ids,

          }
        );

      }
    );


    return null;

  }


  // ---------------------------------------------------
  // Create real Canvas element.
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
  // Duplicate protection.
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
  // Recurse into children.
  //
  // Child coordinates are preserved as initial
  // geometry only.
  //
  // CanvasLayoutEngine will subsequently calculate
  // managed geometry.
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
            16,

          fallbackY:
            16 +
            index * 12,

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
// No layout engine is executed here yet.
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
        DEFAULT_START_X,

      fallbackY:
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
// This is the important architectural change.
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
  // 1. Read logical App configuration.
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
  // 6. Diagnostics.
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

            layoutManaged:
              element.meta?.layoutManaged ||
              false,

          })
        ),

    }
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