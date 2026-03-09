// src/components/inspectorPanel/InspectorContent.js
import React, { useMemo, forwardRef } from "react";
import { Rnd } from "react-rnd";
import InspectorSection from "./InspectorSection";
import { Dock, X } from "lucide-react";
import { useProjectContext } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { getActionOptions } from "../../actions/getActionsOptions";
import { getActionByValue } from "../../actions/getActionByValue";

const DEFAULT_CAPS = {
  showActions: true,
  showTargeting: true,
  showConditions: true,
};

const ELEMENT_ACTION_CATEGORIES = {
  VideoFeed: ["Video"],
  ChatPanel: ["Chat"],
  MicButton: ["System"],
  ControlButton: ["Video", "Chat", "System"], // optional full control
};

const ELEMENT_CAPABILITIES = {
  VideoFeed: { showActions: true, showTargeting: true, showConditions: true },
  AppBar: { showActions: false, showTargeting: false, showConditions: false },
  Container: { showActions: false, showTargeting: false, showConditions: false },
  ChatPanel: { showActions: false, showTargeting: false, showConditions: true },
  MicButton: { showActions: true, showTargeting: false, showConditions: false },
  ControlButton: { showActions: true, showTargeting: true, showConditions: true },
  Text: { showActions: false, showTargeting: false, showConditions: false },
};



