// src/components/inspectorPanel/FieldRenderer.js

import React from "react";

export default function FieldRenderer({
  schema,
  value,
  onChange,
  propKey,
}) {
  if (!schema) return null;

  switch (schema.type) {
    case "boolean":
      return (
        <select
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
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
      return (
        <select
          value={String(value ?? schema.default ?? false)}
          onChange={(e) =>
            onChange(propKey, e.target.value === "true")
          }
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );

    case "string":
      return (
        <input
          value={value ?? schema.default ?? ""}
          onChange={(e) =>
            onChange(propKey, e.target.value)
          }
        />
      );

  case "number":
  return (
    <input
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

    case "select":
      return (
        <select
          value={value ?? schema.default ?? ""}
          onChange={(e) =>
            onChange(propKey, e.target.value)
          }
        >
          {schema.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    default:
      return (
        <div style={{ fontSize: 12, color: "red" }}>
          Unsupported field: {schema.type}
        </div>
      );
  }
}