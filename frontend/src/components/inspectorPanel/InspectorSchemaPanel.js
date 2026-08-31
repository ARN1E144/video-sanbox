// src/components/inspectorPanel/InspectorSchemaPanel.js

import React, {
  useMemo,
} from "react";

import InspectorSection
  from "./InspectorSection";

import FieldRenderer
  from "./FieldRenderer";


// =====================================================
// ACTION-OWNED PROPERTIES
// =====================================================
//
// These are no longer rendered by the generic schema
// inspector.
//
// InspectorActionPanel owns them.
//
// =====================================================

const ACTION_PROPS = new Set([

  "action",

  "targetId",

  "params",

  "actionParams",

  "condition",

  "nextActions",

]);


// =====================================================
// INSPECTOR SCHEMA PANEL
// =====================================================

export default function InspectorSchemaPanel({

  schema = {},

  props = {},

  onChange,

  filterMode =
    "build",

  elements = [],

  selectedElement =
    null,

}) {

  // ===================================================
  // FILTER + GROUP
  // ===================================================

  const grouped =
    useMemo(
      () => {

        const groups =
          {};


        Object.entries(
          schema
        ).forEach(
          (
            [
              key,
              cfg = {},
            ]
          ) => {

            // -----------------------------------------
            // ACTION PROPERTIES BELONG TO THE ACTION
            // PANEL.
            // -----------------------------------------

            if (
              ACTION_PROPS.has(
                key
              )
            ) {

              return;

            }


            const filter =
              cfg.filter ||
              "build";


            // -----------------------------------------
            // Runtime-only fields
            // -----------------------------------------

            if (
              filter ===
                "runtime"
            ) {

              return;

            }


            // -----------------------------------------
            // Advanced fields are hidden in normal
            // builder mode.
            // -----------------------------------------

            if (
              filterMode ===
                "build" &&
              filter ===
                "advanced"
            ) {

              return;

            }


            const group =
              cfg.group ||
              "general";


            if (
              !groups[group]
            ) {

              groups[group] =
                [];

            }


            groups[group].push(
              {
                key,
                ...cfg,
              }
            );

          }
        );


        return groups;

      },
      [
        schema,
        filterMode,
      ]
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <>

      {Object.entries(
        grouped
      ).map(
        (
          [
            group,
            fields,
          ]
        ) => (

          <InspectorSection

            key={
              group
            }

            title={
              group
            }

          >

            {fields.map(
              field => {

                const value =
                  props[
                    field.key
                  ];


                // ---------------------------------------
                // VISIBLE WHEN
                // ---------------------------------------

                const visible =
                  !field.visibleWhen ||
                  Object.entries(
                    field.visibleWhen
                  ).every(
                    (
                      [
                        key,
                        expected,
                      ]
                    ) =>
                      props[key] ===
                      expected
                  );


                if (
                  !visible
                ) {

                  return null;

                }


                console.log(
                  "[INSPECTOR FIELD DEBUG]",
                  {

                    selectedElement,

                    elements,

                    fieldKey:
                      field.key,

                    fieldType:
                      field.type,

                    value,

                  }
                );


                return (

                  <div

                    key={
                      field.key
                    }

                    className="
                      inspector-field-row
                    "

                  >

                    <label
                      className="
                        inspector-field-label
                      "
                    >

                      {
                        field.label ||
                        field.key
                      }

                    </label>


                    <FieldRenderer

                      schema={
                        field
                      }

                      value={
                        value
                      }

                      propKey={
                        field.key
                      }

                      onChange={
                        onChange
                      }

                      elements={
                        elements
                      }

                      selectedElement={
                        selectedElement
                      }

                    />

                  </div>

                );

              }
            )}

          </InspectorSection>

        )
      )}

    </>

  );

}
