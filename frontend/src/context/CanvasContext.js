// src/context/CanvasContext.js

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useProjectContext,
} from "./ProjectContext";

import registry from "../components/elements/registry";

import {
  projectTreeToElements,
} from "../runtime/project/ProjectTreeLoader";


// =====================================================
// CONTEXT
// =====================================================

export const CanvasContext =
  createContext(null);


// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_ELEMENT_WIDTH = 300;
const DEFAULT_ELEMENT_HEIGHT = 150;

const CANVAS_SCHEMA_VERSION = 1;


// =====================================================
// HELPERS
// =====================================================

function isFiniteNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}


// =====================================================
// NORMALISE ID
// =====================================================

function normaliseId(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const result =
    String(value).trim();

  return result || null;
}


// =====================================================
// EXTRACT DEFAULT PROPS
// =====================================================
//
// Registry editableProps may contain:
//
// {
//   text: "Hello"
// }
//
// or:
//
// {
//   text: {
//     type: "string",
//     default: "Hello"
//   }
// }
//
// =====================================================

function extractDefaults(
  editableProps = {}
) {

  const result = {};

  Object.entries(
    editableProps
  ).forEach(
    ([key, config]) => {

      if (
        config &&
        typeof config === "object" &&
        !Array.isArray(config) &&
        config.default !== undefined
      ) {

        result[key] =
          config.default;

        return;
      }

      result[key] =
        config;
    }
  );

  return result;
}


// =====================================================
// GET REGISTRY ENTRY
// =====================================================

function getRegistryEntry(
  type
) {

  if (
    !type
  ) {
    return null;
  }

  return (
    registry?.[type] ||
    null
  );
}


// =====================================================
// NORMALISE ELEMENT
// =====================================================
//
// IMPORTANT:
//
// Canvas geometry is canonical.
//
// x/y/width/height are stored in unscaled
// canvas coordinates.
//
// The Canvas component is responsible for
// applying display scale.
//
// =====================================================

function normalizeElement(
  element
) {

  if (
    !element ||
    typeof element !== "object"
  ) {
    return null;
  }

  const rawType =
    element.type ||
    "Text";

  const registryEntry =
    getRegistryEntry(
      rawType
    );

  const type =
    registryEntry
      ? rawType
      : "Text";

  const editableDefaults =
    extractDefaults(
      registryEntry?.meta?.editableProps ||
      {}
    );

  const existingProps =
    element.props &&
    typeof element.props === "object" &&
    !Array.isArray(element.props)
      ? element.props
      : {};

  const props = {
    ...editableDefaults,
    ...existingProps,
  };

  const id =
    normaliseId(
      element.id
    );

  if (
    !id
  ) {
    return null;
  }

  const parentId =
    normaliseId(
      element.parentId
    );

  const x =
    isFiniteNumber(element.x)
      ? element.x
      : 0;

  const y =
    isFiniteNumber(element.y)
      ? element.y
      : 0;

  const width =
    isFiniteNumber(element.width) &&
    element.width > 0
      ? element.width
      : DEFAULT_ELEMENT_WIDTH;

  const height =
    isFiniteNumber(element.height) &&
    element.height > 0
      ? element.height
      : DEFAULT_ELEMENT_HEIGHT;

  return {
    ...element,

    id,

    type,

    parentId,

    role:
      element.role ??
      null,

    x,

    y,

    width,

    height,

    props,

    meta:
      element.meta &&
      typeof element.meta === "object"
        ? {
            ...element.meta,
          }
        : {},
  };
}


// =====================================================
// NORMALISE ELEMENT COLLECTION
// =====================================================
//
// Guarantees:
//
// - valid objects only
// - valid IDs
// - no duplicate IDs
// - stable array ordering
//
// =====================================================

