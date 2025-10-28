import React, { useState } from "react";
import { useProjectContext } from "../context/ProjectContext";
import { useCanvasState } from "../context/CanvasContext";
import ConfirmDialog from "./ConfirmDialog"; // 🆕 new component

export default function ProjectSidebar() {
  const {
    projects,
    projectName,
    setProjectName,
    setProjectType,
    loadProject,
    deleteProject,
    resetProject,
    saveProject, // 🆕 ensure ProjectContext has saveProject
  } = useProjectContext();

  const { clearCanvas, loadElements, elements } = useCanvasState();
  const [isOpen, setIsOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLoadProject = (proj) => {
    const loaded = loadProject(proj.name);
    if (loaded) {
      clearCanvas();
      if (loaded.elements) loadElements(loaded.elements);
      setProjectName(loaded.name);
      setProjectType(loaded.type);
    }
  };

  const handleDelete = (e, name) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProject(name);
    }
  };

  const handleNewProject = () => {
    if (elements.length > 0) {
      setShowConfirm(true); // 👀 trigger modal
    } else {
      clearCanvas();
      resetProject();
    }
  };

  const handleSaveAndContinue = () => {
  let name = projectName;

  // 📝 If the project doesn't have a name, prompt the user
  if (!name) {
    const userName = window.prompt(
      "Please enter a name for your project:",
      `Untitled-${new Date().toLocaleDateString()}`
    );
    if (!userName) {
      // user cancelled or left empty
      return;
    }
    name = userName.trim();
  }

  saveProject({
    name,
    type: "client-host",
    elements,
  });

  // ✨ Optional: Keep the saved project highlighted for a moment before reset
  setProjectName(name);

  setTimeout(() => {
    clearCanvas();
    resetProject();
  }, 50);

  setShowConfirm(false);
};


  const handleDiscardAndContinue = () => {
    clearCanvas();
    resetProject();
    setShowConfirm(false);
  };

  return (
    <>
      {/* --- Sidebar --- */}
      <div
        className={`transition-all duration-300 bg-panel border-r border-border ${
          isOpen ? "w-64" : "w-10"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          {isOpen && <h3 className="text-sm font-semibold text-text-primary">📁 Projects</h3>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm text-text-primary hover:text-accent"
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? "«" : "»"}
          </button>
        </div>

        {isOpen && (
          <div className="px-3 py-2 border-b border-border">
            <button
              onClick={handleNewProject}
              className="w-full text-sm px-2 py-1 bg-accent hover:bg-accent-light text-white rounded"
            >
              ➕ New Project
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 && isOpen && (
            <p className="text-xs text-text-muted italic px-3 py-2">
              No saved projects yet
            </p>
          )}

          {projects.map((proj) => (
            <div
              key={proj.name}
              onClick={() => handleLoadProject(proj)}
              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition
                ${proj.name === projectName ? "bg-accent/20 text-accent" : "hover:bg-accent/10"}`}
            >
              {isOpen ? (
                <>
                  <span className="truncate">{proj.name}</span>
                  <button
                    onClick={(e) => handleDelete(e, proj.name)}
                    className="text-xs text-red-500 hover:text-red-400 ml-2"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div
                  className={`w-2 h-2 rounded-full ${
                    proj.name === projectName ? "bg-accent" : "bg-gray-500"
                  }`}
                  title={proj.name}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 🆕 Confirm Modal */}
      {showConfirm && (
        <ConfirmDialog
          title="Unsaved Changes"
          message="You have unsaved work. Would you like to save it before starting a new project?"
          onSave={handleSaveAndContinue}
          onDiscard={handleDiscardAndContinue}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
