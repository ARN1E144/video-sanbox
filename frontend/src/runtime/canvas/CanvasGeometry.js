// src/canvas/CanvasGeometry.js

// =====================================================
// CONFO CANVAS GEOMETRY
// =====================================================
//
// Single source of truth for Canvas geometry.
//
// Responsibilities:
//   - Geometry defaults
//   - Numeric normalisation
//   - Bounds calculations
//   - Parent/child geometry
//   - Coordinate normalisation
//   - Layout padding / gaps
//   - Child ordering
//   - Containment checks
//   - Overlap detection
//   - Automatic container sizing
//
// IMPORTANT
// -----------------------------------------------------
// Geometry is always stored in CANONICAL canvas
// coordinates.
//
// Canvas display scaling belongs to Canvas.js.
//
// Therefore:
//
//   persisted x/y/width/height
//          ↓
//   canonical geometry
//          ↓
//   Canvas display scale
//
// NEVER store scaled coordinates here.
// =====================================================


// =====================================================
// CONSTANTS
// =====================================================

export const CANVAS_DEFAULTS = {
  width: 1440,
  height: 900,
};

export const GEOMETRY_DEFAULTS = {
  x: 0,
  y: 0,
  width: 300,
  height: 150,
};

export const CONTAINER_DEFAULTS = {
  width: 600,
  height: 400,
};

export const CONTROL_PANEL_DEFAULTS = {
  width: 520,
  height: 72,
};

export const LAYOUT_DEFAULTS = {
  type: "free",
  gap: 12,
  padding: 16,
  columns: 2,
};

export const MIN_SIZE = {
  width: 1,
  height: 1,
};

export const MIN_CONTAINER_SIZE = {
  width: 40,
  height: 40,
};


// =====================================================
// BASIC HELPERS
// =====================================================

export function isFiniteNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}


export function toFiniteNumber(
  value,
  fallback = 0
) {
  return isFiniteNumber(value)
    ? value
    : fallback;
}


export function toPositiveNumber(
  value,
  fallback
) {
  if (
    !isFiniteNumber(value) ||
    value <= 0
  ) {
    return fallback;
  }

  return value;
}


export function clamp(
  value,
  min,
  max
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}


// =====================================================
// LAYOUT NORMALISATION
// =====================================================

export function normaliseLayoutType(
  value
) {
  if (
    value === "horizontal" ||
    value === "vertical" ||
    value === "grid" ||
    value === "free"
  ) {
    return value;
  }

  return "free";
}


export function normaliseLayoutConfig(
  layout
) {
  const source =
    layout &&
    typeof layout === "object"
      ? layout
      : {};

  return {
    type: normaliseLayoutType(
      source.type ??
      source.layout ??
      "free"
    ),

    gap: toPositiveNumber(
      source.gap,
      LAYOUT_DEFAULTS.gap
    ),

    padding: toPositiveNumber(
      source.padding,
      LAYOUT_DEFAULTS.padding
    ),

    columns: Math.max(
      1,
      Math.floor(
        toPositiveNumber(
          source.columns,
          LAYOUT_DEFAULTS.columns
        )
      )
    ),
  };
}


// =====================================================
// ELEMENT GEOMETRY
// =====================================================

export function normaliseGeometry(
  element,
  fallback = {}
) {
  const source =
    element &&
    typeof element === "object"
      ? element
      : {};

  const fallbackSource =
    fallback &&
    typeof fallback === "object"
      ? fallback
      : {};

  return {
    x: toFiniteNumber(
      source.x,
      toFiniteNumber(
        fallbackSource.x,
        GEOMETRY_DEFAULTS.x
      )
    ),

    y: toFiniteNumber(
      source.y,
      toFiniteNumber(
        fallbackSource.y,
        GEOMETRY_DEFAULTS.y
      )
    ),

    width: Math.max(
      MIN_SIZE.width,
      toPositiveNumber(
        source.width,
        toPositiveNumber(
          fallbackSource.width,
          GEOMETRY_DEFAULTS.width
        )
      )
    ),

    height: Math.max(
      MIN_SIZE.height,
      toPositiveNumber(
        source.height,
        toPositiveNumber(
          fallbackSource.height,
          GEOMETRY_DEFAULTS.height
        )
      )
    ),
  };
}


export function normaliseElementGeometry(
  element
) {
  if (
    !element ||
    typeof element !== "object"
  ) {
    return element;
  }

  return {
    ...element,
    ...normaliseGeometry(element),
  };
}