const InspectorContent = forwardRef(function InspectorContent(
  {
    layout = "right",
    position = { x: 100, y: 100 },
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
  const { projectType } = useProjectContext();
  const { canBuild } = useAuth();
  const element = elements.find((e) => e.id === selectedId);
  const canEditBuilder = !!canBuild && !readOnly;
  const isSingleProject = projectType === "single";

  const caps = useMemo(() => {
    if (!element) return DEFAULT_CAPS;
    const base = ELEMENT_CAPABILITIES[element.type] || DEFAULT_CAPS;
    const next = { ...base };
    if (isSingleProject)
      next.showTargeting = next.showTargeting && element.type === "ControlButton";
    return next;
  }, [element, isSingleProject]);

  // Extract selectedAction separately to avoid passing to DOM
  const { selectedaction, ...safeProps } = element?.props || {};

 const actionOptions = useMemo(() => {
  const allActions = getActionOptions(); // gets value, label, category from registry
  const categorized = {};

  allActions.forEach((act) => {
    const category = act.category || "General"; // use category from registry
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push(act);
  });

  console.log("Categorized action options", categorized);

  return Object.entries(categorized).map(([category, options]) => ({
    category,
    options,
  }));
}, []);

const filteredActionOptions = useMemo(() => {
  if (!element) return [];
  const allowedCategories = ELEMENT_ACTION_CATEGORIES[element.type] || [];
  return actionOptions.filter(opt => allowedCategories.includes(opt.category));
}, [element, actionOptions]);


const handleAction = async (actionValue) => {
  const actionFn = getActionByValue(actionValue);

  if (!actionFn) {
    console.warn("Action not found:", actionValue);
    return;
  }

  try {
    // Optionally pass element props or any context needed
    await actionFn({ element, projectType });
    console.log(`Action "${actionValue}" executed successfully.`);
  } catch (err) {
    console.error(`Error executing action "${actionValue}":`, err);
  }
};


  const targetOptions = useMemo(() => {
    if (!element) return [];
    const list = elements.filter((el) => !!el.id);
    const filtered = isSingleProject
      ? list.filter((el) => ["VideoFeed", "Text", "ChatPanel"].includes(el.type))
      : list;

    return filtered.map((el) => ({
      id: el.id,
      label: `${el.props?.label || el.type} (${el.id.slice(0, 6)})`,
    }));
  }, [elements, element, isSingleProject]);

  if (!element) {
    return (
      <div className="w-80 bg-panel border border-border p-4 text-sm text-text-muted">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">Inspector</h3>
        <p>Select an element to inspect.</p>
      </div>
    );
  }

  const updateProps = (patch) => {
    updateElement(element.id, { props: { ...(safeProps || {}), ...patch } });
  };

  const renderVideoFeedProps = () => {
    if (element.type !== "VideoFeed") return null;
    const props = safeProps;

    return (
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Mode</label>
          <select
            disabled={readOnly || !canEditBuilder}
            value={props.mode || "auto"}
            onChange={(e) => updateProps({ mode: e.target.value })}
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          >
            <option value="local">Local</option>
            <option value="remote">Remote</option>
          </select>
        </div>

        {props.mode === "remote" && (
          <div>
            <label className="block text-xs text-text-muted mb-1">Remote URL</label>
            <input
              type="text"
              disabled={readOnly || !canEditBuilder}
              value={typeof props.src === "string" ? props.src : ""} // <- value is empty if no string
              onChange={(e) => updateProps({ src: e.target.value })}
              placeholder={typeof props.src === "string" ? "" : props.src?.placeholder || "Video/Audio URL"}
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary text-sm"
            />
</div>
        )}

        {['enabled','playing','muted','mirror'].map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs text-text-primary">
            <input
              type="checkbox"
              disabled={readOnly || !canEditBuilder}
              checked={!!props[key]}
              onChange={(e) => updateProps({ [key]: e.target.checked })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>
    );
  };

  const renderGenericProps = () => {
    const editableProps = element?.meta?.editableProps || {};
    return Object.entries(editableProps).map(([key, defaultValue]) => {
      if (["mode","enabled","playing","muted","mirror","src"].includes(key)) return null;
      const value = safeProps[key] ?? defaultValue;

      if (typeof defaultValue === "boolean") {
        return (
          <label key={key} className="flex items-center gap-2 text-xs text-text-primary">
            <input
              type="checkbox"
              disabled={readOnly || !canEditBuilder}
              checked={!!value}
              onChange={(e) => updateProps({ [key]: e.target.checked })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        );
      }

      if (typeof defaultValue === "string") {
        return (
          <div key={key}>
            <label className="block text-xs text-text-muted mb-1">{key}</label>
            <input
              type="text"
              disabled={readOnly || !canEditBuilder}
              value={value}
              onChange={(e) => updateProps({ [key]: e.target.value })}
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            />
          </div>
        );
      }

      if (typeof defaultValue === "object" && defaultValue !== null) {
        return (
          <div key={key} className="space-y-1">
            <label className="block text-xs text-text-muted mb-1">{key}</label>
            <div className="pl-2 space-y-1">
              {Object.entries(value).map(([subKey, subValue]) => {
                if (typeof subValue === "boolean") {
                  return (
                    <label key={`${key}.${subKey}`} className="flex items-center gap-2 text-xs text-text-primary">
                      <input
                        type="checkbox"
                        disabled={readOnly || !canEditBuilder}
                        checked={subValue}
                        onChange={(e) => updateProps({ [key]: { ...value, [subKey]: e.target.checked } })}
                      />
                      {subKey.charAt(0).toUpperCase() + subKey.slice(1)}
                    </label>
                  );
                }
                if (typeof subValue === "string") {
                  return (
                    <div key={`${key}.${subKey}`}>
                      <label className="block text-xs text-text-muted mb-1">{subKey}</label>
                      <input
                        type="text"
                        disabled={readOnly || !canEditBuilder}
                        value={subValue}
                        onChange={(e) => updateProps({ [key]: { ...value, [subKey]: e.target.value } })}
                        className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      }

      return null;
    });
  };

  const body = (
    <div
      ref={ref}
      className={`bg-panel border border-border shadow-soft flex flex-col ${layout === "docked" ? "w-full h-full" : "w-[280px] h-[380px]"}`}
    >
      <div className="inspector-drag-handle flex items-center justify-between px-4 py-3 border-b border-border shrink-0 cursor-move">
        <h3 className="text-lg font-semibold">Inspector</h3>
        <div className="flex items-center gap-2">
          {toggleDock && (
            <button onClick={toggleDock} className="p-1 rounded hover:bg-accent/10" title="Dock / Undock">
              <Dock size={14} />
            </button>
          )}
          <button onClick={toggleOpen} className="p-1 rounded hover:bg-accent/10" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <InspectorSection title="Position & Size">
          <div className="grid grid-cols-2 gap-2">
            {["x","y","width","height"].map((field) => (
              <div key={field}>
                <label className="block text-xs text-text-muted mb-1">{field}</label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={element[field]}
                  onChange={(e) => updateElement(element.id, { [field]: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                />
              </div>
            ))}
          </div>
        </InspectorSection>

        <InspectorSection title="Content">
          {element.type === "VideoFeed" ? renderVideoFeedProps() : renderGenericProps()}
        </InspectorSection>

        {caps.showActions && (canBuild || readOnly) && (
          <InspectorSection title="Actions" defaultOpen={false}>
            <div>
              <label className="block text-xs text-text-muted mb-1">Action</label>
              <select
                  disabled={readOnly || !canEditBuilder}
                  value={selectedaction || ""}
                  onChange={(e) => {
                    const action = e.target.value;
                    updateProps({ selectedaction: action });
                    handleAction(action);
                  }}
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                >
                  <option value="">None</option>

                  {filteredActionOptions.map(act => {
                    if (act.category !== "Video") return null;

                    return (
                      <option key={act.value} value={act.value}>
                        {act.label}
                      </option>
                    );
                  })}
                </select>
            </div>
          </InspectorSection>
        )}

        {caps.showTargeting && (canBuild || readOnly) && (
          <InspectorSection title="Targeting" defaultOpen={false}>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-text-muted mb-1">Target Element</label>
                <select
                  disabled={readOnly || !canEditBuilder}
                  value={safeProps.targetId || ""}
                  onChange={(e) => updateProps({ targetId: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                >
                  <option value="">None</option>
                  {targetOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Target ID (manual)</label>
                <input
                  type="text"
                  disabled={readOnly || !canEditBuilder}
                  value={safeProps.targetId || ""}
                  onChange={(e) => updateProps({ targetId: e.target.value })}
                  placeholder="Element ID"
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                />
              </div>
            </div>
          </InspectorSection>
        )}

        {caps.showConditions && (canBuild || readOnly) && (
          <InspectorSection title="Conditions" defaultOpen={false}>
            <div>
              <label className="block text-xs text-text-muted mb-1">Condition</label>
              <select
                disabled={readOnly || !canEditBuilder}
                value={safeProps.condition || ""}
                onChange={(e) => updateProps({ condition: e.target.value })}
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              >
                <option value="">None</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </InspectorSection>
        )}

        {(canBuild || readOnly) && (
          <InspectorSection title="Danger Zone" defaultOpen={false}>
            <button
              onClick={() => { if (!readOnly && canBuild) onDelete?.(); }}
              disabled={readOnly || !canBuild}
              className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑 Delete Element
            </button>
          </InspectorSection>
        )}
      </div>
    </div>
  );

  if (layout === "floating") {
    return (
      <Rnd
        className="rnd-wrapper"
        default={{ x: position.x, y: position.y, width: 300, height: 380 }}
        bounds="window"
        dragHandleClassName="inspector-drag-handle"
        enableResizing={false}
        minWidth={280}
      >
        {body}
      </Rnd>
    );
  }

  return layout === "right" ? <div className="shrink-0">{body}</div> : <div className="w-full border-t border-border mt-2">{body}</div>;
});

export default InspectorContent;
