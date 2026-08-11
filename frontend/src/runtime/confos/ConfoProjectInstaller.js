// src/runtime/confos/ConfoProjectInstaller.js

/*
=====================================================
CONFO → PROJECT INSTALLER
=====================================================

Purpose:

Validated Confo
      ↓
Confo tree
      ↓
Project tree
      ↓
CanvasContext
      ↓
Canvas

The installer does NOT render anything.

IMPORTANT:

A Confo root Container is treated as a
logical/template wrapper.

It is NOT installed as a draggable Canvas element.

Example Confo:

Container
├── TextLabel
├── AgoraFeed
├── ControlPanel
│   ├── ControlButton
│   └── ControlButton
└── ChatPanel

Becomes:

App
├── TextLabel
├── AgoraFeed
├── ControlPanel
│   ├── ControlButton
│   └── ControlButton
└── ChatPanel

The ControlPanel remains a real Canvas container.

The root Container does not.
=====================================================
*/


// =====================================================
// ROOT TYPES
// =====================================================

const LOGICAL_ROOT_TYPES = new Set([
  "App",
  "Container",
]);


// =====================================================
// CREATE UNIQUE INSTALLED ID
// =====================================================

function createInstalledId(
  originalId,
  path = "0"
) {

  const safeId =
    String(
      originalId ||
      "element"
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      );

  return (
    `confo-${safeId}-${path}`
  );
}


// =====================================================
// COPY OPTIONAL CANVAS PROPERTIES
// =====================================================

function copyCanvasProperties(node) {

  const result = {};

  if (
    node.x !== undefined
  ) {
    result.x = node.x;
  }

  if (
    node.y !== undefined
  ) {
    result.y = node.y;
  }

  if (
    node.width !== undefined
  ) {
    result.width = node.width;
  }

  if (
    node.height !== undefined
  ) {
    result.height = node.height;
  }

  if (
    node.role !== undefined
  ) {
    result.role = node.role;
  }

  return result;
}


// =====================================================
// INSTALL REAL COMPONENT NODE
// =====================================================

function installNode(
  node,
  path = "0"
) {

  if (
    !node ||
    typeof node !== "object"
  ) {
    return null;
  }

  const type =
    node.type ||
    "Text";

  const installedNode = {

    // -------------------------------------------------
    // ID
    // -------------------------------------------------

    id:
      createInstalledId(
        node.id,
        path
      ),

    // -------------------------------------------------
    // COMPONENT TYPE
    // -------------------------------------------------

    type,

    // -------------------------------------------------
    // CANVAS PROPERTIES
    // -------------------------------------------------

    ...copyCanvasProperties(
      node
    ),

    // -------------------------------------------------
    // COMPONENT PROPS
    // -------------------------------------------------

    props: {
      ...(node.props || {})
    },

  };


  // ===================================================
  // ROLE
  // ===================================================

  if (
    node.role !== undefined
  ) {

    installedNode.role =
      node.role;

  }


  // ===================================================
  // META
  // ===================================================

  if (
    node.meta
  ) {

    installedNode.meta = {
      ...node.meta
    };

  }


  // ===================================================
  // CHILDREN
  // ===================================================

  if (
    Array.isArray(
      node.children
    )
  ) {

    const children =
      node.children
        .map(
          (
            child,
            childIndex
          ) =>
            installNode(
              child,
              `${path}-${childIndex}`
            )
        )
        .filter(Boolean);


    if (
      children.length > 0
    ) {

      installedNode.children =
        children;

    }

  }


  return installedNode;
}


// =====================================================
// UNWRAP CONFO ROOT
// =====================================================

/*
-------------------------------------------------------
A Confo normally has a presentation root such as:

Container
├── AgoraFeed
├── ControlPanel
└── ChatPanel

That Container is NOT a user-created Canvas element.

We therefore unwrap it.

If the Confo root is already a genuine component
such as ControlPanel, we keep it.

-------------------------------------------------------
*/

function getInstallRoot(
  confoTree
) {

  if (
    !confoTree ||
    typeof confoTree !== "object"
  ) {
    return null;
  }


  // -----------------------------------------------
  // App is always a logical project root
  // -----------------------------------------------

  if (
    confoTree.type === "App"
  ) {

    return confoTree;

  }


  // -----------------------------------------------
  // Top-level Container is a Confo wrapper
  // -----------------------------------------------

  if (
    confoTree.type === "Container"
  ) {

    return {

      id: "root",

      type: "App",

      children:
        Array.isArray(
          confoTree.children
        )
          ? confoTree.children
          : [],

    };

  }


  // -----------------------------------------------
  // Any other root is a genuine component
  // -----------------------------------------------

  return {

    id: "root",

    type: "App",

    children: [
      confoTree
    ],

  };

}


// =====================================================
// INSTALL CONFO
// =====================================================

export function installConfo(
  confo,
  projectSchema = {}
) {

  console.log(
    "[ConfoProjectInstaller] Installing",
    confo?.id ||
      confo?.name
  );


  // ===================================================
  // VALIDATION
  // ===================================================

  if (!confo) {

    return {

      success: false,

      errors: [
        "Cannot install undefined Confo."
      ],

    };

  }


  if (
    !confo.tree
  ) {

    return {

      success: false,

      errors: [
        "Cannot install Confo without a tree."
      ],

    };

  }


  // ===================================================
  // GET LOGICAL ROOT
  // ===================================================

  const logicalRoot =
    getInstallRoot(
      confo.tree
    );


  if (
    !logicalRoot
  ) {

    return {

      success: false,

      errors: [
        "Failed to resolve Confo project root."
      ],

    };

  }


  // ===================================================
  // INSTALL CHILDREN
  // ===================================================

  const installedChildren =
    (
      Array.isArray(
        logicalRoot.children
      )
        ? logicalRoot.children
        : []
    )
      .map(
        (
          child,
          index
        ) =>
          installNode(
            child,
            String(index)
          )
      )
      .filter(Boolean);


  // ===================================================
  // PROJECT TREE
  // ===================================================

  const tree = {

    id:
      projectSchema?.tree?.id ||
      "root",

    type:
      "App",

    props:
      projectSchema?.tree?.props ||
      {},

    children:
      installedChildren,

    // -------------------------------------------------
    // PROJECT / CONFO METADATA
    // -------------------------------------------------

    meta: {

      ...(projectSchema?.tree?.meta || {}),

      installedFromConfo:
        confo.id ||
        confo.name,

      confoName:
        confo.name,

      confoVersion:
        confo.version ||
        1,

    },

  };


  console.log(
    "[ConfoProjectInstaller] Installed project tree",
    tree
  );


  // ===================================================
  // DEBUG FLATTENED HIERARCHY
  // ===================================================

  function debugHierarchy(
    node,
    depth = 0
  ) {

    if (
      !node
    ) {
      return;
    }

    console.log(
      `${"  ".repeat(depth)}${node.type} (${node.id})`
    );

    if (
      Array.isArray(
        node.children
      )
    ) {

      node.children.forEach(
        child =>
          debugHierarchy(
            child,
            depth + 1
          )
      );

    }

  }


  debugHierarchy(
    tree
  );


  // ===================================================
  // SUCCESS
  // ===================================================

  return {

    success: true,

    errors: [],

    tree,

    confo,

    previousTree:
      projectSchema?.tree ||
      null,

  };

}


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  installConfo,
};