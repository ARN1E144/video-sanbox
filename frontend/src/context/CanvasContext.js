import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  useProjectContext,
} from "./ProjectContext";

import componentRegistry from "../actions/componentRegistry";

import {
  projectTreeToElements,
} from "../runtime/project/ProjectTreeLoader";


const CanvasContext =
  createContext();


/* =========================================================
   DEFAULT EXTRACTION
========================================================= */

function extractDefaults(
  editableProps = {}
) {

  const result = {};

  Object.entries(
    editableProps
  ).forEach(
    ([
      key,
      definition,
    ]) => {

      if (
        definition &&
        typeof definition === "object" &&
        definition.default !== undefined
      ) {

        result[key] =
          definition.default;

        return;

      }

      if (
        definition === null ||
        typeof definition !== "object"
      ) {

        result[key] =
          definition;

        return;

      }

      const type =
        String(
          definition.type ||
          ""
        )
          .toLowerCase()
          .trim();

      if (
        type.includes("string")
      ) {

        result[key] =
          "";

        return;

      }

      if (
        type.includes("number")
      ) {

        result[key] =
          0;

        return;

      }

      if (
        type.includes("boolean")
      ) {

        result[key] =
          false;

        return;

      }

      if (
        type.includes("array")
      ) {

        result[key] =
          [];

        return;

      }

      if (
        type.includes("object")
      ) {

        result[key] =
          null;

        return;

      }

      result[key] =
        null;

    }
  );

  return result;

}


/* =========================================================
   NORMALISE ELEMENT
========================================================= */

function normalizeElement(
  element
) {

  if (
    !element ||
    typeof element !== "object"
  ) {

    return null;

  }

  const registryEntry =
    componentRegistry?.[
      element.type
    ];

  const editableProps =
    registryEntry
      ?.contract
      ?.editableProps ||
    {};

  const defaultProps =
    extractDefaults(
      editableProps
    );

  const props = {
    ...defaultProps,
    ...(element.props || {}),
  };

  const normalized = {

    ...element,

    id:
      element.id ||
      null,

    type:
      registryEntry
        ? element.type
        : "Text",

    parentId:
      element.parentId ??
      null,

    role:
      element.role ??
      null,

    x:
      Number.isFinite(element.x)
        ? element.x
        : 0,

    y:
      Number.isFinite(element.y)
        ? element.y
        : 0,

    width:
      Number.isFinite(element.width)
        ? element.width
        : 300,

    height:
      Number.isFinite(element.height)
        ? element.height
        : 150,

    props,

    meta: {
      ...(element.meta || {}),
    },

  };

  return normalized;

}


/* =========================================================
   NORMALISE ELEMENT COLLECTION
========================================================= */

