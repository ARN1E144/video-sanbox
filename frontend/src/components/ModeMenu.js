// src/components/ModeMenu.js
import React, { useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";
import { usePreviewMode } from "../context/PreviewContext";
import { useCanvasState } from "../context/CanvasContext";

export default function ModeMenu() {
  const { viewMode, setViewMode, projectType, setProjectType } =
    useContext(ProjectContext);

  const { previewView, setPreviewView } = usePreviewMode();
  const { elements, loadElements, clearCanvas } = useCanvasState();

  const activeStyle = {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "1px solid #555",
  };

  const buttonStyle = {
    flex: 1,
    padding: "8px 0",
    cursor: "pointer",
    background: "#1a1a1a",
    color: "#888",
    border: "1px solid #333",
    borderRadius: "6px",
    fontWeight: 500,
    transition: "all 0.25s ease",
    textAlign: "center",
    userSelect: "none",
  };

  const smallButtonStyle = {
    padding: "6px 8px",
    background: "#1a1a1a",
    color: "#888",
    border: "1px solid #333",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.25s ease",
    userSelect: "none",
  };

  const pillRowStyle = {
    display: "flex",
    gap: 6,
    alignItems: "center",
  };

  const maybeWipeCanvas = () => {
    const wipe = window.confirm(
      "Start with a clean canvas?\n\nOK = wipe all elements\nCancel = keep existing elements"
    );
    if (wipe) clearCanvas();
  };

  const setTypeWithConfirm = (nextType) => {
  if (nextType === projectType) return;

  // switching to MULTI is safe: keep everything, just enable role separation
  if (nextType === "multi") {
    const ok = window.confirm(
      "Switch to MULTI project?\n\nYou can edit Host and Client independently.\n\nContinue?"
    );
    if (!ok) return;
    setProjectType("multi");
    return;
  }

  // switching to SINGLE can hide/lose host-only work
  if (nextType === "single") {
    const keepClientOnly = window.confirm(
      "Switch to SINGLE project?\n\nOK = Keep CLIENT elements only (Host elements removed)\nCancel = More options"
    );

    if (keepClientOnly) {
      const clientOnly = (elements || []).filter((el) => el.role === "client" || el.role == null);
      loadElements(clientOnly);
      setProjectType("single");
      setPreviewView("client");
      return;
    }

    const wipeAll = window.confirm(
      "Wipe the canvas completely and switch to SINGLE?\n\nOK = Wipe all\nCancel = Abort switch"
    );

    if (!wipeAll) return;

    clearCanvas();
    setProjectType("single");
    setPreviewView("client");
  }
};


  const setPreviewWithTypeRules = (mode) => {
    // Host or Split implies multi
    if ((mode === "host" || mode === "split") && projectType !== "multi") {
      const ok = window.confirm(
        "Host / Split requires MULTI project.\n\nSwitch project to MULTI?"
      );
      if (!ok) return;

      setProjectType("multi");
      // optional wipe prompt when upgrading to multi
      maybeWipeCanvas();
    }

    // Keep multi when selecting client (safer; doesn't hide host work)
    setPreviewView(mode);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid #333",
        background: "#0f0f0f",
        flexWrap: "wrap",
      }}
    >
      {/* Left: Preview / Actions */}
      <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 220 }}>
        <div
          style={viewMode === "preview" ? { ...buttonStyle, ...activeStyle } : buttonStyle}
          onClick={() => setViewMode("preview")}
        >
          Preview
        </div>
        <div
          style={viewMode === "actions" ? { ...buttonStyle, ...activeStyle } : buttonStyle}
          onClick={() => setViewMode("actions")}
        >
          Actions
        </div>
      </div>

      {/* Middle: Project Type */}
      <div style={{ ...pillRowStyle }}>
        <div style={{ color: "#aaa", fontSize: 12, marginRight: 6 }}>Project</div>

        <div
          style={
            projectType === "single"
              ? { ...smallButtonStyle, background: "#333", color: "#fff" }
              : smallButtonStyle
          }
          onClick={() => setTypeWithConfirm("single")}
          title="Single: one shared client view"
        >
          Single
        </div>

        <div
          style={
            projectType === "multi"
              ? { ...smallButtonStyle, background: "#333", color: "#fff" }
              : smallButtonStyle
          }
          onClick={() => setTypeWithConfirm("multi")}
          title="Multi: separate Host and Client canvases"
        >
          Multi
        </div>
      </div>

      {/* Right: Client / Host / Split */}
      {viewMode === "preview" && (
        <div style={{ ...pillRowStyle }}>
          {["client", "host", "split"].map((mode) => (
            <div
              key={mode}
              style={
                previewView === mode
                  ? { ...smallButtonStyle, background: "#333", color: "#fff" }
                  : smallButtonStyle
              }
              onClick={() => setPreviewWithTypeRules(mode)}
              title={
                mode === "split"
                  ? "Client / Host"
                  : mode.charAt(0).toUpperCase() + mode.slice(1)
              }
            >
              {mode === "split"
                ? "Client / Host"
                : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
