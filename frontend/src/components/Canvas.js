import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { COMPONENTS } from "../components/elements/registry";
import InspectorPanel from "./InspectorPanel";

const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

export default function Canvas() {
  const [device, setDevice] = useState("desktop");
  const [scale, setScale] = useState(0.75);
  const [elements, setElements] = useState([
    {
      id: "el1",
      type: "VideoFeed",
      x: 100,
      y: 100,
      width: 400,
      height: 225,
      props: { label: "🎥 Host Camera" },
    },
  ]);
  const [selectedId, setSelectedId] = useState(null);

  const deviceSize = DEVICE_SIZES[device];

  const updateElement = (id, updates) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  return (
    <div className="flex w-full gap-6">
      {/* Main Editor Column */}
      <div className="flex flex-col flex-1 items-center">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={device}
            onChange={e => setDevice(e.target.value)}
            className="bg-panel text-text-primary border border-border rounded-lg px-3 py-1"
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>

          <label className="text-text-primary">
            Zoom:
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="ml-2"
            />
            <span className="ml-2">{Math.round(scale * 100)}%</span>
          </label>
        </div>

        {/* Canvas */}
        <div
          className="relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-md"
          style={{
            width: deviceSize.width * scale,
            height: deviceSize.height * scale,
            transformOrigin: "top left",
          }}
        >
          {elements.map(el => {
            const ElementComp = COMPONENTS[el.type];
            if (!ElementComp) return null;

            return (
              <Rnd
                key={el.id}
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                onClick={() => setSelectedId(el.id)}
                onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) =>
                  updateElement(el.id, {
                    width: parseFloat(ref.style.width),
                    height: parseFloat(ref.style.height),
                    ...position,
                  })
                }
                bounds="parent"
                scale={scale}
                className={`group rounded-lg cursor-move border-2 ${
                  selectedId === el.id
                    ? "border-purple-500"
                    : "border-gray-600 hover:border-purple-400"
                }`}
              >
                <ElementComp {...el.props} />
              </Rnd>
            );
          })}
        </div>
      </div>

      {/* Inspector Panel */}
      <InspectorPanel
        element={elements.find(el => el.id === selectedId)}
        onUpdate={updates => updateElement(selectedId, updates)}
        onDelete={() =>
          setElements(prev => prev.filter(el => el.id !== selectedId))
        }
      />
    </div>
  );
}
