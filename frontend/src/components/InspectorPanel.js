import React, { useState } from "react";
import InspectorSection from "./InspectorSection";
import { useProjectContext } from "../context/ProjectContext"; // 🆕 import project context

export default function InspectorPanel({ element, onUpdate, onDelete }) {
  const [apiStatus, setApiStatus] = useState(null);
  const { projectType } = useProjectContext(); // 🧭 check if it's a client-host app

  if (!element) return null;

  /**
   * 🧭 Read-only role display for client-host apps
   */
  const renderRoleInfo = () => {
    if (projectType !== "client-host" || !element.role) return null;

    return (
      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted block mb-1">
          Role
        </label>
        <div className="text-sm px-2 py-1 bg-gray-800 rounded border border-gray-700 text-text-primary">
          {element.role.charAt(0).toUpperCase() + element.role.slice(1)} (locked)
        </div>
      </div>
    );
  };

  // 🧠 existing render actions, content, style, etc...
  // keep your other logic exactly as it is

  return (
    <div className="w-80 bg-panel border-l border-border p-4 flex flex-col gap-4 rounded-r-lg shadow-soft max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-1">Inspector</h3>

      {/* 🧭 Show role for host/client projects */}
      {renderRoleInfo()}

      {/* Position & Size */}
      <InspectorSection title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          {["x", "y", "width", "height"].map((field) => (
            <div key={field}>
              <label className="block text-xs text-text-muted mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type="number"
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
            value={element.props?.label || ""}
            onChange={(e) =>
              onUpdate({ props: { ...element.props, label: e.target.value } })
            }
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      </InspectorSection>

      {/* ... keep your Style and Actions sections below ... */}

      {/* Danger Zone */}
      <InspectorSection title="Danger Zone" defaultOpen={false}>
        <button
          onClick={onDelete}
          className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition"
        >
          🗑 Delete Element
        </button>
      </InspectorSection>
    </div>
  );
}
