import React, { useState } from "react";
import InspectorSection from "./InspectorSection";
import { useProjectContext } from "../context/ProjectContext";

export default function InspectorPanel({ element, onUpdate, onDelete, readOnly }) {
  const [apiStatus, setApiStatus] = useState(null);
  const { projectType } = useProjectContext();

  if (!element) return null;

  /* 🧭 Read-only role info for client-host apps */
  const renderRoleInfo = () => {
    if (projectType !== "client-host" || !element.role) return null;

    return (
      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted block mb-1">Role</label>
        <div className="text-sm px-2 py-1 bg-gray-800 rounded border border-gray-700 text-text-primary">
          {element.role.charAt(0).toUpperCase() + element.role.slice(1)} (locked)
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-panel border-l border-border p-4 flex flex-col gap-4 rounded-r-lg shadow-soft max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-1">Inspector</h3>

      {/* 🧭 Role Display */}
      {renderRoleInfo()}

      {/* 📐 Position & Size */}
      <InspectorSection title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          {["x", "y", "width", "height"].map((field) => (
            <div key={field}>
              <label className="block text-xs text-text-muted mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type="number"
                disabled={readOnly}
                value={element[field]}
                onChange={(e) =>
                  onUpdate({ [field]: parseInt(e.target.value, 10) })
                }
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
            </div>
          ))}
        </div>
      </InspectorSection>

      {/* 🧾 Content */}
      <InspectorSection title="Content">
        <div>
          <label className="block text-xs text-text-muted mb-1">Label</label>
          <input
            type="text"
            disabled={readOnly}
            value={element.props?.label || ""}
            onChange={(e) =>
              onUpdate({ props: { ...element.props, label: e.target.value } })
            }
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      </InspectorSection>

      {/* ⚙️ Actions */}
      <InspectorSection title="Actions" defaultOpen={false}>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">On Click</label>
            <select
              disabled={readOnly}
              value={element.props?.onClick || ""}
              onChange={(e) =>
                onUpdate({
                  props: { ...element.props, onClick: e.target.value },
                })
              }
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            >
              <option value="">None</option>
              <option value="navigate">Navigate</option>
              <option value="toggle">Toggle Visibility</option>
              <option value="api">Call API</option>
              <option value="custom">Custom JS</option>
            </select>
          </div>

          {/* 🧠 Conditional fields */}
          {element.props?.onClick === "navigate" && (
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Target Screen
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={element.props?.target || ""}
                onChange={(e) =>
                  onUpdate({
                    props: { ...element.props, target: e.target.value },
                  })
                }
                placeholder="e.g. 'LoginScreen'"
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
            </div>
          )}

          {element.props?.onClick === "api" && (
            <div>
              <label className="block text-xs text-text-muted mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={element.props?.endpoint || ""}
                onChange={(e) =>
                  onUpdate({
                    props: { ...element.props, endpoint: e.target.value },
                  })
                }
                placeholder="/api/example"
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
            </div>
          )}
        </div>
      </InspectorSection>

      {/* 🎯 Targeting */}
      <InspectorSection title="Targeting" defaultOpen={false}>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Target ID</label>
            <input
              type="text"
              disabled={readOnly}
              value={element.props?.targetId || ""}
              onChange={(e) =>
                onUpdate({
                  props: { ...element.props, targetId: e.target.value },
                })
              }
              placeholder="Element ID"
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Condition</label>
            <select
              disabled={readOnly}
              value={element.props?.condition || ""}
              onChange={(e) =>
                onUpdate({
                  props: { ...element.props, condition: e.target.value },
                })
              }
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            >
              <option value="">None</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </InspectorSection>

      {/* 🧨 Danger Zone */}
      <InspectorSection title="Danger Zone" defaultOpen={false}>
        <button
          onClick={onDelete}
          disabled={readOnly}
          className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition"
        >
          🗑 Delete Element
        </button>
      </InspectorSection>
    </div>
  );
}