function normalizeElements(
  list
) {

  if (
    !Array.isArray(list)
  ) {

    return [];

  }

  const seenIds =
    new Set();

  const result = [];

  list.forEach(
    element => {

      const normalized =
        normalizeElement(
          element
        );

      if (!normalized) {

        return;

      }

      if (!normalized.id) {

        console.warn(
          "[Canvas] Ignoring element without ID",
          normalized
        );

        return;

      }

      if (
        seenIds.has(
          normalized.id
        )
      ) {

        console.warn(
          "[Canvas] Duplicate element ID ignored",
          {
            id:
              normalized.id,

            element:
              normalized,
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


/* =========================================================
   VALIDATE HIERARCHY
========================================================= */

function validateHierarchy(
  elements
) {

  if (
    !Array.isArray(elements)
  ) {

    return [];

  }

  const ids =
    new Set(
      elements.map(
        element =>
          element.id
      )
    );

  return elements.map(
    element => {

      if (
        !element.parentId
      ) {

        return element;

      }

      if (
        element.parentId ===
        element.id
      ) {

        console.warn(
          "[Canvas] Self-parenting removed",
          {
            elementId:
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
          element.parentId
        )
      ) {

        console.warn(
          "[Canvas] Missing parent removed",
          {
            elementId:
              element.id,

            parentId:
              element.parentId,
          }
        );

        return {
          ...element,
          parentId:
            null,
        };

      }

      return element;

    }
  );

}


/* =========================================================
   DETECT CIRCULAR REFERENCES
========================================================= */

function hasCircularParentChain(
  element,
  elementMap
) {

  const visited =
    new Set();

  let current =
    element;

  while (
    current?.parentId
  ) {

    if (
      visited.has(
        current.id
      )
    ) {

      return true;

    }

    visited.add(
      current.id
    );

    current =
      elementMap.get(
        current.parentId
      );

    if (!current) {

      return false;

    }

  }

  return false;

}


/* =========================================================
   REPAIR CIRCULAR REFERENCES
========================================================= */

function repairCircularHierarchy(
  elements
) {

  const elementMap =
    new Map(
      elements.map(
        element => [
          element.id,
          element,
        ]
      )
    );

  return elements.map(
    element => {

      if (
        hasCircularParentChain(
          element,
          elementMap
        )
      ) {

        console.warn(
          "[Canvas] Circular hierarchy repaired",
          {
            elementId:
              element.id,

            parentId:
              element.parentId,
          }
        );

        return {
          ...element,
          parentId:
            null,
        };

      }

      return element;

    }
  );

}


/* =========================================================
   CANVAS → PROJECT TREE
=========================================================
//
// Canvas elements are the canonical editable model.
//
// element.parentId
// element.x
// element.y
// element.width
// element.height
//
// parentId is authoritative for hierarchy.
//
// Child coordinates remain LOCAL to their parent.
// ========================================================= */

function elementsToProjectTree(
  elements,
  previousTree = null
) {

  const normalized =
    repairCircularHierarchy(
      validateHierarchy(
        normalizeElements(
          elements
        )
      )
    );

  const safePreviousTree =
    previousTree &&
    typeof previousTree === "object"
      ? previousTree
      : null;

  const previousRoot =
    safePreviousTree?.type === "App"
      ? safePreviousTree
      : null;

  const root = {

    type:
      "App",

    props: {
      ...(previousRoot?.props || {}),
    },

    meta: {
      ...(previousRoot?.meta || {}),
    },

    children: [],

  };

  /* Preserve App-level identity information. */

  if (
    previousRoot?.id !== undefined
  ) {

    root.id =
      previousRoot.id;

  }

  if (
    previousRoot?.name !== undefined
  ) {

    root.name =
      previousRoot.name;

  }

  if (
    previousRoot?.version !== undefined
  ) {

    root.version =
      previousRoot.version;

  }

  if (
    previousRoot?.metadata !== undefined
  ) {

    root.metadata =
      previousRoot.metadata;

  }

  const elementMap =
    new Map();

  normalized.forEach(
    element => {

      elementMap.set(
        element.id,
        element
      );

    }
  );

  const nodeMap =
    new Map();

  normalized.forEach(
    element => {

      const node = {

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

        props: {
          ...(element.props || {}),
        },

        meta: {
          ...(element.meta || {}),
        },

        children: [],

      };

      if (
        element.role !== undefined
      ) {

        node.role =
          element.role;

      }

      nodeMap.set(
        element.id,
        node
      );

    }
  );

  /*
   * Attach strictly through parentId.
   *
   * Never infer hierarchy from:
   * - x/y
   * - component type
   * - visual order
   */

  normalized.forEach(
    element => {

      const node =
        nodeMap.get(
          element.id
        );

      if (!node) {

        return;

      }

      if (
        element.parentId
      ) {

        const parent =
          nodeMap.get(
            element.parentId
          );

        if (
          parent
        ) {

          parent.children.push(
            node
          );

          return;

        }

        console.warn(
          "[Canvas] Parent node missing during tree write",
          {
            elementId:
              element.id,

            parentId:
              element.parentId,
          }
        );

      }

      root.children.push(
        node
      );

    }
  );

  console.log(
    "[Canvas] ELEMENTS → TREE",
    {
      elementCount:
        normalized.length,

      topLevelCount:
        root.children.length,

      tree:
        root,
    }
  );

  return root;

}


/* =========================================================
   PROVIDER
========================================================= */

export function CanvasProvider({
  children,
}) {

  const {
    projectSchema,
    setProjectSchema,
    markProjectDirty,
  } =
    useProjectContext();


  const [
    elements,
    setElements,
  ] =
    useState([]);


  const isHydratingRef =
    useRef(false);


  /* =======================================================
     TREE → CANVAS
  ======================================================= */

  useEffect(
    () => {

      /*
       * A tree change caused by Canvas → Tree is immediately
       * followed by this effect. It is already represented by
       * the current Canvas state, so do not re-hydrate it.
       */

      if (
        isHydratingRef.current
      ) {

        isHydratingRef.current =
          false;

        return;

      }


      if (
        !projectSchema?.tree
      ) {

        setElements(
          []
        );

        return;

      }


      const generated =
        projectTreeToElements(
          projectSchema.tree
        );


      const normalized =
        repairCircularHierarchy(
          validateHierarchy(
            normalizeElements(
              generated
            )
          )
        );


      console.table(
        normalized.map(
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


      console.log(
        "[Canvas] HYDRATING FROM PROJECT TREE",
        {
          tree:
            projectSchema.tree,

          elementCount:
            normalized.length,

          elements:
            normalized,
        }
      );


      setElements(
        normalized
      );

    },
    [
      projectSchema?.tree,
    ]
  );


  /* =======================================================
     CANVAS → TREE
  ======================================================= */

  const syncTree =
    useCallback(
      (
        nextElements,
        {
          markDirty = true,
        } = {}
      ) => {

        const tree =
          elementsToProjectTree(
            nextElements,

            projectSchema?.tree ||
              null
          );


        console.log(
          "[Canvas] CANVAS → TREE",
          tree
        );


        /*
         * The next projectSchema.tree update is generated
         * by the current Canvas state, not an external load.
         */

        isHydratingRef.current =
          true;


        setProjectSchema(
          previous => ({

            ...previous,

            tree,

          })
        );


        if (
          markDirty
        ) {

          markProjectDirty();

        }

      },
      [
        projectSchema?.tree,
        setProjectSchema,
        markProjectDirty,
      ]
    );


  /* =======================================================
     ADD ELEMENT
  ======================================================= */

  const addElement =
    useCallback(
      newElement => {

        const normalized =
          normalizeElement(
            newElement
          );


        if (!normalized) {

          console.warn(
            "[Canvas] Invalid element rejected",
            newElement
          );

          return;

        }


        if (!normalized.id) {

          console.warn(
            "[Canvas] Element requires an ID",
            newElement
          );

          return;

        }


        setElements(
          previous => {

            const existing =
              previous.some(
                element =>
                  element.id ===
                  normalized.id
              );


            if (
              existing
            ) {

              console.warn(
                "[Canvas] Duplicate element prevented",
                {
                  id:
                    normalized.id,
                }
              );

              return previous;

            }


            let next = [
              ...previous,
              normalized,
            ];


            next =
              repairCircularHierarchy(
                validateHierarchy(
                  next
                )
              );


            console.log(
              "[CANVAS ELEMENT ADDED]",
              {
                id:
                  normalized.id,

                type:
                  normalized.type,

                parentId:
                  normalized.parentId,
              }
            );


            syncTree(
              next,
              {
                markDirty:
                  true,
              }
            );


            return next;

          }
        );

      },
      [
        syncTree,
      ]
    );


  /* =======================================================
     UPDATE ELEMENT
  ======================================================= */

  const updateElement =
    useCallback(
      (
        id,
        updates = {}
      ) => {

        if (!id) {

          return;

        }


        setElements(
          previous => {

            const target =
              previous.find(
                element =>
                  element.id ===
                  id
              );


            if (!target) {

              console.warn(
                "[Canvas] Cannot update missing element",
                {
                  id,
                }
              );

              return previous;

            }


            const next =
              previous.map(
                element => {

                  if (
                    element.id !==
                    id
                  ) {

                    return element;

                  }


                  const merged = {

                    ...element,

                    ...updates,

                    props: {

                      ...(element.props || {}),

                      ...(updates?.props || {}),

                    },

                  };


                  /*
                   * Explicit null detaches.
                   * Undefined preserves the existing parent.
                   */

                  if (
                    updates.parentId !==
                    undefined
                  ) {

                    merged.parentId =
                      updates.parentId ??
                      null;

                  }
                  else {

                    merged.parentId =
                      element.parentId ??
                      null;

                  }


                  return normalizeElement(
                    merged
                  );

                }
              );


            const validated =
              repairCircularHierarchy(
                validateHierarchy(
                  next
                )
              );


            const updated =
              validated.find(
                element =>
                  element.id ===
                  id
              );


            console.log(
              "[CANVAS UPDATE ELEMENT]",
              {
                id,

                before:
                  target,

                updates,

                after:
                  updated,

                parentId:
                  updated?.parentId ??
                  null,
              }
            );


            /*
             * Parent movement and child movement are
             * independent.
             *
             * Updating a parent does not rewrite children.
             * Updating a child does not rewrite parentId.
             */

            syncTree(
              validated,
              {
                markDirty:
                  true,
              }
            );


            return validated;

          }
        );

      },
      [
        syncTree,
      ]
    );


  /* =======================================================
     MOVE ELEMENT TO PARENT
  ======================================================= */

  const moveElementToParent =
    useCallback(
      (
        elementId,
        parentId = null
      ) => {

        setElements(
          previous => {

            const element =
              previous.find(
                item =>
                  item.id ===
                  elementId
              );


            if (!element) {

              console.warn(
                "[Canvas] Cannot move missing element",
                {
                  elementId,
                }
              );

              return previous;

            }


            if (
              parentId ===
              elementId
            ) {

              console.warn(
                "[Canvas] Cannot parent element to itself",
                {
                  elementId,
                  parentId,
                }
              );

              return previous;

            }


            if (
              parentId !== null &&
              !previous.some(
                item =>
                  item.id ===
                  parentId
              )
            ) {

              console.warn(
                "[Canvas] Parent does not exist",
                {
                  elementId,
                  parentId,
                }
              );

              return previous;

            }


            /*
             * Prevent parent → descendant cycles.
             */

            if (
              parentId !== null
            ) {

              const visited =
                new Set();

              let currentId =
                parentId;


              while (
                currentId
              ) {

                if (
                  currentId ===
                  elementId
                ) {

                  console.warn(
                    "[Canvas] Circular hierarchy rejected",
                    {
                      elementId,
                      parentId,
                    }
                  );

                  return previous;

                }


                if (
                  visited.has(
                    currentId
                  )
                ) {

                  console.warn(
                    "[Canvas] Existing circular hierarchy detected",
                    {
                      elementId,
                      parentId,
                    }
                  );

                  return previous;

                }


                visited.add(
                  currentId
                );


                const current =
                  previous.find(
                    item =>
                      item.id ===
                      currentId
                  );


                currentId =
                  current?.parentId ||
                  null;

              }

            }


            const next =
              previous.map(
                item => {

                  if (
                    item.id !==
                    elementId
                  ) {

                    return item;

                  }


                  /*
                   * ONLY parentId changes.
                   * Child-local x/y are preserved.
                   */

                  return normalizeElement({

                    ...item,

                    parentId:
                      parentId ??
                      null,

                  });

                }
              );


            const validated =
              repairCircularHierarchy(
                validateHierarchy(
                  next
                )
              );


            console.log(
              "[CANVAS PARENT CHANGE]",
              {
                elementId,

                previousParentId:
                  element.parentId ??
                  null,

                parentId:
                  parentId ??
                  null,

              }
            );


            syncTree(
              validated,
              {
                markDirty:
                  true,
              }
            );


            return validated;

          }
        );

      },
      [
        syncTree,
      ]
    );


  /* =======================================================
     REMOVE ELEMENT
  ======================================================= */

  const removeElement =
    useCallback(
      id => {

        if (!id) {

          return;

        }


        setElements(
          previous => {

            const idsToRemove =
              new Set([
                id,
              ]);


            let changed =
              true;


            while (
              changed
            ) {

              changed =
                false;


              previous.forEach(
                element => {

                  if (
                    element.parentId &&
                    idsToRemove.has(
                      element.parentId
                    ) &&
                    !idsToRemove.has(
                      element.id
                    )
                  ) {

                    idsToRemove.add(
                      element.id
                    );

                    changed =
                      true;

                  }

                }
              );

            }


            const next =
              previous.filter(
                element =>
                  !idsToRemove.has(
                    element.id
                  )
              );


            console.log(
              "[CANVAS REMOVE ELEMENT]",
              {
                removedId:
                  id,

                removedIds:
                  Array.from(
                    idsToRemove
                  ),

                remaining:
                  next.length,
              }
            );


            syncTree(
              next,
              {
                markDirty:
                  true,
              }
            );


            return next;

          }
        );

      },
      [
        syncTree,
      ]
    );


  /* =======================================================
     CLEAR CANVAS
  ======================================================= */

  const clearCanvas =
    useCallback(
      () => {

        setElements(
          []
        );


        syncTree(
          [],
          {
            markDirty:
              true,
          }
        );

      },
      [
        syncTree,
      ]
    );


  /* =======================================================
     LOAD ELEMENTS
  ======================================================= */

  const loadElements =
    useCallback(
      saved => {

        const normalized =
          repairCircularHierarchy(
            validateHierarchy(
              normalizeElements(
                saved
              )
            )
          );


        console.log(
          "[Canvas] LOAD ELEMENTS",
          {
            count:
              normalized.length,

            elements:
              normalized,
          }
        );


        setElements(
          normalized
        );


        /*
         * loadElements is an explicit editor operation, so
         * it represents a user change and marks the project
         * as unsaved.
         */

        syncTree(
          normalized,
          {
            markDirty:
              true,
          }
        );

      },
      [
        syncTree,
      ]
    );


  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  return (

    <CanvasContext.Provider
      value={{

        elements,

        addElement,

        updateElement,

        moveElementToParent,

        removeElement,

        clearCanvas,

        loadElements,

      }}
    >

      {
        children
      }

    </CanvasContext.Provider>

  );

}


/* =========================================================
   HOOK
========================================================= */

export function useCanvasState() {

  const context =
    useContext(
      CanvasContext
    );


  if (!context) {

    throw new Error(
      "useCanvasState must be used inside CanvasProvider"
    );

  }


  return context;

}