// =====================================================
// RECTANGLE HELPERS
// =====================================================

export function getRect(
  element
) {
  const geometry =
    normaliseGeometry(element);

  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,

    right:
      geometry.x +
      geometry.width,

    bottom:
      geometry.y +
      geometry.height,
  };
}


export function rectFromGeometry(
  geometry
) {
  const normalised =
    normaliseGeometry(geometry);

  return {
    ...normalised,

    right:
      normalised.x +
      normalised.width,

    bottom:
      normalised.y +
      normalised.height,
  };
}


// =====================================================
// CHILD / PARENT COORDINATES
// =====================================================
//
// Child coordinates are always relative to the
// immediate parent.
//
// Top-level coordinates are relative to the canvas.
//
// These helpers intentionally do not apply Canvas
// display scaling.
// =====================================================

export function localToAbsolute(
  child,
  parent
) {
  const childGeometry =
    normaliseGeometry(child);

  const parentGeometry =
    normaliseGeometry(parent);

  return {
    x:
      parentGeometry.x +
      childGeometry.x,

    y:
      parentGeometry.y +
      childGeometry.y,

    width:
      childGeometry.width,

    height:
      childGeometry.height,
  };
}


export function absoluteToLocal(
  child,
  parent
) {
  const childGeometry =
    normaliseGeometry(child);

  const parentGeometry =
    normaliseGeometry(parent);

  return {
    x:
      childGeometry.x -
      parentGeometry.x,

    y:
      childGeometry.y -
      parentGeometry.y,

    width:
      childGeometry.width,

    height:
      childGeometry.height,
  };
}


// =====================================================
// BOUNDS
// =====================================================

export function getContentBounds(
  container,
  padding = LAYOUT_DEFAULTS.padding
) {
  const geometry =
    normaliseGeometry(container);

  const safePadding =
    Math.max(
      0,
      toFiniteNumber(
        padding,
        LAYOUT_DEFAULTS.padding
      )
    );

  return {
    x: safePadding,
    y: safePadding,

    width: Math.max(
      0,
      geometry.width -
        safePadding * 2
    ),

    height: Math.max(
      0,
      geometry.height -
        safePadding * 2
    ),
  };
}


export function getChildBounds(
  child,
  parent
) {
  const childGeometry =
    normaliseGeometry(child);

  const parentGeometry =
    normaliseGeometry(parent);

  return {
    left: childGeometry.x,

    top: childGeometry.y,

    right:
      childGeometry.x +
      childGeometry.width,

    bottom:
      childGeometry.y +
      childGeometry.height,

    parentWidth:
      parentGeometry.width,

    parentHeight:
      parentGeometry.height,
  };
}


// =====================================================
// CONTAINMENT
// =====================================================

export function isRectInside(
  child,
  parent,
  options = {}
) {
  const childRect =
    getRect(child);

  const parentRect =
    getRect(parent);

  const allowOverflow =
    options.allowOverflow === true;

  if (allowOverflow) {
    return true;
  }

  return (
    childRect.x >= parentRect.x &&
    childRect.y >= parentRect.y &&
    childRect.right <=
      parentRect.right &&
    childRect.bottom <=
      parentRect.bottom
  );
}


export function isLocalGeometryInsideParent(
  child,
  parent
) {
  const childGeometry =
    normaliseGeometry(child);

  const parentGeometry =
    normaliseGeometry(parent);

  return (
    childGeometry.x >= 0 &&
    childGeometry.y >= 0 &&
    childGeometry.x +
      childGeometry.width <=
      parentGeometry.width &&
    childGeometry.y +
      childGeometry.height <=
      parentGeometry.height
  );
}


// =====================================================
// CLAMPING
// =====================================================
//
// Clamping is a COMMIT-TIME operation.
//
// Renderers should not silently alter geometry.
//
// The returned value is what should be persisted.
// =====================================================

export function clampGeometryToParent(
  child,
  parent,
  options = {}
) {
  const childGeometry =
    normaliseGeometry(child);

  const parentGeometry =
    normaliseGeometry(parent);

  const padding =
    Math.max(
      0,
      toFiniteNumber(
        options.padding,
        0
      )
    );

  const availableWidth =
    Math.max(
      0,
      parentGeometry.width -
        padding * 2
    );

  const availableHeight =
    Math.max(
      0,
      parentGeometry.height -
        padding * 2
    );

  const width =
    Math.min(
      childGeometry.width,
      availableWidth
    );

  const height =
    Math.min(
      childGeometry.height,
      availableHeight
    );

  const maxX =
    Math.max(
      padding,
      parentGeometry.width -
        padding -
        width
    );

  const maxY =
    Math.max(
      padding,
      parentGeometry.height -
        padding -
        height
    );

  return {
    ...child,

    x: clamp(
      childGeometry.x,
      padding,
      maxX
    ),

    y: clamp(
      childGeometry.y,
      padding,
      maxY
    ),

    width,

    height,
  };
}


