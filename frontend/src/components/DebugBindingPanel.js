// src/components/DebugBindingsPanel.js
import React, { useMemo } from "react";
import { useActionContext } from "../context/ActionContext";

export default function DebugBindingsPanel({ selectedId, role }) {
  const { bindings } = useActionContext();

  // Turn bindings object into a sorted list for display
  const entries = useMemo(() => {
    const all = Object.entries(bindings || {});
    // Optional: sort so it's stable
    all.sort(([a], [b]) => a.localeCompare(b));
    return all;
  }, [bindings]);

  if (!entries.length) {
    return (
      <div className="text-xs text-text-muted">
        No bindings yet – trigger an action to see data here.
      </div>
    );
  }

  return (
    <div className="text-xs text-left space-y-2 max-h-64 overflow-auto">
      {entries.map(([id, value]) => {
        const isSelected = id === selectedId;

        return (
          <div
            key={id}
            className={`p-2 rounded border border-border bg-panel/80 ${
              isSelected ? "border-accent bg-accent/10" : ""
            }`}
          >
            <div className="font-mono mb-1 break-all">
              <span className="opacity-70">id:</span> {id}
            </div>
            <pre className="text-[10px] leading-snug whitespace-pre-wrap break-words">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
