// src/components/InspectorPanel.js
import React, { useState, useMemo } from "react";
import InspectorSection from "./InspectorSection";
import { useProjectContext } from "../context/ProjectContext";

// Capabilities per element type
const ELEMENT_CAPABILITIES = {
  VideoFeed: {
    showActions: false,
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

export default function InspectorPanel({
  element,
  elements = [],
  onUpdate,
  onDelete,
  readOnly,
}) {
  const { projectType } = useProjectContext();
  const [apiStatus, setApiStatus] = useState(null);

  // 🛑 Hooks MUST be at the top of the component — before any return!
  const isVideoFeed =
    element?.type === "VideoFeed" || element?.type === "videofeed";

  // What capabilities apply?
  const caps = ELEMENT_CAPABILITIES[element?.type] || {
    showActions: true,
    showTargeting: true,
    showConditions: true,
  };

  // Restrict targeting: VideoFeed can only target other VideoFeeds
  const restrictTargetToVideoFeeds = isVideoFeed;

  // Build list of targetable elements
  const targetOptions = useMemo(() => {
    if (!element) return [];

    let list = elements;

    if (restrictTargetToVideoFeeds) {
      list = elements.filter(
        (el) => el.type === "VideoFeed" || el.type === "videofeed"
      );
    }

    return list.map((el) => {
      const label = el.props?.label || el.type || "Element";
      const shortId = el.id?.slice(0, 6) || "";
      return { id: el.id, label: `${label} (${shortId})` };
    });
  }, [elements, element, restrictTargetToVideoFeeds]);

  // EARLY RETURN — now safe because hooks are already declared above
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

  const updateProps = (patch) =>
    onUpdate({
      props: { ...element.props, ...patch },
    });

  const currentTargetId = element.props?.targetId || "";
  const hideActionsForRemoteVideo =
    isVideoFeed && element.props?.mode === "remote";

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

      {renderRoleInfo()}

      {/* 📐 Position */}
      <InspectorSection title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          {["x", "y", "width", "height"].map((field) => (
            <div key={field}>
              <label className="block text-xs text-text-muted mb-1">
                {field.toUpperCase()}
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
        <label className="block text-xs text-text-muted mb-1">Label</label>
        <input
          type="text"
          disabled={readOnly}
          value={element.props?.label || ""}
          onChange={(e) => updateProps({ label: e.target.value })}
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        />
      </InspectorSection>

      {/* 🎥 VIDEO SETTINGS */}
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
                className="w-full px-2 py-1 rounded bg-surface border border-border"
              >
                <option value="auto">Auto</option>
                <option value="local">Local Camera</option>
                <option value="remote">Remote Stream</option>
              </select>
            </div>

            {/* Remote src */}
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
                  className="w-full px-2 py-1 rounded bg-surface border border-border"
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
                placeholder="default camera"
                className="w-full px-2 py-1 rounded bg-surface border border-border"
              />
            </div>

            {/* Boolean flags */}
            <div className="grid grid-cols-2 gap-2">
              {[
                ["enabled", "Enabled"],
                ["playing", "Playing"],
                ["muted", "Muted"],
                ["mirror", "Mirror"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-xs text-text-primary"
                >
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={element.props?.[key] ?? true}
                    onChange={(e) => updateProps({ [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Object Fit */}
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Object Fit
              </label>
              <select
                disabled={readOnly}
                value={element.props?.objectFit || "cover"}
                onChange={(e) => updateProps({ objectFit: e.target.value })}
                className="w-full px-2 py-1 rounded bg-surface border border-border"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          </div>
        </InspectorSection>
      )}

      {/* ⚙ ACTIONS */}
      {caps.showActions && !hideActionsForRemoteVideo && (
        <InspectorSection title="Actions">
          <label className="block text-xs text-text-muted mb-1">On Click</label>
          <select
            disabled={readOnly}
            value={element.props?.onClick || ""}
            onChange={(e) => updateProps({ onClick: e.target.value })}
            className="w-full px-2 py-1 rounded bg-surface border border-border"
          >
            <option value="">None</option>
            <option value="navigate">Navigate</option>
            <option value="toggle">Toggle</option>
            <option value="api">API Call</option>
            <option value="custom">Custom JS</option>
          </select>
        </InspectorSection>
      )}

      {/* 🎯 TARGETING */}
      {caps.showTargeting && (
        <InspectorSection title="Targeting">
          <label className="block text-xs text-text-muted mb-1">
            Target Element
          </label>
          <select
            disabled={readOnly}
            value={currentTargetId}
            onChange={(e) => updateProps({ targetId: e.target.value })}
            className="w-full px-2 py-1 rounded bg-surface border border-border"
          >
            <option value="">None</option>
            {targetOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Manual override */}
          <label className="block text-xs text-text-muted mb-1 mt-2">
            Target ID (manual)
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={currentTargetId}
            onChange={(e) => updateProps({ targetId: e.target.value })}
            className="w-full px-2 py-1 rounded bg-surface border border-border"
          />

          {/* Conditions */}
          {caps.showConditions && (
            <>
              <label className="block text-xs text-text-muted mb-1 mt-2">
                Condition
              </label>
              <select
                disabled={readOnly}
                value={element.props?.condition || ""}
                onChange={(e) => updateProps({ condition: e.target.value })}
                className="w-full px-2 py-1 rounded bg-surface border border-border"
              >
                <option value="">None</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </>
          )}
        </InspectorSection>
      )}

      {/* 🧨 DELETE */}
      <InspectorSection title="Danger Zone">
        <button
          onClick={onDelete}
          disabled={readOnly}
          className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
        >
          🗑 Delete Element
        </button>
      </InspectorSection>
    </div>
  );
}