export function clampTopLevelGeometry(
  element,
  canvas = CANVAS_DEFAULTS
) {
  const geometry =
    normaliseGeometry(element);

  const canvasWidth =
    toPositiveNumber(
      canvas?.width,
      CANVAS_DEFAULTS.width
    );

  const canvasHeight =
    toPositiveNumber(
      canvas?.height,
      CANVAS_DEFAULTS.height
    );

  const width =
    Math.min(
      geometry.width,
      canvasWidth
    );

  const height =
    Math.min(
      geometry.height,
      canvasHeight
    );

  return {
    ...element,

    x: clamp(
      geometry.x,
      0,
      Math.max(
        0,
        canvasWidth - width
      )
    ),

    y: clamp(
      geometry.y,
      0,
      Math.max(
        0,
        canvasHeight - height
      )
    ),

    width,

    height,
  };
}


// =====================================================
// OVERLAP
// =====================================================

export function rectanglesOverlap(
  first,
  second,
  options = {}
) {
  const a =
    getRect(first);

  const b =
    getRect(second);

  const tolerance =
    Math.max(
      0,
      toFiniteNumber(
        options.tolerance,
        0
      )
    );

  return !(
    a.right <=
      b.x + tolerance ||

    a.x >=
      b.right - tolerance ||

    a.bottom <=
      b.y + tolerance ||

    a.y >=
      b.bottom - tolerance
  );
}


export function findOverlaps(
  element,
  siblings = [],
  options = {}
) {
  if (!element) {
    return [];
  }

  return siblings.filter(
    sibling =>
      sibling &&
      sibling.id !== element.id &&
      rectanglesOverlap(
        element,
        sibling,
        options
      )
  );
}


// =====================================================
// CHILD ORDER
// =====================================================
//
// For managed layouts, ordering is authoritative.
// Geometry is derived from order.
//
// We preserve the current array order unless an
// explicit order value is provided.
// =====================================================

export function getChildOrder(
  child,
  fallbackIndex = 0
) {
  const order =
    child?.props?.order ??
    child?.meta?.order ??
    child?.order;

  if (isFiniteNumber(order)) {
    return order;
  }

  return fallbackIndex;
}


export function sortChildren(
  children = []
) {
  return children
    .map(
      (child, index) => ({
        child,
        index,
        order:
          getChildOrder(
            child,
            index
          ),
      })
    )
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.index - b.index
    )
    .map(
      entry =>
        entry.child
    );
}


// =====================================================
// REQUIRED CONTENT SIZE
// =====================================================
//
// Used by auto-growing containers.
//
// Children must be supplied in LOCAL parent
// coordinates.
// =====================================================

