// src/components/InspectorPanel.js
import React, { useState } from "react";
import InspectorSection from "./InspectorSection";
import { useProjectContext } from "../context/ProjectContext";

// Which inspector sections & actions make sense for each element type
const DEFAULT_CAPS = {
  showActions: true,
  showTargeting: true,
  showConditions: true,
};

const ELEMENT_CAPABILITIES = {
  VideoFeed: {
    showActions: false, // no "On Click" for video feeds
    showTargeting: true,
    showConditions: true,
  },
  AppBar: {
    showActions: false,
    showTargeting: false,
    showConditions: false,
  },
  ControlButton: {
    showActions: true,
    showTargeting: true,
    showConditions: true,
  },
  Text: {
    showActions: false,
    showTargeting: false,
    showConditions: false,
  },
};

// Which onClick actions are allowed per element type
const DEFAULT_ACTION_OPTIONS = [
  { value: "", label: "None" },
  { value: "navigate", label: "Navigate" },
  { value: "toggle", label: "Toggle Visibility" },
  { value: "api", label: "API Call" },
  { value: "custom", label: "Custom JS" },
];

const ELEMENT_ACTIONS = {
  ControlButton: DEFAULT_ACTION_OPTIONS,
  // others fall back to DEFAULT_ACTION_OPTIONS when showActions = true
};

