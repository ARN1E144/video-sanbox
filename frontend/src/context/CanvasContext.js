// src/context/CanvasContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

import { useProjectContext } from "./ProjectContext";

import componentRegistry from "../actions/componentRegistry";

import {
  projectTreeToElements,
} from "../runtime/project/ProjectTreeLoader";

import {
  elementsToProjectTree,
} from "../runtime/project/ProjectTreeWriter";

const CanvasContext = createContext();

// =====================================================
// DEFAULT EXTRACTION
// =====================================================
//
// Contract editableProps describe the PROPERTY TYPE.
// They are not the property's actual runtime value.
//
// Example:
//
// editableProps: {
//
//   source: {
//     type: "string"
//   },
//
//   columns: {
//     type: "number"
//   }
//
// }
//
// MUST become:
//
// props: {
//
//   source: "",
//
//   columns: 0
//
// }
//
// rather than:
//
// props: {
//
//   source: {
//     type: "string"
//   }
//
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
    (
      [
        key,
        definition,
      ]
    ) => {

      // -------------------------------------------------
      // Explicit default always wins.
      // -------------------------------------------------

      if (
        definition &&
        typeof definition ===
          "object" &&
        definition.default !==
          undefined
      ) {

        result[key] =
          definition.default;


        return;

      }


      // -------------------------------------------------
      // Primitive definition.
      //
      // Example:
      //
      // source: ""
      // -------------------------------------------------

      if (
        typeof definition !==
          "object" ||
        definition === null
      ) {

        result[key] =
          definition;

        return;

      }


      // -------------------------------------------------
      // Type-based defaults.
      // -------------------------------------------------

      const type =
        String(
          definition.type ||
          ""
        )
          .toLowerCase();


      if (
        type ===
          "string"
      ) {

        result[key] =
          "";

        return;

      }


      if (
        type ===
          "number"
      ) {

        result[key] =
          0;

        return;

      }


      if (
        type ===
          "boolean"
      ) {

        result[key] =
          false;

        return;

      }


      if (
        type ===
          "object"
      ) {

        result[key] =
          null;

        return;

      }


      if (
        type ===
          "array"
      ) {

        result[key] =
          [];

        return;

      }


      // -------------------------------------------------
      // Union types.
      //
      // Example:
      //
      // "number|string"
      // -------------------------------------------------

      if (
        type.includes(
          "string"
        )
      ) {

        result[key] =
          "";

        return;

      }


      if (
        type.includes(
          "number"
        )
      ) {

        result[key] =
          0;

        return;

      }


      if (
        type.includes(
          "boolean"
        )
      ) {

        result[key] =
          false;

        return;

      }


      // -------------------------------------------------
      // Unknown definition.
      //
      // Don't leak the contract object into component
      // props.
      // -------------------------------------------------

      result[key] =
        null;

    }
  );


  return result;

}

// =====================================================
// NORMALIZE ELEMENT
// =====================================================

function normalizeElement(
  el
) {

  if (
    !el ||
    typeof el !==
      "object"
  ) {

    return null;

  }


  const registryEntry =
    componentRegistry?.[
      el.type
    ];


  // ===================================================
  // CONTRACT DEFAULTS
  // ===================================================

  const contractDefaults =
    registryEntry
      ?.contract
      ?.editableProps ||
    {};


  const defaultProps =
    extractDefaults(
      contractDefaults
    );


  // ===================================================
  // ACTUAL ELEMENT PROPS
  // ===================================================
  //
  // Explicit element props override contract defaults.
  //
  // ===================================================

  const props = {

    ...defaultProps,

    ...(el.props || {}),

  };


  // ===================================================
  // NORMALISED ELEMENT
  // ===================================================

  return {

    ...el,

    type:
      registryEntry
        ? el.type
        : "Text",

    parentId:
      el.parentId ??
      null,

    props,

  };

}


// =====================================================
// NORMALIZE ELEMENTS
// =====================================================

function normalizeElements(list) {

  if (!Array.isArray(list)) {

    return [];

  }

  return list
    .map(normalizeElement)
    .filter(Boolean);

}

// =====================================================
// PROVIDER
// =====================================================

