import { useState } from "react";
import PromptForm from "./components/PromptForm";
import LiveEditorWrapper from "./components/LiveEditor";
import ProjectSidebar from "./components/ProjectSidebar";
import Canvas from "./components/Canvas"; // 👈 now your main builder area
import useProject from "./hooks/useProject";

import mock_liveStream from "./mockTemplates/mock_liveStream";
import mock_videoCall from "./mockTemplates/mock_videoCall";
import mock_tiktokFeed from "./mockTemplates/mock_tiktokFeed";
import mock_classroom from "./mockTemplates/mock_classroom";

function App() {
  const [editorCode, setEditorCode] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [mode, setMode] = useState("editor"); // 👈 "editor" or "preview"
  const [activeProjectId, setActiveProjectId] = useState(null);

  const { projects, saveProject, loadProject, deleteProject } = useProject();

  const handleTemplateGenerated = (prompt) => {
    const lower = prompt.toLowerCase();
    let codeStr = "";
    let name = "";

    if (lower.includes("stream")) {
      codeStr = mock_liveStream;
      name = "Mock Live Stream";
    } else if (lower.includes("tiktok")) {
      codeStr = mock_tiktokFeed;
      name = "Mock TikTok Feed";
    } else if (lower.includes("classroom")) {
      codeStr = mock_classroom;
      name = "Mock Classroom";
    } else if (lower.includes("call")) {
      codeStr = mock_videoCall;
      name = "Mock Video Call";
    } else {
      codeStr = "// ⚠️ No template matches this prompt";
      name = "Untitled";
    }

    setEditorCode(codeStr);
    setTemplateName(name);
  };

  const handleSave = () => {
    if (!editorCode) return alert("No code to save.");
    const name = prompt("Enter a project name:", templateName || "New Project");
    if (!name) return;
    saveProject(name, templateName, editorCode);
    alert(`✅ Project "${name}" saved!`);
  };

  const handleLoad = (id) => {
    const proj = loadProject(id);
    if (proj) {
      setEditorCode(proj.code);
      setTemplateName(proj.template);
      setActiveProjectId(id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-cream-50 text-dark">
      {/* --- Header --- */}
      <header className="flex items-center justify-between px-6 py-3 bg-panel text-text-primary shadow-soft border-b border-border">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">🎥 So Real Video Studio</span>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              mode === "editor"
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-primary"
            }`}
            onClick={() => setMode("editor")}
          >
            Editor
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              mode === "preview"
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-primary"
            }`}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Save */}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition"
          >
            💾 Save
          </button>

          {/* Export */}
          <button
            onClick={() => {
              const current = projects.find(
                (p) => p.code === editorCode && p.template === templateName
              );
              if (!current)
                return alert("Please save the project before exporting.");
              import("./utils/exportProject").then(({ exportProject }) => {
                exportProject(current);
              });
            }}
            className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition"
          >
            ⬇️ Export
          </button>

          {/* Show Editor Toggle */}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border
              ${
                showEditor
                  ? "border-accent text-accent bg-surface hover:bg-border"
                  : "border-border text-text-primary bg-surface hover:bg-border"
              }`}
          >
            {showEditor ? "Hide Code" : "Show Code"}
          </button>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-cream-100 border-r border-sorrel-100 overflow-y-auto">
          <ProjectSidebar
            projects={projects}
            onLoad={handleLoad}
            onDelete={deleteProject}
            activeProjectId={activeProjectId}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col p-6 overflow-auto">
          <PromptForm onTemplateGenerated={handleTemplateGenerated} />

          {/* --- EDITOR MODE --- */}
          {mode === "editor" && (
            <>
              <div className="mt-6 flex justify-center">
                <Canvas />
              </div>

              {/* Optional code editor */}
              {showEditor && editorCode && (
                <div className="mt-6 border border-sorrel-200 rounded-xl overflow-hidden transition-all duration-500">
                  <LiveEditorWrapper key={editorCode} code={editorCode} />
                </div>
              )}
            </>
          )}

          {/* --- PREVIEW MODE --- */}
          {mode === "preview" && editorCode && (
            <div className="mt-6 grid grid-cols-2 gap-4 h-[60vh]">
              {/* Host Preview */}
              <div className="border border-sorrel-200 rounded-xl shadow-inner overflow-hidden">
                <LiveEditorWrapper
                  key={`${editorCode}-host`}
                  code={editorCode}
                  previewOnly
                />
              </div>

              {/* Client Preview */}
              <div className="border border-sorrel-200 rounded-xl shadow-inner overflow-hidden">
                <LiveEditorWrapper
                  key={`${editorCode}-client`}
                  code={editorCode}
                  previewOnly
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
