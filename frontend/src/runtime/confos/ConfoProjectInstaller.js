// src/runtime/confos/ConfoProjectInstaller.js

/*
=====================================================
CONFO → PROJECT INSTALLER
=====================================================

Responsibilities:

Confo definition
      ↓
Installed project tree
      ↓
Canvas / project system

The installer:

- preserves Confo hierarchy
- creates deterministic installed IDs
- preserves original Confo source IDs
- preserves metadata
- resolves targetId references
- preserves explicit Canvas properties
- preserves parent/child relationships explicitly
- preserves tree paths
- preserves logical root containers
- provides diagnostics for hierarchy integrity

It does NOT:

- calculate Canvas layout
- render components
- create Canvas runtime state

ProjectTreeLoader / Canvas layer handles Canvas layout.

IMPORTANT ID MODEL
-----------------------------------------------------

Confo ID:

    interview-video

Installed project ID:

    confo-interview-video-2

Metadata:

    meta.sourceId = "interview-video"

Hierarchy metadata:

    meta.parentId
    meta.parentSourceId
    meta.treePath
    meta.depth

This gives the project system TWO reliable ways to
understand hierarchy:

1. Native tree structure:

      parent.children[]

2. Explicit relationship metadata:

      child.meta.parentId

The native tree remains authoritative.

=====================================================
*/


// =====================================================
// CREATE INSTALLED ID
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
// GET SOURCE ID
// =====================================================
//
// Original Confo identity is always retained separately
// from the generated installed project ID.
//
// =====================================================

function getSourceId(
  node
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  if (
    typeof node.meta?.sourceId ===
      "string" &&
    node.meta.sourceId.trim()
  ) {

    return node.meta.sourceId;

  }


  if (
    typeof node.id ===
      "string" &&
    node.id.trim()
  ) {

    return node.id;

  }


  return null;

}


// =====================================================
// GET ORIGINAL META
// =====================================================

function getOriginalMeta(
  node
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return {};

  }


  if (
    !node.meta ||
    typeof node.meta !== "object"
  ) {

    return {};

  }


  return {
    ...node.meta,
  };

}


// =====================================================
// BUILD ID MAP
// =====================================================
//
// Original Confo ID
//      ↓
// Installed project ID
//
// Example:
//
// interview-video
//      ↓
// confo-interview-video-2
//
// The walk is recursive so nested children are always
// included.
//
// =====================================================

function buildIdMap(
  node,
  map = new Map(),
  path = "0"
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return map;

  }


  // ---------------------------------------------------
  // App is a logical root and does not participate in
  // Confo target ID mapping.
  // ---------------------------------------------------

  if (
    node.type !==
    "App"
  ) {

    const sourceId =
      getSourceId(
        node
      );


    if (
      sourceId
    ) {

      map.set(
        sourceId,
        createInstalledId(
          sourceId,
          path
        )
      );

    }

  }


  // ---------------------------------------------------
  // CHILDREN
  // ---------------------------------------------------

  if (
    Array.isArray(
      node.children
    )
  ) {

    node.children.forEach(
      (
        child,
        index
      ) => {

        buildIdMap(
          child,
          map,
          `${path}-${index}`
        );

      }
    );

  }


  return map;

}


// =====================================================
// RESOLVE TARGET REFERENCES
// =====================================================
//
// Supports:
//
// targetId: "interview-video"
//
// →
//
// targetId: "confo-interview-video-2"
//
// Existing target IDs that cannot be resolved are
// intentionally retained rather than removed.
//
// =====================================================

function resolveTargetReferences(
  props,
  idMap
) {

  if (
    !props ||
    typeof props !== "object"
  ) {

    return props;

  }


  const resolved = {
    ...props,
  };


  if (
    typeof resolved.targetId ===
      "string"
  ) {

    resolved.targetId =
      idMap.get(
        resolved.targetId
      ) ||
      resolved.targetId;

  }


  return resolved;

}


// =====================================================
// INSTALL NODE
// =====================================================
//
// Recursive installation.
//
// IMPORTANT:
//
// children are NEVER flattened.
//
// Every installed child remains inside:
//
// parent.children[]
//
// In addition, parent relationships are written into
// metadata so downstream Canvas code can reconstruct
// hierarchy safely even if it temporarily works with a
// flattened element collection.
// =====================================================

