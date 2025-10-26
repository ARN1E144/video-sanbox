import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";
import { COMPONENTS } from "../components/elements/registry";
import InspectorPanel from "./InspectorPanel";
import Tabs from "./Tabs";
import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";

const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

export default function Canvas() {
  const [device, setDevice] = useState("desktop");
  const [scale, setScale] = useState(0.75);
  const { isPreviewMode, setIsPreviewMode } = usePreviewMode();
  const { elements, addElement, updateElement, removeElement } = useCanvasState();

  const [selectedId, setSelectedId] = useState(null);
  const [availableElements, setAvailableElements] = useState([]);
  const [activeTab, setActiveTab] = useState("Elements");

  const canvasRef = useRef(null);
  const deviceSize = DEVICE_SIZES[device];

  /* ------------------------------------------------------------
   🧠 Load element metadata
  ------------------------------------------------------------ */
  useEffect(() => {
    const ctx = require.context("../components/elements", false, /\.meta\.json$/);
    const all = ctx.keys().map((key) => {
      const meta = ctx(key);
      return meta.default || meta;
    });
    setAvailableElements(all);
  }, []);

  /* ------------------------------------------------------------
   🧩 Add Element (drag/drop)
  ------------------------------------------------------------ */
  const handleDrop = (e) => {
    e.preventDefault();
    const metaString = e.dataTransfer.getData("application/json");
    if (!metaString) return;
    const meta = JSON.parse(metaString);

    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = (e.clientX - rect.left) / scale;
    const dropY = (e.clientY - rect.top) / scale;

    addElement({
      id: uuid(),
      type: meta.name,
      x: dropX - 150,
      y: dropY - 75,
      width: 300,
      height: 150,
      props: meta.editableProps || {},
    });

    setSelectedId(meta.id);
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ------------------------------------------------------------
   🧠 Action Handling in Preview Mode
  ------------------------------------------------------------ */
  const handleExecuteAction = (el, event) => {
    if (["Button", "MicButton", "ControlButton"].includes(el.type)) {
      switch (el.props.onClickAction) {
        case "consoleLog":
          console.log("🪝 Button clicked:", el);
          break;
        case "alert":
          alert(`🚀 ${el.props.label || "Button"} clicked!`);
          break;
        case "navigate":
          console.log("🌍 Navigation action triggered");
          break;
        default:
          break;
      }
    }

    if (el.type === "TextBox" && el.props.onInputAction) {
      const val = event?.target?.value || "";
      switch (el.props.onInputAction) {
        case "logInput":
          console.log("📥 Input value:", val);
          break;
        case "validate":
          console.log("✅ Validating:", val);
          break;
        default:
          break;
      }
    }
  };

  /* ------------------------------------------------------------
   🧭 Element Rendering Helper
  ------------------------------------------------------------ */
  const renderElement = (el) => {
    const ElementComp = COMPONENTS[el.type];
    if (!ElementComp) return null;

    const isButton = ["Button", "MicButton", "ControlButton"].includes(el.type);
    const isTextBox = el.type === "TextBox";

    if (isPreviewMode) {
      // ✅ Fully interactive preview
      if (isTextBox) {
        return (
          <input
            type="text"
            placeholder={el.props.placeholder || "Type..."}
            onInput={(e) => handleExecuteAction(el, e)}
            className="w-full h-full bg-transparent outline-none px-2 text-white"
            style={{
              backgroundColor: el.props.bgColor || "#333",
              borderRadius: 8,
            }}
          />
        );
      }

      try {
        return <ElementComp {...el.props} />;
      } catch (e) {
        console.error("❌ Preview render failed:", el.type, e);
        return <div style={{ color: "red" }}>Error rendering {el.type}</div>;
      }
    }

    // ✍️ Editor mode (non-interactive)
    if (isButton) {
      return (
        <div
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            backgroundColor: el.props.bgColor || "#6d28d9",
            borderRadius: 8,
            pointerEvents: "none",
          }}
        >
          {el.props.label || "Button"}
        </div>
      );
    }

    if (isTextBox) {
      return (
        <input
          type="text"
          placeholder={el.props.placeholder || "Type..."}
          disabled
          className="w-full h-full bg-transparent outline-none px-2 text-white"
          style={{
            backgroundColor: el.props.bgColor || "#333",
            borderRadius: 8,
            pointerEvents: "none",
          }}
        />
      );
    }

    return (
      <div className="w-full h-full" style={{ pointerEvents: "none" }}>
        <ElementComp {...el.props} />
      </div>
    );
  };

  /* ------------------------------------------------------------
   🖼️ Main Render
  ------------------------------------------------------------ */
  return (
    <div className="flex w-full gap-4 h-full">
      {/* --- Sidebar --- */}
      {!isPreviewMode && (
        <div className="flex flex-col w-56 border-r border-border bg-panel p-3 overflow-y-auto">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={["Elements", "Layers"]} />

          {activeTab === "Elements" && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-text-primary">🧩 Elements</h3>
              {availableElements.map((el) => (
                <div
                  key={el.name}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("application/json", JSON.stringify(el))
                  }
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent/10 transition cursor-grab active:cursor-grabbing"
                >
                  <span>{el.icon}</span>
                  <span>{el.name}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Layers" && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-text-primary">🧭 Layers</h3>
              {elements.length === 0 && (
                <p className="text-xs text-text-muted italic">No elements yet</p>
              )}
              {elements.map((el) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex justify-between items-center px-2 py-1 rounded cursor-pointer mb-1 ${
                    selectedId === el.id ? "bg-accent/20" : "hover:bg-accent/10"
                  }`}
                >
                  <span className="text-sm">{el.type}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(el.id);
                      if (selectedId === el.id) setSelectedId(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Main Editor/Preview Column --- */}
      <div className="flex flex-col flex-1 items-center">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="bg-panel text-text-primary border border-border rounded-lg px-3 py-1"
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>

          <label className="text-text-primary">
            Zoom:
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="ml-2"
            />
            <span className="ml-2">{Math.round(scale * 100)}%</span>
          </label>

          <button
            onClick={() => setIsPreviewMode((prev) => !prev)}
            className={`px-3 py-1 rounded text-white transition ${
              isPreviewMode ? "bg-green-600 hover:bg-green-500" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isPreviewMode ? "Preview Mode ✅" : "Editor Mode ✍️"}
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-md"
          style={{
            width: deviceSize.width * scale,
            height: deviceSize.height * scale,
            transformOrigin: "top left",
          }}
        >
          {elements.map((el) => (
            <Rnd
              key={el.id}
              size={{ width: el.width, height: el.height }}
              position={{ x: el.x, y: el.y }}
              onClick={() => setSelectedId(el.id)}
              onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
              onResizeStop={(e, direction, ref, delta, position) =>
                updateElement(el.id, {
                  width: parseFloat(ref.style.width),
                  height: parseFloat(ref.style.height),
                  ...position,
                })
              }
              bounds="parent"
              scale={scale}
              className={`group rounded-lg border-2 ${
                isPreviewMode ? "cursor-pointer" : "cursor-move"}
                ${ selectedId === el.id ? 
                   isPreviewMode ?
                   "border-blue-500"              // 🔹 maybe a subtler border for preview
                   : "border-purple-500 shadow-[0_0_0_2px_rgba(168,85,247,0.5)]"
                    : "border-gray-600 hover:border-purple-400"
              }`}
            >
              {renderElement(el)}
            </Rnd>
          ))}
        </div>
      </div>

      {/* Inspector Panel always visible */}
      <InspectorPanel
        element={elements.find((el) => el.id === selectedId)}
        onUpdate={(updates) => updateElement(selectedId, updates)}
        onDelete={() => removeElement(selectedId)}
      />
    </div>
  );
}
