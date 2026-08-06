// src/components/ElementPalette.js
import React, { useEffect, useState } from "react";
import { useRuntimeAuth } from "../context/RuntimeAuthContext";

export default function ElementPalette({ onAdd }) {

  const {
  role,
  allowedElements,
  canBuild
} = useRuntimeAuth();

  const [elements, setElements] = useState([]);

  useEffect(() => {
    async function loadMeta() {
      const ctx = require.context("./elements", false, /\.meta\.json$/);
      const all = ctx.keys().map((key) => {
      const meta = ctx(key);
      console.log("[ELEMENTS] CTX KEYS", ctx.keys());
      return meta.default || meta;
    });

     const permitted = all.filter(el =>
  allowedElements.includes(el.name)
);


console.log(
  "[ELEMENT PALETTE]",
  {
    role: role,
    allowedElements,
    available: all.map(e => e.name),
    permitted: permitted.map(e => e.name)
  }
);


setElements(permitted);
    }
    loadMeta();
  }, [allowedElements]);

  if (!canBuild) {
  return (
    <div className="p-3 text-sm text-gray-400">
      Builder access required
    </div>
  );
}

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
