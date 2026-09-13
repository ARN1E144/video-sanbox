// =====================================================
// CONFO CANVAS LAYOUT ENGINE
// =====================================================
//
// Single layout orchestration layer for Confo.
//
// Responsibilities:
//
//   Project Tree
//        ↓
//   ProjectTreeLoader
//        ↓
//   CanvasLayoutEngine
//        ↓
//   CanvasGeometry
//        ↓
//   canonical canvas.elements
//
// IMPORTANT:
//
// This file decides WHERE elements should be positioned.
//
// CanvasGeometry.js decides HOW geometry is normalised,
// measured, clamped, converted and validated.
//
// Canvas.js should eventually become a renderer/editor,
// not a second layout engine.
//
// Layout policy:
//
//   ROOT / TOP LEVEL
//   ----------------
//   x/y are absolute canvas coordinates.
//
//   FREE CHILD
//   ----------
//   x/y are relative to the immediate parent.
//
//   VERTICAL CHILD
//   --------------
//   order + width/height + gap/padding determine position.
//
//   HORIZONTAL CHILD
//   ----------------
//   order + width/height + gap/padding determine position.
//
//   GRID CHILD
//   ----------
//   order + size + columns + gap/padding determine position.
//
// Managed layouts therefore do NOT treat child x/y as
// authoritative.
//
// =====================================================

import CanvasGeometry from "./CanvasGeometry";


// =====================================================
// DEFAULTS
// =====================================================

const DEFAULTS = {

  canvasWidth: 1440,

  canvasHeight: 900,

  rootGap: 24,

  padding: 16,

  gap: 12,

  gridColumns: 2,

  gridColumnGap: 12,

  gridRowGap: 12,

  minimumContainerWidth: 160,

  minimumContainerHeight: 80,

  minimumElementWidth: 20,

  minimumElementHeight: 20,

};


// =====================================================
// TYPE HELPERS
// =====================================================

function isFiniteNumber(
  value
) {

  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );

}


function toNumber(
  value,
  fallback = 0
) {

  const result =
    Number(value);


  return Number.isFinite(result)
    ? result
    : fallback;

}


function toPositiveNumber(
  value,
  fallback
) {

  const result =
    Number(value);


  return (
    Number.isFinite(result) &&
    result > 0
  )
    ? result
    : fallback;

}


function clamp(
  value,
  min,
  max
) {

  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );

}


// =====================================================
// LAYOUT NORMALISATION
// =====================================================
//
// CanvasGeometry may provide layout normalisation.
//
// However, the LayoutEngine must retain layout-specific
// properties such as:
//
//   columnGap
//   rowGap
//   fixedSize
//   columns
//
// rather than accidentally losing them.
//
// =====================================================

function normaliseLayout(
  layout
) {

  const base =
    CanvasGeometry.normaliseLayoutConfig
      ? CanvasGeometry.normaliseLayoutConfig(
          layout
        )
      : normaliseLayoutFallback(
          layout
        );


  const source =
    typeof layout === "object" &&
    layout !== null
      ? layout
      : {};


  return {

    ...base,

    ...source,

    type:
      normaliseLayoutType(
        source.type ??
        source.mode ??
        source.layout ??
        base?.type ??
        layout
      ),

    gap:
      toPositiveNumber(
        source.gap ??
        base?.gap,
        DEFAULTS.gap
      ),

    padding:
      toPositiveNumber(
        source.padding ??
        base?.padding,
        DEFAULTS.padding
      ),

    columns:
      Math.max(
        1,
        Math.round(
          toPositiveNumber(
            source.columns ??
            base?.columns,
            DEFAULTS.gridColumns
          )
        )
      ),

    columnGap:
      toPositiveNumber(
        source.columnGap ??
        base?.columnGap,
        DEFAULTS.gridColumnGap
      ),

    rowGap:
      toPositiveNumber(
        source.rowGap ??
        base?.rowGap,
        DEFAULTS.gridRowGap
      ),

    fixedSize:
      source.fixedSize === true ||
      base?.fixedSize === true,

  };

}


