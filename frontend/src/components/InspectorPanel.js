// src/components/InspectorPanel.js
import React, { useMemo, useState } from "react";
import InspectorSection from "./InspectorSection";
import { useProjectContext } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";

const DEFAULT_CAPS = {
  showActions: true,
  showTargeting: true,
  showConditions: true,
};

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
  Container: {
    showActions: false,
    showTargeting: false,
    showConditions: false,
  },
  ChatPanel: {
    showActions: false,
    showTargeting: false,
    showConditions: true,
  },
  MicButton: {
    showActions: true,
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

// IMPORTANT: values MUST match runAction() cases exactly (case-sensitive)
const DEFAULT_ACTION_OPTIONS = [
  { value: "", label: "None" },
  { value: "toggle", label: "Toggle (enabled/playing)" },
  { value: "api", label: "API Call" },
  { value: "StartStream", label: "Start Video Stream" },
  { value: "StopStream", label: "Stop Video Stream" },
  { value: "LoadVideo", label: "Load Video" },
  { value: "SendMessage", label: "Send Message" },
  { value: "ToggleMic", label: "Toggle Microphone" },
  { value: "EndCall", label: "End Call" },
  { value: "custom", label: "Custom JS" },
];

const ELEMENT_ACTIONS = {
  ControlButton: DEFAULT_ACTION_OPTIONS,
  MicButton: [
    { value: "", label: "None" },
    { value: "ToggleMic", label: "Toggle Microphone" },
    { value: "custom", label: "Custom JS" },
  ],
};

export default function InspectorPanel({
  element,
  elements = [],
  onUpdate,
  onDelete,
  readOnly,
}) {
  const [apiStatus] = useState(null); // reserved for future
  const { projectType } = useProjectContext();
  const { canBuild } = useAuth();

  // In editor: canBuild controls whether builder sections appear.
  // In preview: we still show things readOnly.
  const canEditBuilder = !!canBuild && !readOnly;

  const isSingleProject = projectType === "single";

  // ---- derive caps (DO NOT mutate caps objects) ----
  const caps = useMemo(() => {
    const base = ELEMENT_CAPABILITIES[element?.type] || DEFAULT_CAPS;

    // clone so we can safely adjust per project mode
    const next = { ...base };

    // Example rule you had: in SINGLE projects, only ControlButton can target
    if (isSingleProject) {
      next.showTargeting = next.showTargeting && element?.type === "ControlButton";
    }

    return next;
  }, [element?.type, isSingleProject]);

  const actionOptions = useMemo(() => {
    if (!element) return DEFAULT_ACTION_OPTIONS;
    return ELEMENT_ACTIONS[element.type] || DEFAULT_ACTION_OPTIONS;
  }, [element]);

  // ---- targets for Targeting dropdown ----
  const targetOptions = useMemo(() => {
    const list = (elements || []).filter((el) => !!el?.id);

    const filtered = isSingleProject
      ? list.filter((el) => ["VideoFeed", "Text", "ChatPanel"].includes(el.type))
      : list;

    return filtered.map((el) => {
      const label = el.props?.label || el.type || "Element";
      const shortId = el.id?.slice(0, 6) || "";
      return { id: el.id, label: `${label} (${shortId})` };
    });
  }, [elements, isSingleProject]);

  // ---- early return AFTER hooks ----
  if (!element) {
    return (
      <div className="w-80 bg-panel border-l border-border p-4 rounded-r-lg shadow-soft text-sm text-text-muted">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">Inspector</h3>
        <p>Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  const isVideoFeed = element.type === "VideoFeed";

  const currentTargetId = element.props?.targetId || "";
  const onClickAction = element.props?.onClick || "";

  const updateProps = (patch) =>
    onUpdate({
      props: { ...(element.props || {}), ...patch },
    });

  // 🧭 Role info (your projectType is single/multi — show role only in multi)
  const renderRoleInfo = () => {
    if (projectType !== "multi" || !element.role) return null;

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
    <div className="w-80 bg-panel border-l border-border p-4 flex flex-col gap-4 rounded-r-lg shadow-soft">
      <h3 className="text-lg font-semibold mb-1">Inspector</h3>

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

            <div>
              <label className="block text-xs text-text-muted mb-1">Camera Device ID</label>
              <input
                type="text"
                disabled={readOnly}
                value={element.props?.deviceId || ""}
                onChange={(e) => updateProps({ deviceId: e.target.value })}
                placeholder="Leave blank for default camera"
                className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["enabled", "Enabled"],
                ["playing", "Playing"],
                ["muted", "Muted"],
                ["mirror", "Mirror"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-text-primary">
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

            <div>
              <label className="block text-xs text-text-muted mb-1">Object Fit</label>
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

      {/* 🔒 Builder-only sections in editor.
          In preview, we allow showing them but readOnly disables edits anyway.
          If you want to HIDE them in preview too, we can gate with canBuild only. */}

      {/* ⚙️ Actions */}
      {caps.showActions && (canBuild || readOnly) && (
        <InspectorSection title="Actions" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">On Click</label>
              <select
                disabled={readOnly || !canEditBuilder}
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

            {onClickAction === "toggle" && caps.showTargeting && (
              <div className="text-xs text-text-muted">
                Tip: choose a target in <b>Targeting</b> (below) for toggle to work.
              </div>
            )}

            {onClickAction === "api" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-text-muted mb-1">API Endpoint</label>
                  <input
                    type="text"
                    disabled={readOnly || !canEditBuilder}
                    value={element.props?.endpoint || ""}
                    onChange={(e) => updateProps({ endpoint: e.target.value })}
                    placeholder="http://localhost:5000/api/users/me"
                    className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">HTTP Method</label>
                  <select
                    disabled={readOnly || !canEditBuilder}
                    value={element.props?.method || element.props?.apiMethod || "GET"}
                    onChange={(e) =>
                      updateProps({
                        method: e.target.value,      // ✅ canonical
                        apiMethod: e.target.value,   // ♻️ legacy compatibility
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                  >
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={readOnly || !canEditBuilder}
                    checked={element.props?.apiIncludeAuth ?? false}
                    onChange={(e) => updateProps({ apiIncludeAuth: e.target.checked })}
                  />
                  <span className="text-xs text-text-primary">Include Authorization header</span>
                </div>

                {element.props?.apiIncludeAuth && (
                  <>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Auth Scheme</label>
                      <input
                        type="text"
                        disabled={readOnly || !canEditBuilder}
                        value={element.props?.apiAuthScheme || "Bearer"}
                        onChange={(e) => updateProps({ apiAuthScheme: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-text-muted mb-1">JWT Token</label>
                      <textarea
                        disabled={readOnly || !canEditBuilder}
                        rows={3}
                        value={element.props?.apiAuthToken || ""}
                        onChange={(e) => updateProps({ apiAuthToken: e.target.value })}
                        placeholder="Paste your JWT here"
                        className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs text-text-muted mb-1">Target Prop (API result)</label>
                  <input
                    type="text"
                    disabled={readOnly || !canEditBuilder}
                    value={element.props?.targetField || element.props?.apiTargetField || ""}
                    onChange={(e) =>
                      updateProps({
                        targetField: e.target.value,
                        apiTargetField: e.target.value,
                      })
                    }
                    placeholder='e.g. "text" (Text), "src" (VideoFeed)'
                    className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">Response Path (optional)</label>
                  <input
                    type="text"
                    disabled={readOnly || !canEditBuilder}
                    value={element.props?.responsePath || element.props?.apiResponsePath || ""}
                    onChange={(e) =>
                      updateProps({
                        responsePath: e.target.value,
                        apiResponsePath: e.target.value,
                      })
                    }
                    placeholder='e.g. "user.name"'
                    className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {onClickAction === "custom" && (
              <div>
                <label className="block text-xs text-text-muted mb-1">Custom JS</label>
                <textarea
                  disabled={readOnly || !canEditBuilder}
                  rows={4}
                  value={element.props?.customCode || ""}
                  onChange={(e) => updateProps({ customCode: e.target.value })}
                  placeholder="// ctx and event available here"
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary text-xs font-mono"
                />
              </div>
            )}

            {apiStatus && <div className="text-xs text-text-muted">{apiStatus}</div>}
          </div>
        </InspectorSection>
      )}

      {/* 🎯 Targeting */}
      {caps.showTargeting && (canBuild || readOnly) && (
        <InspectorSection title="Targeting" defaultOpen={false}>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">Target Element</label>
              <select
                disabled={readOnly || !canEditBuilder}
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
              <label className="block text-xs text-text-muted mb-1">Target ID (manual)</label>
              <input
                type="text"
                disabled={readOnly || !canEditBuilder}
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
      {caps.showConditions && (canBuild || readOnly) && (
        <InspectorSection title="Condition" defaultOpen={false}>
          <div>
            <label className="block text-xs text-text-muted mb-1">Condition</label>
            <select
              disabled={readOnly || !canEditBuilder}
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
      {(canBuild || readOnly) && (
        <InspectorSection title="Danger Zone" defaultOpen={false}>
          <button
            onClick={() => {
              if (readOnly || !canBuild) return;
              onDelete?.();
            }}
            disabled={readOnly || !canBuild}
            className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canBuild && !readOnly ? "No build permission" : ""}
          >
            🗑 Delete Element
          </button>
        </InspectorSection>
      )}
    </div>
  );
}
