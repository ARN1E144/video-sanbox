// src/components/ElementPalette.js

import React, {
  useEffect,
  useMemo,
} from "react";

import {
  useRuntimeAuth,
} from "../context/RuntimeAuthContext";

import componentRegistry
  from "./elements/registry";


// =====================================================
// ELEMENT PALETTE
// =====================================================
//
// Builder source of truth:
//
//   componentRegistry
//         ↓
//   component + contract
//         ↓
//   allowedElements
//         ↓
//   palette
//
// No .meta.json files are required.
// =====================================================

export default function ElementPalette({
  onAdd,
}) {

  const {
    role,
    allowedElements,
    canBuild,
  } =
    useRuntimeAuth();


  // ===================================================
  // NORMALISE ALLOWED ELEMENTS
  // ===================================================

  const permittedNames =
    useMemo(
      () =>
        Array.isArray(
          allowedElements
        )
          ? new Set(
              allowedElements.map(
                name =>
                  String(
                    name
                  )
              )
            )
          : new Set(),
      [
        allowedElements,
      ]
    );


  // ===================================================
  // BUILD PALETTE ITEMS FROM REGISTRY
  // ===================================================

  const elements =
    useMemo(
      () => {

        return Object.entries(
          componentRegistry
        )

          .map(
            (
              [
                registryName,
                entry,
              ]
            ) => {

              const contract =
                entry?.contract ||
                {};


              const name =
                contract.name ||
                registryName;


              return {

                name,

                icon:
                  contract.icon ||
                  "🧩",

                category:
                  contract.category ||
                  "general",

                description:
                  contract.description ||
                  "",

                component:
                  entry.component,

                contract,

                registryName,

              };

            }
          )

          .filter(
            element =>
              permittedNames.has(
                element.name
              )
          );

      },
      [
        permittedNames,
      ]
    );


  // ===================================================
  // DEBUG
  // ===================================================

  useEffect(() => {

    console.log(
      "[ELEMENT PALETTE]",
      {

        role,

        allowedElements,

        registered:
          Object.keys(
            componentRegistry
          ),

        available:
          elements.map(
            element =>
              element.name
          ),

      }
    );

  }, [
    role,
    allowedElements,
    elements,
  ]);


  // ===================================================
  // BUILDER ACCESS
  // ===================================================

  if (
    !canBuild
  ) {

    return (

      <div
        className="
          p-3
          text-sm
          text-gray-400
        "
      >

        Builder access required

      </div>

    );

  }


  // ===================================================
  // PALETTE
  // ===================================================

  return (

    <div
      className="
        flex
        flex-col
        gap-2
        p-3
        border-r
        border-border
        bg-panel
        w-52
      "
    >

      <h3
        className="
          text-sm
          font-semibold
          mb-2
          text-text-primary
        "
      >

        🧩 Elements

      </h3>


      {elements.map(
        element => (

          <button

            key={
              element.name
            }

            type="button"

            onClick={() =>
              onAdd(
                element
              )
            }

            title={
              element.description
            }

            className="
              flex
              items-center
              gap-2
              px-3
              py-2
              rounded-md
              hover:bg-accent/10
              text-sm
              transition
            "
          >

            <span>
              {
                element.icon
              }
            </span>

            <span>
              {
                element.name
              }
            </span>

          </button>

        )
      )}

    </div>

  );

}