function normaliseLayoutFallback(
  layout
) {

  if (
    typeof layout === "string"
  ) {

    return {

      type:
        normaliseLayoutType(
          layout
        ),

      gap:
        DEFAULTS.gap,

      padding:
        DEFAULTS.padding,

      columns:
        DEFAULTS.gridColumns,

      columnGap:
        DEFAULTS.gridColumnGap,

      rowGap:
        DEFAULTS.gridRowGap,

      fixedSize:
        false,

    };

  }


  if (
    !layout ||
    typeof layout !== "object"
  ) {

    return {

      type: "free",

      gap:
        DEFAULTS.gap,

      padding:
        DEFAULTS.padding,

      columns:
        DEFAULTS.gridColumns,

      columnGap:
        DEFAULTS.gridColumnGap,

      rowGap:
        DEFAULTS.gridRowGap,

      fixedSize:
        false,

    };

  }


  return {

    ...layout,

    type:
      normaliseLayoutType(
        layout.type ??
        layout.mode ??
        layout.layout
      ),

    gap:
      toPositiveNumber(
        layout.gap,
        DEFAULTS.gap
      ),

    padding:
      toPositiveNumber(
        layout.padding,
        DEFAULTS.padding
      ),

    columns:
      Math.max(
        1,
        Math.round(
          toPositiveNumber(
            layout.columns,
            DEFAULTS.gridColumns
          )
        )
      ),

    columnGap:
      toPositiveNumber(
        layout.columnGap,
        DEFAULTS.gridColumnGap
      ),

    rowGap:
      toPositiveNumber(
        layout.rowGap,
        DEFAULTS.gridRowGap
      ),

    fixedSize:
      layout.fixedSize === true,

  };

}


function normaliseLayoutType(
  layout
) {

  const value =
    String(
      layout ??
      "free"
    )
      .trim()
      .toLowerCase();


  if (
    value === "row" ||
    value === "horizontal"
  ) {

    return "horizontal";

  }


  if (
    value === "column" ||
    value === "vertical"
  ) {

    return "vertical";

  }


  if (
    value === "grid"
  ) {

    return "grid";

  }


  return "free";

}


// =====================================================
// NODE / ELEMENT HELPERS
// =====================================================

function getNodeLayout(
  node
) {

  if (!node) {

    return normaliseLayout(
      "free"
    );

  }


  return normaliseLayout(

    node.props?.layout ??
    node.meta?.layout ??
    node.layout ??
    "free"

  );

}


function getElementLayout(
  element
) {

  if (!element) {

    return normaliseLayout(
      "free"
    );

  }


  return normaliseLayout(

    element.props?.layout ??
    element.meta?.layout ??
    "free"

  );

}


function getChildren(
  elements,
  parentId
) {

  return elements.filter(
    element =>
      element.parentId ===
      parentId
  );

}


function getTopLevelElements(
  elements
) {

  return elements.filter(
    element =>
      !element.parentId
  );

}


function getElementId(
  element
) {

  return element?.id ??
    null;

}


// =====================================================
// SIZE RESOLUTION
// =====================================================

function resolveSize(
  node,
  fallbackWidth,
  fallbackHeight
) {

  const width =
    toPositiveNumber(
      node?.width ??
      node?.props?.width ??
      node?.meta?.width,
      fallbackWidth
    );


  const height =
    toPositiveNumber(
      node?.height ??
      node?.props?.height ??
      node?.meta?.height,
      fallbackHeight
    );


  return {

    width,

    height,

  };

}


function resolveElementSize(
  element,
  fallbackWidth,
  fallbackHeight
) {

  return {

    width:
      toPositiveNumber(
        element?.width,
        fallbackWidth
      ),

    height:
      toPositiveNumber(
        element?.height,
        fallbackHeight
      ),

  };

}


// =====================================================
// EXPLICIT POSITION
// =====================================================

function resolveExplicitPosition(
  node,
  fallbackX = 0,
  fallbackY = 0
) {

  return {

    x:
      isFiniteNumber(
        node?.x
      )
        ? node.x
        : fallbackX,

    y:
      isFiniteNumber(
        node?.y
      )
        ? node.y
        : fallbackY,

  };

}


// =====================================================
// ELEMENT NORMALISATION
// =====================================================

function normaliseElement(
  element
) {

  if (!element) {

    return null;

  }


  if (
    CanvasGeometry.normaliseElement
  ) {

    return CanvasGeometry.normaliseElement(
      element
    );

  }


  return {

    ...element,

    x:
      toNumber(
        element.x,
        0
      ),

    y:
      toNumber(
        element.y,
        0
      ),

    width:
      toPositiveNumber(
        element.width,
        DEFAULTS.minimumElementWidth
      ),

    height:
      toPositiveNumber(
        element.height,
        DEFAULTS.minimumElementHeight
      ),

  };

}