export function getRequiredContentSize(
  children = [],
  options = {}
) {
  const padding =
    Math.max(
      0,
      toFiniteNumber(
        options.padding,
        LAYOUT_DEFAULTS.padding
      )
    );

  const gap =
    Math.max(
      0,
      toFiniteNumber(
        options.gap,
        LAYOUT_DEFAULTS.gap
      )
    );

  const layout =
    normaliseLayoutType(
      options.layout ??
      options.type ??
      "free"
    );

  const columns =
    Math.max(
      1,
      Math.floor(
        toPositiveNumber(
          options.columns,
          LAYOUT_DEFAULTS.columns
        )
      )
    );

  if (!children.length) {
    return {
      width:
        padding * 2,

      height:
        padding * 2,
    };
  }

  const normalisedChildren =
    children.map(
      child =>
        normaliseGeometry(child)
    );

  // -----------------------------------------------
  // FREE
  // -----------------------------------------------

  if (layout === "free") {
    const right =
      Math.max(
        ...normalisedChildren.map(
          child =>
            child.x +
            child.width
        )
      );

    const bottom =
      Math.max(
        ...normalisedChildren.map(
          child =>
            child.y +
            child.height
        )
      );

    return {
      width:
        right +
        padding,

      height:
        bottom +
        padding,
    };
  }

  // -----------------------------------------------
  // HORIZONTAL
  // -----------------------------------------------

  if (layout === "horizontal") {
    const width =
      normalisedChildren.reduce(
        (
          total,
          child
        ) =>
          total +
          child.width,
        0
      ) +
      gap *
        Math.max(
          0,
          normalisedChildren.length - 1
        ) +
      padding * 2;

    const height =
      Math.max(
        ...normalisedChildren.map(
          child =>
            child.height
        )
      ) +
      padding * 2;

    return {
      width,
      height,
    };
  }

  // -----------------------------------------------
  // VERTICAL
  // -----------------------------------------------

  if (layout === "vertical") {
    const width =
      Math.max(
        ...normalisedChildren.map(
          child =>
            child.width
        )
      ) +
      padding * 2;

    const height =
      normalisedChildren.reduce(
        (
          total,
          child
        ) =>
          total +
          child.height,
        0
      ) +
      gap *
        Math.max(
          0,
          normalisedChildren.length - 1
        ) +
      padding * 2;

    return {
      width,
      height,
    };
  }

  // -----------------------------------------------
  // GRID
  // -----------------------------------------------

  const rows =
    Math.ceil(
      normalisedChildren.length /
        columns
    );

  const columnWidths =
    Array.from(
      {
        length: columns,
      },
      () => 0
    );

  const rowHeights =
    Array.from(
      {
        length: rows,
      },
      () => 0
    );

  normalisedChildren.forEach(
    (
      child,
      index
    ) => {
      const column =
        index % columns;

      const row =
        Math.floor(
          index / columns
        );

      columnWidths[column] =
        Math.max(
          columnWidths[column],
          child.width
        );

      rowHeights[row] =
        Math.max(
          rowHeights[row],
          child.height
        );
    }
  );

  return {
    width:
      columnWidths.reduce(
        (
          total,
          width
        ) =>
          total + width,
        0
      ) +
      gap *
        Math.max(
          0,
          columns - 1
        ) +
      padding * 2,

    height:
      rowHeights.reduce(
        (
          total,
          height
        ) =>
          total + height,
        0
      ) +
      gap *
        Math.max(
          0,
          rows - 1
        ) +
      padding * 2,
  };
}


// =====================================================
// AUTO-SIZE CONTAINER
// =====================================================
//
// Only changes the container dimensions.
// It does not move children.
//
// This is deliberately separate from layout so the
// layout engine can decide whether auto-size is enabled.
// =====================================================

export function autoSizeContainer(
  container,
  children = [],
  options = {}
) {
  if (!container) {
    return container;
  }

  const required =
    getRequiredContentSize(
      children,
      options
    );

  const minimumWidth =
    Math.max(
      MIN_CONTAINER_SIZE.width,
      toPositiveNumber(
        options.minWidth,
        MIN_CONTAINER_SIZE.width
      )
    );

  const minimumHeight =
    Math.max(
      MIN_CONTAINER_SIZE.height,
      toPositiveNumber(
        options.minHeight,
        MIN_CONTAINER_SIZE.height
      )
    );

  return {
    ...container,

    width:
      Math.max(
        minimumWidth,
        required.width
      ),

    height:
      Math.max(
        minimumHeight,
        required.height
      ),
  };
}


// =====================================================
// LAYOUT CHILD POSITIONING
// =====================================================
//
// Returns NEW child geometry.
//
// Does not mutate the original child.
// =====================================================