function normalizeElements(
  list
) {

  if (
    !Array.isArray(list)
  ) {
    return [];
  }

  const result = [];

  const seenIds =
    new Set();

  list.forEach(
    element => {

      const normalized =
        normalizeElement(
          element
        );

      if (
        !normalized
      ) {
        return;
      }

      if (
        seenIds.has(
          normalized.id
        )
      ) {

        console.warn(
          "[CanvasContext] Duplicate element ID skipped",
          {
            id:
              normalized.id,

            type:
              normalized.type,
          }
        );

        return;
      }

      seenIds.add(
        normalized.id
      );

      result.push(
        normalized
      );
    }
  );

  return result;
}


// =====================================================
// VALIDATE HIERARCHY
// =====================================================
//
// Removes:
//
// - self-parenting
// - orphaned parent references
// - circular parent chains
//
// We intentionally do not change geometry here.
//
// Geometry belongs to the canonical Canvas model.
//
// =====================================================

function validateHierarchy(
  elements
) {

  const normalized =
    normalizeElements(
      elements
    );

  const ids =
    new Set(
      normalized.map(
        element =>
          element.id
      )
    );

  const byId =
    new Map(
      normalized.map(
        element => [
          element.id,
          element,
        ]
      )
    );

  return normalized.map(
    element => {

      let parentId =
        normaliseId(
          element.parentId
        );

      if (
        !parentId
      ) {
        return {
          ...element,
          parentId:
            null,
        };
      }

      if (
        parentId ===
        element.id
      ) {

        console.warn(
          "[CanvasContext] Self-parenting repaired",
          {
            id:
              element.id,
          }
        );

        return {
          ...element,
          parentId:
            null,
        };
      }

      if (
        !ids.has(
          parentId
        )
      ) {

        console.warn(
          "[CanvasContext] Orphaned parent repaired",
          {
            id:
              element.id,

            parentId,
          }
        );

        return {
          ...element,
          parentId:
            null,
        };
      }

      const visited =
        new Set();

      let currentId =
        element.id;

      let circular =
        false;

      while (
        currentId
      ) {

        if (
          visited.has(
            currentId
          )
        ) {

          circular =
            true;

          break;
        }

        visited.add(
          currentId
        );

        const current =
          byId.get(
            currentId
          );

        if (
          !current?.parentId
        ) {
          break;
        }

        currentId =
          current.parentId;
      }

      if (
        circular
      ) {

        console.warn(
          "[CanvasContext] Circular hierarchy repaired",
          {
            id:
              element.id,
          }
        );

        return {
          ...element,
          parentId:
            null,
        };
      }

      return {
        ...element,
        parentId,
      };
    }
  );
}


// =====================================================
// PROJECT TREE → CANVAS
// =====================================================
//
// This is now a FALLBACK hydration path only.
//
// Normal reload:
//
// projectSchema.canvas.elements
//             ↓
//       Canvas elements
//
// Legacy / newly installed tree:
//
// projectSchema.tree
//             ↓
//     ProjectTreeLoader
//             ↓
//       Canvas elements
//
// =====================================================

function loadElementsFromTree(
  tree
) {

  if (
    !tree ||
    typeof tree !== "object"
  ) {
    return [];
  }

  try {

    const loaded =
      projectTreeToElements(
        tree
      );

    return validateHierarchy(
      loaded
    );

  } catch (
    error
  ) {

    console.error(
      "[CanvasContext] Tree → Canvas hydration failed",
      error
    );

    return [];
  }
}


// =====================================================
// CANVAS → PROJECT TREE
// =====================================================
//
// The project tree remains the structural representation
// used by Confo/runtime.
//
// Canvas geometry is ALSO persisted separately under:
//
// projectSchema.canvas.elements
//
// =====================================================

