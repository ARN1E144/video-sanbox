// src/components/Canvas.js

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
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
// Example:
//
// source: {
//   type: "string"
// }
//
// becomes:
//
// source: ""
//
// Explicit default values always win.
//
// =====================================================

const extractDefaults = (
  editableProps = {}
) => {

  const result = {};

  Object.entries(
    editableProps
  ).forEach(
    ([
      key,
      definition,
    ]) => {

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
      // UNKNOWN
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

const SYSTEM_LOCKED_KEYS =
  new Set([
    "controls",
    "action",
    "bindings",
  ]);


// =====================================================
// CONTAINER TYPES
// =====================================================

const isContainerType = (
  type
) => {

  return [
    "ControlPanel",
    "Container",
  ].includes(
    type
  );

};


// =====================================================
// SELECTION STYLE
// =====================================================

const getSelectionStyle = (
  isSelected
) => {

  if (!isSelected) {
    return {};
  }

  return {
    outline:
      "2px solid #6366f1",

    outlineOffset:
      "2px",

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

  if (
    parentType ===
      "ControlPanel" &&
    [
      "ControlButton",
      "Select",
      "Input",
      "TextBox",
    ].includes(
      childType
    )
  ) {

    return true;

  }


  if (
    parentType ===
    "Container"
  ) {

    return true;

  }


  return false;

};


// =====================================================
// ID NORMALISATION
// =====================================================

const normaliseElementId = (
  value
) => {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return null;

  }

  const id =
    String(
      value
    ).trim();

  return id || null;

};


// =====================================================
// DEFAULT PROPS
// =====================================================

const DEFAULT_PROPS_BY_TYPE = {

  ControlButton: {

    label:
      "Button",

    action:
      "",

    targetId:
      "",

    apiUrl:
      "",

  },


  ControlPanel: {

    layout:
      "vertical",

    position:
      "left",

    controls:
      [],

  },


  MicButton: {

    label:
      "Mic",

    action:
      "ToggleMic",

  },


  VideoFeed: {

    label:
      "Video",

    mode:
      "local",

    src:
      "",

    playing:
      true,

    enabled:
      true,

    muted:
      false,

  },


  Text: {

    label:
      "Text",

  },


  ChatPanel: {

    label:
      "Chat",

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

  SYSTEM_LOCKED_KEYS.forEach(
    key => {

      if (
        systemProps[key] !==
        undefined
      ) {

        clean[key] =
          systemProps[key];

      }

    }
  );

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
  } =
    usePreviewMode();


  const {
    elements,
    addElement,
    updateElement,
  } =
    useCanvasState();


  const {
    projectType,
    backgroundConfigs,
  } =
    useProjectContext();


  const {
    collapsed:
      sidebarCollapsed,
  } =
    useContext(
      ProjectContext
    );


  const {
    bindings,
    cameraOn,
  } =
    useActionContext();


  const {
    canBuild,
  } =
    useAuth();


  const {
    allowedElements,
    runtimeRole,
  } =
    useRuntimeAuth();


  // ===================================================
  // BASIC STATE
  // ===================================================

  const isBuilderEditable =
    !isPreviewMode &&
    !!canBuild &&
    !forcePreview;


  console.log(
    "🔥 CANVAS EDITABILITY",
    {
      isPreviewMode,
      canBuild,
      forcePreview,
      isBuilderEditable,
    }
  );


  const [
    device,
  ] =
    useState(
      "desktop"
    );


  const [
    scale,
  ] =
    useState(
      0.75
    );


  const [
    selectedId,
    setSelectedId,
  ] =
    useState(
      null
    );


  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      "Elements"
    );


  const [
    availableElements,
    setAvailableElements,
  ] =
    useState(
      []
    );


  const currentRoleKey =
    role ||
    "null";


  // ===================================================
  // INSPECTOR STATE
  // ===================================================

  const [
    inspectorOpen,
    setInspectorOpen,
  ] =
    useState({

      host:
        true,

      client:
        true,

      null:
        true,

    });


  const [
    inspectorLayout,
    setInspectorLayout,
  ] =
    useState({

      host:
        "right",

      client:
        "right",

      null:
        "right",

    });


  const [
    pinInspector,
    setPinInspector,
  ] =
    useState({

      host:
        false,

      client:
        false,

      null:
        false,

    });


  const [
    floatingPos,
    setFloatingPos,
  ] =
    useState({

      x:
        240,

      y:
        160,

    });


  // ===================================================
  // PROJECT VIEW
  // ===================================================

  const isMultiProject =
    projectType ===
    "multi";


  const isSplitView =
    isMultiProject &&
    previewView ===
      "split";


  const requestedLayout =
    inspectorLayout[
      currentRoleKey
    ];


  const effectiveLayout =
    requestedLayout ===
      "floating"

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
    useRef(
      null
    );


  // ===================================================
  // CANVAS SIZE
  // ===================================================

  const canvasSize =
    DEVICE_SIZES[
      device
    ];


  // ===================================================
  // ELEMENT PERMISSIONS
  // ===================================================

  useEffect(
    () => {

      const all =
        Object.values(
          componentRegistry
        )
          .map(
            entry =>
              entry.contract
          )
          .filter(
            Boolean
          );


      const permitted =
        all.filter(
          contract =>
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
              c =>
                c.name
            ),

          permitted:
            permitted.map(
              c =>
                c.name
            ),
        }
      );


      setAvailableElements(
        permitted
      );

    },
    [
      allowedElements,
      runtimeRole,
    ]
  );


  // ===================================================
  // BACKGROUND
  // ===================================================

  const bg =
    backgroundConfigs?.[
      device
    ] || {

      kind:
        "color",

      color:
        "#020617",

    };


  const canvasBackgroundStyle =
    bg.kind ===
      "image" &&
    bg.imageUrl

      ? {

          backgroundImage:
            `url(${bg.imageUrl})`,

          backgroundSize:
            bg.size ||
            "cover",

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
  // VISIBLE / CANONICAL ELEMENTS
  // ===================================================
  //
  // This is the single collection used by the Canvas.
  //
  // We:
  //
  // 1. apply role visibility
  // 2. reject missing IDs
  // 3. suppress duplicate IDs
  // 4. normalise parent IDs
  //
  // This prevents duplicate persisted elements from
  // producing multiple Rnd instances at the same position.
  //
  // ===================================================

  const visibleElements =
    useMemo(
      () => {

        const roleVisible =
          Array.isArray(
            elements
          )

            ? elements.filter(
                el => {

                  if (
                    !el?.role
                  ) {

                    return true;

                  }

                  return (
                    el.role ===
                    role
                  );

                }
              )

            : [];


        const seenIds =
          new Set();


        const duplicates =
          [];


        const canonical =
          roleVisible.filter(
            el => {

              const id =
                normaliseElementId(
                  el?.id
                );


              if (
                !id
              ) {

                console.warn(
                  "[CANVAS] Ignoring element without ID",
                  {
                    element:
                      el,
                  }
                );


                return false;

              }


              if (
                seenIds.has(
                  id
                )
              ) {

                duplicates.push(
                  el
                );

                return false;

              }


              seenIds.add(
                id
              );

              return true;

            }
          )
          .map(
            el => ({

              ...el,

              id:
                normaliseElementId(
                  el.id
                ),

              parentId:
                normaliseElementId(
                  el.parentId
                ),

              props:
                el.props &&
                typeof el.props ===
                  "object"
                  ? el.props
                  : {},

              x:
                Number.isFinite(
                  Number(
                    el.x
                  )
                )
                  ? Number(
                      el.x
                    )
                  : 0,

              y:
                Number.isFinite(
                  Number(
                    el.y
                  )
                )
                  ? Number(
                      el.y
                    )
                  : 0,

              width:
                Number.isFinite(
                  Number(
                    el.width
                  )
                )
                  ? Math.max(
                      1,
                      Number(
                        el.width
                      )
                    )
                  : 300,

              height:
                Number.isFinite(
                  Number(
                    el.height
                  )
                )
                  ? Math.max(
                      1,
                      Number(
                        el.height
                      )
                    )
                  : 150,

            })
          );


        if (
          duplicates.length >
          0
        ) {

          console.warn(
            "[CANVAS] DUPLICATE ELEMENT IDS DETECTED",
            {
              duplicates:
                duplicates.map(
                  el => ({

                    id:
                      el.id,

                    type:
                      el.type,

                    parentId:
                      el.parentId ||
                      null,

                    x:
                      el.x,

                    y:
                      el.y,

                    width:
                      el.width,

                    height:
                      el.height,

                  })
                ),

            }
          );

        }


        return canonical;

      },
      [
        elements,
        role,
      ]
    );


  // ===================================================
  // ELEMENT MAP
  // ===================================================
  //
  // O(1) lookup for hierarchy calculations.
  //
  // ===================================================

  const elementMap =
    useMemo(
      () => {

        const map =
          new Map();


        visibleElements.forEach(
          element => {

            map.set(
              element.id,
              element
            );

          }
        );


        return map;

      },
      [
        visibleElements,
      ]
    );


  // ===================================================
  // CANVAS ELEMENT INTEGRITY
  // ===================================================

  useEffect(
    () => {

      const orphaned = [];


      visibleElements.forEach(
        element => {

          const parentId =
            normaliseElementId(
              element.parentId
            );


          if (
            parentId &&
            !elementMap.has(
              parentId
            )
          ) {

            orphaned.push(
              {
                id:
                  element.id,

                type:
                  element.type,

                parentId,

              }
            );

          }

        }
      );


      console.log(
        "[CANVAS ELEMENT INTEGRITY]",
        {
          elementCount:
            visibleElements.length,

          duplicateIds:
            [],

          orphaned,
        }
      );


      if (
        orphaned.length
      ) {

        console.warn(
          "[CANVAS] Orphaned elements will be rendered top-level",
          orphaned
        );

      }

    },
    [
      visibleElements,
      elementMap,
    ]
  );


  // ===================================================
  // HIERARCHY DEBUG
  // ===================================================

  useEffect(
    () => {

      console.log(
        "[CANVAS HIERARCHY]",
        visibleElements.map(
          el => ({

            id:
              el.id,

            type:
              el.type,

            parentId:
              el.parentId ||
              null,

            x:
              el.x,

            y:
              el.y,

            width:
              el.width,

            height:
              el.height,

          })
        )
      );

    },
    [
      visibleElements,
    ]
  );


  // ===================================================
  // SELECTED ELEMENT
  // ===================================================

  const selectedElement =
    visibleElements.find(
      el =>
        el.id ===
        selectedId
    ) ||
    null;


  const selectedMeta =
    selectedElement
      ? componentRegistry[
          selectedElement.type
        ]?.contract
      : null;


  // ===================================================
  // SELECT ELEMENT
  // ===================================================

  const selectElement =
    id => {

      setSelectedId(
        id
      );


      onSelectedIdChange?.(
        id
      );


      if (
        !pinInspector[
          currentRoleKey
        ]
      ) {

        setInspectorOpen(
          prev => ({

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

  const getElementById =
    id => {

      const normalisedId =
        normaliseElementId(
          id
        );


      if (
        !normalisedId
      ) {

        return null;

      }


      return (
        elementMap.get(
          normalisedId
        ) ||
        null
      );

    };


  // ===================================================
  // GET CHILDREN
  // ===================================================

  const getChildren =
    parentId => {

      const normalisedParentId =
        normaliseElementId(
          parentId
        );


      if (
        !normalisedParentId
      ) {

        return [];

      }


      return visibleElements.filter(
        element =>
          normaliseElementId(
            element.parentId
          ) ===
          normalisedParentId
      );

    };


  // ===================================================
  // GET ABSOLUTE POSITION
  // ===================================================

  const getAbsolutePosition =
    element => {

      let x =
        Number(
          element?.x
        ) || 0;


      let y =
        Number(
          element?.y
        ) || 0;


      let parentId =
        normaliseElementId(
          element?.parentId
        );


      const visited =
        new Set();


      while (
        parentId
      ) {

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


        x +=
          Number(
            parent.x
          ) || 0;


        y +=
          Number(
            parent.y
          ) || 0;


        parentId =
          normaliseElementId(
            parent.parentId
          );

      }


      return {

        x,
        y,

      };

    };


  // ===================================================
  // CLAMP TOP-LEVEL ELEMENT
  // ===================================================
  //
  // Top-level elements live directly on the stage.
  //
  // Children are positioned relative to their parent and
  // therefore are intentionally NOT clamped here.
  //
  // ===================================================

  const clampTopLevelElement =
    element => {

      const width =
        Math.min(
          Math.max(
            1,
            Number(
              element?.width
            ) || 300
          ),
          canvasSize.width
        );


      const height =
        Math.min(
          Math.max(
            1,
            Number(
              element?.height
            ) || 150
          ),
          canvasSize.height
        );


      const x =
        Math.min(
          Math.max(
            0,
            Number(
              element?.x
            ) || 0
          ),
          Math.max(
            0,
            canvasSize.width -
              width
          )
        );


      const y =
        Math.min(
          Math.max(
            0,
            Number(
              element?.y
            ) || 0
          ),
          Math.max(
            0,
            canvasSize.height -
              height
          )
        );


      return {

        ...element,

        x,
        y,

        width,
        height,

      };

    };


  // ===================================================
  // FIND DOM DROP TARGET
  // ===================================================

  const findDomDropTarget =
    (
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


        if (
          elementId
        ) {

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

  const findGeometricDropTarget =
    (
      canvasX,
      canvasY,
      draggedType
    ) => {

      const candidates =
        visibleElements

          .filter(
            el => {

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

            }
          )

          .map(
            el => {

              const absolute =
                getAbsolutePosition(
                  el
                );


              const width =
                Number(
                  el.width
                ) || 0;


              const height =
                Number(
                  el.height
                ) || 0;


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

                element:
                  el,

                absolute,

                width,

                height,

                inside,

              };

            }
          )

          .filter(
            item =>
              item.inside
          );


      if (
        !candidates.length
      ) {

        return null;

      }


      candidates.sort(
        (
          a,
          b
        ) => {

          const areaA =
            a.width *
            a.height;


          const areaB =
            b.width *
            b.height;


          return (
            areaA -
            areaB
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

  const handleDrop =
    e => {

      if (
        !isBuilderEditable
      ) {

        return;

      }


      e.preventDefault();


      let meta = {};


      try {

        meta =
          JSON.parse(
            e.dataTransfer.getData(
              "application/json"
            ) ||
            "{}"
          );

      }
      catch (
        error
      ) {

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


      const rect =
        canvasRef.current.getBoundingClientRect();


      const canvasX =
        (
          e.clientX -
          rect.left
        ) /
        scale;


      const canvasY =
        (
          e.clientY -
          rect.top
        ) /
        scale;


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


      const parentId =
        potentialParent?.id ||
        null;


      let elementX =
        canvasX -
        150;


      let elementY =
        canvasY -
        75;


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


      if (
        potentialParent?.type ===
        "ControlPanel"
      ) {

        elementX =
          0;


        elementY =
          0;

      }


      const system =
        DEFAULT_PROPS_BY_TYPE[
          draggedType
        ] ||
        {};


      const metaDefaults =
        extractDefaults(
          meta.editableProps
        ) ||
        {};


      const newId =
        uuid();


      let width =
        300;


      let height =
        150;


      if (
        draggedType ===
        "ControlButton"
      ) {

        width =
          140;

        height =
          44;

      }


      if (
        draggedType ===
        "ControlPanel"
      ) {

        width =
          300;

        height =
          150;

      }


      if (
        draggedType ===
        "Text"
      ) {

        width =
          200;

        height =
          50;

      }


      const newElement = {

        id:
          newId,

        type:
          draggedType,

        role:
          role ||
          null,

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

          id:
            newElement.id,

          type:
            newElement.type,

          draggedType,

          metaName:
            meta.name,

          meta,

          newElement,

        }
      );


      addElement(
        newElement
      );


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
        prev => ({

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
        prev => ({

          ...prev,

          [currentRoleKey]:
            prev[
              currentRoleKey
            ] ===
              "floating"

              ? "right"

              : "floating",

        })
      );

    };


  const togglePin =
    () => {

      setPinInspector(
        prev => ({

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

  const renderChildren =
    (
      parentId,
      ancestry = new Set()
    ) => {

      const normalisedParentId =
        normaliseElementId(
          parentId
        );


      if (
        !normalisedParentId
      ) {

        return null;

      }


      if (
        ancestry.has(
          normalisedParentId
        )
      ) {

        console.warn(
          "[CANVAS] Recursive child rendering stopped",
          {
            parentId:
              normalisedParentId,
          }
        );


        return null;

      }


      const parent =
        getElementById(
          normalisedParentId
        );


      const children =
        getChildren(
          normalisedParentId
        );


      if (
        !children.length
      ) {

        return null;

      }


      const nextAncestry =
        new Set(
          ancestry
        );


      nextAncestry.add(
        normalisedParentId
      );


      // =================================================
      // CONTROL PANEL
      // =================================================

      if (
        parent?.type ===
        "ControlPanel"
      ) {

        const panelChildren =
          children.filter(
            child =>
              [
                "ControlButton",
                "Select",
                "Input",
                "TextBox",
              ].includes(
                child.type
              )
          );


        return (
          <React.Fragment>

            {
              panelChildren.map(
                child => {

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
                    ] ||
                    {};


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

                      onClick={
                        event => {

                          event.stopPropagation();

                          selectElement(
                            child.id
                          );

                        }
                      }

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
              )
            }

          </React.Fragment>
        );

      }


      // =================================================
      // NORMAL CONTAINER
      // =================================================

      return children.map(
        child => {

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
            ] ||
            {};


          const childX =
            Number.isFinite(
              Number(
                child.x
              )
            )
              ? Number(
                  child.x
                )
              : 0;


          const childY =
            Number.isFinite(
              Number(
                child.y
              )
            )
              ? Number(
                  child.y
                )
              : 0;


          const childWidth =
            Number.isFinite(
              Number(
                child.width
              )
            )
              ? Number(
                  child.width
                )
              : 100;


          const childHeight =
            Number.isFinite(
              Number(
                child.height
              )
            )
              ? Number(
                  child.height
                )
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

                margin:
                  0,

                padding:
                  0,

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

              onClick={
                event => {

                  event.stopPropagation();

                  selectElement(
                    child.id
                  );

                }
              }

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


              {
                renderChildren(
                  child.id,
                  nextAncestry
                )
              }

            </div>
          );

        }
      );

    };


  // ===================================================
  // TOP LEVEL ELEMENT RENDERER
  // ===================================================

  const renderTopLevelElement =
    rawElement => {

      const el =
        clampTopLevelElement(
          rawElement
        );


      console.log(
        "🔥 TOP LEVEL ELEMENT BEFORE RESOLVE",
        {

          id:
            el.id,

          type:
            el.type,

          props:
            el.props,

          parentId:
            el.parentId,

          x:
            el.x,

          y:
            el.y,

          width:
            el.width,

          height:
            el.height,

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
        ] ||
        {};


      const isControlPanel =
        el.type ===
        "ControlPanel";


      const controlPanelChildren =
        isControlPanel
          ? renderChildren(
              el.id,
              new Set()
            )
          : null;


      return (
        <Rnd
          key={
            el.id
          }

          bounds="parent"

          size={{

            width:
              el.width,

            height:
              el.height,

          }}

          position={{

            x:
              el.x,

            y:
              el.y,

          }}

          scale={
            scale
          }

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

          onClick={
            event => {

              event.stopPropagation();

              selectElement(
                el.id
              );

            }
          }

          onDragStop={
            (
              event,
              data
            ) => {

              const newWidth =
                el.width;


              const newHeight =
                el.height;


              const maxX =
                Math.max(
                  0,
                  canvasSize.width -
                    newWidth
                );


              const maxY =
                Math.max(
                  0,
                  canvasSize.height -
                    newHeight
                );


              const newX =
                Math.round(
                  Math.min(
                    maxX,
                    Math.max(
                      0,
                      data.x
                    )
                  )
                );


              const newY =
                Math.round(
                  Math.min(
                    maxY,
                    Math.max(
                      0,
                      data.y
                    )
                  )
                );


              updateElement(
                el.id,
                {

                  x:
                    newX,

                  y:
                    newY,

                }
              );

            }
          }

          onResizeStop={
            (
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


              const maxX =
                Math.max(
                  0,
                  canvasSize.width -
                    newWidth
                );


              const maxY =
                Math.max(
                  0,
                  canvasSize.height -
                    newHeight
                );


              const newX =
                Math.round(
                  Math.min(
                    maxX,
                    Math.max(
                      0,
                      position.x
                    )
                  )
                );


              const newY =
                Math.round(
                  Math.min(
                    maxY,
                    Math.max(
                      0,
                      position.y
                    )
                  )
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

            }
          }

        >

          <div
            data-canvas-element-id={
              el.id
            }

            className="
              w-full
              h-full
            "

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

            {/* =========================================
                CONTROL PANEL
            ========================================= */}

            {
              isControlPanel

                ? (

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

                  )

                : (

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

                  )
            }


            {/* =========================================
                NORMAL CONTAINER CHILDREN
            ========================================= */}

            {
              !isControlPanel &&
              renderChildren(
                el.id,
                new Set()
              )
            }

          </div>

        </Rnd>
      );

    };


  // ===================================================
  // ROOT ELEMENTS
  // ===================================================
  //
  // Only elements with no parent OR with a missing parent
  // are mounted as top-level Rnd instances.
  //
  // Real children are mounted by renderChildren().
  //
  // ===================================================

  const topLevelElements =
    useMemo(
      () => {

        return visibleElements.filter(
          element => {

            const parentId =
              normaliseElementId(
                element.parentId
              );


            if (
              !parentId
            ) {

              return true;

            }


            if (
              !elementMap.has(
                parentId
              )
            ) {

              return true;

            }


            return false;

          }
        );

      },
      [
        visibleElements,
        elementMap,
      ]
    );


  // ===================================================
  // LAYERS TREE
  // ===================================================

  const renderLayerTree =
    (
      parentId = null,
      depth = 0,
      ancestry = new Set()
    ) => {

      const normalisedParentId =
        normaliseElementId(
          parentId
        );


      if (
        ancestry.has(
          normalisedParentId
        )
      ) {

        console.warn(
          "[CANVAS] Layer tree circular reference detected",
          {
            parentId:
              normalisedParentId,
          }
        );


        return null;

      }


      const children =
        visibleElements.filter(
          el => {

            const elementParent =
              normaliseElementId(
                el.parentId
              );


            return (
              elementParent ===
              normalisedParentId
            );

          }
        );


      if (
        !children.length
      ) {

        return null;

      }


      const nextAncestry =
        new Set(
          ancestry
        );


      nextAncestry.add(
        normalisedParentId
      );


      return children.map(
        el => {

          const hasChildren =
            visibleElements.some(
              child =>
                normaliseElementId(
                  child.parentId
                ) ===
                el.id
            );


          return (
            <React.Fragment
              key={
                el.id
              }
            >

              <div
                onClick={
                  () =>
                    selectElement(
                      el.id
                    )
                }

                className="
                  px-2
                  py-1
                  rounded
                  cursor-pointer
                  flex
                  items-center
                  gap-1
                  hover:bg-accent/10
                "

                style={{

                  paddingLeft:
                    8 +
                    depth *
                      16,

                  background:
                    selectedId ===
                    el.id

                      ? "rgba(99, 102, 241, 0.12)"

                      : undefined,

                }}
              >

                {
                  depth > 0 && (

                    <span
                      className="opacity-60"
                    >

                      ↳

                    </span>

                  )
                }


                <span>

                  {
                    el.type
                  }

                </span>

              </div>


              {
                hasChildren &&
                renderLayerTree(
                  el.id,
                  depth + 1,
                  nextAncestry
                )
              }

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

        width:
          "100%",

        height:
          "100%",

        minWidth:
          0,

        minHeight:
          0,

        display:
          "flex",

        flexDirection:
          "row",

        overflow:
          "hidden",

        boxSizing:
          "border-box",

      }}
    >

      {/* =================================================
          LEFT ELEMENTS / LAYERS SIDEBAR
      ================================================= */}

      <div
        className="
          bg-panel
          border-r
          border-border
          p-3
        "

        style={{

          width:
            250,

          flexShrink:
            0,

          minWidth:
            0,

          minHeight:
            0,

          overflowY:
            "auto",

          overflowX:
            "hidden",

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


        {/* =================================================
            ELEMENTS
        ================================================= */}

        {
          activeTab ===
            "Elements" &&

          availableElements.map(
            meta => (

              <div
                key={
                  meta.name
                }

                draggable={
                  isBuilderEditable
                }

                onDragStart={
                  event => {

                    console.log(
                      "🔥 DRAG START FIRED",
                      meta.name
                    );


                    event.dataTransfer.effectAllowed =
                      "copy";


                    event.dataTransfer.setData(
                      "application/json",
                      JSON.stringify(
                        meta
                      )
                    );


                    console.log(
                      "🔥 DRAG DATA SET",
                      event.dataTransfer.getData(
                        "application/json"
                      )
                    );

                  }
                }

                className="
                  px-3
                  py-2
                  text-sm
                  rounded
                  hover:bg-accent/10
                  cursor-grab
                "
              >

                {
                  meta.icon
                }{" "}

                {
                  meta.name
                }

              </div>

            )
          )
        }


        {/* =================================================
            LAYERS
        ================================================= */}

        {
          activeTab ===
            "Layers" && (

            <div>

              {
                renderLayerTree()
              }

            </div>

          )
        }

      </div>


      {/* =================================================
          MAIN CANVAS COLUMN
      ================================================= */}

      <div
        style={{

          flex:
            1,

          minWidth:
            0,

          minHeight:
            0,

          display:
            "flex",

          flexDirection:
            "column",

          overflow:
            "hidden",

          position:
            "relative",

        }}
      >

        {/* =================================================
            CANVAS VIEWPORT
        ================================================= */}

        <div
          style={{

            flex:
              1,

            minWidth:
              0,

            minHeight:
              0,

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
              CANVAS STAGE
          ============================================= */}

          <div
            ref={
              canvasRef
            }

            onDragEnter={
              event => {

                console.log(
                  "🔥 CANVAS DRAG ENTER"
                );

              }
            }

            onDragOver={
              event => {

                if (
                  !isBuilderEditable
                ) {

                  console.log(
                    "❌ DRAG OVER - builder not editable"
                  );


                  return;

                }


                console.log(
                  "🔥 CANVAS DRAG OVER"
                );


                event.preventDefault();


                event.dataTransfer.dropEffect =
                  "copy";

              }
            }

            onDrop={
              event => {

                console.log(
                  "🔥🔥🔥 CANVAS DROP FIRED"
                );


                handleDrop(
                  event
                );

              }
            }

            style={{

              width:
                canvasSize.width,

              height:
                canvasSize.height,

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

            {
              topLevelElements.map(
                renderTopLevelElement
              )
            }

          </div>

        </div>


        {/* =================================================
            BOTTOM INSPECTOR / SPLIT VIEW
        ================================================= */}

        {
          isSplitView && (

            <div
              style={{

                flexShrink:
                  0,

                minWidth:
                  0,

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

          )
        }

      </div>


      {/* =================================================
          RIGHT INSPECTOR
      ================================================= */}

      {
        !isSplitView &&
        isInspectorVisible &&
        effectiveLayout ===
          "right" && (

          <div
            style={{

              flexShrink:
                0,

              minWidth:
                0,

              minHeight:
                0,

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

        )
      }


      {/* =================================================
          FLOATING INSPECTOR
      ================================================= */}

      {
        !isSplitView &&
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

        )
      }

    </div>

  );

}
