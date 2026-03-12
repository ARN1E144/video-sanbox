import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";

import COMPONENTS from "../components/elements/registry";
import InspectorContent from "./inspectorPanel/InspectorContent";
import Tabs from "./Tabs";
import LazyAgoraFeed from "./LazyAgoraFeed";

import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";
import { useProjectContext } from "../context/ProjectContext";
import { useActionContext } from "../context/ActionContext";
import { useAuth } from "../context/AuthContext";

const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

/* -------------------- NEW: Extract defaults from meta.editableProps -------------------- */
const extractDefaults = (editableProps = {}) => {
  const result = {};
  Object.entries(editableProps).forEach(([key, cfg]) => {
    result[key] = typeof cfg === "object" && cfg.default !== undefined ? cfg.default : cfg;
  });
  return result;
};

  
/* -------------------------------------------------------------------- */

export default function Canvas({ role, onSelectedIdChange }) {
  const { isPreviewMode } = usePreviewMode();
  const { elements, addElement, updateElement } = useCanvasState();
  const { projectType, backgroundConfigs } = useProjectContext();
  const actionCtx = useActionContext();
  const { canBuild } = useAuth();

  const isBuilderEditable = !isPreviewMode && !!canBuild;

  const [device] = useState("desktop");
  const [scale] = useState(0.75);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("Elements");
  const [availableElements, setAvailableElements] = useState([]);

  const currentRoleKey = role || "null";
  const [inspectorOpen, setInspectorOpen] = useState({ host: true, client: true, null: true });
  const [inspectorLayout, setInspectorLayout] = useState({ host: "docked", client: "docked", null: "docked" });
  const [floatingPos, setFloatingPos] = useState({ x: 240, y: 160 });

  const isSingleMode = projectType === "single";
  const isSplitPreview = isPreviewMode && (role === "host" || role === "client");
  const requestedLayout = inspectorLayout[currentRoleKey];
  const effectiveLayout = isSplitPreview ? "docked" : requestedLayout === "floating" ? "floating" : isSingleMode ? "right" : "docked";
  const isInspectorVisible = inspectorOpen[currentRoleKey];
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = require.context("../components/elements", false, /\.meta\.json$/);
    setAvailableElements(ctx.keys().map((k) => ctx(k).default || ctx(k)));
  }, []);

  const bg = backgroundConfigs?.[device] || { kind: "color", color: "#020617" };
  const canvasBackgroundStyle =
    bg.kind === "image" && bg.imageUrl
      ? { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: bg.size || "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" }
      : { backgroundColor: bg.color };

  const visibleElements = elements.filter((el) => {
    if (projectType === "single") return el.role === "client" || el.role == null;
    if (!role) return true;
    return el.role === role;
  });

  const handleDrop = (e) => {
  if (!isBuilderEditable) return;
  e.preventDefault();

  const meta = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
  if (!meta?.name || !canvasRef.current) return;

  const rect = canvasRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  const defaultPropsByType = {
    ControlButton: { label: "Button", action: "", targetId: "", apiUrl: "" },
    MicButton: { label: "Mic", action: "ToggleMic" },
    VideoFeed: {
      label: "Video",
      mode: "local",   // default local
      src: "",         // empty for remote to show placeholder
      playing: true,
      enabled: true,
      muted: false,
    },
    Text: { label: "Text" },
    ChatPanel: { label: "Chat" },
  };

  const newId = uuid();

  addElement({
    id: newId,
    type: meta.name,
    role: projectType === "single" ? "client" : role,
    x: x - 150,
    y: y - 75,
    width: 300,
    height: 150,
    props: {
      ...(defaultPropsByType[meta.name] || {}),
      ...extractDefaults(meta.editableProps),
    },
  });

  // Start local camera immediately
  if (meta.name === "VideoFeed") {
    actionCtx?.cameraOn?.(newId);
  }
};

  const toggleInspector = () => setInspectorOpen((p) => ({ ...p, [currentRoleKey]: !p[currentRoleKey] }));

  const toggleDock = () => {
    if (isSplitPreview) return;
    setInspectorLayout((p) => ({ ...p, [currentRoleKey]: p[currentRoleKey] === "floating" ? "docked" : "floating" }));
  };

  const { bindings } = useActionContext();

  console.log("[Canvas] visibleElements", visibleElements);

  return (
    <div className="flex w-full h-full gap-4 relative overflow-hidden">
      {!isSplitPreview && (
        <div className="bg-panel border-r border-border p-3 w-56">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={["Elements", "Layers"]} />

          {activeTab === "Elements" &&
            availableElements.map((meta) => (
              <div key={meta.name} draggable={isBuilderEditable} onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(meta))} className="px-3 py-2 text-sm rounded hover:bg-accent/10 cursor-grab">
                {meta.icon} {meta.name}
              </div>
            ))}

          {activeTab === "Layers" &&
            visibleElements.map((el) => (
              <div key={el.id} onClick={() => { setSelectedId(el.id); onSelectedIdChange?.(el.id); setInspectorOpen((p) => ({ ...p, [currentRoleKey]: true })); }} className={`px-2 py-1 rounded cursor-pointer ${selectedId === el.id ? "bg-accent/20" : "hover:bg-accent/10"}`}>
                {el.type}
              </div>
            ))}
        </div>
      )}

      <div className="relative flex-1 min-w-0 overflow-hidden">
        <div ref={canvasRef} onDrop={handleDrop} onDragOver={(e) => isBuilderEditable && e.preventDefault()} className="relative mx-auto border border-border rounded-xl overflow-hidden" style={{ width: DEVICE_SIZES[device].width * scale, height: DEVICE_SIZES[device].height * scale, transform: `scale(${scale})`, transformOrigin: "top left", ...canvasBackgroundStyle }}>
          {visibleElements.map((el) => {

            const Comp = COMPONENTS[el.type];

            if (!Comp) {
              console.warn("Component not found:", el.type);
              return null;
            }

            const binding = bindings[el.id] || {};

            const extraProps = {
              ...binding,
            };

            return (
             <Rnd
                key={el.id}
                bounds="parent"
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                scale={scale}
                onClick={() => {
                  setSelectedId(el.id);
                  onSelectedIdChange?.(el.id);
                }}
                onDragStop={(e, d) => {
                  updateElement(el.id, {
                    x: d.x,
                    y: d.y,
                  });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateElement(el.id, {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    x: position.x,
                    y: position.y,
                  });
                }}
              >
                <div className="w-full h-full">
                  <Comp
                    id={el.id}
                    {...el.props}
                    {...extraProps}
                  />
                </div>
              </Rnd>
            );
          })}
        </div>

        {isInspectorVisible && effectiveLayout === "docked" && (
          <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: "40%" }}>
            <InspectorContent layout="docked" selectedId={selectedId} elements={visibleElements} updateElement={updateElement} toggleDock={!isSplitPreview ? toggleDock : null} toggleOpen={toggleInspector} />
          </div>
        )}

        {isInspectorVisible && effectiveLayout === "right" && (
          <InspectorContent layout="right" selectedId={selectedId} elements={visibleElements} updateElement={updateElement} toggleDock={toggleDock} toggleOpen={toggleInspector} />
        )}

        {isInspectorVisible && effectiveLayout === "floating" && (
          <InspectorContent layout="floating" position={floatingPos} setPosition={setFloatingPos} selectedId={selectedId} elements={visibleElements} updateElement={updateElement} toggleDock={toggleDock} toggleOpen={toggleInspector} />
        )}
      </div>
    </div>
  );
}