export function CanvasProvider({
  children
}) {

  const {
    projectSchema,
    setProjectSchema,
  } = useProjectContext();

  const [
    elements,
    setElements
  ] = useState([]);

  const isSyncingRef =
    useRef(false);

  // =====================================================
  // TREE → CANVAS
  // =====================================================

  useEffect(() => {

    if (
      isSyncingRef.current
    ) {

      isSyncingRef.current =
        false;

      return;

    }

    if (
      !projectSchema?.tree
    ) {

      setElements([]);

      return;

    }

    const generated =
      projectTreeToElements(
        projectSchema.tree
      );

    const normalized =
      normalizeElements(
        generated
      );

    console.table(
      normalized.map(el => ({
        id: el.id,
        type: el.type,
        parentId: el.parentId,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height
      }))
    );

    console.log(
      "[Canvas] Hydrating from tree",
      normalized
    );

    console.log(
      "🟢 TREE → CANVAS",
      projectSchema?.tree
    );

    setElements(
      normalized
    );

  }, [
    projectSchema?.tree
  ]);

  // =====================================================
  // CANVAS → TREE
  // =====================================================

  const syncTree =
    useCallback(
      (nextElements) => {

        const tree =
          elementsToProjectTree(
            nextElements
          );

        console.log(
          "🔵 CANVAS → TREE",
          tree
        );

        isSyncingRef.current =
          true;

        setProjectSchema(
          prev => ({

            ...prev,

            tree,

          })
        );

      },
      [
        setProjectSchema
      ]
    );

  // =====================================================
  // ADD ELEMENT
  // =====================================================

  const addElement =
    useCallback(
      (newEl) => {

        const normalized =
          normalizeElement(
            newEl
          );

        console.log(
          "[NORMALIZED ELEMENT]",
          {
            input: newEl,
            output: normalized
          }
        );

        if (!normalized) {

          return;

        }

        setElements(prev => {

          const next = [

            ...prev,

            normalized

          ];

          console.log(
            "[CANVAS ELEMENTS AFTER ADD]",
            next.map(e => ({

              id: e.id,

              type: e.type,

              role: e.role,

              parentId:
                e.parentId

            }))
          );

          syncTree(next);

          return next;

        });

      },
      [
        syncTree
      ]
    );

  // =====================================================
  // UPDATE ELEMENT
  // =====================================================

  const updateElement =
    useCallback(
      (
        id,
        updates
      ) => {

        setElements(prev => {

          const next =
            prev.map(el => {

              if (
                el.id !== id
              ) {

                return el;

              }

              return normalizeElement({

                ...el,

                ...updates,

                props: {

                  ...(el.props || {}),

                  ...(updates?.props || {})

                }

              });

            });

          console.log(
            "[UPDATE ELEMENT → SYNC TREE]",
            next.find(el => el.id === id)
          );

          syncTree(next);

          console.log(
            "[SYNC TREE INPUT]",
            next
          );

          return next;

        });

      },
      [
        syncTree
      ]
    );

  // =====================================================
  // MOVE ELEMENT TO PARENT
  // =====================================================

  const moveElementToParent =
    useCallback(
      (
        elementId,
        parentId = null
      ) => {

        setElements(prev => {

          const element =
            prev.find(
              el =>
                el.id === elementId
            );

          if (!element) {

            console.warn(
              "[Canvas] Cannot move missing element",
              elementId
            );

            return prev;

          }

          // ---------------------------------------------
          // Prevent self-parenting
          // ---------------------------------------------

          if (
            parentId === elementId
          ) {

            console.warn(
              "[Canvas] Cannot parent element to itself",
              {
                elementId,
                parentId
              }
            );

            return prev;

          }

          // ---------------------------------------------
          // Parent must exist unless null
          // ---------------------------------------------

          if (
            parentId !== null &&
            !prev.some(
              el =>
                el.id === parentId
            )
          ) {

            console.warn(
              "[Canvas] Parent does not exist",
              {
                elementId,
                parentId
              }
            );

            return prev;

          }

          // ---------------------------------------------
          // Prevent circular hierarchy
          // ---------------------------------------------

          if (parentId !== null) {

            let currentParent =
              prev.find(
                el =>
                  el.id === parentId
              );

            while (currentParent) {

              if (
                currentParent.id === elementId
              ) {

                console.warn(
                  "[Canvas] Circular hierarchy rejected",
                  {
                    elementId,
                    parentId
                  }
                );

                return prev;

              }

              if (
                !currentParent.parentId
              ) {

                break;

              }

              currentParent =
                prev.find(
                  el =>
                    el.id ===
                    currentParent.parentId
                );

            }

          }

          const next =
            prev.map(el => {

              if (
                el.id !== elementId
              ) {

                return el;

              }

              return normalizeElement({

                ...el,

                parentId

              });

            });

          console.log(
            "[CANVAS PARENT CHANGE]",
            {
              elementId,
              parentId
            }
          );

          syncTree(next);

          return next;

        });

      },
      [
        syncTree
      ]
    );

  // =====================================================
  // REMOVE ELEMENT
  // =====================================================

  const removeElement =
    useCallback(
      (id) => {

        setElements(prev => {

          /*
          =================================================
          REMOVE THE ELEMENT AND ITS CHILDREN
          =================================================
          */

          const idsToRemove =
            new Set([id]);

          let changed = true;

          while (changed) {

            changed = false;

            prev.forEach(el => {

              if (
                el.parentId &&
                idsToRemove.has(
                  el.parentId
                ) &&
                !idsToRemove.has(
                  el.id
                )
              ) {

                idsToRemove.add(
                  el.id
                );

                changed = true;

              }

            });

          }

          const next =
            prev.filter(
              el =>
                !idsToRemove.has(
                  el.id
                )
            );

          syncTree(next);

          return next;

        });

      },
      [
        syncTree
      ]
    );

  // =====================================================
  // CLEAR CANVAS
  // =====================================================

  const clearCanvas =
    useCallback(
      () => {

        setElements([]);

        syncTree([]);

      },
      [
        syncTree
      ]
    );

  // =====================================================
  // LOAD ELEMENTS
  // =====================================================

  const loadElements =
    useCallback(
      (saved) => {

        const normalized =
          normalizeElements(
            saved
          );

        setElements(
          normalized
        );

        syncTree(
          normalized
        );

      },
      [
        syncTree
      ]
    );

  // =====================================================
  // CONTEXT
  // =====================================================

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

      {children}

    </CanvasContext.Provider>

  );

}

// =====================================================
// HOOK
// =====================================================

export function useCanvasState() {

  const ctx =
    useContext(
      CanvasContext
    );

  if (!ctx) {

    throw new Error(
      "useCanvasState must be used inside CanvasProvider"
    );

  }

  return ctx;

}