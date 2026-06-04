import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function InspectorSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between py-2 text-sm font-semibold"
      >
        {title}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && <div className="space-y-2 pb-3">{children}</div>}
    </div>
  );
}