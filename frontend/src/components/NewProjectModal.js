import React, { useState } from "react";
import { useProjectContext } from "../context/ProjectContext";

export default function NewProjectModal() {
  const { setProjectType, setProjectName, resetProject } = useProjectContext();
  const [localName, setLocalName] = useState("");
  const [localType, setLocalType] = useState("single");

  const handleStart = () => {
    if (!localName.trim()) {
      alert("Please enter a project name.");
      return;
    }
    setProjectName(localName.trim());
    setProjectType(localType);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900/90 backdrop-blur-sm fixed top-0 left-0 z-50">
      <div className="bg-panel border border-border rounded-xl shadow-lg w-[400px] p-6 text-text-primary">
        <h2 className="text-lg font-semibold mb-4">🆕 Create New Project</h2>

        {/* Project Name */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Project Name</label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="My Project"
            className="w-full px-3 py-2 rounded bg-surface border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Project Type */}
        <div className="mb-6">
          <label className="block text-sm mb-2">Project Type</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="projectType"
                value="single"
                checked={localType === "single"}
                onChange={(e) => setLocalType(e.target.value)}
              />
              <span>👤 Single User</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="projectType"
                value="client-host"
                checked={localType === "client-host"}
                onChange={(e) => setLocalType(e.target.value)}
              />
              <span>👥 Client / Host App</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={resetProject}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded"
          >
            Start Project 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
