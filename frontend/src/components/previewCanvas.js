import React from "react";
import COMPONENTS from "../components/elements/registry";
import { useCanvasState } from "../context/CanvasContext";
import { useProjectContext } from "../context/ProjectContext";

export default function PreviewCanvas({ role }) {
  const { elements } = useCanvasState();
  const { projectType } = useProjectContext();

  const visibleElements = elements.filter((el) => {
    if (projectType === "single") return true;
    return el.role === role;
  });

  return (
    <div className="relative border border-border rounded-xl overflow-hidden w-full h-[500px]">
      {visibleElements.map((el) => {
        const Comp = COMPONENTS[el.type];
        if (!Comp) return null;

        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
            }}
          >
            <Comp id={el.id} {...el.props} />
          </div>
        );
      })}
    </div>
  );
}