export function layoutChildren(
  children = [],
  options = {}
) {
  const layout =
    normaliseLayoutType(
      options.layout ??
      options.type ??
      "free"
    );

  const padding =
    Math.max(
      0,
      toFiniteNumber(
        options.padding,
        LAYOUT_DEFAULTS.padding
      )
    );

  const gap =
    Math.max(
      0,
      toFiniteNumber(
        options.gap,
        LAYOUT_DEFAULTS.gap
      )
    );

  const columns =
    Math.max(
      1,
      Math.floor(
        toPositiveNumber(
          options.columns,
          LAYOUT_DEFAULTS.columns
        )
      )
    );

  const ordered =
    sortChildren(children);

  // -----------------------------------------------
  // FREE
  // -----------------------------------------------

  if (layout === "free") {
    return ordered.map(
      child => ({
        ...child,
        ...normaliseGeometry(child),
        meta: {
          ...(child.meta || {}),
          layoutManaged: false,
        },
      })
    );
  }

  // -----------------------------------------------
  // HORIZONTAL
  // -----------------------------------------------

  if (layout === "horizontal") {
    let cursorX =
      padding;

    return ordered.map(
      child => {
        const geometry =
          normaliseGeometry(
            child
          );

        const result = {
          ...child,

          x: cursorX,

          y: padding,

          width:
            geometry.width,

          height:
            geometry.height,

          meta: {
            ...(child.meta || {}),
            layoutManaged: true,
          },
        };

        cursorX +=
          geometry.width +
          gap;

        return result;
      }
    );
  }

  // -----------------------------------------------
  // VERTICAL
  // -----------------------------------------------

  if (layout === "vertical") {
    let cursorY =
      padding;

    return ordered.map(
      child => {
        const geometry =
          normaliseGeometry(
            child
          );

        const result = {
          ...child,

          x: padding,

          y: cursorY,

          width:
            geometry.width,

          height:
            geometry.height,

          meta: {
            ...(child.meta || {}),
            layoutManaged: true,
          },
        };

        cursorY +=
          geometry.height +
          gap;

        return result;
      }
    );
  }

  // -----------------------------------------------
  // GRID
  // -----------------------------------------------

  const columnWidths =
    Array.from(
      {
        length: columns,
      },
      () => 0
    );

  const rowHeights = [];

  ordered.forEach(
    (
      child,
      index
    ) => {
      const geometry =
        normaliseGeometry(
          child
        );

      const column =
        index % columns;

      const row =
        Math.floor(
          index / columns
        );

      columnWidths[column] =
        Math.max(
          columnWidths[column],
          geometry.width
        );

      rowHeights[row] =
        Math.max(
          rowHeights[row] || 0,
          geometry.height
        );
    }
  );

  return ordered.map(
    (
      child,
      index
    ) => {
      const geometry =
        normaliseGeometry(
          child
        );

      const column =
        index % columns;

      const row =
        Math.floor(
          index / columns
        );

      let x =
        padding;

      for (
        let i = 0;
        i < column;
        i += 1
      ) {
        x +=
          columnWidths[i] +
          gap;
      }

      let y =
        padding;

      for (
        let i = 0;
        i < row;
        i += 1
      ) {
        y +=
          rowHeights[i] +
          gap;
      }

      return {
        ...child,

        x,

        y,

        width:
          geometry.width,

        height:
          geometry.height,

        meta: {
          ...(child.meta || {}),
          layoutManaged: true,
        },
      };
    }
  );
}


// =====================================================
// GEOMETRY VALIDATION
// =====================================================

