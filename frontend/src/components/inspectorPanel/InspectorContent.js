import React, { useMemo, forwardRef } from "react";
import InspectorSection from "./InspectorSection";
import { X } from "lucide-react";
import { useActionContext } from "../../context/ActionContext";
import componentRegistry from "../../actions/componentRegistry";
import { getActionOptions } from "../../actions/getActionsOptions";
import { getActionByValue } from "../../actions/getActionByValue";
import FieldRenderer from "./FieldRenderer";
import InspectorSchemaPanel from "./InspectorSchemaPanel";
import InspectorActionPanel from "./InspectorActionPanel";
import InspectorControlPanelEditor from "./InspectorControlPanelEditor";
import "../../css/InspectorContent.css"


const InspectorContent = forwardRef(function InspectorContent(
  {
    selectedId,
    elements = [],
    updateElement,
    layout = "right",
    toggleOpen,
    position,
  },
  ref
) {
  const { bindings, updateBinding } = useActionContext();

  // --------------------------
  // HOOKS FIRST (NO EARLY RETURNS ABOVE THIS POINT)
  // --------------------------

  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedId),
    [elements, selectedId]
  );

  const meta = useMemo(() => {

  if (!selectedElement) {
    return null;
  }

  return (
    componentRegistry?.[selectedElement.type]?.contract ||
    selectedElement.contract ||
    null
  );

}, [selectedElement]);

  const schema = meta?.editableProps || {};
  const props = selectedElement?.props || {};

  const groupedSchema = useMemo(() => {
    const groups = {};

    Object.entries(schema).forEach(([key, cfg]) => {
      const group = cfg.group || "general";
      if (!groups[group]) groups[group] = [];
      groups[group].push({ key, ...cfg });
    });

    return groups;
  }, [schema]);

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

  const getTargets = (actionValue) => {
    const action = getActionByValue(actionValue);
    if (!action?.targets) return elements;
    return elements.filter((el) =>
      action.targets.includes(el.type)
    );
  };

  const updateProp = (key, value) => {
    if (!selectedElement) return;

    updateElement(selectedId, {
      props: {
        ...props,
        [key]: value,
      },
    });
  };

  // --------------------------
  // NOW SAFE EARLY CONDITIONS (NO HOOKS ABOVE THIS)
  // --------------------------

  if (!selectedElement) {
    return (
      <div className="p-3 text-xs text-gray-400">
        No element selected
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="p-3 text-xs text-red-400">
        No meta found for {selectedElement.type}
      </div>
    );
  }

  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="p-3 text-xs text-red-400">
        No editableProps found
      </div>
    );
  }

  // --------------------------
  // UI
  // --------------------------

  console.log(
  "[INSPECTOR TARGET DEBUG]",
  {
    selectedElement,
    elements,
    targetId: selectedElement?.props?.targetId
  }
);

  return (
  <div
    ref={ref}
    className="bg-panel border flex flex-col h-full w-[340px]"
    style={{
      position: layout === "floating" ? "absolute" : "relative",
      left: position?.x,
      top: position?.y,
      zIndex: 2000,
    }}
  >
    {/* HEADER */}
    <div className="flex justify-between p-3 border-b">
      <h3 className="text-sm font-semibold">
        {selectedElement.type}
      </h3>
      <button onClick={toggleOpen}>
        <X size={14} />
      </button>
    </div>

    {/* BODY */}
    <div className="p-3 space-y-3 overflow-y-auto">

      {/* 1. SCHEMA */}
     <InspectorSchemaPanel
        schema={schema}
        props={props}
        onChange={updateProp}
        elements={elements}
        selectedElement={selectedElement}
      />

      {/* 2. ACTIONS (NOW PROPER MODULE) */}
      {selectedElement.type === "ControlPanel" && (
        <InspectorControlPanelEditor
          selectedElement={selectedElement}
          elements={elements}
          updateElement={updateElement}
        />
      )}

    </div>
  </div>
);
  
});

export default InspectorContent;