function elementsToProjectTree(
  elements,
  previousTree
) {

  const normalized =
    validateHierarchy(
      elements
    );

  const previous =
    previousTree &&
    typeof previousTree === "object"
      ? previousTree
      : {};

  const appId =
    previous.id ||
    "app";

  const appNode = {
    ...previous,

    id:
      appId,

    type:
      "App",

    name:
      previous.name ||
      "Untitled App",

    version:
      previous.version ??
      1,

    children:
      [],
  };

  delete appNode.parentId;
  delete appNode.x;
  delete appNode.y;
  delete appNode.width;
  delete appNode.height;

  const nodes =
    new Map();

  normalized.forEach(
    element => {

      nodes.set(
        element.id,
        {
          id:
            element.id,

          type:
            element.type,

          x:
            element.x,

          y:
            element.y,

          width:
            element.width,

          height:
            element.height,

          props:
            element.props &&
            typeof element.props === "object"
              ? {
                  ...element.props,
                }
              : {},

          meta:
            element.meta &&
            typeof element.meta === "object"
              ? {
                  ...element.meta,
                }
              : {},

          role:
            element.role ??
            null,

          children:
            [],
        }
      );
    }
  );

  normalized.forEach(
    element => {

      const node =
        nodes.get(
          element.id
        );

      if (
        !node
      ) {
        return;
      }

      const parentId =
        normaliseId(
          element.parentId
        );

      if (
        parentId &&
        nodes.has(
          parentId
        )
      ) {

        nodes
          .get(parentId)
          .children
          .push(
            node
          );

        return;
      }

      appNode.children.push(
        node
      );
    }
  );

  return appNode;
}


// =====================================================
// CANONICAL CANVAS SCHEMA
// =====================================================

function createCanvasSchema(
  elements,
  previousCanvas
) {

  return {
    ...(previousCanvas || {}),

    version:
      previousCanvas?.version ??
      CANVAS_SCHEMA_VERSION,

    elements:
      normalizeElements(
        elements
      ),
  };
}


// =====================================================
// CANVAS PROVIDER
// =====================================================