function installNode(
  node,
  path,
  idMap,
  parentNode = null,
  depth = 0
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  // ===================================================
  // SOURCE ID
  // ===================================================

  const sourceId =
    getSourceId(
      node
    );


  // ===================================================
  // INSTALLED ID
  // ===================================================

  const installedId =
    sourceId

      ? (
          idMap.get(
            sourceId
          ) ||
          createInstalledId(
            sourceId,
            path
          )
        )

      : createInstalledId(
          node.type ||
          "element",
          path
        );


  // ===================================================
  // PARENT INFORMATION
  // ===================================================

  const parentId =
    parentNode?.id ||
    null;


  const parentSourceId =
    parentNode
      ? (
          getSourceId(
            parentNode
          ) ||
          null
        )
      : null;


  // ===================================================
  // META
  // ===================================================
  //
  // Preserve ALL existing metadata.
  //
  // Then add installer metadata without overwriting
  // the important source relationship.
  //
  // ===================================================

  const installedMeta = {

    ...getOriginalMeta(
      node
    ),

    source:
      node.meta?.source ||
      "confo",

    sourceId:
      sourceId,

    installedId:
      installedId,

    treePath:
      path,

    depth:
      depth,

    parentId:
      parentId,

    parentSourceId:
      parentSourceId,

  };


  // ===================================================
  // PROJECT NODE
  // ===================================================

  const installedNode = {

    id:
      installedId,

    type:
      node.type ||
      "Text",

    props:
      resolveTargetReferences(
        {
          ...(node.props || {}),
        },
        idMap
      ),

    meta:
      installedMeta,

    ...(node.x !== undefined
      ? {
          x:
            node.x,
        }
      : {}),

    ...(node.y !== undefined
      ? {
          y:
            node.y,
        }
      : {}),

    ...(node.width !== undefined
      ? {
          width:
            node.width,
        }
      : {}),

    ...(node.height !== undefined
      ? {
          height:
            node.height,
        }
      : {}),

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
  // CHILDREN
  // ===================================================
  //
  // CRITICAL:
  //
  // The hierarchy remains nested.
  //
  // We do NOT convert children into siblings.
  //
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

              `${path}-${childIndex}`,

              idMap,

              installedNode,

              depth + 1
            )
        )

        .filter(
          Boolean
        );


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
// GET INSTALL ROOT
// =====================================================
//
// Converts the Confo logical root into the project App
// root when necessary.
//
// IMPORTANT:
//
// The logical Container itself is NOT installed as a
// detached Canvas element.
//
// Its children become the App's children while retaining
// their complete internal hierarchy.
//
// =====================================================

function getInstallRoot(
  confoTree
) {

  if (
    !confoTree ||
    typeof confoTree !== "object"
  ) {

    return null;

  }


  // ---------------------------------------------------
  // Existing App root
  // ---------------------------------------------------

  if (
    confoTree.type ===
    "App"
  ) {

    return confoTree;

  }


  // ---------------------------------------------------
  // Logical Container root
  // ---------------------------------------------------

  if (
    confoTree.type ===
    "Container"
  ) {

    return {

      id:
        "root",

      type:
        "App",

      props:
        {},

      children:
        Array.isArray(
          confoTree.children
        )
          ? confoTree.children
          : [],

      meta: {

        source:
          "confo-root-container",

        confoLayout:
          confoTree.props?.layout ||
          "vertical",

        sourceId:
          null,

      },

    };

  }


  // ---------------------------------------------------
  // Any other root
  // ---------------------------------------------------

  return {

    id:
      "root",

    type:
      "App",

    props:
      {},

    children: [
      confoTree,
    ],

    meta: {

      source:
        "confo-root",

      sourceId:
        null,

    },

  };

}


// =====================================================
// DEBUG HIERARCHY
// =====================================================

