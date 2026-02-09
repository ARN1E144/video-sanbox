// src/components/InspectorShell.js
import React from "react";
import { Move, Dock } from "lucide-react";

export default function InspectorShell({
  layout,
  position,
  setPosition,
  toggleDock,
  toggleOpen,
  children,
}) {
  const isFloating = layout === "floating";

  const baseStyle = isFloating
    ? {
        position: "absolute",
        left: position?.x ?? 100,
        top: position?.y ?? 100,
        width: 320,
        maxHeight: "70vh",
        zIndex: 2000,
      }
    : {
        width: "100%",
        maxHeight: "40vh",
      };

  return (
    <div
      className="bg-panel border border-border rounded-lg shadow-xl flex flex-col"
      style={baseStyle}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border text-xs font-semibold cursor-default"
        onMouseDown={isFloating ? (e) => e.stopPropagation() : undefined}
      >
        <span>Inspector</span>

        <div className="flex items-center gap-2">
          {toggleDock && (
            <button
              onClick={toggleDock}
              className="p-1 rounded hover:bg-accent/10"
              title={isFloating ? "Dock" : "Undock"}
            >
              <Dock size={14} />
            </button>
          )}
          <button
            onClick={toggleOpen}
            className="text-text-muted hover:text-accent"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto p-3">
        {children}
      </div>
    </div>
  );
}