export function CanvasProvider({
  children,
}) {

  const {
    projectSchema,
    setProjectSchema,
    markProjectDirty,
  } =
    useProjectContext();


  // ===================================================
  // CANONICAL CANVAS STATE
  // ===================================================

  const [
    elements,
    setElements,
  ] = useState(
    []
  );


  // ===================================================
  // REFS
  // ===================================================
  //
  // Refs allow editor operations to always operate on
  // the latest canonical element collection without
  // relying on state updater side effects.
  //
  // ===================================================

  const elementsRef =
    useRef([]);

  const projectSchemaRef =
    useRef(
      projectSchema
    );

  const hydratingRef =
    useRef(false);

  const migrationRef =
    useRef(false);


  // ===================================================
  // KEEP PROJECT SCHEMA REF CURRENT
  // ===================================================

  useEffect(
    () => {

      projectSchemaRef.current =
        projectSchema;

    },
    [
      projectSchema,
    ]
  );


  // ===================================================
  // KEEP ELEMENT REF CURRENT
  // ===================================================

  const commitLocalElements =
    useCallback(
      nextElements => {

        const normalized =
          validateHierarchy(
            nextElements
          );

        elementsRef.current =
          normalized;

        setElements(
          normalized
        );

        return normalized;
      },
      []
    );


  // ===================================================
  // PERSIST CANONICAL CANVAS
  // =====================================================
  //
  // Every real editor change writes BOTH:
  //
  //   projectSchema.tree
  //   projectSchema.canvas.elements
  //
  // The two representations therefore remain aligned.
  //
  // ===================================================

  const persistElements =
    useCallback(
      (
        nextElements,
        {
          markDirty = true,
        } = {}
      ) => {

        const normalized =
          validateHierarchy(
            nextElements
          );

        const currentSchema =
          projectSchemaRef.current ||
          {};

        const nextTree =
          elementsToProjectTree(
            normalized,
            currentSchema.tree ||
              null
          );

        const nextCanvas =
          createCanvasSchema(
            normalized,
            currentSchema.canvas
          );

        hydratingRef.current =
          true;

        setProjectSchema(
          previous => ({
            ...previous,

            tree:
              nextTree,

            canvas:
              nextCanvas,
          })
        );

        if (
          markDirty
        ) {
          markProjectDirty();
        }

        return normalized;
      },
      [
        markProjectDirty,
        setProjectSchema,
      ]
    );


  // =====================================================
  // COMMIT EDIT
  // =====================================================
  //
  // This is the single write path used by add/update/
  // move/remove/load.
  //
  // =====================================================

  const commitElements =
    useCallback(
      (
        nextElements,
        {
          markDirty = true,
        } = {}
      ) => {

        const normalized =
          validateHierarchy(
            nextElements
          );

        commitLocalElements(
          normalized
        );

        persistElements(
          normalized,
          {
            markDirty,
          }
        );

        return normalized;
      },
      [
        commitLocalElements,
        persistElements,
      ]
    );


  // =====================================================
  // PROJECT SCHEMA → CANVAS HYDRATION
  // =====================================================
  //
  // IMPORTANT:
  //
  // If canonical canvas.elements exist, they WIN.
  //
  // We never reconstruct the editor geometry from the
  // tree during normal reload.
  //
  // This is the key fix for save/reload geometry drift.
  //
  // =====================================================

  useEffect(
    () => {

      if (
        hydratingRef.current
      ) {

        hydratingRef.current =
          false;

        return;
      }

      const schema =
        projectSchema;

      if (
        !schema ||
        typeof schema !== "object"
      ) {

        elementsRef.current =
          [];

        setElements(
          []
        );

        return;
      }


      // =================================================
      // CANONICAL CANVAS EXISTS
      // =================================================

      if (
        schema.canvas &&
        Array.isArray(
          schema.canvas.elements
        )
      ) {

        const canonical =
          validateHierarchy(
            schema.canvas.elements
          );

        console.log(
          "[CanvasContext] Hydrating canonical Canvas elements",
          {
            count:
              canonical.length,
          }
        );

        elementsRef.current =
          canonical;

        setElements(
          canonical
        );

        return;
      }


      // =================================================
      // LEGACY / TREE FALLBACK
      // =================================================
      //
      // Existing projects created before the canonical
      // Canvas model are migrated here.
      //
      // This is intentionally a one-time migration.
      //
      // =================================================

      const treeElements =
        loadElementsFromTree(
          schema.tree
        );

      console.log(
        "[CanvasContext] Hydrating Canvas from project tree",
        {
          count:
            treeElements.length,
        }
      );

      elementsRef.current =
        treeElements;

      setElements(
        treeElements
      );


      // =================================================
      // MIGRATE TREE → CANONICAL CANVAS
      // =================================================
      //
      // The tracked ProjectContext setter marks this as
      // dirty. This only occurs for projects which do not
      // yet contain canvas.elements.
      //
      // Once saved, subsequent loads use the canonical
      // Canvas representation and this path is never hit.
      //
      // =================================================

      if (
        !migrationRef.current
      ) {

        migrationRef.current =
          true;

        const migratedCanvas =
          createCanvasSchema(
            treeElements,
            schema.canvas
          );

        const migratedTree =
          elementsToProjectTree(
            treeElements,
            schema.tree ||
              null
          );

        hydratingRef.current =
          true;

        setProjectSchema(
          previous => ({
            ...previous,

            tree:
              migratedTree,

            canvas:
              migratedCanvas,
          })
        );

        markProjectDirty();

        console.log(
          "[CanvasContext] Legacy project migrated to canonical Canvas state"
        );
      }

    },
    [
      projectSchema,
      setProjectSchema,
      markProjectDirty,
    ]
  );


  // =====================================================
  // RESET MIGRATION FLAG WHEN A CANONICAL SCHEMA ARRIVES
  // =====================================================

  useEffect(
    () => {

      if (
        projectSchema?.canvas &&
        Array.isArray(
          projectSchema.canvas.elements
        )
      ) {

        migrationRef.current =
          false;
      }

    },
    [
      projectSchema?.canvas,
    ]
  );


  // =====================================================
  // ADD ELEMENT
  // =====================================================

  const addElement =
    useCallback(
      element => {

        const normalized =
          normalizeElement(
            element
          );

        if (
          !normalized
        ) {

          console.warn(
            "[CanvasContext] addElement rejected invalid element",
            element
          );

          return null;
        }

        const current =
          elementsRef.current;

        if (
          current.some(
            existing =>
              existing.id ===
              normalized.id
          )
        ) {

          console.warn(
            "[CanvasContext] addElement rejected duplicate ID",
            normalized.id
          );

          return null;
        }

        const next =
          [
            ...current,
            normalized,
          ];

        const validated =
          commitElements(
            next
          );

        return (
          validated.find(
            candidate =>
              candidate.id ===
              normalized.id
          ) ||
          null
        );
      },
      [
        commitElements,
      ]
    );


  // =====================================================
  // UPDATE ELEMENT
  // =====================================================

  const updateElement =
    useCallback(
      (
        id,
        updates = {}
      ) => {

        const targetId =
          normaliseId(
            id
          );

        if (
          !targetId
        ) {
          return null;
        }

        const current =
          elementsRef.current;

        const index =
          current.findIndex(
            element =>
              element.id ===
              targetId
          );

        if (
          index === -1
        ) {

          console.warn(
            "[CanvasContext] updateElement target not found",
            targetId
          );

          return null;
        }

        const existing =
          current[index];

        const nextProps =
          updates.props !== undefined
            ? {
                ...(existing.props || {}),
                ...(updates.props || {}),
              }
            : existing.props;

        const nextElement = {
          ...existing,

          ...updates,

          id:
            existing.id,

          props:
            nextProps,
        };


        // -----------------------------------------------
        // Explicit parent detach
        // -----------------------------------------------

        if (
          Object.prototype.hasOwnProperty.call(
            updates,
            "parentId"
          )
        ) {

          nextElement.parentId =
            normaliseId(
              updates.parentId
            );
        }


        // -----------------------------------------------
        // Never allow accidental ID mutation
        // -----------------------------------------------

        nextElement.id =
          existing.id;


        const normalized =
          normalizeElement(
            nextElement
          );

        if (
          !normalized
        ) {
          return null;
        }

        const next =
          [
            ...current,
          ];

        next[index] =
          normalized;

        const validated =
          commitElements(
            next
          );

        return (
          validated.find(
            candidate =>
              candidate.id ===
              targetId
          ) ||
          null
        );
      },
      [
        commitElements,
      ]
    );


  // =====================================================
  // MOVE ELEMENT TO PARENT
  // =====================================================
  //
  // Geometry is deliberately NOT changed here.
  //
  // The Layout Engine / Canvas renderer will eventually
  // decide how managed-container geometry is derived.
  //
  // For now this operation only changes hierarchy.
  //
  // =====================================================

  const moveElementToParent =
    useCallback(
      (
        id,
        parentId = null
      ) => {

        const targetId =
          normaliseId(
            id
          );

        const targetParentId =
          normaliseId(
            parentId
          );

        if (
          !targetId
        ) {
          return null;
        }

        if (
          targetParentId ===
          targetId
        ) {

          console.warn(
            "[CanvasContext] moveElementToParent rejected self-parenting",
            {
              id:
                targetId,
            }
          );

          return null;
        }

        const current =
          elementsRef.current;

        const target =
          current.find(
            element =>
              element.id ===
              targetId
          );

        if (
          !target
        ) {

          console.warn(
            "[CanvasContext] moveElementToParent target not found",
            targetId
          );

          return null;
        }

        if (
          targetParentId &&
          !current.some(
            element =>
              element.id ===
              targetParentId
          )
        ) {

          console.warn(
            "[CanvasContext] moveElementToParent parent not found",
            {
              id:
                targetId,

              parentId:
                targetParentId,
            }
          );

          return null;
        }


        // -----------------------------------------------
        // Cycle protection
        // -----------------------------------------------

        if (
          targetParentId
        ) {

          const visited =
            new Set();

          let currentId =
            targetParentId;

          while (
            currentId
          ) {

            if (
              currentId ===
              targetId
            ) {

              console.warn(
                "[CanvasContext] moveElementToParent rejected circular hierarchy",
                {
                  id:
                    targetId,

                  parentId:
                    targetParentId,
                }
              );

              return null;
            }

            if (
              visited.has(
                currentId
              )
            ) {
              break;
            }

            visited.add(
              currentId
            );

            const parent =
              current.find(
                element =>
                  element.id ===
                  currentId
              );

            currentId =
              parent?.parentId ||
              null;
          }
        }


        const next =
          current.map(
            element =>
              element.id ===
              targetId
                ? {
                    ...element,

                    parentId:
                      targetParentId,
                  }
                : element
          );

        const validated =
          commitElements(
            next
          );

        return (
          validated.find(
            element =>
              element.id ===
              targetId
          ) ||
          null
        );
      },
      [
        commitElements,
      ]
    );


  // =====================================================
  // REMOVE ELEMENT
  // =====================================================
  //
  // Removing a parent removes its entire subtree.
  //
  // =====================================================

  const removeElement =
    useCallback(
      id => {

        const targetId =
          normaliseId(
            id
          );

        if (
          !targetId
        ) {
          return false;
        }

        const current =
          elementsRef.current;

        const target =
          current.find(
            element =>
              element.id ===
              targetId
          );

        if (
          !target
        ) {

          return false;
        }


        // -----------------------------------------------
        // Collect subtree
        // -----------------------------------------------

        const removeIds =
          new Set([
            targetId,
          ]);

        let changed =
          true;

        while (
          changed
        ) {

          changed =
            false;

          current.forEach(
            element => {

              if (
                element.parentId &&
                removeIds.has(
                  element.parentId
                ) &&
                !removeIds.has(
                  element.id
                )
              ) {

                removeIds.add(
                  element.id
                );

                changed =
                  true;
              }
            }
          );
        }


        const next =
          current.filter(
            element =>
              !removeIds.has(
                element.id
              )
          );

        commitElements(
          next
        );

        return true;
      },
      [
        commitElements,
      ]
    );


  // =====================================================
  // CLEAR CANVAS
  // =====================================================

  const clearCanvas =
    useCallback(
      () => {

        commitElements(
          []
        );

        return true;
      },
      [
        commitElements,
      ]
    );


  // =====================================================
  // LOAD ELEMENTS
  // =====================================================
  //
  // Explicit external loading path.
  //
  // This should be used when a caller already has a
  // canonical element collection and wants it installed
  // into the editor.
  //
  // =====================================================

  const loadElements =
    useCallback(
      (
        savedElements = [],
        options = {}
      ) => {

        const normalized =
          validateHierarchy(
            savedElements
          );

        const shouldMarkDirty =
          options.markDirty !==
          undefined
            ? !!options.markDirty
            : true;

        commitElements(
          normalized,
          {
            markDirty:
              shouldMarkDirty,
          }
        );

        return normalized;
      },
      [
        commitElements,
      ]
    );


  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value =
    useMemo(
      () => ({

        // -------------------------------------------------
        // Canonical editor state
        // -------------------------------------------------

        elements,

        // -------------------------------------------------
        // Element operations
        // -------------------------------------------------

        addElement,

        updateElement,

        moveElementToParent,

        removeElement,

        clearCanvas,

        loadElements,

      }),
      [
        elements,

        addElement,

        updateElement,

        moveElementToParent,

        removeElement,

        clearCanvas,

        loadElements,
      ]
    );


  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <CanvasContext.Provider
      value={
        value
      }
    >
      {children}
    </CanvasContext.Provider>
  );
}


// =====================================================
// HOOK
// =====================================================

export function useCanvasState() {

  const context =
    useContext(
      CanvasContext
    );

  if (
    !context
  ) {

    throw new Error(
      "useCanvasState must be used within CanvasProvider"
    );
  }

  return context;
}


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default CanvasContext;