function debugHierarchy(
  node,
  depth = 0
) {

  if (
    !node
  ) {

    return;

  }


  const prefix =
    "  ".repeat(
      depth
    );


  console.log(
    `${prefix}${node.type}`,
    {

      id:
        node.id,

      sourceId:
        node.meta?.sourceId,

      parentId:
        node.meta?.parentId,

      parentSourceId:
        node.meta?.parentSourceId,

      treePath:
        node.meta?.treePath,

      depth:
        node.meta?.depth,

      meta:
        node.meta,

    }
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


// =====================================================
// VALIDATE INSTALLED HIERARCHY
// =====================================================
//
// This deliberately runs after installation.
//
// It does NOT modify the tree.
//
// It only detects structural problems so we can see
// whether the installer itself has detached anything.
//
// =====================================================

function validateInstalledHierarchy(
  node,
  result = {
    valid:
      true,

    errors: [],

    nodes:
      0,

  },
  parent = null
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return result;

  }


  result.nodes +=
    1;


  // ---------------------------------------------------
  // Parent relationship
  // ---------------------------------------------------

  if (
    parent
  ) {

    const expectedParentId =
      parent.id ||
      null;


    const actualParentId =
      node.meta?.parentId ||
      null;


    if (
      expectedParentId !==
      actualParentId
    ) {

      result.valid =
        false;


      result.errors.push(

        `Hierarchy mismatch for '${node.id}': expected parent '${expectedParentId}', received '${actualParentId}'.`

      );

    }

  }
  else {

    // Root App is allowed to have no parent.

    if (
      node.meta?.parentId
    ) {

      result.valid =
        false;


      result.errors.push(

        `Root node '${node.id}' unexpectedly contains parentId '${node.meta.parentId}'.`

      );

    }

  }


  // ---------------------------------------------------
  // Recursive validation
  // ---------------------------------------------------

  if (
    Array.isArray(
      node.children
    )
  ) {

    node.children.forEach(
      child =>
        validateInstalledHierarchy(
          child,
          result,
          node
        )
    );

  }


  return result;

}


// =====================================================
// FIND NODE BY SOURCE ID
// =====================================================

function findNodeBySourceId(
  node,
  sourceId
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  if (
    node.meta?.sourceId ===
    sourceId
  ) {

    return node;

  }


  if (
    node.id ===
    sourceId
  ) {

    return node;

  }


  if (
    Array.isArray(
      node.children
    )
  ) {

    for (
      const child of node.children
    ) {

      const found =
        findNodeBySourceId(
          child,
          sourceId
        );


      if (
        found
      ) {

        return found;

      }

    }

  }


  return null;

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
    {

      id:
        confo?.id,

      name:
        confo?.name,

      version:
        confo?.version,

    }
  );


  // ===================================================
  // VALIDATION
  // ===================================================

  if (
    !confo
  ) {

    return {

      success:
        false,

      errors: [
        "Cannot install undefined Confo.",
      ],

    };

  }


  if (
    !confo.tree
  ) {

    return {

      success:
        false,

      errors: [
        "Cannot install Confo without a tree.",
      ],

    };

  }


  // ===================================================
  // RESOLVE ROOT
  // ===================================================

  const logicalRoot =
    getInstallRoot(
      confo.tree
    );


  if (
    !logicalRoot
  ) {

    return {

      success:
        false,

      errors: [
        "Failed to resolve Confo project root.",
      ],

    };

  }


  // ===================================================
  // BUILD ID MAP
  // ===================================================

  const idMap =
    buildIdMap(
      logicalRoot
    );


  console.log(
    "[ConfoProjectInstaller] ID MAP",
    Object.fromEntries(
      idMap.entries()
    )
  );


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

            String(
              index
            ),

            idMap,

            null,

            0
          )
      )

      .filter(
        Boolean
      );


  // ===================================================
  // PROJECT TREE
  // ===================================================

  const installedTree = {

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

    meta: {

      ...(projectSchema?.tree?.meta || {}),

      source:
        "project-tree",

      sourceId:
        null,

      installedFromConfo:
        confo.id ||
        confo.name,

      confoName:
        confo.name,

      confoVersion:
        confo.version ||
        1,

      treePath:
        "root",

      depth:
        0,

      parentId:
        null,

      parentSourceId:
        null,

    },

  };


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[ConfoProjectInstaller] INSTALLED TREE",
    installedTree
  );


  debugHierarchy(
    installedTree
  );


  // ===================================================
  // HIERARCHY VALIDATION
  // ===================================================

  const hierarchyValidation =
    validateInstalledHierarchy(
      installedTree
    );


  console.log(
    "[ConfoProjectInstaller] HIERARCHY VALIDATION",
    hierarchyValidation
  );


  // ===================================================
  // EXPLICIT VIDEOFEED CHECK
  // ===================================================

  const interviewVideo =
    findNodeBySourceId(
      installedTree,
      "interview-video"
    );


  console.log(
    "[ConfoProjectInstaller] INTERVIEW VIDEO",
    {

      found:
        !!interviewVideo,

      id:
        interviewVideo?.id ||
        null,

      sourceId:
        interviewVideo?.meta?.sourceId ||
        null,

      parentId:
        interviewVideo?.meta?.parentId ||
        null,

      treePath:
        interviewVideo?.meta?.treePath ||
        null,

      meta:
        interviewVideo?.meta ||
        null,

    }
  );


  // ===================================================
  // SUCCESS
  // ===================================================

  return {

    success:
      true,

    errors:
      hierarchyValidation.valid
        ? []
        : hierarchyValidation.errors,

    tree:
      installedTree,

    confo,

    previousTree:
      projectSchema?.tree ||
      null,

    hierarchy: {

      valid:
        hierarchyValidation.valid,

      nodes:
        hierarchyValidation.nodes,

    },

  };

}


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  installConfo,
};