function normaliseElements(
  elements
) {

  if (
    !Array.isArray(
      elements
    )
  ) {

    return [];

  }


  return elements
    .filter(Boolean)
    .map(
      normaliseElement
    );

}


// =====================================================
// CONTAINER DETECTION
// =====================================================

function isContainer(
  element
) {

  if (!element) {

    return false;

  }


  return (

    element.type ===
      "Container" ||

    element.type ===
      "ControlPanel" ||

    element.meta?.isContainer ===
      true ||

    element.props?.isContainer ===
      true

  );

}


// =====================================================
// AUTO SIZE
// =====================================================

function shouldAutoSizeContainer(
  element
) {

  if (!element) {

    return false;

  }


  const layout =
    getElementLayout(
      element
    );


  if (
    layout.type ===
    "free"
  ) {

    return false;

  }


  if (
    element.props?.fixedSize ===
      true ||

    element.meta?.fixedSize ===
      true ||

    layout.fixedSize ===
      true
  ) {

    return false;

  }


  return true;

}


function autoSizeContainer(
  container,
  children
) {

  if (
    !container ||
    !children.length ||
    !shouldAutoSizeContainer(
      container
    )
  ) {

    return container;

  }


  const layout =
    getElementLayout(
      container
    );


  const padding =
    toPositiveNumber(
      layout.padding,
      DEFAULTS.padding
    );


  const gap =
    toPositiveNumber(
      layout.gap,
      DEFAULTS.gap
    );


  const currentWidth =
    toPositiveNumber(
      container.width,
      DEFAULTS.minimumContainerWidth
    );


  const currentHeight =
    toPositiveNumber(
      container.height,
      DEFAULTS.minimumContainerHeight
    );


  let requiredWidth =
    currentWidth;


  let requiredHeight =
    currentHeight;


  // ---------------------------------------------------
  // HORIZONTAL
  // ---------------------------------------------------

  if (
    layout.type ===
    "horizontal"
  ) {

    const totalWidth =
      children.reduce(
        (
          total,
          child
        ) =>
          total +
          toPositiveNumber(
            child.width,
            DEFAULTS.minimumElementWidth
          ),
        0
      );


    const totalGap =
      Math.max(
        0,
        children.length - 1
      ) * gap;


    requiredWidth =
      Math.max(
        currentWidth,
        padding * 2 +
        totalWidth +
        totalGap
      );


    const maxHeight =
      children.reduce(
        (
          max,
          child
        ) =>
          Math.max(
            max,
            toPositiveNumber(
              child.height,
              DEFAULTS.minimumElementHeight
            )
          ),
        0
      );


    requiredHeight =
      Math.max(
        currentHeight,
        padding * 2 +
        maxHeight
      );

  }


  // ---------------------------------------------------
  // VERTICAL
  // ---------------------------------------------------

  if (
    layout.type ===
    "vertical"
  ) {

    const maxWidth =
      children.reduce(
        (
          max,
          child
        ) =>
          Math.max(
            max,
            toPositiveNumber(
              child.width,
              DEFAULTS.minimumElementWidth
            )
          ),
        0
      );


    const totalHeight =
      children.reduce(
        (
          total,
          child
        ) =>
          total +
          toPositiveNumber(
            child.height,
            DEFAULTS.minimumElementHeight
          ),
        0
      );


    const totalGap =
      Math.max(
        0,
        children.length - 1
      ) * gap;


    requiredWidth =
      Math.max(
        currentWidth,
        padding * 2 +
        maxWidth
      );


    requiredHeight =
      Math.max(
        currentHeight,
        padding * 2 +
        totalHeight +
        totalGap
      );

  }


  // ---------------------------------------------------
  // GRID
  // ---------------------------------------------------

  if (
    layout.type ===
    "grid"
  ) {

    const columns =
      Math.max(
        1,
        Math.round(
          toPositiveNumber(
            layout.columns,
            DEFAULTS.gridColumns
          )
        )
      );


    const rows =
      Math.ceil(
        children.length /
        columns
      );


    const columnWidths =
      [];


    const rowHeights =
      [];


    for (
      let column = 0;
      column < columns;
      column += 1
    ) {

      const columnChildren =
        children.filter(
          (
            child,
            index
          ) =>
            index % columns ===
            column
        );


      columnWidths[column] =
        columnChildren.reduce(
          (
            max,
            child
          ) =>
            Math.max(
              max,
              toPositiveNumber(
                child.width,
                DEFAULTS.minimumElementWidth
              )
            ),
          0
        );

    }


    for (
      let row = 0;
      row < rows;
      row += 1
    ) {

      const rowChildren =
        children.slice(
          row * columns,
          row * columns +
            columns
        );


      rowHeights[row] =
        rowChildren.reduce(
          (
            max,
            child
          ) =>
            Math.max(
              max,
              toPositiveNumber(
                child.height,
                DEFAULTS.minimumElementHeight
              )
            ),
          0
        );

    }


    const totalWidth =
      columnWidths.reduce(
        (
          total,
          width
        ) =>
          total + width,
        0
      );


    const totalHeight =
      rowHeights.reduce(
        (
          total,
          height
        ) =>
          total + height,
        0
      );


    requiredWidth =
      Math.max(
        currentWidth,
        padding * 2 +
        totalWidth +
        Math.max(
          0,
          columns - 1
        ) *
        toPositiveNumber(
          layout.columnGap,
          DEFAULTS.gridColumnGap
        )
      );


    requiredHeight =
      Math.max(
        currentHeight,
        padding * 2 +
        totalHeight +
        Math.max(
          0,
          rows - 1
        ) *
        toPositiveNumber(
          layout.rowGap,
          DEFAULTS.gridRowGap
        )
      );

  }


  return {

    ...container,

    width:
      Math.max(
        requiredWidth,
        DEFAULTS.minimumContainerWidth
      ),

    height:
      Math.max(
        requiredHeight,
        DEFAULTS.minimumContainerHeight
      ),

  };

}


