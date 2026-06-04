import React, { useMemo } from "react";
import InspectorSection from "./InspectorSection";
import FieldRenderer from "./FieldRenderer";

export default function InspectorSchemaPanel({
  schema = {},
  props = {},
  onChange,
  filterMode = "build", // 👈 NEW
}) {
  const grouped = useMemo(() => {
    const g = {};

    Object.entries(schema).forEach(([key, cfg]) => {
      const filter = cfg.filter || "build";

      // 🔥 FILTER RULE (CORE V1 BEHAVIOUR)
      if (filter === "runtime") return;
      if (filterMode === "build" && filter === "advanced") return;

      const group = cfg.group || "general";
      if (!g[group]) g[group] = [];

      g[group].push({ key, ...cfg });
    });

    return g;
  }, [schema, filterMode]);

  return Object.entries(grouped).map(([group, fields]) => (
    <InspectorSection key={group} title={group}>
      {fields.map((field) => {
        const value = props[field.key];

        const visible =
          !field.visibleWhen ||
          Object.entries(field.visibleWhen).every(
            ([k, v]) => props[k] === v
          );

        if (!visible) return null;

        return (
          <div key={field.key} className="space-y-1">
            <label className="text-xs opacity-70">
              {field.label || field.key}
            </label>

            <FieldRenderer
              schema={field}
              value={value}
              propKey={field.key}
              onChange={onChange}
            />
          </div>
        );
      })}
    </InspectorSection>
  ));
}