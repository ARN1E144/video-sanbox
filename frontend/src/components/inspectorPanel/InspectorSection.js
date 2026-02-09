import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function InspectorSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-2 text-sm font-semibold text-text-primary hover:text-accent transition"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown size={16} className="text-text-muted" />
        ) : (
          <ChevronRight size={16} className="text-text-muted" />
        )}
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {open && <div className="pb-3 space-y-3">{children}</div>}
      </div>
    </div>
  );
}