// =====================================================
// FREE LAYOUT
// =====================================================

function layoutFreeChildren(
  parent,
  children
) {

  return children.map(
    child => {

      const x =
        isFiniteNumber(
          child.x
        )
          ? child.x
          : DEFAULTS.padding;


      const y =
        isFiniteNumber(
          child.y
        )
          ? child.y
          : DEFAULTS.padding;


      return {

        ...child,

        x,

        y,

        meta: {

          ...(child.meta || {}),

          layoutManaged:
            false,

        },

      };

    }
  );

}


// =====================================================
// VERTICAL LAYOUT
// =====================================================

function layoutVerticalChildren(
  parent,
  children,
  layout
) {

  const padding =
    toPositiveNumber(
      layout.padding,
      DEFAULTS.padding
    );


  const gap =
    toPositiveNumber(
      layout.gap,
      DEFAULTS.gap
    );


  let cursorY =
    padding;


  return children.map(
    child => {

      const width =
        toPositiveNumber(
          child.width,
          DEFAULTS.minimumElementWidth
        );


      const height =
        toPositiveNumber(
          child.height,
          DEFAULTS.minimumElementHeight
        );


      const next = {

        ...child,

        x:
          padding,

        y:
          cursorY,

        width,

        height,

        meta: {

          ...(child.meta || {}),

          layoutManaged:
            true,

          layoutParent:
            parent.id,

          layoutType:
            "vertical",

        },

      };


      cursorY +=
        height +
        gap;


      return next;

    }
  );

}


// =====================================================
// HORIZONTAL LAYOUT
// =====================================================

function layoutHorizontalChildren(
  parent,
  children,
  layout
) {

  const padding =
    toPositiveNumber(
      layout.padding,
      DEFAULTS.padding
    );


  const gap =
    toPositiveNumber(
      layout.gap,
      DEFAULTS.gap
    );


  let cursorX =
    padding;


  return children.map(
    child => {

      const width =
        toPositiveNumber(
          child.width,
          DEFAULTS.minimumElementWidth
        );


      const height =
        toPositiveNumber(
          child.height,
          DEFAULTS.minimumElementHeight
        );


      const next = {

        ...child,

        x:
          cursorX,

        y:
          padding,

        width,

        height,

        meta: {

          ...(child.meta || {}),

          layoutManaged:
            true,

          layoutParent:
            parent.id,

          layoutType:
            "horizontal",

        },

      };


      cursorX +=
        width +
        gap;


      return next;

    }
  );

}


// =====================================================
// GRID LAYOUT
// =====================================================

