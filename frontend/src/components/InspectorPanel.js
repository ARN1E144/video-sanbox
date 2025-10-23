import React from "react";

export default function InspectorPanel({ element, onUpdate, onDelete }) {
  if (!element) return null;

  return (
    <div className="w-80 bg-panel border-l border-border p-4 flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Inspector</h3>

      {/* Label */}
      <div>
        <label className="block text-sm text-text-muted mb-1">Label</label>
        <input
          type="text"
          value={element.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
        />
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">X</label>
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: parseFloat(e.target.value) })}
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Y</label>
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: parseFloat(e.target.value) })}
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Width</label>
          <input
            type="number"
            value={element.width}
            onChange={(e) => onUpdate({ width: parseFloat(e.target.value) })}
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Height</label>
          <input
            type="number"
            value={element.height}
            onChange={(e) => onUpdate({ height: parseFloat(e.target.value) })}
            className="w-full px-2 py-1 rounded bg-surface border border-border text-text-primary"
          />
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="mt-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition"
      >
        🗑 Delete Element
      </button>
    </div>
  );
}
