// src/components/Canvas.js
import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";
import COMPONENTS from "../components/elements/registry";
import InspectorPanel from "./InspectorPanel";
import Tabs from "./Tabs";
import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";
import { useProjectContext } from "../context/ProjectContext";
import { runAction } from "../utils/actionExecutor";
import { useActionContext } from "../context/ActionContext";
import {
  ChevronDown,
  ChevronUp,
  Move,
  Dock,
  Bug,
  Palette,
} from "lucide-react";
import DebugBindingsPanel from "./DebugBindingPanel";

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
  const { projectType, backgroundConfigs, setBackgroundConfigs } = useProjectContext();
  const actionCtx = useActionContext();

  const [selectedId, setSelectedId] = useState(null);
  const [availableElements, setAvailableElements] = useState([]);
  const [activeTab, setActiveTab] = useState("Elements");

  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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

  const isRoleCanvas = role === "host" || role === "client";
  const currentRoleKey = role || "null";
  const isInspectorOpen = inspectorState[currentRoleKey];

  const deviceSize = DEVICE_SIZES[device];

  /* ------------------------------------------------------------
   * Background (per device, shared for project)
   * ---------------------------------------------------------- */
  const defaultBg = {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  };

  const activeBg = (backgroundConfigs && backgroundConfigs[device]) || defaultBg;

  const canvasBackgroundStyle =
    activeBg.kind === "image" && activeBg.imageUrl
      ? {
          backgroundImage: `url(${activeBg.imageUrl})`,
          backgroundRepeat: activeBg.size === "repeat" ? "repeat" : "no-repeat",
          backgroundSize:
            activeBg.size === "cover" || activeBg.size === "contain"
              ? activeBg.size
              : "auto",
          backgroundPosition: "center",
          backgroundColor: "#000000",
        }
      : {
          backgroundColor: activeBg.color || "#020617",
        };

  const updateActiveBackground = (patch) => {
    if (typeof setBackgroundConfigs !== "function") {
      console.warn("setBackgroundConfigs is not available from ProjectContext");
      return;
    }

    setBackgroundConfigs((prev) => {
      const safePrev = prev || {};
      const current = safePrev[device] || defaultBg;
      return {
        ...safePrev,
        [device]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  /* ------------------------------------------------------------
   * Load element metadata
   * ---------------------------------------------------------- */
  useEffect(() => {
    const ctx = require.context("../components/elements", false, /\.meta\.json$/);
    const all = ctx.keys().map((key) => {
      const meta = ctx(key);
      return meta.default || meta;
    });
    setAvailableElements(all);
  }, []);

  /* ------------------------------------------------------------
   * Clear bindings only when leaving preview (prevents max depth)
   * ---------------------------------------------------------- */
  const prevPreviewRef = useRef(isPreviewMode);
  useEffect(() => {
    const wasPreview = prevPreviewRef.current;
    const isNowPreview = isPreviewMode;

    if (wasPreview && !isNowPreview) {
      actionCtx.clearAllBindings();
    }

    prevPreviewRef.current = isNowPreview;
  }, [isPreviewMode]); // IMPORTANT: don't depend on actionCtx object

  /* ------------------------------------------------------------
   * Drag & drop
   * ---------------------------------------------------------- */
  const handleDrop = (e) => {
    e.preventDefault();
    const metaString = e.dataTransfer.getData("application/json");
    if (!metaString) return;

    const meta = JSON.parse(metaString);
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = (e.clientX - rect.left) / scale;
    const dropY = (e.clientY - rect.top) / scale;

    addElement({
      id: uuid(),
      type: meta.name,
      // ✅ IMPORTANT: role-specific canvases stamp the element with that role
      role: isRoleCanvas ? role : null,
      x: dropX - 150,
      y: dropY - 75,
      width: 300,
      height: 150,
      props: meta.editableProps || {},
    });
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ------------------------------------------------------------
   * Inspector: toggle + docking
   * ---------------------------------------------------------- */
  const toggleInspector = () => {
    setInspectorState((prev) => ({
      ...prev,
      [currentRoleKey]: !prev[currentRoleKey],
    }));
  };

  const toggleDock = () => setInspectorDocked((prev) => !prev);

  /* ------------------------------------------------------------
   * Manual drag for undocked inspector
   * ---------------------------------------------------------- */
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

      const maxX = containerRect.width - 260;
      const maxY = containerRect.height - 100;

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
   * ✅ Role filtering (fixes host/client showing same elements)
   * ---------------------------------------------------------- */
  const visibleElements = React.useMemo(() => {
    // If this Canvas is host/client, ALWAYS show only its own role.
    if (isRoleCanvas) return elements.filter((el) => el.role === role);

    // Otherwise, behave as before (single canvas or "all" canvas).
    if (projectType === "single") return elements;
    return elements;
  }, [elements, isRoleCanvas, role, projectType]);

  const isSplitPreview = isPreviewMode && isRoleCanvas;
  const isSplitEditor = !isPreviewMode && isRoleCanvas;

  /* ------------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */
  return (
    <div
      ref={containerRef}
      className="flex w-full min-w-0 gap-4 h-full relative overflow-visible"
    >
      {/* Sidebar */}
      <div
        className={`shrink-0 transition-all duration-300 bg-panel flex flex-col
          ${isSplitPreview ? "hidden" : `${isSplitEditor ? "w-44" : "w-56"} p-3 border-r border-border`}
        `}
      >
        {!isSplitPreview && (
          <>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={["Elements", "Layers"]} />

            {activeTab === "Elements" && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-text-primary">🧩 Elements</h3>
                {availableElements.map((meta) => (
                  <div
                    key={meta.name}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("application/json", JSON.stringify(meta))
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent/10 transition cursor-grab active:cursor-grabbing"
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.name}</span>
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
                {visibleElements.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => {
                      setSelectedId(el.id);
                      setInspectorState((prev) => ({ ...prev, [currentRoleKey]: true }));
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

      {/* Canvas + Inspector column */}
      <div className="flex flex-col flex-1 min-w-0 relative bg-panel">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 min-w-0">
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="bg-panel text-text-primary border border-border rounded-lg px-3 py-1 shrink-0"
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>

          <label className="text-text-primary whitespace-nowrap flex items-center min-w-0">
            <span className="shrink-0">Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="ml-2 w-28"
            />
            <span className="ml-2 shrink-0">{Math.round(scale * 100)}%</span>
          </label>

          {/* ✅ Always available; icon-only in split preview to avoid "ou" clipping */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowBgPanel((v) => !v)}
              className="px-2 py-1 text-xs rounded border border-border text-text-muted hover:text-accent hover:border-accent transition flex items-center gap-2"
              title="Background"
            >
              <Palette size={14} />
              {!isSplitPreview && <span>{showBgPanel ? "Hide Background" : "Background"}</span>}
            </button>

            <button
              type="button"
              onClick={() => setShowDebug((v) => !v)}
              className="px-2 py-1 text-xs rounded border border-border text-text-muted hover:text-accent hover:border-accent transition flex items-center gap-2"
              title="Bindings Debug"
            >
              <Bug size={14} />
              {!isSplitPreview && <span>{showDebug ? "Hide Debug" : "Show Debug"}</span>}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="flex justify-center items-start overflow-auto relative flex-1 min-w-0"
          onClick={(e) => {
            if (e.target === canvasRef.current) setSelectedId(null);
          }}
        >
          <div
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative overflow-hidden rounded-lg shadow-md"
            style={{
              ...canvasBackgroundStyle,
              width: deviceSize.width * scale,
              height: deviceSize.height * scale,
              transformOrigin: "top left",
            }}
          >
            {visibleElements.map((el) => {
              const ElementComp = COMPONENTS[el.type];

              const handleElementClick = async (event) => {
                event.stopPropagation();

                setSelectedId(el.id);
                setInspectorState((prev) => ({ ...prev, [currentRoleKey]: true }));

                const actionName = el.props?.onClick;
                if (!isPreviewMode || !actionName) return;

                try {
                  await runAction(actionName, actionCtx, {
                    ...el.props,
                    elementId: el.id,
                    role: el.role,
                  });
                } catch (err) {
                  console.error("Action error:", err);
                }
              };

              return (
                <Rnd
                  key={el.id}
                  size={{ width: el.width, height: el.height }}
                  position={{ x: el.x, y: el.y }}
                  bounds="parent"
                  scale={scale}
                  onClick={handleElementClick}
                  onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, direction, ref, delta, position) =>
                    updateElement(el.id, {
                      width: parseFloat(ref.style.width),
                      height: parseFloat(ref.style.height),
                      ...position,
                    })
                  }
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
                  <div className="w-full h-full pointer-events-none">
                    <ElementComp {...el.props} {...(actionCtx.bindings?.[el.id] || {})} />
                  </div>
                </Rnd>
              );
            })}
          </div>
        </div>

        {/* Inspector */}
        {isInspectorOpen &&
          (inspectorDocked ? (
            <div
              style={{
                flexShrink: 0,
                marginTop: 8,
                display: "flex",
                justifyContent: "center",
                width: "100%",
                zIndex: 50,
              }}
            >
              <div
                className="bg-panel border border-border rounded-lg shadow-soft flex flex-col"
                style={{
                  width: "min(100%, 480px)",
                  height: "40vh",
                  overflow: "hidden",
                }}
              >
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

                <div className="p-4 flex-1 overflow-y-auto" ref={inspectorRef} style={{ minHeight: 0 }}>
                  <InspectorPanel
                    element={elements.find((el) => el.id === selectedId)}
                    elements={visibleElements}
                    onUpdate={(updates) => updateElement(selectedId, updates)}
                    onDelete={() => removeElement(selectedId)}
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>
          ) : (
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

              <div className="p-4 overflow-y-auto flex-1" ref={inspectorRef} style={{ minHeight: 0 }}>
                <InspectorPanel
                  element={elements.find((el) => el.id === selectedId)}
                  elements={visibleElements}
                  onUpdate={(updates) => updateElement(selectedId, updates)}
                  onDelete={() => removeElement(selectedId)}
                  readOnly={isPreviewMode}
                />
              </div>
            </div>
          ))}
      </div>

      {/* Background panel */}
      {showBgPanel && (
        <div
          className="pointer-events-auto bg-panel border border-border rounded-lg shadow-xl"
          style={{
            position: "absolute",
            right: showDebug ? 304 : 16,
            bottom: 16,
            width: 260,
            zIndex: 1000,
            padding: 8,
            fontSize: 11,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary">
              Background – {device}
            </span>
            <button
              type="button"
              onClick={() => setShowBgPanel(false)}
              className="text-[10px] text-text-muted hover:text-accent"
            >
              ✕
            </button>
          </div>

          <div className="mb-2">
            <label className="block text-[10px] text-text-muted mb-1">Type</label>
            <select
              className="w-full px-2 py-1 rounded bg-surface border border-border text-[11px]"
              value={activeBg.kind}
              onChange={(e) => updateActiveBackground({ kind: e.target.value })}
            >
              <option value="color">Solid color</option>
              <option value="image">Image</option>
            </select>
          </div>

          {activeBg.kind === "color" && (
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-[10px] text-text-muted">Color</label>
              <input
                type="color"
                value={activeBg.color}
                onChange={(e) => updateActiveBackground({ color: e.target.value })}
              />
              <input
                type="text"
                value={activeBg.color}
                onChange={(e) => updateActiveBackground({ color: e.target.value })}
                className="flex-1 px-2 py-1 rounded bg-surface border border-border text-[11px]"
              />
            </div>
          )}

          {activeBg.kind === "image" && (
            <>
              <div className="mb-2">
                <label className="block text-[10px] text-text-muted mb-1">Image URL</label>
                <input
                  type="text"
                  value={activeBg.imageUrl}
                  onChange={(e) => updateActiveBackground({ imageUrl: e.target.value })}
                  placeholder="https://example.com/bg.png"
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-[11px]"
                />
              </div>
              <div className="mb-1">
                <label className="block text-[10px] text-text-muted mb-1">Size / Repeat</label>
                <select
                  className="w-full px-2 py-1 rounded bg-surface border border-border text-[11px]"
                  value={activeBg.size}
                  onChange={(e) => updateActiveBackground({ size: e.target.value })}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="repeat">Repeat</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <div
          className="pointer-events-auto bg-panel border border-border rounded-lg shadow-xl"
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            width: 280,
            maxHeight: "50vh",
            zIndex: 1000,
            padding: 8,
            fontFamily: "monospace",
            fontSize: 10,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary">Bindings Debug</span>
            <button
              type="button"
              onClick={() => setShowDebug(false)}
              className="text-[10px] text-text-muted hover:text-accent"
            >
              ✕
            </button>
          </div>

          <DebugBindingsPanel selectedId={selectedId} role={role} />
        </div>
      )}
    </div>
  );
}
