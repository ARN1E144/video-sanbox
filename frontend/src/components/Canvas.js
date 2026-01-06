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
import { useAuth } from "../context/AuthContext";
import {
  ChevronDown,
  ChevronUp,
  Move,
  Dock,
  Image as ImageIcon,
  Bug,
} from "lucide-react";

const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

export default function Canvas({
  role,
  showRightTools = true,
  onSelectedIdChange,
  onRequestBackground,
  onRequestDebug,
}) {
  const [device, setDevice] = useState("desktop");
  const [scale, setScale] = useState(0.75);

  const { isPreviewMode } = usePreviewMode();
  const { elements, addElement, updateElement, removeElement } = useCanvasState();
  const { projectType, backgroundConfigs } = useProjectContext();
  const actionCtx = useActionContext();
  const { canBuild } = useAuth();

  // 🔒 Only gate builder features in editor mode (NOT preview).
  const isBuilderEditable = !isPreviewMode && !!canBuild;

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

  const [isDraggingInspector, setIsDraggingInspector] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const deviceSize = DEVICE_SIZES[device];
  const currentRoleKey = role || "null";
  const isInspectorOpen = inspectorState[currentRoleKey];

  const isSplitPreview = isPreviewMode && (role === "host" || role === "client");
  const isSplitEditor = !isPreviewMode && (role === "host" || role === "client");

  // Local fallback panels (Canvas will still show something even if parent doesn't)
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  /* ------------------------------------------------------------
   * Notify parent when selection changes
   * ---------------------------------------------------------- */
  const onSelectedIdChangeRef = useRef(onSelectedIdChange);

  useEffect(() => {
    onSelectedIdChangeRef.current = onSelectedIdChange;
  }, [onSelectedIdChange]);

  useEffect(() => {
    onSelectedIdChangeRef.current?.(selectedId);
  }, [selectedId]);

  /* ------------------------------------------------------------
   * Background (shared per project, per device)
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
   * Prevent max update depth:
   * clear bindings ONLY when leaving preview
   * ---------------------------------------------------------- */
  const prevPreviewRef = useRef(isPreviewMode);
  useEffect(() => {
    if (prevPreviewRef.current && !isPreviewMode) {
      actionCtx.clearAllBindings();
    }
    prevPreviewRef.current = isPreviewMode;
  }, [isPreviewMode]); // intentionally minimal deps

  /* ------------------------------------------------------------
   * Drag & Drop (builders only in editor)
   * ---------------------------------------------------------- */
  const handleDrop = (e) => {
    e.preventDefault();

    // 🔒 No building in editor if user can't build
    if (!isBuilderEditable) return;

    const metaString = e.dataTransfer.getData("application/json");
    if (!metaString || !canvasRef.current) return;

    const meta = JSON.parse(metaString);
    const rect = canvasRef.current.getBoundingClientRect();

    const dropX = (e.clientX - rect.left) / scale;
    const dropY = (e.clientY - rect.top) / scale;

    // ✅ single => always client
    // ✅ multi  => use canvas role (host/client), fallback null
    const targetRole = projectType === "single" ? "client" : role || null;

    addElement({
      id: uuid(),
      type: meta.name,
      role: targetRole,
      x: dropX - 150,
      y: dropY - 75,
      width: 300,
      height: 150,
      props: meta.editableProps || {},
    });
  };

  const handleDragOver = (e) => {
    if (!isBuilderEditable) return;
    e.preventDefault();
  };

  /* ------------------------------------------------------------
   * Inspector controls
   * ---------------------------------------------------------- */
  const toggleInspector = () => {
    setInspectorState((prev) => ({
      ...prev,
      [currentRoleKey]: !prev[currentRoleKey],
    }));
  };

  const toggleDock = () => setInspectorDocked((prev) => !prev);

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
  }, [isDraggingInspector, inspectorPosition.x, inspectorPosition.y]);

  /* ------------------------------------------------------------
   * Filter elements per role
   * ---------------------------------------------------------- */
  const visibleElements = elements.filter((el) => {
    if (projectType === "single") return el.role === "client" || el.role === null;
    if (role === null) return true;
    return el.role === role;
  });

  /* ------------------------------------------------------------
   * Tool handlers (call parent if provided, otherwise local panel)
   * ---------------------------------------------------------- */
  const handleBackgroundClick = () => {
    if (typeof onRequestBackground === "function") return onRequestBackground();
    setShowBgPanel((v) => !v);
  };

  const handleDebugClick = () => {
    if (typeof onRequestDebug === "function") return onRequestDebug();
    setShowDebug((v) => !v);
  };

  /* ------------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */
  return (
    <div ref={containerRef} className="flex w-full min-w-0 gap-4 h-full relative overflow-visible">
      {/* Sidebar (builders only in editor; allowed in preview if you want it later) */}
      {(isPreviewMode || isBuilderEditable) && (
        <div
          className={`shrink-0 transition-all duration-300 bg-panel flex flex-col
            ${
              isSplitPreview
                ? "hidden"
                : `${isSplitEditor ? "w-44" : "w-56"} p-3 border-r border-border`
            }
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
                      draggable={isBuilderEditable}
                      onDragStart={(e) => {
                        if (!isBuilderEditable) return;
                        e.dataTransfer.setData("application/json", JSON.stringify(meta));
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
                        ${isBuilderEditable ? "hover:bg-accent/10 cursor-grab active:cursor-grabbing" : "opacity-60 cursor-not-allowed"}
                      `}
                      title={isBuilderEditable ? "" : "No build permission"}
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

                  {elements
                    .filter((el) => (role ? el.role === role : true))
                    .map((el) => (
                      <div
                        key={el.id}
                        onClick={() => {
                          setSelectedId(el.id);
                          if (isPreviewMode || isBuilderEditable) {
                            setInspectorState((prev) => ({ ...prev, [currentRoleKey]: true }));
                          }
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
                            if (!isBuilderEditable) return;
                            removeElement(el.id);
                            if (selectedId === el.id) setSelectedId(null);
                          }}
                          className={`text-xs ${
                            isBuilderEditable
                              ? "text-red-500 hover:text-red-400"
                              : "text-red-500/40 cursor-not-allowed"
                          }`}
                          title={isBuilderEditable ? "Delete" : "No build permission"}
                          type="button"
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
      )}

      {/* Canvas + Inspector */}
      <div className="flex flex-col flex-1 relative bg-panel min-w-0">
        {/* Toolbar */}
        <div className="relative flex items-center gap-4 mb-4 pr-16">
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="bg-panel text-text-primary border border-border rounded-lg px-3 py-1"
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>

          <label className="text-text-primary whitespace-nowrap">
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

          {/* View-only badge */}
          {!isPreviewMode && !isBuilderEditable && (
            <div
              style={{
                marginLeft: 12,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #333",
                color: "#aaa",
                fontSize: 12,
              }}
            >
              View-only (no build permission)
            </div>
          )}

          {/* Right tools pinned */}
          {showRightTools && (
            <div className="absolute right-0 top-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackgroundClick}
                className="p-1.5 rounded border border-border text-text-muted hover:text-accent hover:border-accent transition"
                title="Background"
              >
                <ImageIcon size={14} />
              </button>

              <button
                type="button"
                onClick={handleDebugClick}
                className="p-1.5 rounded border border-border text-text-muted hover:text-accent hover:border-accent transition"
                title="Show Debug"
              >
                <Bug size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Local Floating Panels */}
        {showBgPanel && (
          <div
            className="pointer-events-auto bg-panel border border-border rounded-lg shadow-xl"
            style={{
              position: "absolute",
              right: 12,
              top: 52,
              width: 260,
              zIndex: 2000,
              padding: 10,
              fontSize: 11,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary">
                Background ({role || "client"})
              </span>
              <button
                type="button"
                onClick={() => setShowBgPanel(false)}
                className="text-[10px] text-text-muted hover:text-accent"
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="text-text-muted text-xs">
              Background editor UI…
              <br />
              (Parent panel can override this)
            </div>
          </div>
        )}

        {showDebug && (
          <div
            className="pointer-events-auto bg-panel border border-border rounded-lg shadow-xl"
            style={{
              position: "absolute",
              right: 12,
              top: showBgPanel ? 52 + 220 : 52,
              width: 280,
              maxHeight: "50vh",
              overflow: "auto",
              zIndex: 2000,
              padding: 10,
              fontFamily: "monospace",
              fontSize: 10,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary">Debug</span>
              <button
                type="button"
                onClick={() => setShowDebug(false)}
                className="text-[10px] text-text-muted hover:text-accent"
                title="Close"
              >
                ✕
              </button>
            </div>

            <pre className="text-text-muted whitespace-pre-wrap">
              {JSON.stringify(
                {
                  role,
                  projectType,
                  selectedId,
                  visibleCount: visibleElements.length,
                  isPreviewMode,
                  canBuild,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

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

                // Only auto-open inspector if builder can edit (or in preview)
                if (isPreviewMode || isBuilderEditable) {
                  setInspectorState((prev) => ({ ...prev, [currentRoleKey]: true }));
                }

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
                  enableResizing={isBuilderEditable}
                  disableDragging={!isBuilderEditable}
                  onDragStop={(e, d) => {
                    if (!isBuilderEditable) return;
                    updateElement(el.id, { x: d.x, y: d.y });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    if (!isBuilderEditable) return;
                    updateElement(el.id, {
                      width: parseFloat(ref.style.width),
                      height: parseFloat(ref.style.height),
                      ...position,
                    });
                  }}
                  className={`group rounded-lg border-2 ${
                    isPreviewMode ? "cursor-pointer" : isBuilderEditable ? "cursor-move" : "cursor-default"
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

        {/* Inspector (builders only in editor; still visible in preview if you ever want readOnly) */}
        {isInspectorOpen && (isPreviewMode || isBuilderEditable) &&
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
                      type="button"
                    >
                      <Dock size={14} />
                    </button>
                    <button
                      className="text-xs text-text-muted hover:text-accent transition"
                      onClick={toggleInspector}
                      title="Close Inspector"
                      type="button"
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
                    onDelete={() => {
                      if (!isBuilderEditable) return;
                      removeElement(selectedId);
                    }}
                    readOnly={isPreviewMode || !isBuilderEditable}
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
                    type="button"
                  >
                    <Dock size={14} />
                  </button>
                  <button
                    className="text-xs text-text-muted hover:text-accent transition"
                    onClick={toggleInspector}
                    title="Close Inspector"
                    type="button"
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
                  onDelete={() => {
                    if (!isBuilderEditable) return;
                    removeElement(selectedId);
                  }}
                  readOnly={isPreviewMode || !isBuilderEditable}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
