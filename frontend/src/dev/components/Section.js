import React, { useState } from "react";

export default function Section({
  title,
  children,
  defaultOpen = true,
}) {

  const [open, setOpen] = useState(defaultOpen);


  return (
    <div
      style={{
        marginBottom: 12,
        borderBottom: "1px solid #333",
        paddingBottom: 12,
      }}
    >

      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: open ? 10 : 0,
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >

        <span>
          {open ? "▼" : "▶"}
        </span>

        <span>
          {title}
        </span>

      </div>


      {
        open &&
        (
          <div>
            {children}
          </div>
        )
      }


    </div>
  );

}