// src/components/inspectorPanel/InspectorContent.js
import React, { useMemo, useState, forwardRef } from "react";
import { Rnd } from "react-rnd";
import InspectorSection from "./InspectorSection";
import { X } from "lucide-react";


import { useActionContext } from "../../context/ActionContext";

import { getActionOptions } from "../../actions/getActionsOptions";
import { getActionByValue } from "../../actions/getActionByValue";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { CONTROL_TEMPLATES } from "../../constants/controlTemplates";

import {
  getDefaultRuntimeTarget,
} from "../../utils/runtimeTargets";





/* --------------------------
   SORTABLE CONTROL
-------------------------- */

const SortableControl = ({
    ctrl,
    index,
    updateControl,
    removeControl,
    actionOptions,
    isSelected,
    onSelect,
    getTargets,
    elements,
    bindings,
    updateBinding,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: ctrl.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const action = getActionByValue(ctrl.action);
  const paramsSchema = action?.params || {};

  const isSystem = ctrl.type === "system";
  const targets = getTargets(ctrl);


  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`p-3 border rounded bg-surface space-y-2 cursor-pointer ${
        isSelected ? "border-blue-500 ring-1 ring-blue-400" : "border-border"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div {...attributes} {...listeners} className="cursor-grab text-xs">
          ☰
        </div>
        <button onClick={() => removeControl(index)} className="text-xs text-red-400">
          ✕
        </button>
      </div>

      {/* TYPE */}
      <select
        value={ctrl.type || "custom"}
        onChange={(e) => {
          const type = e.target.value;

         if (type === "system") {
            const defaultTarget =
            getDefaultRuntimeTarget(elements);

            updateControl(index, {
              ...CONTROL_TEMPLATES.mic,

              type: "system",

              targetId: defaultTarget?.id || "",

              bindId: defaultTarget?.id || "",
            });
          } else {
            updateControl(index, {
              type: "custom",
              action: "",
              targetId: "",
              
            });
          }
        }}
        className="w-full px-2 py-1 border rounded"
      >
        <option value="system">System</option>
        <option value="custom">Custom</option>
      </select>

      {/* LABEL */}
      <input
        value={ctrl.label || ""}
        onChange={(e) => updateControl(index, { label: e.target.value })}
        placeholder="Label"
        className="w-full px-2 py-1 border rounded"
      />

      {/* CUSTOM ONLY */}
      {!isSystem && (
        <>
          {/* TARGET */}
          <select
            value={ctrl.targetId || ""}
            onChange={(e) =>
              updateControl(index, { targetId: e.target.value })
            }
            className="w-full px-2 py-1 border rounded"
          >
            <option value="">Self</option>
            {targets.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* ACTION */}
          <select
            value={ctrl.action || ""}
             onChange={(e) => {
              const actionValue = e.target.value;

              const action = getActionByValue(actionValue);

              // 🔥 Find first compatible target
              const compatibleTarget = elements.find((el) =>
                action?.targets?.includes(el.type)
              );

              updateControl(index, {
                action: actionValue,

                // ✅ auto target valid element
                targetId: compatibleTarget?.id || "",
                bindId: compatibleTarget?.id || "",

                
              });
            }}
            className="w-full px-2 py-1 border rounded"
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

          {/* ACTION CONFIG (SCHEMA DRIVEN) */}
          {Object.entries(paramsSchema).map(([key, schema]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs">{key}</label>

              {schema.type === "boolean" && (
                <select
                  value={String(
                    bindings?.[ctrl.targetId]?.[key] ?? schema.default
                  )}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}

              {schema.type === "string" && (
                <input
                  value={
                    bindings?.[ctrl.targetId]?.[key]
                    ?? schema.default
                    ?? ""
                  }
                  onChange={(e) =>
                    updateBinding(ctrl.targetId, {
                      [key]: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 border rounded"
                />
              )}

              {schema.type === "select" && (
                <select
                  value={
                    bindings?.[ctrl.targetId]?.[key]
                    ?? schema.default
                    ?? ""
}
                  onChange={(e) =>
                    updateBinding(ctrl.targetId, {
                      [key]: e.target.value,
                    })
                  }
                >
                  {schema.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

/* --------------------------
   MAIN INSPECTOR
-------------------------- */

const InspectorContent = forwardRef(function InspectorContent(
  {
    layout = "right",
    position,
    setPosition,
    toggleDock,
    toggleOpen,
    selectedId,
    elements = [],
    updateElement,
    onDelete,
    readOnly,
  },
  ref
) {
  
  const { bindings, updateBinding } = useActionContext();
 

  const selectedElement = elements.find((e) => e.id === selectedId);
 

  const [selectedControlId, setSelectedControlId] = useState(null);

  /* --------------------------
     ACTION OPTIONS
  -------------------------- */

  const actionOptions = useMemo(() => {
    const raw = getActionOptions() || [];

    const grouped = {};
    raw.forEach((act) => {
      const cat = act.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(act);
    });

    return Object.entries(grouped).map(([category, options]) => ({
      category,
      options,
    }));
  }, []);

  /* --------------------------
     TARGET FILTER (NEW CORE)
  -------------------------- */

  const getTargets = (ctrl) => {
    const action = getActionByValue(ctrl.action);

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

  /* --------------------------
     CONTROLS
  -------------------------- */

  const controls = (selectedElement?.props?.controls || []).map((c) => ({
  ...c, // 👈 KEEP EVERYTHING FIRST (critical fix)

  id: c.id,
  type: c.type || "custom",
  label: c.label || "",
  action: c.action || "",
  targetId: c.targetId || "",

  // 🔥 CRITICAL: preserve binding identity
  bindId: c.bindId ?? c.targetId ?? "",

  // optional safety fallback (future-proofing)
  config: c.config || {},
}));

  const updateControls = (next) => {
    updateElement(selectedElement.id, {
      props: { ...selectedElement.props, controls: next },
    });
  };

  const updateControl = (index, patch) => {
    const next = [...controls];
    next[index] = { ...next[index], ...patch };
    updateControls(next);
  };

  const removeControl = (index) => {
    updateControls(controls.filter((_, i) => i !== index));
  };

  const addControl = () => {
  console.log("%c[INSPECTOR ELEMENTS]", "color: blue; font-weight: bold;", elements);
  // 🔥 Find best default target
  const defaultTarget =
    elements.find(
      (el) =>
        el.type === "AgoraFeed"
    ) ||
    elements.find(
      (el) =>
        el.type === "VideoFeed"
    ) ||
    null;

  updateControls([
    ...controls,
    {
      id: `ctrl-${Date.now()}`,

      type: "custom",

      label: "New Control",

      action: "",

      // ✅ AUTO TARGET
      targetId: defaultTarget?.id || "",
      bindId: defaultTarget?.id || "",

    },
  ]);

};

  /* --------------------------
     DRAG
  -------------------------- */

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = controls.findIndex((c) => c.id === active.id);
    const newIndex = controls.findIndex((c) => c.id === over.id);

    const updated = [...controls];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);

    updateControls(updated);
  };

  if (!selectedElement) return null;

  /* --------------------------
     UI
  -------------------------- */

  const body = (
    <div ref={ref} className="bg-panel border flex flex-col h-full">
      <div className="flex justify-between p-3 border-b">
        <h3>Inspector</h3>
        <button onClick={toggleOpen}>
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto">
        <InspectorSection title="Controls">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={controls.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {controls.map((ctrl, i) => (
                 <SortableControl
                    key={ctrl.id}
                    ctrl={ctrl}
                    index={i}
                    updateControl={updateControl}
                    removeControl={removeControl}
                    actionOptions={actionOptions}
                    isSelected={selectedControlId === ctrl.id}
                    onSelect={() => setSelectedControlId(ctrl.id)}
                    getTargets={getTargets}
                    elements={elements}
                    bindings={bindings}
                    updateBinding={updateBinding}
                  />
              ))}
            </SortableContext>
          </DndContext>

          <button onClick={addControl} className="w-full py-1 bg-accent/20 rounded">
            + Add Control
          </button>
        </InspectorSection>
      </div>
    </div>
  );

  if (layout === "floating") {
    return (
      <Rnd
        bounds="window"
        position={position}
        onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      >
        {body}
      </Rnd>
    );
  }

  return <div>{body}</div>;
});

export default InspectorContent;