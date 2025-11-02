import React, { useState } from "react";
import Canvas from "./components/Canvas";
import { usePreviewMode } from "./context/PreviewContext";
import { useProjectContext } from "./context/ProjectContext";
import { useCanvasState } from "./context/CanvasContext";
import NewProjectModal from "./components/NewProjectModal";
import ProjectSidebar from "./components/ProjectSidebar";
import { v4 as uuid } from "uuid";
import { useEffect } from "react";

export default function MainApp() {
  const { isPreviewMode, setIsPreviewMode } = usePreviewMode();
  const {
    projectType,
    projectName,
    setProjectName,
    saveProject,
    setActiveRole,
  } = useProjectContext();
  const { elements } = useCanvasState();
  const [viewMode, setViewMode] = useState("host"); // host | client | split

  // ✅ Prevent accidental tab closing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // shows native confirmation dialog
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 💾 Handle Save
  const handleSave = () => {
    let name = projectName;
    if (!name) {
      const userName = window.prompt(
        "Enter a name for this project:",
        `Untitled-${uuid().slice(0, 4)}`
      );
      if (!userName) return;
      name = userName.trim();
      setProjectName(name);
    }

    saveProject({
      name,
      type: projectType || "client-host",
      elements,
    });

    alert(`✅ Project "${name}" saved successfully!`);
  };

  if (!projectType) return <NewProjectModal />;

  const isClientHost = projectType === "client-host";

  return (
    <div className="w-full h-screen flex flex-col bg-background text-text-primary">
      {/* 🧭 Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">
            🎬 So Real Video Studio {projectName && `— ${projectName}`}
          </h1>

          {/* 🪄 Toggle Editor / Preview */}
          <button
            onClick={() => setIsPreviewMode((prev) => !prev)}
            className={`px-3 py-1 rounded text-white transition ${
              isPreviewMode
                ? "bg-green-600 hover:bg-green-500"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isPreviewMode ? "Preview Mode ✅" : "Editor Mode ✍️"}
          </button>

          {/* 🧭 Host/Client view selector */}
          {isClientHost && (
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                setActiveRole(e.target.value);
              }}
              className="bg-panel text-text-primary border border-border rounded px-2 py-1"
            >
              <option value="host">Host Only</option>
              <option value="client">Client Only</option>
              <option value="split">Host / Client Split</option>
            </select>
          )}
        </div>

        {/* 💾 Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={elements.length === 0}
            className={`px-2 py-1 rounded text-sm text-white transition ${
              elements.length === 0
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* 🖼 Layout */}
      <div className="flex flex-1 overflow-hidden">
        {!isPreviewMode && <ProjectSidebar />}

        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          {/* Single-user project: normal canvas */}
          {!isClientHost && <Canvas role={null} />}

          {/* Client-Host project: host/client/split */}
          {isClientHost && viewMode === "host" && (
            <div className="flex-1 border border-border rounded-lg overflow-hidden">
              <h3 className="bg-panel text-xs px-2 py-1 border-b border-border">🧑 Host View</h3>
              <Canvas role="host" />
            </div>
          )}
          {isClientHost && viewMode === "client" && (
            <div className="flex-1 border border-border rounded-lg overflow-hidden">
              <h3 className="bg-panel text-xs px-2 py-1 border-b border-border">🙋 Client View</h3>
              <Canvas role="client" />
            </div>
          )}
          {isClientHost && viewMode === "split" && (
  <>
          <div className="flex-1 border border-border rounded-lg overflow-hidden">
            <h3 className="bg-panel text-xs px-2 py-1 border-b border-border">
              🧑 Split View — Host
            </h3>
            <Canvas role="host" />
          </div>
          <div className="flex-1 border border-border rounded-lg overflow-hidden">
            <h3 className="bg-panel text-xs px-2 py-1 border-b border-border">
              🙋 Split View — Client
            </h3>
            <Canvas role="client" />
          </div>
        </>
      )}

        </div>
      </div>
    </div>
  );
}
