import React, { useState } from "react";
import InspectorSection from "./InspectorSection";

export default function InspectorPanel({ element, onUpdate, onDelete }) {
  // ✅ Hooks must be on top
  const [apiStatus, setApiStatus] = useState(null);

  if (!element) return null;

  /**
   * 🧠 Renders extra API configuration when "apiCall" action is selected
   */
  const renderApiConfig = (actionType) => {
    const isApiSelected =
    (actionType === "onClickAction" &&
        element.props?.onClickAction === "apiCall") ||
    (actionType === "onInputAction" &&
        element.props?.onInputAction === "apiCall") ||
    (actionType === "onLoadAction" &&
        element.props?.onLoadAction === "apiCall");


    if (!isApiSelected) return null;

    const headers = element.props?.apiHeaders || [];

    const updateHeaders = (newHeaders) =>
      onUpdate({
        props: { ...element.props, apiHeaders: newHeaders },
      });

    const handleHeaderChange = (index, field, value) => {
      const newHeaders = headers.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      );
      updateHeaders(newHeaders);
    };

    const addHeader = () => updateHeaders([...headers, { key: "", value: "" }]);
    const removeHeader = (index) =>
      updateHeaders(headers.filter((_, i) => i !== index));

    const testApiCall = async () => {
      const url = element.props?.apiUrl;
      if (!url) {
        alert("Please enter a valid API URL before testing.");
        return;
      }

      try {
        setApiStatus("pending");
        const res = await fetch(url, { method: "GET" });
        await res.json();
        setApiStatus("success");
      } catch (err) {
        console.error("❌ API test failed:", err);
        setApiStatus("error");
      } finally {
        setTimeout(() => setApiStatus(null), 3000);
      }
    };

    return (
      <div className="flex flex-col gap-2 mt-2">
        <label className="block text-xs text-text-muted mb-1">API URL</label>
        <input
          type="text"
          placeholder="https://example.com/api"
          value={element.props?.apiUrl || ""}
          onChange={(e) =>
            onUpdate({ props: { ...element.props, apiUrl: e.target.value } })
          }
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        />

        <label className="block text-xs text-text-muted mb-1">HTTP Method</label>
        <select
          value={element.props?.apiMethod || "POST"}
          onChange={(e) =>
            onUpdate({ props: { ...element.props, apiMethod: e.target.value } })
          }
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>

        <label className="block text-xs text-text-muted mt-2 mb-1">
          Request Headers
        </label>
        {headers.length === 0 && (
          <p className="text-xs text-text-muted italic mb-1">
            No headers added yet.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {headers.map((header, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                placeholder="Key"
                value={header.key}
                onChange={(e) => handleHeaderChange(idx, "key", e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) =>
                  handleHeaderChange(idx, "value", e.target.value)
                }
                className="flex-1 px-2 py-1 rounded bg-surface border border-border text-text-primary"
              />
              <button
                onClick={() => removeHeader(idx)}
                className="px-2 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addHeader}
          className="mt-1 px-2 py-1 text-sm bg-accent hover:bg-accent-light text-white rounded"
        >
          ➕ Add Header
        </button>

        <label className="block text-xs text-text-muted mt-3 mb-1">
          Target Element (optional)
        </label>
        <select
          value={element.props?.apiTarget || ""}
          onChange={(e) =>
            onUpdate({ props: { ...element.props, apiTarget: e.target.value } })
          }
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        >
          <option value="">None</option>
          {window.__CANVAS_ELEMENTS__?.map((el) => (
            <option key={el.id} value={el.id}>
              {el.props?.label || el.type} ({el.id})
            </option>
          ))}
        </select>

        <label className="block text-xs text-text-muted mt-3 mb-1">
          Response Field (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. data.title or message"
          value={element.props?.apiTargetField || ""}
          onChange={(e) =>
            onUpdate({
              props: { ...element.props, apiTargetField: e.target.value },
            })
          }
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        />
        <p className="text-[11px] text-text-muted italic">
          Leave blank to use the full response.
        </p>

        <label className="block text-xs text-text-muted mt-3 mb-1">
          Response Template (optional)
        </label>
        <textarea
          placeholder="e.g. Welcome {{user.name}} 🎉"
          value={element.props?.apiTemplate || ""}
          onChange={(e) =>
            onUpdate({
              props: { ...element.props, apiTemplate: e.target.value },
            })
          }
          rows={3}
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        ></textarea>
        <p className="text-[11px] text-text-muted italic">
          Use {"{{field.path}}"} to insert data dynamically.
        </p>

        <div className="flex items-center justify-between mt-2">
          <button
            onClick={testApiCall}
            className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition"
          >
            🚀 Test API
          </button>
          {apiStatus === "pending" && (
            <span className="text-yellow-400 text-xs">⏳ Testing...</span>
          )}
          {apiStatus === "success" && (
            <span className="text-green-400 text-xs">✅ Success</span>
          )}
          {apiStatus === "error" && (
            <span className="text-red-400 text-xs">❌ Failed</span>
          )}
        </div>
      </div>
    );
  };

  const renderActionsForType = () => {
  // 🪄 Button-based elements
  if (["Button", "MicButton", "ControlButton"].includes(element.type)) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs text-text-muted mb-1">
          On Click Action
        </label>
        <select
          value={element.props?.onClickAction || ""}
          onChange={(e) =>
            onUpdate({
              props: { ...element.props, onClickAction: e.target.value },
            })
          }
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        >
          <option value="">Select Action</option>
          <option value="consoleLog">Console Log</option>
          <option value="alert">Show Alert</option>
          <option value="navigate">Navigate</option>
          <option value="apiCall">API Call</option>
        </select>

        {renderApiConfig("onClickAction")}
      </div>
    );
  }

  // 🧾 TextBox elements
  if (element.type === "TextBox") {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs text-text-muted mb-1">
          On Input Action
        </label>
        <select
          value={element.props?.onInputAction || ""}
          onChange={(e) =>
            onUpdate({
              props: { ...element.props, onInputAction: e.target.value },
            })
          }
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        >
          <option value="">Select Action</option>
          <option value="consoleLog">Console Log</option>
          <option value="alert">Show Alert</option>
          <option value="navigate">Navigate</option>
          <option value="apiCall">API Call</option>
        </select>

        {renderApiConfig("onInputAction")}
      </div>
    );
  }

  // 🧠 VideoFeed elements (Host Camera, etc.)
  // 🧠 VideoFeed elements (Host Camera, etc.)
if (element.type === "VideoFeed") {
  return (
    <div className="flex flex-col gap-2">
      {/* Action Type */}
      <label className="block text-xs text-text-muted mb-1">
        On Load Action
      </label>
      <select
        value={element.props?.onLoadAction || ""}
        onChange={(e) =>
          onUpdate({
            props: { ...element.props, onLoadAction: e.target.value },
          })
        }
        className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
      >
        <option value="">None</option>
        <option value="apiCall">API Call</option>
      </select>

      {/* Only show config if API Call selected */}
      {element.props?.onLoadAction === "apiCall" && renderApiConfig("onLoadAction")}

      {/* Template Output */}
      <label className="block text-xs text-text-muted mt-3 mb-1">
        Response Template (optional)
      </label>
      <textarea
        placeholder="e.g. Stream from {{camera.name}}"
        value={element.props?.apiTemplate || ""}
        onChange={(e) =>
          onUpdate({
            props: { ...element.props, apiTemplate: e.target.value },
          })
        }
        rows={3}
        className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
      ></textarea>
      <p className="text-[11px] text-text-muted italic">
        Use <code>{`{{field.path}}`}</code> to insert dynamic data.
      </p>
    </div>
  );
}


  // 🪨 Default fallback
  return (
    <p className="text-sm text-text-muted italic">
      No specific actions for this element type.
    </p>
  );
};


  return (
    <div className="w-80 bg-panel border-l border-border p-4 flex flex-col gap-4 rounded-r-lg shadow-soft max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-1">Inspector</h3>

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

      {/* Content */}
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

      {/* Style */}
      <InspectorSection title="Style" defaultOpen={false}>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Background
          </label>
          <input
            type="color"
            value={element.props?.bgColor || "#1E1E1E"}
            onChange={(e) =>
              onUpdate({ props: { ...element.props, bgColor: e.target.value } })
            }
            className="w-full h-8 cursor-pointer rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Border Radius
          </label>
          <input
            type="number"
            value={element.props?.borderRadius || 8}
            onChange={(e) =>
              onUpdate({
                props: {
                  ...element.props,
                  borderRadius: parseInt(e.target.value, 10),
                },
              })
            }
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      </InspectorSection>

      {/* Actions */}
      <InspectorSection title="Actions" defaultOpen={false}>
        {renderActionsForType()}
      </InspectorSection>

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
