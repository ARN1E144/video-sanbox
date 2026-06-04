import React, { useMemo } from "react";
import InspectorSection from "./InspectorSection";
import { getActionOptions } from "../../actions/getActionsOptions";
import { getActionByValue } from "../../actions/getActionByValue";

export default function InspectorActionPanel({
  selectedElement,
  elements = [],
  updateElement,
}) {
  const props = selectedElement?.props || {};
  const actionValue = props.action || "";

  const actionOptions = useMemo(() => {
    const raw = getActionOptions();

    const grouped = {};

    raw.forEach((a) => {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    });

    return Object.entries(grouped).map(([category, options]) => ({
      category,
      options,
    }));
  }, []);

  const getTargets = (actionValue) => {
    const action = getActionByValue(actionValue);

    if (!action?.targets) {
      return elements.map((el) => ({
        id: el.id,
        label: el.type,
      }));
    }

    return elements
      .filter((el) => action.targets.includes(el.type))
      .map((el) => ({
        id: el.id,
        label: el.type,
      }));
  };

  const updateProp = (key, value) => {
    updateElement(selectedElement.id, {
      props: {
        ...props,
        [key]: value,
      },
    });
  };

  if (!selectedElement) return null;

  return (
    <InspectorSection title="Actions">
      {/* ACTION */}

      <div className="space-y-2">
      <select
        value={actionValue}
        onChange={(e) => {
          const value = e.target.value;
          const action = getActionByValue(value);

          const target = elements.find((el) =>
            action?.targets?.includes(el.type)
          );

          updateProp("action", value);
          updateProp("targetId", target?.id || "");
        }}
      >
        <option value="">Select Action</option>

        {actionOptions.map((g) => (
          <optgroup key={g.category} label={g.category}>
            {g.options.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* TARGET */}
      {actionValue && (
        <select
          value={props.targetId || ""}
          onChange={(e) => updateProp("targetId", e.target.value)}
        >
          <option value="">Select Target</option>

          {getTargets(actionValue).map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      )}
      </div>
    </InspectorSection>
  );
}