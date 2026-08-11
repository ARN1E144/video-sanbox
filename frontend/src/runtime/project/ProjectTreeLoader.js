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

becomes:

Canvas elements:

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

Real Containers such as ControlPanel ARE Canvas
elements.
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
    width: 250,
    height: 80,
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
    width: 250,
    height: 50,
  },

  ChatPanel: {
    width: 300,
    height: 300,
  },

  VideoFeed: {
    width: 800,
    height: 450,
  },

  default: {
    width: 300,
    height: 150,
  },

};


// =====================================================
// DEFAULT POSITION
// =====================================================

function createDefaultPosition(
  index = 0
) {

  return {

    x: 50,

    y:
      50 +
      (
        index *
        150
      ),

  };

}


// =====================================================
// GET SIZE
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
// CONVERT NODE
// =====================================================

function convertNode(
  node,
  index = 0,
  parentId = null
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  const position =
    createDefaultPosition(
      index
    );


  const size =
    getDefaultSize(
      node.type
    );


  const element = {

    // -------------------------------------------------
    // ID
    // -------------------------------------------------

    id:
      node.id ||
      `${node.type || "element"}_${index}`,

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
    // -------------------------------------------------

    x:
      node.x ??
      position.x,

    y:
      node.y ??
      position.y,

    // -------------------------------------------------
    // SIZE
    // -------------------------------------------------

    width:
      node.width ??
      size.width,

    height:
      node.height ??
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
  // ROLE
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
// FLATTEN TREE
// =====================================================

function flattenTree(
  node,
  result = [],
  parentId = null
) {

  if (!node) {

    return result;

  }


  // ===================================================
  // ARRAY
  // ===================================================

  if (
    Array.isArray(node)
  ) {

    node.forEach(
      (
        child,
        index
      ) => {

        flattenTree(
          child,
          result,
          parentId
        );

      }
    );

    return result;

  }


  // ===================================================
  // APP ROOT
  // ===================================================

  /*
  -----------------------------------------------------
  App is a logical project root.

  We deliberately do NOT create:

  {
    type: "App"
  }

  as a Canvas element.
  -----------------------------------------------------
  */

  const isApp =
    node.type === "App";


  // ===================================================
  // CURRENT PARENT
  // ===================================================

  let currentParentId =
    parentId;


  // ===================================================
  // REAL CANVAS ELEMENT
  // ===================================================

  if (
    !isApp
  ) {

    const element =
      convertNode(
        node,
        result.length,
        parentId
      );


    if (
      element
    ) {

      result.push(
        element
      );


      /*
      -------------------------------------------------
      IMPORTANT

      Children now inherit this element's ID.

      Therefore:

      ControlPanel
        ↓
      ControlButton

      becomes:

      ControlPanel parentId:null
      ControlButton parentId:ControlPanel.id
      -------------------------------------------------
      */

      currentParentId =
        element.id;

    }

  }


  // ===================================================
  // CHILDREN
  // ===================================================

  if (
    Array.isArray(
      node.children
    )
  ) {

    node.children.forEach(
      child => {

        flattenTree(
          child,
          result,
          currentParentId
        );

      }
    );

  }


  return result;

}


// =====================================================
// PUBLIC API
// =====================================================

export function projectTreeToElements(
  tree
) {

  if (
    !tree
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