
// src/components/Canvas.js

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";

import { Rnd } from "react-rnd";
import { v4 as uuid } from "uuid";

import InspectorContent from "./inspectorPanel/InspectorContent";
import Tabs from "./Tabs";

import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";
import {
  useProjectContext,
  ProjectContext,
} from "../context/ProjectContext";
import { useActionContext } from "../context/ActionContext";
import { useAuth } from "../context/AuthContext";
import { useRuntimeAuth } from "../context/RuntimeAuthContext";

import CanvasElementRenderer from "./CanvasElementRenderer";
import componentRegistry from "../actions/componentRegistry";

// =====================================================
// DEVICE SIZES
// =====================================================

const DEVICE_SIZES = {
  desktop: {
    width: 1440,
    height: 900,
  },

  tablet: {
    width: 1024,
    height: 768,
  },

  mobile: {
    width: 390,
    height: 844,
  },
};

// =====================================================
// DEFAULT EXTRACTION
// =====================================================
//
// Contract editableProps describe the property's
// definition, not its runtime value.
//
// Example contract:
//
// source: {
//   type: "string"
// }
//
// must become:
//
// source: ""
//
// If a contract explicitly provides:
//
// default: "https://..."
//
// that value wins.
//
// =====================================================

const extractDefaults = (
  editableProps = {}
) => {

  const result = {};


  Object.entries(
    editableProps
  ).forEach(
    (
      [
        key,
        definition,
      ]
    ) => {

      // =================================================
      // EXPLICIT DEFAULT
      // =================================================

      if (
        definition &&
        typeof definition ===
          "object" &&
        definition.default !==
          undefined
      ) {

        result[key] =
          definition.default;

        return;

      }


      // =================================================
      // LEGACY PRIMITIVE VALUE
      // =================================================

      if (
        definition === null ||
        typeof definition !==
          "object"
      ) {

        result[key] =
          definition;

        return;

      }


      // =================================================
      // TYPE
      // =================================================

      const type =
        String(
          definition.type ||
          ""
        )
          .toLowerCase()
          .trim();


      // =================================================
      // STRING
      // =================================================

      if (
        type.includes(
          "string"
        )
      ) {

        result[key] =
          "";

        return;

      }


      // =================================================
      // NUMBER
      // =================================================

      if (
        type.includes(
          "number"
        )
      ) {

        result[key] =
          0;

        return;

      }


      // =================================================
      // BOOLEAN
      // =================================================

      if (
        type.includes(
          "boolean"
        )
      ) {

        result[key] =
          false;

        return;

      }


      // =================================================
      // ARRAY
      // =================================================

      if (
        type.includes(
          "array"
        )
      ) {

        result[key] =
          [];

        return;

      }


      // =================================================
      // OBJECT
      // =================================================

      if (
        type.includes(
          "object"
        )
      ) {

        result[key] =
          null;

        return;

      }


      // =================================================
      // UNKNOWN TYPE
      // =================================================
      //
      // Never pass the contract definition itself
      // into a runtime component prop.
      //
      // =================================================

      result[key] =
        null;

    }
  );


  return result;

};

// =====================================================
// SYSTEM LOCKED PROPERTIES
// =====================================================

const SYSTEM_LOCKED_KEYS = new Set([
  "controls",
  "action",
  "bindings",
]);

// =====================================================
// CONTAINER TYPES
// =====================================================

const isContainerType = (type) => {
  return [
    "ControlPanel",
    "Container",
  ].includes(type);
};

// =====================================================
// SELECTION STYLE
// =====================================================

const getSelectionStyle = (isSelected) => {
  if (!isSelected) {
    return {};
  }

  return {
    outline: "2px solid #6366f1",
    outlineOffset: "2px",
    boxShadow:
      "0 0 0 4px rgba(99, 102, 241, 0.18)",
  };
};

// =====================================================
// PARENT / CHILD COMPATIBILITY
// =====================================================

const canDropIntoParent = (
  childType,
  parentType
) => {
  // ControlPanel accepts ControlButton
  if (
    parentType === "ControlPanel" &&
    childType === "ControlButton"
  ) {
    return true;
  }

  // Generic Container accepts anything
  if (
    parentType === "Container"
  ) {
    return true;
  }

  return false;
};

// =====================================================
// DEFAULT PROPS
// =====================================================

