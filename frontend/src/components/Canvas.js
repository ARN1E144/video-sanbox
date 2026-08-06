// src/components/Canvas.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";

import registry from "../components/elements/registry";
import InspectorContent from "./inspectorPanel/InspectorContent";
import Tabs from "./Tabs";

import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";
import { useProjectContext, ProjectContext } from "../context/ProjectContext";
import { useActionContext } from "../context/ActionContext";
import { useAuth } from "../context/AuthContext";
import { CONTROL_TEMPLATES } from "../constants/controlTemplates";
import { useRuntimeAuth } from "../context/RuntimeAuthContext";
import CanvasElementRenderer from "./CanvasElementRenderer";



const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

const extractDefaults = (editableProps = {}) => {
  const result = {};
  Object.entries(editableProps).forEach(([key, cfg]) => {
    result[key] =
      typeof cfg === "object" && cfg.default !== undefined ? cfg.default : cfg;
  });
  return result;
};

const SYSTEM_LOCKED_KEYS = new Set([
  "controls",
  "action",
  "bindings"
]);

export default function Canvas({ role, onSelectedIdChange, forcePreview }) {
  const { isPreviewMode, previewView } = usePreviewMode();
  const { elements, addElement, updateElement } = useCanvasState();
  const {
  projectType,
  backgroundConfigs,
} = useProjectContext();
  const { collapsed: sidebarCollapsed } = useContext(ProjectContext);
  const { bindings, cameraOn } = useActionContext();
  const { canBuild } = useAuth();

  const {
    allowedElements,
    runtimeRole
  } = useRuntimeAuth();
  

  const isBuilderEditable = !isPreviewMode && !!canBuild;
  const [device] = useState("desktop");
  const [scale] = useState(0.75);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("Elements");
  const [availableElements, setAvailableElements] = useState([]);
  

  const currentRoleKey = role || "null";

  // Inspector states
  const [inspectorOpen, setInspectorOpen] = useState({
    host: true,
    client: true,
    null: true,
  });
  const [inspectorLayout, setInspectorLayout] = useState({
    host: "right",
    client: "right",
    null: "right",
  });
  const [pinInspector, setPinInspector] = useState({
    host: false,
    client: false,
    null: false,
  });
  const [floatingPos, setFloatingPos] = useState({ x: 240, y: 160 });

  const isMultiProject = projectType === "multi";
  const isSplitView = isMultiProject && previewView === "split";
 

  const requestedLayout = inspectorLayout[currentRoleKey];
  const effectiveLayout =
    requestedLayout === "floating"
      ? "floating"
      : isSplitView
      ? "bottom"
      : "right";

  const isInspectorVisible = isSplitView
    ? true // always visible in split view
    : inspectorOpen[currentRoleKey];

  const canvasRef = useRef(null);


  /*
------------------------------------------------------------
Project Tree → Canvas Elements

Confo generated projects enter here.

tree
 ↓
ProjectTreeLoader
 ↓
Canvas elements

------------------------------------------------------------
*/
  

  // Load element meta
  useEffect(() => {

  const ctx = require.context(
    "../components/elements",
    false,
    /\.meta\.json$/
  );


  const all =
    ctx.keys().map(
      (k)=>ctx(k).default || ctx(k)
    );


  const permitted =
    all.filter(el =>
      allowedElements.includes(el.name)
    );


  console.log(
    "[CANVAS ELEMENT PERMISSIONS]",
    {
      runtimeRole,
      allowedElements,
      available: all.map(e=>e.name),
      permitted: permitted.map(e=>e.name)
    }
  );


  setAvailableElements(permitted);


},[
  allowedElements,
  runtimeRole
]);

  const bg = backgroundConfigs?.[device] || { kind: "color", color: "#020617" };
  const canvasBackgroundStyle =
    bg.kind === "image" && bg.imageUrl
      ? {
          backgroundImage: `url(${bg.imageUrl})`,
          backgroundSize: bg.size || "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }
      : { backgroundColor: bg.color };


  console.log(
  "[CANVAS ROLE CHECK]",
  {
    propRole: role,
    projectType,
    elements: elements.map(e=>({
      type:e.type,
      role:e.role,
      visible:e.role === role
    }))
  }
);

  const visibleElements = elements.filter((el) => {

  // Global elements
  if (!el.role) {
    return true;
  }


  // Role specific elements
  return el.role === role;

});

  console.log(
  "[CANVAS FILTER DEBUG]",
  {
    currentRole: role,
    allElements: elements.map(e => ({
      type:e.type,
      role:e.role
    })),
    visibleElements: visibleElements.map(e => ({
      type:e.type,
      role:e.role
    }))
  }
);

  console.log("[CANVAS] visibleElements", visibleElements);

  console.log(
  "[CANVAS]: PERMISSIONS",
  {
    canBuild,
    isPreviewMode,
    isBuilderEditable
  }
);

  const selectedElement =
  visibleElements.find((el) => el.id === selectedId) || null;

    const selectedMeta = selectedElement
      ? registry[selectedElement.type]?.meta
      : null;

  // Drop handler
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
      ControlPanel: {
        layout: "vertical",
        position: "left",
        controls: [
          CONTROL_TEMPLATES.mic,
          CONTROL_TEMPLATES.camera,
          CONTROL_TEMPLATES.end
        ]
      },
      MicButton: { label: "Mic", action: "ToggleMic" },
      VideoFeed: {
        label: "Video",
        mode: "local",
        src: "",
        playing: true,
        enabled: true,
        muted: false,
      },
      Text: { label: "Text" },
      ChatPanel: { label: "Chat" },
    };

    const system = defaultPropsByType[meta.name] || {};
    const metaDefaults = extractDefaults(meta.editableProps) || {};

    const sanitizeProps = (system, meta) => {
      const clean = { ...meta };

      SYSTEM_LOCKED_KEYS.forEach((key) => {
        if (system[key] !== undefined) {
          clean[key] = system[key];
        }
      });

      return clean;
    };

    const newId = uuid();

    addElement({
      id: newId,
      type: meta.name,
      role: role || null,
      x: x - 150,
      y: y - 75,
      width: 300,
      height: 150,

      // ONLY UI props
      props: {
        ...sanitizeProps(system, metaDefaults)
      }
    });

    console.log(
    "[ADDING ELEMENT]",
    {
      id:newId,
      type:meta.name,
      role:role || null
    }
  );

    console.log(
      "[DROP CREATED]",
      {
        role,
        projectType,
        role: role || null,
        type: meta.name
      }
    );

    if (meta.name === "VideoFeed" && cameraOn) {
      cameraOn(newId);
    }
  };

  const toggleInspector = () =>
    setInspectorOpen((prev) => ({ ...prev, [currentRoleKey]: !prev[currentRoleKey] }));
  const toggleDock = () => {
    if (isMultiProject && !role) return;
    setInspectorLayout((p) => ({
      ...p,
      [currentRoleKey]: p[currentRoleKey] === "floating" ? "right" : "floating",
    }));
  };
  const togglePin = () =>
    setPinInspector((p) => ({ ...p, [currentRoleKey]: !p[currentRoleKey] }));
  

  return (
    <div className="flex w-full h-full relative overflow-hidden gap-4">
      {/* LEFT ELEMENTS / LAYERS SIDEBAR */}
      <div className="bg-panel border-r border-border p-3" style={{ width: 250 }}>
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={["Elements", "Layers"]} />

        {activeTab === "Elements" &&
          availableElements.map((meta) => (
            <div
              key={meta.name}
              draggable={isBuilderEditable}
              onDragStart={(e) => {

                console.log(
                  "[DRAG START]",
                  meta
                );

                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify(meta)
                );

              }}
              className="px-3 py-2 text-sm rounded hover:bg-accent/10 cursor-grab"
            >
              {meta.icon} {meta.name}
            </div>
          ))}

        {activeTab === "Layers" &&
          visibleElements.map((el) => (

            <div
              key={el.id}
              onClick={() => {
                setSelectedId(el.id);
                onSelectedIdChange?.(el.id);
                setInspectorOpen((p) => ({ ...p, [currentRoleKey]: true }));
              }}
              className={`px-2 py-1 rounded cursor-pointer ${
                selectedId === el.id ? "bg-accent/20" : "hover:bg-accent/10"
              }`}
            >
              {el.type}
            </div>
          ))}
      </div>

      {/* CANVAS + INSPECTOR */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* CANVAS */}
         <div
            ref={canvasRef}

            onDrop={(e)=>{
              console.log("[DROP EVENT FIRED");
              handleDrop(e);
            }}

            onDragOver={(e)=>{
              if(isBuilderEditable){
                e.preventDefault();
              }
            }}

            style={{
              width: DEVICE_SIZES[device].width,
              height: DEVICE_SIZES[device].height,
              transform:`scale(${scale})`,
              transformOrigin:"top left",
              position:"relative",
            }}
          >
          
          {visibleElements.map((el) => {
            const entry = registry[el.type];
            if (!entry?.component) return null;

            const Comp = entry.component;
            const binding = bindings[el.id] || {};

            console.log(
              "[Canvas Render Component]",
              {
                type: el.type,
                props: el.props,
              }
            );

            return (
              <Rnd
                style={{
                  zIndex: selectedId === el.id ? 100 : 1
                }}
                key={el.id}
                bounds="parent"
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                scale={1}
                onClick={() => {
                  setSelectedId(el.id);
                  onSelectedIdChange?.(el.id);
                  if (!pinInspector[currentRoleKey]) {
                    setInspectorOpen((p) => ({ ...p, [currentRoleKey]: true }));
                  }
                }}
                onDragStop={(e, d) => {

                  updateElement(el.id,{

                    x: Math.round(Math.max(0,d.x)),

                    y: Math.round(Math.max(0,d.y))

                  });

}}
                onResizeStop={(e, dir, ref, delta, position) =>
                  updateElement(el.id, {
                    width: Math.round(
                    parseFloat(ref.style.width)
                  ),

                  height: Math.round(
                    parseFloat(ref.style.height)
                  ),
                    x: position.x,
                    y: position.y,
                  })
                }
              >
                <div className="w-full h-full">
                  <CanvasElementRenderer
                    Component={Comp}
                    element={el}
                    binding={binding}
                  />
                </div>
              </Rnd>
            );
          })}
        </div>

        {/* BOTTOM INSPECTOR for split view */}
        {isSplitView &&  (
          <InspectorContent
            layout="docked"
            selectedId={selectedId}
            elements={visibleElements}
            updateElement={updateElement}
            toggleDock={toggleDock}
            toggleOpen={toggleInspector}
            pinInspector={pinInspector[currentRoleKey]}
            togglePin={togglePin}
          />
        )}
      </div>

      {/* RIGHT DOCKED INSPECTOR for non-split view */}
      {!isSplitView && isInspectorVisible && effectiveLayout === "right" && (
        <InspectorContent
          layout="right"
          selectedId={selectedId}
          elements={visibleElements}
          updateElement={updateElement}
          toggleDock={toggleDock}
          toggleOpen={toggleInspector}
          pinInspector={pinInspector[currentRoleKey]}
          togglePin={togglePin}
        />
      )}

      {/* FLOATING INSPECTOR */}
      {!isSplitView && isInspectorVisible && effectiveLayout === "floating" && (
        <InspectorContent
          layout="floating"
          position={floatingPos}
          setPosition={setFloatingPos}
          selectedId={selectedId}
          elements={selectedElement ? [selectedElement] : []}
          updateElement={updateElement}
          toggleDock={toggleDock}
          toggleOpen={toggleInspector}
          pinInspector={pinInspector[currentRoleKey]}
          togglePin={togglePin}
        />
      )}
    </div>
  );
}