import React, { useMemo, useState } from "react";
import * as Icons from "lucide-react";

import InspectorSection from "./InspectorSection";
import { getActionOptions } from "../../actions/getActionsOptions";
import { getActionByValue } from "../../actions/getActionByValue";
import  ControlButtonBase from "../../ui/ControlButtonBase";

export default function InspectorControlPanelEditor({
  selectedElement,
  updateElement,
  elements = [],
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const controls = selectedElement?.props?.controls || [];
  const selectedControl = controls[selectedIndex] || null;

  const actionOptions = useMemo(() => {
    const raw = getActionOptions() || [];
    const grouped = {};

    raw.forEach((a) => {
      const cat = a.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    });

    return Object.entries(grouped).map(([category, options]) => ({
      category,
      options,
    }));
  }, []);

  if (!selectedElement) {
    return <div className="p-3 text-xs text-gray-400">No Control Panel selected</div>;
  }

  const updateControls = (nextControls) => {
    updateElement(selectedElement.id, {
      props: {
        ...selectedElement.props,
        controls: nextControls,
      },
    });
  };

  const updateControl = (patch) => {
    const next = [...controls];
    next[selectedIndex] = { ...next[selectedIndex], ...patch };
    updateControls(next);
  };

  const addControl = () => {
    const newControl = {
      id: crypto.randomUUID(),
      label: "Button",
      icon: "Circle",
      action: "",
      targetId: "",
      config: {},
    };

    const next = [...controls, newControl];
    updateControls(next);
    setSelectedIndex(next.length - 1);
  };

  const removeControl = () => {
    const next = controls.filter((_, i) => i !== selectedIndex);
    updateControls(next);
    setSelectedIndex(0);
  };

  const selectedIcon = selectedControl?.icon
    ? Icons[selectedControl.icon]
    : Icons.Circle;

  return (
    <div className="space-y-3">

      <InspectorSection title="Controls">

        <button
          onClick={addControl}
          className="w-full p-2 rounded bg-black text-white"
        >
          + Add Control
        </button>

        <div className="mt-2 space-y-1">
          {controls.map((ctrl, i) => {
            const Icon = Icons[ctrl.icon] || Icons.Circle;

            return (
              <ControlButtonBase
                key={ctrl.id}
                icon={ctrl.icon}
                label={ctrl.label}
                active={i === selectedIndex}
                onClick={() => setSelectedIndex(i)}
              />
            );
          })}
        </div>

      </InspectorSection>

      {selectedControl && (
        <InspectorSection title="Edit Control">

          <input
            value={selectedControl.label}
            onChange={(e) => updateControl({ label: e.target.value })}
            className="w-full border p-1 rounded"
          />

          <select
            value={selectedControl.icon}
            onChange={(e) => updateControl({ icon: e.target.value })}
            className="w-full border p-1 rounded mt-2"
          >
            {Object.keys(Icons).slice(0, 40).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={selectedControl.action}
            onChange={(e) => {
              const value = e.target.value;
              const action = getActionByValue(value);

              const target = elements.find((el) =>
                action?.targets?.includes(el.type)
              );

              updateControl({
                action: value,
                targetId: target?.id || "",
              });
            }}
            className="w-full border p-1 rounded mt-2"
          >
            <option value="">Select Action</option>

            {actionOptions.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {selectedControl.action && (
            <select
              value={selectedControl.targetId}
              onChange={(e) => updateControl({ targetId: e.target.value })}
              className="w-full border p-1 rounded mt-2"
            >
              <option value="">Select Target</option>

              {elements
                .filter((el) => {
                  const action = getActionByValue(selectedControl.action);
                  return action?.targets?.includes(el.type);
                })
                .map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.type}
                  </option>
                ))}
            </select>
          )}

          <button
            onClick={removeControl}
            className="w-full mt-2 p-2 bg-red-500 text-white rounded"
          >
            Delete Control
          </button>

        </InspectorSection>
      )}
    </div>
  );
}