export default function InspectorPanel({
  element,
  elements = [],
  onUpdate,
  onDelete,
  readOnly,
}) {
  const [apiStatus, setApiStatus] = useState(null); // reserved for future UI
  const { projectType } = useProjectContext();

  // -------- Target options (for Targeting section) ----------
  const targetOptions = elements.map((el) => {
    const label = el.props?.label || el.type || "Element";
    const shortId = el.id?.slice(0, 6) || "";
    return {
      id: el.id,
      label: `${label} (${shortId})`,
    };
  });

  // If nothing is selected, show placeholder
  if (!element) {
    return (
      <div className="w-80 bg-panel border-l border-border p-4 rounded-r-lg shadow-soft text-sm text-text-muted">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">
          Inspector
        </h3>
        <p>Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  const caps =
    ELEMENT_CAPABILITIES[element.type] != null
      ? ELEMENT_CAPABILITIES[element.type]
      : DEFAULT_CAPS;

  const actionOptions =
    ELEMENT_ACTIONS[element.type] || DEFAULT_ACTION_OPTIONS;

  const isVideoFeed =
    element.type === "VideoFeed" || element.type === "videofeed";

  const currentTargetId = element.props?.targetId || "";
  const onClickAction = element.props?.onClick || "";

  const updateProps = (patch) =>
    onUpdate({
      props: { ...element.props, ...patch },
    });

  /* 🧭 Read-only role info for client-host apps */
  const renderRoleInfo = () => {
    if (projectType !== "client-host" || !element.role) return null;

    return (
      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted block mb-1">
          Role
        </label>
        <div className="text-sm px-2 py-1 bg-gray-800 rounded border border-gray-700 text-text-primary">
          {element.role.charAt(0).toUpperCase() + element.role.slice(1)}{" "}
          (locked)
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-panel border-l border-border p-4 flex flex-col gap-4 rounded-r-lg shadow-soft">
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
                  onUpdate({ [field]: parseInt(e.target.value, 10) || 0 })
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
            onChange={(e) => updateProps({ label: e.target.value })}
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      </InspectorSection>

      {/* 🎥 Video settings (VideoFeed only) */}
      {isVideoFeed && (
        <InspectorSection title="Video" defaultOpen={true}>
          <div className="space-y-2">
            {/* Mode */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Mode</label>
              <select
                disabled={readOnly}
                value={element.props?.mode || "auto"}
                onChange={(e) => updateProps({ mode: e.target.value })}
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              >
                <option value="auto">Auto</option>
                <option value="local">Local Camera</option>
                <option value="remote">Remote Stream</option>
              </select>
            </div>

            {/* Remote src (mode === remote) */}
            {(element.props?.mode || "auto") === "remote" && (
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Remote Stream URL
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={element.props?.src || ""}
                  onChange={(e) => updateProps({ src: e.target.value })}
                  placeholder="https://example.com/stream.m3u8"
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                />
              </div>
            )}

            {/* Device ID */}
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Camera Device ID
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={element.props?.deviceId || ""}
                onChange={(e) => updateProps({ deviceId: e.target.value })}
                placeholder="Leave blank for default camera"
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={element.props?.enabled ?? true}
                  onChange={(e) => updateProps({ enabled: e.target.checked })}
                />
                Enabled
              </label>

              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={element.props?.playing ?? true}
                  onChange={(e) => updateProps({ playing: e.target.checked })}
                />
                Playing
              </label>

              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={element.props?.muted ?? true}
                  onChange={(e) => updateProps({ muted: e.target.checked })}
                />
                Muted
              </label>

              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={element.props?.mirror ?? true}
                  onChange={(e) => updateProps({ mirror: e.target.checked })}
                />
                Mirror
              </label>
            </div>

            {/* Object fit */}
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Object Fit
              </label>
              <select
                disabled={readOnly}
                value={element.props?.objectFit || "cover"}
                onChange={(e) => updateProps({ objectFit: e.target.value })}
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          </div>
        </InspectorSection>
      )}

      // inside src/components/InspectorPanel.js, in the Actions section

{/* ⚙️ Actions */}
{caps.showActions && (
  <InspectorSection title="Actions" defaultOpen={false}>
    <div className="space-y-3">
      {/* On Click selector */}
      <div>
        <label className="block text-xs text-text-muted mb-1">
          On Click
        </label>
        <select
          disabled={readOnly}
          value={onClickAction}
          onChange={(e) => updateProps({ onClick: e.target.value })}
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        >
          {actionOptions.map((opt) => (
            <option key={opt.value || "none"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 🔀 Navigate config */}
      {onClickAction === "navigate" && (
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Target Screen
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={element.props?.target || ""}
            onChange={(e) => updateProps({ target: e.target.value })}
            placeholder="e.g. 'LoginScreen'"
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      )}

      {/* 🌐 API call config */}
      {element.props?.onClick === "api" && (
        <div className="space-y-2">
          {/* URL */}
          <div>
            <label className="block text-xs text-text-muted mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={element.props?.endpoint || ""}
              onChange={(e) => updateProps({ endpoint: e.target.value })}
              placeholder="http://localhost:5000/api/users/me"
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            />
          </div>

          {/* HTTP Method */}
          <div>
            <label className="block text-xs text-text-muted mb-1">
              HTTP Method
            </label>
            <select
              disabled={readOnly}
              value={element.props?.apiMethod || "GET"}
              onChange={(e) =>
                updateProps({
                  method: e.target.value,     // 👈 used by runAction
                  apiMethod: e.target.value,  // 👈 keep for backward compat
                })
              }
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* ✅ Include Auth toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={element.props?.apiIncludeAuth ?? false}
              onChange={(e) =>
                updateProps({ apiIncludeAuth: e.target.checked })
              }
            />
            <span className="text-xs text-text-primary">
              Include Authorization header
            </span>
          </div>

          {/* Auth scheme & token – only when includeAuth is true */}
          {element.props?.apiIncludeAuth && (
            <>
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Auth Scheme
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={element.props?.apiAuthScheme || "Bearer"}
                  onChange={(e) =>
                    updateProps({ apiAuthScheme: e.target.value })
                  }
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">
                  JWT Token
                </label>
                <textarea
                  disabled={readOnly}
                  rows={3}
                  value={element.props?.apiAuthToken || ""}
                  onChange={(e) =>
                    updateProps({ apiAuthToken: e.target.value })
                  }
                  placeholder="Paste your JWT here"
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary font-mono text-xs"
                />
              </div>
            </>
          )}

          {/* 🔁 Target Prop for the result */}
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Target Prop (for API result)
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={
                element.props?.targetField ||
                element.props?.apiTargetField ||
                ""
              }
              onChange={(e) =>
                updateProps({
                  targetField: e.target.value,      // 👈 used by runAction
                  apiTargetField: e.target.value,   // 👈 backward compat
                })
              }
              placeholder='e.g. "text" (Text), "src" (VideoFeed)'
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
            />
          </div>

          {/* (Optional) Response path – nested data */}
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Response Path (optional)
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={
                element.props?.responsePath ||
                element.props?.apiResponsePath ||
                ""
              }
              onChange={(e) =>
                updateProps({
                  responsePath: e.target.value,      // 👈 used by runAction
                  apiResponsePath: e.target.value,   // 👈 backward compat
                })
              }
              placeholder='e.g. "user.name" if response is {"user": { "name": "Anish" }}'
              className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* 🧮 Custom JS */}
      {onClickAction === "custom" && (
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Custom JS
          </label>
          <textarea
            disabled={readOnly}
            rows={4}
            value={element.props?.customCode || ""}
            onChange={(e) => updateProps({ customCode: e.target.value })}
            placeholder="// ctx and event available here"
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary text-xs font-mono"
          />
        </div>
      )}
    </div>
  </InspectorSection>
)}


      {/* 🎯 Targeting */}
      {caps.showTargeting && (
        <InspectorSection title="Targeting" defaultOpen={false}>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Target Element
              </label>
              <select
                disabled={readOnly}
                value={currentTargetId}
                onChange={(e) => updateProps({ targetId: e.target.value })}
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              >
                <option value="">None</option>
                {targetOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">
                Target ID (manual)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={currentTargetId}
                onChange={(e) => updateProps({ targetId: e.target.value })}
                placeholder="Element ID"
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
            </div>
          </div>
        </InspectorSection>
      )}

      {/* 🔄 Conditions */}
      {caps.showConditions && (
        <InspectorSection title="Condition" defaultOpen={false}>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Condition
            </label>
            <select
              disabled={readOnly}
              value={element.props?.condition || ""}
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