function layoutGridChildren(
  parent,
  children,
  layout
) {

  const padding =
    toPositiveNumber(
      layout.padding,
      DEFAULTS.padding
    );


  const columns =
    Math.max(
      1,
      Math.round(
        toPositiveNumber(
          layout.columns,
          DEFAULTS.gridColumns
        )
      )
    );


  const columnGap =
    toPositiveNumber(
      layout.columnGap,
      DEFAULTS.gridColumnGap
    );


  const rowGap =
    toPositiveNumber(
      layout.rowGap,
      DEFAULTS.gridRowGap
    );


  const columnWidths =
    [];


  for (
    let column = 0;
    column < columns;
    column += 1
  ) {

    const columnChildren =
      children.filter(
        (
          child,
          index
        ) =>
          index % columns ===
          column
      );


    columnWidths[column] =
      columnChildren.reduce(
        (
          max,
          child
        ) =>
          Math.max(
            max,
            toPositiveNumber(
              child.width,
              DEFAULTS.minimumElementWidth
            )
          ),
        0
      );

  }


  const rowHeights =
    [];


  const rows =
    Math.ceil(
      children.length /
      columns
    );


  for (
    let row = 0;
    row < rows;
    row += 1
  ) {

    const rowChildren =
      children.slice(
        row * columns,
        row * columns +
          columns
      );


    rowHeights[row] =
      rowChildren.reduce(
        (
          max,
          child
        ) =>
          Math.max(
            max,
            toPositiveNumber(
              child.height,
              DEFAULTS.minimumElementHeight
            )
          ),
        0
      );

  }


  return children.map(
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


      let x =
        padding;


      for (
        let currentColumn = 0;
        currentColumn < column;
        currentColumn += 1
      ) {

        x +=
          columnWidths[
            currentColumn
          ] +
          columnGap;

      }


      let y =
        padding;


      for (
        let currentRow = 0;
        currentRow < row;
        currentRow += 1
      ) {

        y +=
          rowHeights[
            currentRow
          ] +
          rowGap;

      }


      return {

        ...child,

        x,

        y,

        meta: {

          ...(child.meta || {}),

          layoutManaged:
            true,

          layoutParent:
            parent.id,

          layoutType:
            "grid",

          gridRow:
            row,

          gridColumn:
            column,

        },

      };

    }
  );

}


// =====================================================
// LAYOUT CHILDREN
// =====================================================

function layoutChildren(
  parent,
  children
) {

  if (
    !parent ||
    !children.length
  ) {

    return children;

  }


  const layout =
    getElementLayout(
      parent
    );


  switch (
    layout.type
  ) {

    case "vertical":

      return layoutVerticalChildren(
        parent,
        children,
        layout
      );


    case "horizontal":

      return layoutHorizontalChildren(
        parent,
        children,
        layout
      );


    case "grid":

      return layoutGridChildren(
        parent,
        children,
        layout
      );


    case "free":

    default:

      return layoutFreeChildren(
        parent,
        children
      );

  }

}


// =====================================================
// TOP LEVEL NORMALISATION
// =====================================================

function normaliseTopLevelElement(
  element,
  canvasWidth,
  canvasHeight
) {

  if (!element) {

    return null;

  }


  const width =
    toPositiveNumber(
      element.width,
      DEFAULTS.minimumElementWidth
    );


  const height =
    toPositiveNumber(
      element.height,
      DEFAULTS.minimumElementHeight
    );


  let x =
    isFiniteNumber(
      element.x
    )
      ? element.x
      : 0;


  let y =
    isFiniteNumber(
      element.y
    )
      ? element.y
      : 0;


  const maxX =
    Math.max(
      0,
      canvasWidth -
      width
    );


  const maxY =
    Math.max(
      0,
      canvasHeight -
      height
    );


  x =
    clamp(
      x,
      0,
      maxX
    );


  y =
    clamp(
      y,
      0,
      maxY
    );


  return {

    ...element,

    x,

    y,

    width,

    height,

    meta: {

      ...(element.meta || {}),

      layoutManaged:
        false,

    },

  };

}


// =====================================================
// CHILD CONTAINMENT
// =====================================================

function clampChildToParent(
  parent,
  child
) {

  if (
    !parent ||
    !child
  ) {

    return child;

  }


  const layout =
    getElementLayout(
      parent
    );


  // Managed layouts already calculate coordinates.

  if (
    layout.type !==
    "free"
  ) {

    return child;

  }


  const padding =
    toPositiveNumber(
      layout.padding,
      0
    );


  const parentWidth =
    toPositiveNumber(
      parent.width,
      DEFAULTS.minimumContainerWidth
    );


  const parentHeight =
    toPositiveNumber(
      parent.height,
      DEFAULTS.minimumContainerHeight
    );


  const width =
    toPositiveNumber(
      child.width,
      DEFAULTS.minimumElementWidth
    );


  const height =
    toPositiveNumber(
      child.height,
      DEFAULTS.minimumElementHeight
    );


  const maxX =
    Math.max(
      padding,
      parentWidth -
      padding -
      width
    );


  const maxY =
    Math.max(
      padding,
      parentHeight -
      padding -
      height
    );


  return {

    ...child,

    x:
      clamp(
        toNumber(
          child.x,
          padding
        ),
        padding,
        maxX
      ),

    y:
      clamp(
        toNumber(
          child.y,
          padding
        ),
        padding,
        maxY
      ),

  };

}