export function validateGeometry(
  element,
  options = {}
) {
  const geometry =
    normaliseGeometry(
      element
    );

  const errors = [];

  if (
    geometry.width <= 0
  ) {
    errors.push(
      "width must be greater than zero"
    );
  }

  if (
    geometry.height <= 0
  ) {
    errors.push(
      "height must be greater than zero"
    );
  }

  if (
    !isFiniteNumber(
      geometry.x
    )
  ) {
    errors.push(
      "x must be finite"
    );
  }

  if (
    !isFiniteNumber(
      geometry.y
    )
  ) {
    errors.push(
      "y must be finite"
    );
  }

  if (
    options.parent
  ) {
    const parent =
      options.parent;

    if (
      !isLocalGeometryInsideParent(
        geometry,
        parent
      )
    ) {
      errors.push(
        "element exceeds parent bounds"
      );
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,

    geometry,
  };
}


// =====================================================
// NORMALISE COMPLETE ELEMENT
// =====================================================

export function normaliseElement(
  element,
  options = {}
) {
  if (
    !element ||
    typeof element !== "object"
  ) {
    return element;
  }

  let result =
    normaliseElementGeometry(
      element
    );

  if (
    options.parent &&
    options.clampToParent
  ) {
    result =
      clampGeometryToParent(
        result,
        options.parent,
        {
          padding:
            options.padding ?? 0,
        }
      );
  }

  if (
    options.topLevel
  ) {
    result =
      clampTopLevelGeometry(
        result,
        options.canvas ??
          CANVAS_DEFAULTS
      );
  }

  return result;
}


// =====================================================
// NORMALISE ELEMENT COLLECTION
// =====================================================

export function normaliseElements(
  elements = [],
  options = {}
) {
  if (
    !Array.isArray(elements)
  ) {
    return [];
  }

  const byId =
    new Map();

  elements.forEach(
    element => {
      if (
        !element ||
        !element.id
      ) {
        return;
      }

      if (
        byId.has(element.id)
      ) {
        return;
      }

      byId.set(
        element.id,
        element
      );
    }
  );

  const result =
    Array.from(
      byId.values()
    ).map(
      element =>
        normaliseElement(
          element,
          options
        )
    );

  return result;
}


// =====================================================
// CHILD LOOKUP
// =====================================================

export function getChildren(
  elements = [],
  parentId
) {
  return elements.filter(
    element =>
      element &&
      element.parentId ===
        parentId
  );
}


export function getTopLevelElements(
  elements = []
) {
  return elements.filter(
    element =>
      element &&
      (
        element.parentId ===
          null ||
        element.parentId ===
          undefined ||
        element.parentId === ""
      )
  );
}


// =====================================================
// PARENT LOOKUP
// =====================================================

export function getElementById(
  elements = [],
  id
) {
  if (!id) {
    return null;
  }

  return (
    elements.find(
      element =>
        element?.id === id
    ) || null
  );
}


export function getParent(
  elements = [],
  element
) {
  if (
    !element ||
    !element.parentId
  ) {
    return null;
  }

  return getElementById(
    elements,
    element.parentId
  );
}


// =====================================================
// ABSOLUTE GEOMETRY
// =====================================================
//
// Useful for collision detection and debugging.
//
// Returns geometry in canvas coordinates.
// =====================================================

export function getAbsoluteGeometry(
  elements = [],
  element
) {
  if (!element) {
    return null;
  }

  const visited =
    new Set();

  let current =
    element;

  let x =
    toFiniteNumber(
      current.x,
      0
    );

  let y =
    toFiniteNumber(
      current.y,
      0
    );

  while (
    current?.parentId
  ) {
    if (
      visited.has(
        current.id
      )
    ) {
      // Circular hierarchy.
      break;
    }

    visited.add(
      current.id
    );

    const parent =
      getElementById(
        elements,
        current.parentId
      );

    if (!parent) {
      break;
    }

    x +=
      toFiniteNumber(
        parent.x,
        0
      );

    y +=
      toFiniteNumber(
        parent.y,
        0
      );

    current =
      parent;
  }

  return {
    x,

    y,

    width:
      toPositiveNumber(
        element.width,
        GEOMETRY_DEFAULTS.width
      ),

    height:
      toPositiveNumber(
        element.height,
        GEOMETRY_DEFAULTS.height
      ),
  };
}


// =====================================================
// HIERARCHY VALIDATION
// =====================================================

export function hasCircularParentChain(
  elements = [],
  element
) {
  if (!element) {
    return false;
  }

  const visited =
    new Set();

  let current =
    element;

  while (
    current?.parentId
  ) {
    if (
      visited.has(
        current.id
      )
    ) {
      return true;
    }

    visited.add(
      current.id
    );

    current =
      getElementById(
        elements,
        current.parentId
      );

    if (!current) {
      return false;
    }
  }

  return false;
}


// =====================================================
// EXPORT BUNDLE
// =====================================================
//
// This is intentionally redundant with named exports.
// It makes the module convenient to consume from code
// that prefers a geometry namespace.
// =====================================================

const CanvasGeometry = {
  CANVAS_DEFAULTS,
  GEOMETRY_DEFAULTS,
  CONTAINER_DEFAULTS,
  CONTROL_PANEL_DEFAULTS,
  LAYOUT_DEFAULTS,
  MIN_SIZE,
  MIN_CONTAINER_SIZE,

  isFiniteNumber,
  toFiniteNumber,
  toPositiveNumber,
  clamp,

  normaliseLayoutType,
  normaliseLayoutConfig,

  normaliseGeometry,
  normaliseElementGeometry,

  getRect,
  rectFromGeometry,

  localToAbsolute,
  absoluteToLocal,

  getContentBounds,
  getChildBounds,

  isRectInside,
  isLocalGeometryInsideParent,

  clampGeometryToParent,
  clampTopLevelGeometry,

  rectanglesOverlap,
  findOverlaps,

  getChildOrder,
  sortChildren,

  getRequiredContentSize,
  autoSizeContainer,

  layoutChildren,

  validateGeometry,
  normaliseElement,
  normaliseElements,

  getChildren,
  getTopLevelElements,

  getElementById,
  getParent,

  getAbsoluteGeometry,

  hasCircularParentChain,
};

export default CanvasGeometry;