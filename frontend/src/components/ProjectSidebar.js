import React from "react";

export default function ProjectSidebar({ projects, onLoad, onDelete, activeProjectId }) {
  return (
    <div className="w-64 bg-panel border-r border-border p-4 h-full overflow-y-auto text-text-primary">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📁 Projects
      </h3>

      {projects.length === 0 ? (
        <p className="text-text-muted text-sm">No saved projects yet.</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <li
                key={p.id}
                className={`rounded-lg p-3 shadow-sm border transition 
                  ${isActive ? "border-accent bg-surface" : "border-border bg-panel"}
                `}
              >
                <strong className="block text-sm mb-1">{p.name}</strong>
                <p className="text-xs text-text-muted mb-2">{p.template}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onLoad(p.id)}
                    className={`flex-1 text-sm py-1.5 rounded-md transition 
                      ${
                        isActive
                          ? "bg-accent-light text-white"
                          : "bg-accent text-white hover:bg-accent-light"
                      }`}
                  >
                    {isActive ? "Active" : "Load"}
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="flex-1 bg-red-600 text-white text-sm py-1.5 rounded-md hover:bg-red-500 transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
