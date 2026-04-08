import React, { useState, useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";

export default function ProjectSidebar() {
  const [newProjectName, setNewProjectName] = useState("");
  const { 
  projects, 
  loadProject, 
  deleteProject, 
  saveProject,
  collapsed,
  setCollapsed
} = useContext(ProjectContext);

  const handleSave = () => {
    if (!newProjectName.trim()) return alert("Enter a project name");
    saveProject(newProjectName.trim());
    setNewProjectName("");
  };

  return (
    <div
      style={{
        width: collapsed ? 40 : 260,
        background: "#141414",
        color: "#fff",
        transition: "width 0.25s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Collapse button */}
      <div
        style={{
          padding: "8px",
          borderBottom: "1px solid #222",
          cursor: "pointer",
          textAlign: "center",
          background: "#0f0f0f",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "▶" : "◀ Collapse"}
      </div>

      {!collapsed && (
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {/* New Project Input + Save */}
          <div style={{ display: "flex", marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #333",
                background: "#1a1a1a",
                color: "#fff",
              }}
            />
            <button
              onClick={handleSave}
              style={{
                marginLeft: 6,
                padding: "6px 12px",
                borderRadius: 4,
                border: "1px solid #333",
                background: "#333",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>

          {/* Saved Projects List */}
          <h4 style={{ marginBottom: 8, color: "#aaa" }}>Saved Projects</h4>
          {projects.length === 0 && <div style={{ color: "#555" }}>No projects saved</div>}

          {projects.map((proj) => (
            <div
              key={proj.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 6px",
                borderRadius: 4,
                cursor: "pointer",
                marginBottom: 4,
                background: "#1a1a1a",
              }}
            >
              <div
                style={{ flex: 1 }}
                onClick={() => loadProject(proj.id)}
              >
                {proj.name}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#f55",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
