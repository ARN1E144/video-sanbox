// src/components/inspectorPanel/FieldRenderer.js

import React from "react";

import componentRegistry from "../../actions/componentRegistry";

import {
  getActionOptions
} from "../../actions/getActionsOptions";

import "../../css/InspectorContent.css";


// =====================================================
// FIELD RENDERER
// =====================================================

export default function FieldRenderer({
  schema,
  value,
  onChange,
  propKey,
  elements = [],
  selectedElement = null
}) {

  // ===================================================
  // SAFETY
  // ===================================================

  if (!schema) {
    return null;
  }


  // ===================================================
  // COMMON
  // ===================================================

  const fieldClassName =
    "inspector-field";


  // ===================================================
  // BOOLEAN
  // ===================================================

  if (schema.type === "boolean") {

    return (
      <select
        className={fieldClassName}
        value={
          typeof value === "boolean"
            ? String(value)
            : String(schema.default ?? false)
        }
        onChange={(e) =>
          onChange(
            propKey,
            e.target.value === "true"
          )
        }
      >

        <option value="true">
          True
        </option>

        <option value="false">
          False
        </option>

      </select>
    );

  }


  // ===================================================
  // STRING
  // ===================================================

  if (schema.type === "string") {

    return (
      <input
        className={fieldClassName}
        type="text"
        value={
          value ??
          schema.default ??
          ""
        }
        onChange={(e) =>
          onChange(
            propKey,
            e.target.value
          )
        }
      />
    );

  }


  // ===================================================
  // NUMBER
  // ===================================================

  if (schema.type === "number") {

    return (
      <input
        className={fieldClassName}
        type="number"
        value={
          typeof value === "number"
            ? value
            : schema.default ?? 0
        }
        onChange={(e) =>
          onChange(
            propKey,
            Number(e.target.value)
          )
        }
      />
    );

  }


  // ===================================================
  // SELECT
  // ===================================================

  if (schema.type === "select") {

    return (
      <select
        className={fieldClassName}
        value={
          value ??
          schema.default ??
          ""
        }
        onChange={(e) =>
          onChange(
            propKey,
            e.target.value
          )
        }
      >

        {schema.options?.map(
          option => (

            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>

          )
        )}

      </select>
    );

  }


  // ===================================================
  // ACTION
  // ===================================================

  if (schema.type === "action") {

    const actionOptions =
      getActionOptions() || [];


    return (
      <select
        className={fieldClassName}
        value={
          value ??
          schema.default ??
          ""
        }
        onChange={(e) =>
          onChange(
            propKey,
            e.target.value
          )
        }
      >

        <option value="">
          Select action
        </option>

        {actionOptions.map(
          action => (

            <option
              key={action.value}
              value={action.value}
            >

              {
                action.label ||
                action.value
              }

            </option>

          )
        )}

      </select>
    );

  }


  // ===================================================
// COMPONENT TARGET
// ===================================================

if (schema.type === "component") {

  const contract =
    selectedElement
      ? componentRegistry?.[
          selectedElement.type
        ]?.contract
      : null;


  const allowedTypes =
    contract?.targets?.components ||
    contract?.targets?.accepts ||
    [];


  console.log(
    "[FIELD RENDERER TARGET DEBUG]",
    {
      selectedType: selectedElement?.type,
      contract,
      targets: contract?.targets,
      elements,
      allowedTypes
    }
  );


  const targetElements =
    elements.filter(
      element => {

        if (
          element.id ===
          selectedElement?.id
        ) {
          return false;
        }

        return allowedTypes.includes(
          element.type
        );

      }
    );


  return (
    <select
      className={fieldClassName}
      value={
        value ??
        schema.default ??
        ""
      }
      onChange={(e) =>
        onChange(
          propKey,
          e.target.value
        )
      }
    >

      <option value="">
        Select target
      </option>

      {targetElements.map(
        element => (

          <option
            key={element.id}
            value={element.id}
          >

            {element.type}
            {" — "}
            {element.id.slice(0, 8)}

          </option>

        )
      )}

    </select>
  );
}


  // ===================================================
  // CONDITION
  // ===================================================

  if (schema.type === "condition") {

    return (
      <input
        className={fieldClassName}
        type="text"
        placeholder="Optional condition"
        value={
          value ??
          schema.default ??
          ""
        }
        onChange={(e) =>
          onChange(
            propKey,
            e.target.value
          )
        }
      />
    );

  }


  // ===================================================
  // STYLE
  // ===================================================

  if (schema.type === "style") {

    const displayValue =
      typeof value === "string"
        ? value
        : JSON.stringify(
            value ??
            schema.default ??
            {},
            null,
            2
          );


    return (
      <textarea
        className={fieldClassName}
        rows={4}
        value={displayValue}
        onChange={(e) => {

          const raw =
            e.target.value;

          try {

            onChange(
              propKey,
              JSON.parse(raw)
            );

          }
          catch {

            onChange(
              propKey,
              raw
            );

          }

        }}
      />
    );

  }


  // ===================================================
  // OBJECT
  // ===================================================

  if (schema.type === "object") {

    const displayValue =
      typeof value === "string"
        ? value
        : JSON.stringify(
            value ??
            schema.default ??
            {},
            null,
            2
          );


    return (
      <textarea
        className={fieldClassName}
        rows={4}
        value={displayValue}
        onChange={(e) => {

          const raw =
            e.target.value;

          try {

            onChange(
              propKey,
              JSON.parse(raw)
            );

          }
          catch {

            onChange(
              propKey,
              raw
            );

          }

        }}
      />
    );

  }


  // ===================================================
  // UNKNOWN
  // ===================================================

  return (
    <div
      className="inspector-field-unsupported"
    >

      Unsupported field: {schema.type}

    </div>
  );

}