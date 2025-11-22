import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";
import COMPONENTS from "../components/elements/registry";
import InspectorPanel from "./InspectorPanel";
import Tabs from "./Tabs";
import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";
import { useProjectContext } from "../context/ProjectContext";
import { ChevronDown, ChevronUp, Move, Dock } from "lucide-react";

const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

export default function Canvas({ role }) {
  const [device, setDevice] = useState("desktop");
  const [scale, setScale] = useState(0.75);
  const { isPreviewMode } = usePreviewMode();
  const { elements, addElement, updateElement, removeElement } = useCanvasState();
  const { projectType } = useProjectContext();

  const [selectedId, setSelectedId] = useState(null);
  const [availableElements, setAvailableElements] = useState([]);
  const [activeTab, setActiveTab] = useState("Elements");

  const [inspectorState, setInspectorState] = useState({
    host: true,
    client: true,
    null: true,
  });
  const [inspectorDocked, setInspectorDocked] = useState(true);
  const [inspectorPosition, setInspectorPosition] = useState({ x: 200, y: 200 });

  const canvasRef = useRef(null);
  const inspectorRef = useRef(null);
  const containerRef = useRef(null);

  // manual drag state for undocked inspector
  const [isDraggingInspector, setIsDraggingInspector] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const deviceSize = DEVICE_SIZES[device];
  const currentRoleKey = role || "null";
  const isInspectorOpen = inspectorState[currentRoleKey];

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
     🧩 Drag and Drop Element
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
      role: role || null,
      x: dropX - 150,
      y: dropY - 75,
      width: 300,
      height: 150,
      props: meta.editableProps || {},
    });
  };
  const handleDragOver = (e) => e.preventDefault();

  /* ------------------------------------------------------------
     🧭 Inspector Toggle
  ------------------------------------------------------------ */
  const toggleInspector = () => {
    setInspectorState((prev) => ({
      ...prev,
      [currentRoleKey]: !prev[currentRoleKey],
    }));
  };

  const toggleDock = () => setInspectorDocked((prev) => !prev);

  /* ------------------------------------------------------------
     🧭 Manual drag for undocked inspector
  ------------------------------------------------------------ */
  const handleInspectorDragStart = (e) => {
    if (inspectorDocked) return;
    if (!containerRef.current) return;

    setIsDraggingInspector(true);

    const containerRect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - containerRect.left - inspectorPosition.x,
      y: e.clientY - containerRect.top - inspectorPosition.y,
    };
  };

  useEffect(() => {
    if (!isDraggingInspector) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const handleMove = (e) => {
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const newX = mouseX - dragOffsetRef.current.x;
      const newY = mouseY - dragOffsetRef.current.y;

      const maxX = containerRect.width - 260; // min inspector width
      const maxY = containerRect.height - 100; // leave a bit of bottom space

      setInspectorPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleUp = () => setIsDraggingInspector(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("mouseleave", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("mouseleave", handleUp);
    };
  }, [isDraggingInspector, inspectorPosition]);

  /* ------------------------------------------------------------
     🧭 Render Element
  ------------------------------------------------------------ */
  const renderElement = (el) => {
    const ElementComp = COMPONENTS[el.type];
    if (!ElementComp) return null;

    const isButton = ["Button", "MicButton", "ControlButton"].includes(el.type);
    const isTextBox = el.type === "TextBox";

    if (isPreviewMode) {
      if (isTextBox)
        return (
          <input
            type="text"
            placeholder={el.props.placeholder || "Type..."}
            className="w-full h-full bg-transparent outline-none px-2 text-white"
            style={{ backgroundColor: el.props.bgColor || "#333", borderRadius: 8 }}
          />
        );
      try {
        return <ElementComp {...el.props} />;
      } catch (e) {
        console.error("❌ Preview render failed:", el.type, e);
        return <div style={{ color: "red" }}>Error rendering {el.type}</div>;
      }
    }

    if (isButton)
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

    if (isTextBox)
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

    return (
      <div className="w-full h-full" style={{ pointerEvents: "none" }}>
        <ElementComp {...el.props} />
      </div>
    );
  };

  /* ------------------------------------------------------------
     🧮 Filter Elements by Role
  ------------------------------------------------------------ */
  const visibleElements = elements.filter((el) => {
    if (projectType === "single") return true;
    if (role === null) return true;
    return el.role === role;
  });

  const isSplitPreview = isPreviewMode && (role === "host" || role === "client");
  const isSplitEditor = !isPreviewMode && (role === "host" || role === "client");

  /* ------------------------------------------------------------
     🖼️ Render
  ------------------------------------------------------------ */
  return (
    <div
      ref={containerRef}
      className="flex w-full min-w-0 gap-4 h-full relative overflow-visible"
    >
      {/* Sidebar */}
      <div
        className={`shrink-0 transition-all duration-300 bg-panel flex flex-col
          ${isSplitPreview ? "hidden" : `${
            isSplitEditor ? "w-44" : "w-56"
          } p-3 border-r border-border`}
        `}
      >
        {!isSplitPreview && (
          <>
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
                {elements
                  .filter((el) => (role ? el.role === role : true))
                  .map((el) => (
                    <div
                      key={el.id}
                      onClick={() => {
                        setSelectedId(el.id);
                        setInspectorState((prev) => ({
                          ...prev,
                          [currentRoleKey]: true,
                        }));
                      }}
                      className={`flex justify-between items-center px-2 py-1 rounded cursor-pointer mb-1 ${
                        selectedId === el.id ? "bg-accent/20" : "hover:bg-accent/10"
                      }`}
                    >
                      <span className="text-sm">
                        {el.type} {el.role && `(${el.role})`}
                      </span>
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
          </>
        )}
      </div>

      {/* Canvas + Inspector */}
      <div className="flex flex-col flex-1 relative bg-panel">
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
        </div>

        {/* Canvas */}
        <div
          className="flex justify-center items-start overflow-auto relative flex-1"
          onClick={(e) => {
            if (e.target === canvasRef.current) setSelectedId(null);
          }}
        >
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
            {visibleElements.map((el) => (
              <Rnd
                key={el.id}
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                onClick={() => {
                  setSelectedId(el.id);
                  setInspectorState((prev) => ({
                    ...prev,
                    [currentRoleKey]: true,
                  }));
                }}
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
                  isPreviewMode ? "cursor-pointer" : "cursor-move"
                } ${
                  selectedId === el.id
                    ? isPreviewMode
                      ? "border-blue-500"
                      : "border-purple-500 shadow-[0_0_0_2px_rgba(168,85,247,0.5)]"
                    : "border-gray-600 hover:border-purple-400"
                }`}
              >
                {renderElement(el)}
              </Rnd>
            ))}
          </div>
        </div>

        {/* 🧪 Draggable / Dockable Inspector */}
        {isInspectorOpen &&
          (inspectorDocked ? (
            // Docked: full-width bar at the bottom of the canvas area
            <div
      style={{
        flexShrink: 0,
        marginTop: 8,
        display: "flex",
        justifyContent: "center", // center inside this Canvas column
        zIndex: 50,
      }}
    >
      <div
        className="bg-panel border border-border rounded-lg shadow-soft transition-all duration-300 flex flex-col"
        style={{
          width: 360,          // fixed, reasonable width
          maxWidth: "100%",    // if column is narrower, shrink
          maxHeight: "40vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-border bg-panel-dark select-none"
          style={{ userSelect: "none", minWidth: 0, overflow: "visible" }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Move size={14} />
            Inspector
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-text-muted hover:text-accent transition"
              onClick={toggleDock}
              title="Undock Inspector"
            >
              <Dock size={14} />
            </button>
            <button
              className="text-xs text-text-muted hover:text-accent transition"
              onClick={toggleInspector}
              title="Close Inspector"
            >
              {isInspectorOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-4 overflow-y-auto flex-1"
          ref={inspectorRef}
          style={{ minHeight: 0, overflowY: "auto" }}
        >
          <InspectorPanel
            element={elements.find((el) => el.id === selectedId)}
            onUpdate={(updates) => updateElement(selectedId, updates)}
            onDelete={() => removeElement(selectedId)}
            readOnly={isPreviewMode}
          />
        </div>
      </div>
    </div>
          ) : (
            // Undocked: floating panel with manual drag
            <div
              className="bg-panel rounded-lg shadow-2xl border border-border transition-all duration-150"
              style={{
                position: "absolute",
                top: inspectorPosition.y,
                left: inspectorPosition.x,
                zIndex: 999,
                display: "flex",
                flexDirection: "column",
                minWidth: 260,
                maxWidth: 420,
                maxHeight: "60vh",
              }}
            >
              <div
                className="inspector-drag-handle flex items-center justify-between px-3 py-2 border-b border-border bg-panel-dark select-none"
                style={{ userSelect: "none", minWidth: 200, overflow: "visible" }}
                onMouseDown={handleInspectorDragStart}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Move size={14} />
                  Inspector
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-text-muted hover:text-accent transition"
                    onClick={toggleDock}
                    title="Dock Inspector"
                  >
                    <Dock size={14} />
                  </button>
                  <button
                    className="text-xs text-text-muted hover:text-accent transition"
                    onClick={toggleInspector}
                    title="Close Inspector"
                  >
                    {isInspectorOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>

              <div
                className="p-4 overflow-y-auto flex-1"
                ref={inspectorRef}
                style={{ minHeight: 0, overflowY: "auto" }}
              >
                <InspectorPanel
                  element={elements.find((el) => el.id === selectedId)}
                  onUpdate={(updates) => updateElement(selectedId, updates)}
                  onDelete={() => removeElement(selectedId)}
                  readOnly={isPreviewMode}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