const DEFAULT_PROPS_BY_TYPE = {
  ControlButton: {
    label: "Button",
    action: "",
    targetId: "",
    apiUrl: "",
  },

  ControlPanel: {
    layout: "vertical",
    position: "left",
    controls: [],
  },

  MicButton: {
    label: "Mic",
    action: "ToggleMic",
  },

  VideoFeed: {
    label: "Video",
    mode: "local",
    src: "",
    playing: true,
    enabled: true,
    muted: false,
  },

  Text: {
    label: "Text",
  },

  ChatPanel: {
    label: "Chat",
  },
};

// =====================================================
// PROP SANITISATION
// =====================================================

const sanitizeProps = (
  systemProps = {},
  metaProps = {}
) => {
  const clean = {
    ...metaProps,
  };

  SYSTEM_LOCKED_KEYS.forEach((key) => {
    if (systemProps[key] !== undefined) {
      clean[key] = systemProps[key];
    }
  });

  return clean;
};

// =====================================================
// CANVAS
// =====================================================

export default function Canvas({
  role,
  onSelectedIdChange,
  forcePreview,
}) {
  // ===================================================
  // CONTEXT
  // ===================================================

  const {
    isPreviewMode,
    previewView,
  } = usePreviewMode();

  const {
    elements,
    addElement,
    updateElement,
  } = useCanvasState();

  const {
    projectType,
    backgroundConfigs,
  } = useProjectContext();

  const {
    collapsed: sidebarCollapsed,
  } = useContext(ProjectContext);

  const {
    bindings,
    cameraOn,
  } = useActionContext();

  const {
    canBuild,
  } = useAuth();

  const {
    allowedElements,
    runtimeRole,
  } = useRuntimeAuth();

  // ===================================================
  // BASIC STATE
  // ===================================================

  const isBuilderEditable =
  !isPreviewMode &&
  !!canBuild &&
  !forcePreview;

    console.log("🔥 CANVAS EDITABILITY", {
      isPreviewMode,
      canBuild,
      forcePreview,
      isBuilderEditable,
    });

  const [device] =
    useState("desktop");

  const [scale] =
    useState(0.75);

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [
    activeTab,
    setActiveTab,
  ] = useState("Elements");

  const [
    availableElements,
    setAvailableElements,
  ] = useState([]);

  const currentRoleKey =
    role || "null";

  // ===================================================
  // INSPECTOR STATE
  // ===================================================

  const [
    inspectorOpen,
    setInspectorOpen,
  ] = useState({
    host: true,
    client: true,
    null: true,
  });

  const [
    inspectorLayout,
    setInspectorLayout,
  ] = useState({
    host: "right",
    client: "right",
    null: "right",
  });

  const [
    pinInspector,
    setPinInspector,
  ] = useState({
    host: false,
    client: false,
    null: false,
  });

  const [
    floatingPos,
    setFloatingPos,
  ] = useState({
    x: 240,
    y: 160,
  });

  // ===================================================
  // PROJECT VIEW
  // ===================================================

  const isMultiProject =
    projectType === "multi";

  const isSplitView =
    isMultiProject &&
    previewView === "split";

  const requestedLayout =
    inspectorLayout[
      currentRoleKey
    ];

  const effectiveLayout =
    requestedLayout === "floating"
      ? "floating"
      : isSplitView
      ? "bottom"
      : "right";

  const isInspectorVisible =
    isSplitView
      ? true
      : inspectorOpen[
          currentRoleKey
        ];

  // ===================================================
  // CANVAS REFS
  // ===================================================

  const canvasRef =
    useRef(null);

  // ===================================================
  // ELEMENT PERMISSIONS
  // ===================================================

  useEffect(() => {
    const all =
      Object.values(componentRegistry)
        .map(
          (entry) =>
            entry.contract
        )
        .filter(Boolean);

    const permitted =
      all.filter((contract) =>
        allowedElements.includes(
          contract.name
        )
      );

    console.log(
      "[CANVAS ELEMENT PERMISSIONS]",
      {
        runtimeRole,
        allowedElements,

        available:
          all.map(
            (c) => c.name
          ),

        permitted:
          permitted.map(
            (c) => c.name
          ),
      }
    );

    setAvailableElements(
      permitted
    );
  }, [
    allowedElements,
    runtimeRole,
  ]);

  // ===================================================
  // BACKGROUND
  // ===================================================

  const bg =
    backgroundConfigs?.[
      device
    ] || {
      kind: "color",
      color: "#020617",
    };

  const canvasBackgroundStyle =
    bg.kind === "image" &&
    bg.imageUrl
      ? {
          backgroundImage:
            `url(${bg.imageUrl})`,
          backgroundSize:
            bg.size || "cover",
          backgroundRepeat:
            "no-repeat",
          backgroundPosition:
            "center",
        }
      : {
          backgroundColor:
            bg.color ||
            "#020617",
        };

  // ===================================================
  // VISIBLE ELEMENTS
  // ===================================================

  const visibleElements =
    elements.filter((el) => {
      if (!el.role) {
        return true;
      }

      return el.role === role;
    });

  // ===================================================
  // HIERARCHY DEBUG
  // ===================================================

  useEffect(() => {
    console.log(
      "[CANVAS HIERARCHY]",
      visibleElements.map(
        (el) => ({
          id: el.id,
          type: el.type,
          parentId:
            el.parentId ||
            null,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        })
      )
    );
  }, [visibleElements]);

  // ===================================================
  // SELECTED ELEMENT
  // ===================================================

  const selectedElement =
    visibleElements.find(
      (el) =>
        el.id === selectedId
    ) || null;

  const selectedMeta =
    selectedElement
      ? componentRegistry[
          selectedElement.type
        ]?.contract
      : null;

  // ===================================================
  // SELECT ELEMENT
  // ===================================================

  const selectElement = (id) => {
    setSelectedId(id);

    onSelectedIdChange?.(id);

    if (
      !pinInspector[
        currentRoleKey
      ]
    ) {
      setInspectorOpen(
        (prev) => ({
          ...prev,
          [currentRoleKey]:
            true,
        })
      );
    }
  };

  // ===================================================
  // GET ELEMENT BY ID
  // ===================================================

  const getElementById = (id) => {
    return (
      visibleElements.find(
        (el) =>
          el.id === id
      ) || null
    );
  };

  // ===================================================
  // GET CHILDREN
  // ===================================================

  const getChildren = (
    parentId
  ) => {
    return visibleElements.filter(
      (el) =>
        el.parentId ===
        parentId
    );
  };

  // ===================================================
  // GET ABSOLUTE POSITION
  // ===================================================

  const getAbsolutePosition = (
    element
  ) => {
    let x =
      Number(
        element?.x || 0
      );

    let y =
      Number(
        element?.y || 0
      );

    let parentId =
      element?.parentId ||
      null;

    const visited =
      new Set();

    while (parentId) {
      if (
        visited.has(
          parentId
        )
      ) {
        console.warn(
          "[CANVAS] Circular hierarchy detected",
          parentId
        );

        break;
      }

      visited.add(
        parentId
      );

      const parent =
        getElementById(
          parentId
        );

      if (!parent) {
        break;
      }

      x += Number(
        parent.x || 0
      );

      y += Number(
        parent.y || 0
      );

      parentId =
        parent.parentId ||
        null;
    }

    return {
      x,
      y,
    };
  };

  // ===================================================
  // FIND DOM DROP TARGET
  // ===================================================

  const findDomDropTarget = (
    clientX,
    clientY,
    draggedType
  ) => {
    if (
      !canvasRef.current
    ) {
      return null;
    }

    const domTarget =
      document.elementFromPoint(
        clientX,
        clientY
      );

    if (!domTarget) {
      return null;
    }

    let node =
      domTarget;

    while (
      node &&
      node !==
        canvasRef.current
    ) {
      const elementId =
        node.getAttribute?.(
          "data-canvas-element-id"
        );

      if (elementId) {
        const candidate =
          getElementById(
            elementId
          );

        if (
          candidate &&
          isContainerType(
            candidate.type
          ) &&
          canDropIntoParent(
            draggedType,
            candidate.type
          )
        ) {
          console.log(
            "[CANVAS DOM DROP TARGET]",
            {
              draggedType,

              targetId:
                candidate.id,

              targetType:
                candidate.type,
            }
          );

          return candidate;
        }
      }

      node =
        node.parentElement;
    }

    return null;
  };

  // ===================================================
  // FIND GEOMETRIC DROP TARGET
  // ===================================================

  const findGeometricDropTarget = (
    canvasX,
    canvasY,
    draggedType
  ) => {
    const candidates =
      visibleElements
        .filter((el) => {
          if (
            !isContainerType(
              el.type
            )
          ) {
            return false;
          }

          return canDropIntoParent(
            draggedType,
            el.type
          );
        })
        .map((el) => {
          const absolute =
            getAbsolutePosition(
              el
            );

          const width =
            Number(
              el.width || 0
            );

          const height =
            Number(
              el.height || 0
            );

          const inside =
            canvasX >=
              absolute.x &&
            canvasX <=
              absolute.x +
                width &&
            canvasY >=
              absolute.y &&
            canvasY <=
              absolute.y +
                height;

          return {
            element: el,
            absolute,
            width,
            height,
            inside,
          };
        })
        .filter(
          (item) =>
            item.inside
        );

    if (
      !candidates.length
    ) {
      return null;
    }

    candidates.sort(
      (a, b) => {
        const areaA =
          a.width *
          a.height;

        const areaB =
          b.width *
          b.height;

        return (
          areaA - areaB
        );
      }
    );

    const target =
      candidates[0];

    console.log(
      "[CANVAS GEOMETRIC DROP TARGET]",
      {
        draggedType,

        targetId:
          target.element.id,

        targetType:
          target.element.type,

        absolute:
          target.absolute,
      }
    );

    return target.element;
  };

  // ===================================================
  // DROP HANDLER
  // ===================================================

  const handleDrop = (e) => {
    if (
      !isBuilderEditable
    ) {
      return;
    }

    e.preventDefault();

    // -----------------------------------------------
    // READ DRAG DATA
    // -----------------------------------------------

    let meta = {};

    try {
      meta =
        JSON.parse(
          e.dataTransfer.getData(
            "application/json"
          ) || "{}"
        );
    } catch (error) {
      console.error(
        "[CANVAS DROP] Invalid drag data",
        error
      );

      return;
    }

    if (
      !meta?.name ||
      !canvasRef.current
    ) {
      return;
    }

    const draggedType =
      meta.name;

    // -----------------------------------------------
    // CANVAS COORDINATES
    // -----------------------------------------------

    const rect =
      canvasRef.current.getBoundingClientRect();

    const canvasX =
      (
        e.clientX -
        rect.left
      ) / scale;

    const canvasY =
      (
        e.clientY -
        rect.top
      ) / scale;

    console.log(
      "[CANVAS DROP]",
      {
        draggedType,

        clientX:
          e.clientX,

        clientY:
          e.clientY,

        canvasX,
        canvasY,
      }
    );

    // -----------------------------------------------
    // FIND PARENT
    // -----------------------------------------------

    let potentialParent =
      findDomDropTarget(
        e.clientX,
        e.clientY,
        draggedType
      );

    if (
      !potentialParent
    ) {
      potentialParent =
        findGeometricDropTarget(
          canvasX,
          canvasY,
          draggedType
        );
    }

    // -----------------------------------------------
    // PARENT ID
    // -----------------------------------------------

    const parentId =
      potentialParent?.id ||
      null;

    // -----------------------------------------------
    // POSITION
    // -----------------------------------------------

    let elementX =
      canvasX - 150;

    let elementY =
      canvasY - 75;

    if (
      potentialParent
    ) {
      const parentAbsolute =
        getAbsolutePosition(
          potentialParent
        );

      elementX =
        canvasX -
        parentAbsolute.x -
        150;

      elementY =
        canvasY -
        parentAbsolute.y -
        75;
    }

    // -----------------------------------------------
    // CONTROL PANEL CHILDREN
    // -----------------------------------------------

    if (
      potentialParent?.type ===
      "ControlPanel"
    ) {
      elementX = 0;
      elementY = 0;
    }

    // -----------------------------------------------
    // DEFAULT PROPS
    // -----------------------------------------------

    const system =
      DEFAULT_PROPS_BY_TYPE[
        draggedType
      ] || {};

    const metaDefaults =
      extractDefaults(
        meta.editableProps
      ) || {};

    // -----------------------------------------------
    // NEW ELEMENT
    // -----------------------------------------------

    const newId =
      uuid();

    // -----------------------------------------------
    // DEFAULT SIZE
    // -----------------------------------------------

    let width = 300;
    let height = 150;

    if (
      draggedType ===
      "ControlButton"
    ) {
      width = 140;
      height = 44;
    }

    if (
      draggedType ===
      "ControlPanel"
    ) {
      width = 300;
      height = 150;
    }

    if (
      draggedType ===
      "Text"
    ) {
      width = 200;
      height = 50;
    }

    // -----------------------------------------------
    // NEW ELEMENT
    // -----------------------------------------------

    const newElement = {
      id: newId,

      type:
        draggedType,

      role:
        role || null,

      x:
        elementX,

      y:
        elementY,

      width,
      height,

      parentId,

      props:
        sanitizeProps(
          system,
          metaDefaults
        ),
    };

    console.log(
      "[CANVAS DROP CREATED]",
      {
        ...newElement,

        hierarchy:
          parentId
            ? "CHILD"
            : "TOP_LEVEL",
      }
    );

        console.log(
      "🔥🔥 BEFORE ADD ELEMENT",
      {
        id: newElement.id,
        type: newElement.type,
        draggedType,
        metaName: meta.name,
        meta,
        newElement,
      }
    );

    // -----------------------------------------------
    // ADD
    // -----------------------------------------------

    addElement(
      newElement
    );


    // -----------------------------------------------
    // VIDEO FEED
    // -----------------------------------------------

    if (
      draggedType ===
        "VideoFeed" &&
      cameraOn
    ) {
      cameraOn(
        newId
      );
    }
  };

  // ===================================================
  // INSPECTOR CONTROLS
  // ===================================================

  const toggleInspector =
    () => {
      setInspectorOpen(
        (prev) => ({
          ...prev,

          [currentRoleKey]:
            !prev[
              currentRoleKey
            ],
        })
      );
    };

  const toggleDock =
    () => {
      if (
        isMultiProject &&
        !role
      ) {
        return;
      }

      setInspectorLayout(
        (prev) => ({
          ...prev,

          [currentRoleKey]:
            prev[
              currentRoleKey
            ] === "floating"
              ? "right"
              : "floating",
        })
      );
    };

  const togglePin =
    () => {
      setPinInspector(
        (prev) => ({
          ...prev,

          [currentRoleKey]:
            !prev[
              currentRoleKey
            ],
        })
      );
    };

  // ===================================================
  // RECURSIVE CANVAS CHILD RENDERER
  // ===================================================

  const renderChildren = (
    parentId
  ) => {
    const parent =
      getElementById(
        parentId
      );

    const children =
      getChildren(
        parentId
      );

    if (
      !children.length
    ) {
      return null;
    }

    // =================================================
    // CONTROL PANEL
    // =================================================

    if (
      parent?.type ===
      "ControlPanel"
    ) {
      const panelChildren =
        children.filter(
          (child) =>
            child.type ===
            "ControlButton"
        );

      return (
        <React.Fragment>
          {panelChildren.map(
            (child) => {
              const childEntry =
                componentRegistry[
                  child.type
                ];

              if (
                !childEntry?.component
              ) {
                console.warn(
                  "[CANVAS] Missing ControlPanel child:",
                  child.type
                );

                return null;
              }

              const ChildComponent =
                childEntry.component;

              const childBinding =
                bindings[
                  child.id
                ] || {};

              const isSelected =
                selectedId ===
                child.id;

              return (
                <div
                  key={
                    child.id
                  }

                  data-canvas-element-id={
                    child.id
                  }

                  onClick={(
                    event
                  ) => {
                    event.stopPropagation();

                    selectElement(
                      child.id
                    );
                  }}

                  style={{
                    position:
                      "relative",

                    width:
                      "100%",

                    boxSizing:
                      "border-box",

                    zIndex:
                      isSelected
                        ? 100
                        : 1,

                    outline:
                      isSelected
                        ? "2px solid #6366f1"
                        : "none",

                    outlineOffset:
                      isSelected
                        ? "2px"
                        : "0",

                    boxShadow:
                      isSelected
                        ? "0 0 0 4px rgba(99, 102, 241, 0.18)"
                        : "none",

                    borderRadius:
                      isSelected
                        ? "4px"
                        : "0",
                  }}
                >
                  <CanvasElementRenderer
                    Component={
                      ChildComponent
                    }

                    element={
                      child
                    }

                    binding={
                      childBinding
                    }
                  />
                </div>
              );
            }
          )}
        </React.Fragment>
      );
    }

    // =================================================
    // NORMAL CONTAINER
    // =================================================

    return children.map(
      (child) => {
        const childEntry =
          componentRegistry[
            child.type
          ];

        if (
          !childEntry?.component
        ) {
          console.warn(
            "[CANVAS] Missing child component:",
            child.type
          );

          return null;
        }

        const ChildComponent =
          childEntry.component;

        const childBinding =
          bindings[
            child.id
          ] || {};

        const childX =
          Number.isFinite(
            child.x
          )
            ? child.x
            : 0;

        const childY =
          Number.isFinite(
            child.y
          )
            ? child.y
            : 0;

        const childWidth =
          Number.isFinite(
            child.width
          )
            ? child.width
            : 100;

        const childHeight =
          Number.isFinite(
            child.height
          )
            ? child.height
            : 40;

        const isSelected =
          selectedId ===
          child.id;

        return (
          <div
            key={
              child.id
            }

            data-canvas-element-id={
              child.id
            }

            style={{
              position:
                "absolute",

              left:
                childX,

              top:
                childY,

              width:
                childWidth,

              height:
                childHeight,

              boxSizing:
                "border-box",

              margin: 0,
              padding: 0,

              zIndex:
                isSelected
                  ? 100
                  : 1,

              overflow:
                "visible",

              ...getSelectionStyle(
                isSelected
              ),
            }}

            onClick={(
              event
            ) => {
              event.stopPropagation();

              selectElement(
                child.id
              );
            }}
          >
            <div
              style={{
                position:
                  "relative",

                width:
                  "100%",

                height:
                  "100%",

                boxSizing:
                  "border-box",
              }}
            >
              <CanvasElementRenderer
                Component={
                  ChildComponent
                }

                element={
                  child
                }

                binding={
                  childBinding
                }
              />
            </div>

            {renderChildren(
              child.id
            )}
          </div>
        );
      }
    );
  };

  // ===================================================
  // TOP LEVEL ELEMENT RENDERER
  // ===================================================

  const renderTopLevelElement =
    (el) => {

      console.log(
      "🔥 TOP LEVEL ELEMENT BEFORE RESOLVE",
      {
        id: el.id,
        type: el.type,
        props: el.props,
        parentId: el.parentId,
      }
    );
      const entry =
        componentRegistry[
          el.type
        ];

      if (
        !entry?.component
      ) {
        console.warn(
          "[CANVAS] Missing component:",
          el.type
        );

        return null;
      }

      const Comp =
        entry.component;

      const binding =
        bindings[
          el.id
        ] || {};

      const width =
        Number.isFinite(
          el.width
        )
          ? el.width
          : 300;

      const height =
        Number.isFinite(
          el.height
        )
          ? el.height
          : 150;

      const x =
        Number.isFinite(
          el.x
        )
          ? el.x
          : 0;

      const y =
        Number.isFinite(
          el.y
        )
          ? el.y
          : 0;

      const isControlPanel =
        el.type ===
        "ControlPanel";

      const controlPanelChildren =
        isControlPanel
          ? renderChildren(
              el.id
            )
          : null;

      return (
        <Rnd
          key={
            el.id
          }

          bounds="parent"

          size={{
            width,
            height,
          }}

          position={{
            x,
            y,
          }}

          scale={scale}

          enableResizing={
            isBuilderEditable
          }

          disableDragging={
            !isBuilderEditable
          }

          style={{
            zIndex:
              selectedId ===
              el.id
                ? 100
                : 1,

            ...getSelectionStyle(
              selectedId ===
                el.id
            ),
          }}

          data-canvas-element-id={
            el.id
          }

          onClick={(
            event
          ) => {
            event.stopPropagation();

            selectElement(
              el.id
            );
          }}

          onDragStop={(
            event,
            data
          ) => {
            const newX =
              Math.round(
                Math.max(
                  0,
                  data.x
                )
              );

            const newY =
              Math.round(
                Math.max(
                  0,
                  data.y
                )
              );

            updateElement(
              el.id,
              {
                x: newX,
                y: newY,
              }
            );
          }}

          onResizeStop={(
            event,
            direction,
            ref,
            delta,
            position
          ) => {
            const newWidth =
              Math.round(
                parseFloat(
                  ref.style.width
                )
              );

            const newHeight =
              Math.round(
                parseFloat(
                  ref.style.height
                )
              );

            const newX =
              Math.round(
                position.x
              );

            const newY =
              Math.round(
                position.y
              );

            updateElement(
              el.id,
              {
                width:
                  newWidth,

                height:
                  newHeight,

                x:
                  newX,

                y:
                  newY,
              }
            );
          }}
        >
          <div
            data-canvas-element-id={
              el.id
            }

            className="w-full h-full"

            style={{
              position:
                "relative",

              width:
                "100%",

              height:
                "100%",

              boxSizing:
                "border-box",

              overflow:
                "visible",

              ...canvasBackgroundStyle,
            }}
          >
            {/* CONTROL PANEL */}

            {isControlPanel ? (
              <CanvasElementRenderer
                Component={
                  Comp
                }

                element={
                  el
                }

                binding={
                  binding
                }

                children={
                  controlPanelChildren
                }
              />
            ) : (
              <CanvasElementRenderer
                Component={
                  Comp
                }

                element={
                  el
                }

                binding={
                  binding
                }
              />
            )}

            {/* NORMAL CONTAINER CHILDREN */}

            {!isControlPanel &&
              renderChildren(
                el.id
              )}
          </div>
        </Rnd>
      );
    };

  // ===================================================
  // LAYERS TREE
  // ===================================================

  const renderLayerTree =
    (
      parentId = null,
      depth = 0
    ) => {
      const children =
        visibleElements.filter(
          (el) => {
            const elementParent =
              el.parentId ||
              null;

            return (
              elementParent ===
              parentId
            );
          }
        );

      if (
        !children.length
      ) {
        return null;
      }

      return children.map(
        (el) => {
          const hasChildren =
            visibleElements.some(
              (child) =>
                (
                  child.parentId ||
                  null
                ) === el.id
            );

          return (
            <React.Fragment
              key={
                el.id
              }
            >
              <div
                onClick={() =>
                  selectElement(
                    el.id
                  )
                }

                className={`
                  px-2
                  py-1
                  rounded
                  cursor-pointer
                  flex
                  items-center
                  gap-1
                  ${
                    selectedId ===
                    el.id
                      ? "bg-accent/20"
                      : "hover:bg-accent/10"
                  }
                `}

                style={{
                  paddingLeft:
                    8 +
                    depth *
                      16,
                }}
              >
                {depth > 0 && (
                  <span
                    className="opacity-60"
                  >
                    ↳
                  </span>
                )}

                <span>
                  {el.type}
                </span>
              </div>

              {hasChildren &&
                renderLayerTree(
                  el.id,
                  depth + 1
                )}
            </React.Fragment>
          );
        }
      );
    };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      style={{
        width: "100%",
        height: "100%",

        minWidth: 0,
        minHeight: 0,

        display: "flex",
        flexDirection: "row",

        overflow: "hidden",

        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          LEFT ELEMENTS / LAYERS SIDEBAR
      ================================================= */}

      <div
        className="bg-panel border-r border-border p-3"
        style={{
          width: 250,

          flexShrink: 0,

          minWidth: 0,
          minHeight: 0,

          overflowY: "auto",
          overflowX: "hidden",

          boxSizing:
            "border-box",
        }}
      >
        <Tabs
          activeTab={
            activeTab
          }

          setActiveTab={
            setActiveTab
          }

          tabs={[
            "Elements",
            "Layers",
          ]}
        />

        {/* ELEMENTS */}

        {activeTab ===
          "Elements" &&
          availableElements.map(
            (meta) => (
              <div
                key={
                  meta.name
                }

                draggable={
                  isBuilderEditable
                }

                onDragStart={(event) => {
                  console.log("🔥 DRAG START FIRED", meta.name);

                  event.dataTransfer.effectAllowed = "copy";

                  event.dataTransfer.setData(
                    "application/json",
                    JSON.stringify(meta)
                  );

                  console.log(
                    "🔥 DRAG DATA SET",
                    event.dataTransfer.getData("application/json")
                  );
                }}

                className="px-3 py-2 text-sm rounded hover:bg-accent/10 cursor-grab"
              >
                {meta.icon}{" "}
                {meta.name}
              </div>
            )
          )}

        {/* LAYERS */}

        {activeTab ===
          "Layers" && (
          <div>
            {renderLayerTree()}
          </div>
        )}
      </div>


      {/* =================================================
          MAIN CANVAS COLUMN
      ================================================= */}

      <div
        style={{
          flex: 1,

          minWidth: 0,
          minHeight: 0,

          display: "flex",
          flexDirection: "column",

          overflow: "hidden",

          position: "relative",
        }}
      >
        {/* =================================================
            CANVAS VIEWPORT
        ================================================= */}

        <div
          style={{
            flex: 1,

            minWidth: 0,
            minHeight: 0,

            position:
              "relative",

            overflow:
              "auto",

            boxSizing:
              "border-box",

            background:
              "#0a0a0a",
          }}
        >
          {/* =============================================
              DESIGN CANVAS / STAGE
          ============================================= */}

          <div
              ref={canvasRef}

  onDragEnter={(event) => {
    console.log("🔥 CANVAS DRAG ENTER");
  }}

      onDragOver={(event) => {
        if (!isBuilderEditable) {
          console.log(
            "❌ DRAG OVER - builder not editable"
          );
          return;
        }

        console.log("🔥 CANVAS DRAG OVER");

        event.preventDefault();

        event.dataTransfer.dropEffect = "copy";
      }}

      onDrop={(event) => {
        console.log("🔥🔥🔥 CANVAS DROP FIRED");
        handleDrop(event);
      }}

            style={{
              width:
                DEVICE_SIZES[
                  device
                ].width,

              height:
                DEVICE_SIZES[
                  device
                ].height,

              transform:
                `scale(${scale})`,

              transformOrigin:
                "top left",

              position:
                "relative",

              overflow:
                "hidden",

              boxSizing:
                "border-box",

              ...canvasBackgroundStyle,
            }}
          >
            {/* =========================================
                TOP LEVEL ELEMENTS ONLY
            ========================================= */}

            {visibleElements
              .filter(
                (el) =>
                  !el.parentId
              )
              .map(
                renderTopLevelElement
              )}
          </div>
        </div>


        {/* =================================================
            BOTTOM INSPECTOR / SPLIT VIEW
        ================================================= */}

        {isSplitView && (
          <div
            style={{
              flexShrink: 0,

              minWidth: 0,

              maxWidth:
                "100%",

              overflow:
                "hidden",

              borderTop:
                "1px solid #2a2a2a",
            }}
          >
            <InspectorContent
              layout="docked"

              selectedId={
                selectedId
              }

              elements={
                visibleElements
              }

              updateElement={
                updateElement
              }

              selectedMeta={
                selectedMeta
              }

              toggleDock={
                toggleDock
              }

              toggleOpen={
                toggleInspector
              }

              pinInspector={
                pinInspector[
                  currentRoleKey
                ]
              }

              togglePin={
                togglePin
              }
            />
          </div>
        )}
      </div>


      {/* =================================================
          RIGHT INSPECTOR
      ================================================= */}

      {!isSplitView &&
        isInspectorVisible &&
        effectiveLayout ===
          "right" && (
          <div
            style={{
              flexShrink: 0,

              minWidth: 0,
              minHeight: 0,

              maxWidth:
                "min(360px, 35vw)",

              overflow:
                "hidden",

              borderLeft:
                "1px solid #2a2a2a",

              boxSizing:
                "border-box",
            }}
          >
            <InspectorContent
              layout="right"

              selectedId={
                selectedId
              }

              elements={
                visibleElements
              }

              updateElement={
                updateElement
              }

              selectedMeta={
                selectedMeta
              }

              toggleDock={
                toggleDock
              }

              toggleOpen={
                toggleInspector
              }

              pinInspector={
                pinInspector[
                  currentRoleKey
                ]
              }

              togglePin={
                togglePin
              }
            />
          </div>
        )}


      {/* =================================================
          FLOATING INSPECTOR
      ================================================= */}

      {!isSplitView &&
        isInspectorVisible &&
        effectiveLayout ===
          "floating" && (
          <InspectorContent
            layout="floating"

            position={
              floatingPos
            }

            setPosition={
              setFloatingPos
            }

            selectedId={
              selectedId
            }

            elements={
              selectedElement
                ? [
                    selectedElement,
                  ]
                : []
            }

            updateElement={
              updateElement
            }

            selectedMeta={
              selectedMeta
            }

            toggleDock={
              toggleDock
            }

            toggleOpen={
              toggleInspector
            }

            pinInspector={
              pinInspector[
                currentRoleKey
              ]
            }

            togglePin={
              togglePin
            }
          />
        )}
    </div>
  );
}