// =====================================================
// RECURSIVE CONTAINER LAYOUT
// =====================================================

function layoutContainerTree(
  parent,
  allElements
) {

  const directChildren =
    getChildren(
      allElements,
      parent.id
    );


  if (
    !directChildren.length
  ) {

    return allElements;

  }


  let workingElements =
    allElements;


  // ---------------------------------------------------
  // Process nested containers first.
  // ---------------------------------------------------

  for (
    const child of directChildren
  ) {

    if (
      isContainer(
        child
      )
    ) {

      workingElements =
        layoutContainerTree(
          child,
          workingElements
        );

    }

  }


  // ---------------------------------------------------
  // Re-read children after nested layout.
  // ---------------------------------------------------

  let children =
    getChildren(
      workingElements,
      parent.id
    );


  // ---------------------------------------------------
  // Auto-size parent.
  // ---------------------------------------------------

  const resizedParent =
    autoSizeContainer(
      parent,
      children
    );


  if (
    resizedParent.width !==
      parent.width ||

    resizedParent.height !==
      parent.height
  ) {

    workingElements =
      workingElements.map(
        element =>
          element.id ===
            parent.id
            ? resizedParent
            : element
      );


    parent =
      resizedParent;

  }


  // ---------------------------------------------------
  // Apply layout.
  // ---------------------------------------------------

  children =
    layoutChildren(
      parent,
      children
    );


  // ---------------------------------------------------
  // Free-layout containment.
  // ---------------------------------------------------

  children =
    children.map(
      child =>
        clampChildToParent(
          parent,
          child
        )
    );


  // ---------------------------------------------------
  // Write children back.
  // ---------------------------------------------------

  const childMap =
    new Map(
      children.map(
        child => [
          child.id,
          child,
        ]
      )
    );


  workingElements =
    workingElements.map(
      element =>
        childMap.has(
          element.id
        )
          ? childMap.get(
              element.id
            )
          : element
    );


  return workingElements;

}


// =====================================================
// ROOT LAYOUT
// =====================================================

function layoutRootElements(
  elements,
  rootLayout,
  canvasWidth,
  canvasHeight
) {

  const topLevel =
    getTopLevelElements(
      elements
    );


  if (
    !topLevel.length
  ) {

    return elements;

  }


  const layout =
    normaliseLayout(
      rootLayout
    );


  // ---------------------------------------------------
  // FREE ROOT
  // ---------------------------------------------------

  if (
    layout.type ===
    "free"
  ) {

    return elements.map(
      element => {

        if (
          !element.parentId
        ) {

          return normaliseTopLevelElement(
            element,
            canvasWidth,
            canvasHeight
          );

        }


        return element;

      }
    );

  }


  // ---------------------------------------------------
  // Managed logical App root.
  // ---------------------------------------------------

  const logicalRoot = {

    id:
      "__confo_root__",

    type:
      "Container",

    width:
      canvasWidth,

    height:
      canvasHeight,

    props: {

      layout,

    },

    meta: {

      layout,

    },

  };


  const positioned =
    layoutChildren(
      logicalRoot,
      topLevel
    );


  const positionedMap =
    new Map(
      positioned.map(
        element => [
          element.id,
          element,
        ]
      )
    );


  return elements.map(
    element => {

      if (
        positionedMap.has(
          element.id
        )
      ) {

        return normaliseTopLevelElement(
          positionedMap.get(
            element.id
          ),
          canvasWidth,
          canvasHeight
        );

      }


      return element;

    }
  );

}


// =====================================================
// OVERLAP DETECTION
// =====================================================
//
// CanvasGeometry.findOverlaps() operates on:
//
//   findOverlaps(element, siblings)
//
// NOT:
//
//   findOverlaps(elements)
//
// Therefore we group siblings by parentId and call the
// Geometry API correctly.
//
// =====================================================

