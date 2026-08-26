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
- unwraps logical root containers

It does NOT:

- calculate Canvas layout
- render components
- create Canvas runtime state

ProjectTreeLoader handles Canvas layout.

IMPORTANT ID MODEL
-----------------------------------------------------

Confo ID:

    interview-video

Installed project ID:

    confo-interview-video-2

Metadata:

    meta.sourceId = "interview-video"

This gives us a stable relationship between the
template definition and the installed project instance.
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
// GET ORIGINAL SOURCE ID
// =====================================================
//
// This is deliberately independent from the generated
// installed ID.
//
// Example:
//
// node.id = "interview-video"
//
// installed node:
//
// id:
//   "confo-interview-video-2"
//
// meta.sourceId:
//   "interview-video"
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
// Confo:
//
// targetId: "interview-video"
//
// Installed:
//
// targetId: "confo-interview-video-2"
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

function installNode(
  node,
  path,
  idMap
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
  // META
  // ===================================================
  //
  // IMPORTANT:
  //
  // sourceId is written explicitly here.
  //
  // We do NOT rely on spreading node.meta to preserve
  // the relationship.
  //
  // ===================================================

  const installedMeta = {

    ...(node.meta || {}),

    source:
      node.meta?.source ||
      "confo",

    sourceId:
      sourceId,

    installedId:

      installedId,

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
              idMap
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
// UNWRAP ROOT
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
            String(index),
            idMap
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
  // EXPLICIT VIDEOFEED CHECK
  // ===================================================

  let interviewVideo = null;


  function findInterviewVideo(
    node
  ) {

    if (
      !node ||
      typeof node !== "object"
    ) {

      return;

    }


    if (
      node.meta?.sourceId ===
      "interview-video"
    ) {

      interviewVideo =
        node;

      return;

    }


    if (
      node.type ===
      "VideoFeed" &&
      (
        node.meta?.sourceId ===
          "interview-video" ||
        node.id ===
          "confo-interview-video"
      )
    ) {

      interviewVideo =
        node;

      return;

    }


    if (
      Array.isArray(
        node.children
      )
    ) {

      for (
        const child of node.children
      ) {

        if (
          interviewVideo
        ) {

          break;

        }


        findInterviewVideo(
          child
        );

      }

    }

  }


  findInterviewVideo(
    installedTree
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

    errors: [],

    tree:
      installedTree,

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
