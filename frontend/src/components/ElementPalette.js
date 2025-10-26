// src/components/ElementPalette.js
import React, { useEffect, useState } from "react";

export default function ElementPalette({ onAdd }) {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    async function loadMeta() {
      const ctx = require.context("./elements", false, /\.meta\.json$/);
      const all = ctx.keys().map((key) => {
        const meta = ctx(key);
        return meta.default || meta;
      });
      setElements(all);
    }
    loadMeta();
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3 border-r border-border bg-panel w-52">
      <h3 className="text-sm font-semibold mb-2 text-text-primary">
        🧩 Elements
      </h3>
      {elements.map((el) => (
        <button
          key={el.name}
          onClick={() => onAdd(el)}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/10 text-sm transition"
        >
          <span>{el.icon}</span>
          <span>{el.name}</span>
        </button>
      ))}
    </div>
  );
}