function detectOverlaps(
  elements
) {

  if (
    !Array.isArray(
      elements
    ) ||
    !CanvasGeometry.findOverlaps
  ) {

    return [];

  }


  const overlaps =
    [];


  const seenPairs =
    new Set();


  const groups =
    new Map();


  elements.forEach(
    element => {

      const parentId =
        element.parentId ??
        "__root__";


      if (
        !groups.has(
          parentId
        )
      ) {

        groups.set(
          parentId,
          []
        );

      }


      groups.get(
        parentId
      ).push(
        element
      );

    }
  );


  groups.forEach(
    siblings => {

      siblings.forEach(
        element => {

          const result =
            CanvasGeometry.findOverlaps(
              element,
              siblings
            );


          if (
            !Array.isArray(
              result
            )
          ) {

            return;

          }


          result.forEach(
            overlap => {

              const otherId =
                overlap?.id ??
                overlap?.elementId ??
                overlap?.otherId ??
                overlap?.other?.id ??
                null;


              if (
                !otherId ||
                otherId ===
                  element.id
              ) {

                return;

              }


              const key =
                [
                  element.id,
                  otherId,
                ]
                  .sort()
                  .join(
                    "::"
                  );


              if (
                seenPairs.has(
                  key
                )
              ) {

                return;

              }


              seenPairs.add(
                key
              );


              overlaps.push(
                {

                  elementId:
                    element.id,

                  otherId,

                  parentId:
                    element.parentId ??
                    null,

                  detail:
                    overlap,

                }
              );

            }
          );

        }
      );

    }
  );


  return overlaps;

}


// =====================================================
// GEOMETRY VALIDATION
// =====================================================
//
// IMPORTANT:
//
// CanvasGeometry.validateGeometry() validates ONE
// element and returns a validation object.
//
// It must NEVER replace the elements array.
//
// This function therefore performs diagnostics over
// every element individually.
//
// Geometry normalisation itself has already happened
// through normaliseElements().
//
// =====================================================

function validateGeometry(
  elements,
  options = {}
) {

  if (
    !Array.isArray(
      elements
    )
  ) {

    return [];

  }


  if (
    !CanvasGeometry.validateGeometry
  ) {

    return [];

  }


  return elements.map(
    element => {

      const result =
        CanvasGeometry.validateGeometry(
          element,
          options
        );


      return {

        id:
          element.id,

        valid:
          result?.valid !==
          false,

        errors:
          Array.isArray(
            result?.errors
          )
            ? result.errors
            : [],

        geometry:
          result?.geometry ??
          null,

      };

    }
  );

}


// =====================================================
// HIERARCHY VALIDATION
// =====================================================

function validateHierarchy(
  elements
) {

  const byId =
    new Map(
      elements.map(
        element => [
          element.id,
          element,
        ]
      )
    );


  return elements.map(
    element => {

      if (
        !element.parentId
      ) {

        return element;

      }


      if (
        element.parentId ===
        element.id
      ) {

        return {

          ...element,

          parentId:
            null,

        };

      }


      if (
        !byId.has(
          element.parentId
        )
      ) {

        return {

          ...element,

          parentId:
            null,

        };

      }


      return element;

    }
  );

}


// =====================================================
// CIRCULAR HIERARCHY REPAIR
// =====================================================

function repairCircularHierarchy(
  elements
) {

  const byId =
    new Map(
      elements.map(
        element => [
          element.id,
          element,
        ]
      )
    );


  return elements.map(
    element => {

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

          return {

            ...element,

            parentId:
              null,

          };

        }


        visited.add(
          current.id
        );


        const parent =
          byId.get(
            current.parentId
          );


        if (
          !parent
        ) {

          return {

            ...element,

            parentId:
              null,

          };

        }


        if (
          parent.id ===
          element.id
        ) {

          return {

            ...element,

            parentId:
              null,

          };

        }


        current =
          parent;

      }


      return element;

    }
  );

}


// =====================================================
// MAIN LAYOUT PIPELINE
// =====================================================

function layoutElements(
  inputElements,
  options = {}
) {

  const canvasWidth =
    toPositiveNumber(
      options.canvasWidth,
      DEFAULTS.canvasWidth
    );


  const canvasHeight =
    toPositiveNumber(
      options.canvasHeight,
      DEFAULTS.canvasHeight
    );


  const rootLayout =
    options.rootLayout ??
    options.layout ??
    "free";


  // ---------------------------------------------------
  // 1. Normalise input.
  // ---------------------------------------------------

  let elements =
    normaliseElements(
      Array.isArray(
        inputElements
      )
        ? inputElements
        : []
    );


  // ---------------------------------------------------
  // 2. Repair hierarchy.
  // ---------------------------------------------------

  elements =
    validateHierarchy(
      elements
    );


  elements =
    repairCircularHierarchy(
      elements
    );


  // ---------------------------------------------------
  // 3. Layout nested containers.
  // ---------------------------------------------------

  const containers =
    elements.filter(
      isContainer
    );


  for (
    const container of containers
  ) {

    elements =
      layoutContainerTree(
        container,
        elements
      );

  }


  // ---------------------------------------------------
  // 4. Layout root.
  // ---------------------------------------------------

  elements =
    layoutRootElements(
      elements,
      rootLayout,
      canvasWidth,
      canvasHeight
    );


  // ---------------------------------------------------
  // 5. Final geometry normalisation.
  // ---------------------------------------------------

  elements =
    normaliseElements(
      elements
    );


  // ---------------------------------------------------
  // 6. Geometry validation.
  //
  // IMPORTANT:
  //
  // This is diagnostics only.
  //
  // The elements array remains an array.
  // ---------------------------------------------------

  const validation =
    validateGeometry(
      elements,
      {

        canvasWidth,

        canvasHeight,

      }
    );


  // ---------------------------------------------------
  // 7. Overlap diagnostics.
  // ---------------------------------------------------

  const overlaps =
    detectOverlaps(
      elements
    );


  // ---------------------------------------------------
  // 8. Return canonical layout result.
  // ---------------------------------------------------

  return {

    elements,

    overlaps,

    validation,

    canvas: {

      width:
        canvasWidth,

      height:
        canvasHeight,

    },

  };

}


// =====================================================
// PROJECT ELEMENT LAYOUT
// =====================================================
//
// ProjectTreeLoader calls this function.
//
// It intentionally returns:
//
// {
//   elements,
//   overlaps,
//   validation,
//   canvas
// }
//
// =====================================================

function layoutProjectElements(
  elements,
  options = {}
) {

  return layoutElements(
    elements,
    options
  );

}


// =====================================================
// SINGLE ELEMENT RELAYOUT
// =====================================================

function relayoutParent(
  elements,
  parentId,
  options = {}
) {

  const parent =
    elements.find(
      element =>
        element.id ===
        parentId
    );


  if (!parent) {

    return layoutElements(
      elements,
      options
    );

  }


  return layoutContainerTree(
    parent,
    elements
  );

}


// =====================================================
// PREVIEW LAYOUT
// =====================================================

function previewLayout(
  elements,
  options = {}
) {

  return layoutElements(
    elements,
    options
  );

}


// =====================================================
// CANONICAL COMMIT LAYOUT
// =====================================================

function commitLayout(
  elements,
  options = {}
) {

  const result =
    layoutElements(
      elements,
      options
    );


  return {

    ...result,

    elements:
      result.elements.map(
        element => ({

          ...element,

          meta: {

            ...(element.meta || {}),

            geometryVersion:
              1,

          },

        })
      ),

  };

}


// =====================================================
// PUBLIC API
// =====================================================

const CanvasLayoutEngine = {

  // Main pipeline

  layoutElements,

  layoutProjectElements,


  // Editing / targeted layout

  relayoutParent,


  // Preview / commit

  previewLayout,

  commitLayout,


  // Individual layout helpers

  layoutChildren,

  layoutFreeChildren,

  layoutVerticalChildren,

  layoutHorizontalChildren,

  layoutGridChildren,


  // Container sizing

  autoSizeContainer,


  // Validation

  validateHierarchy,

  repairCircularHierarchy,


  // Diagnostics

  detectOverlaps,


  // Helpers

  getNodeLayout,

  getElementLayout,

  getChildren,

  getTopLevelElements,

  resolveSize,

  resolveElementSize,

  resolveExplicitPosition,


  // Constants

  DEFAULTS,

};


// =====================================================
// NAMED EXPORTS
// =====================================================

export {

  CanvasLayoutEngine,

  layoutElements,

  layoutProjectElements,

  relayoutParent,

  previewLayout,

  commitLayout,

  layoutChildren,

  layoutFreeChildren,

  layoutVerticalChildren,

  layoutHorizontalChildren,

  layoutGridChildren,

  autoSizeContainer,

  validateHierarchy,

  repairCircularHierarchy,

  detectOverlaps,

  getNodeLayout,

  getElementLayout,

  getChildren,

  getTopLevelElements,

  resolveSize,

  resolveElementSize,

  resolveExplicitPosition,

  DEFAULTS,

};


export default CanvasLayoutEngine;