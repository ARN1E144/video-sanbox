// src/MainApp.js
import React, { useState, useContext, useMemo } from "react";
import PromptForm from "./components/PromptForm";
import ProjectSidebar from "./components/ProjectSidebar";
import TemplateCarousel from "./components/TemplateCarousel";
import ModeMenu from "./components/ModeMenu";
import MainMenu from "./components/MainMenu";
import Canvas from "./components/Canvas";
import DebugBindingsPanel from "./components/DebugBindingPanel";
import { ProjectContext } from "./context/ProjectContext";
import { usePreviewMode } from "./context/PreviewContext";

export default function MainApp() {
  const { viewMode, backgroundConfigs, setBackgroundConfigs } = useContext(ProjectContext);
  const { previewView } = usePreviewMode();

  const [currentView, setCurrentView] = useState("templates"); // templates | build | settings

  // Shared panels (one instance)
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Which side is the panel currently targeting? (client|host)
  const [panelTargetRole, setPanelTargetRole] = useState("client");

  // Track selection per side so Debug panel can show “current”
  const [selectedByRole, setSelectedByRole] = useState({ client: null, host: null });

  const activeSelectedId = useMemo(() => {
    return selectedByRole[panelTargetRole] || null;
  }, [selectedByRole, panelTargetRole]);

  const defaultBg = useMemo(
    () => ({
      kind: "color",
      color: "#020617",
      imageUrl: "",
      size: "cover",
    }),
    []
  );

  const activeBg = useMemo(() => {
    return (backgroundConfigs && backgroundConfigs[panelTargetRole]) || defaultBg;
  }, [backgroundConfigs, panelTargetRole, defaultBg]);

  const updateActiveBackground = (patch) => {
    if (typeof setBackgroundConfigs !== "function") return;
    setBackgroundConfigs((prev) => {
      const safePrev = prev || {};
      const current = safePrev[panelTargetRole] || defaultBg;
      return {
        ...safePrev,
        [panelTargetRole]: { ...current, ...patch },
      };
    });
  };

  // NOTE:
  // We are now storing backgrounds per ROLE (client/host).
  // If you want it per device instead, tell me and I’ll flip it back,
  // but this matches “host/client independent” behavior better.

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        height: "100vh",
        backgroundColor: "#0f0f0f",
        color: "#fff",
      }}
    >
      <ProjectSidebar />

      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <MainMenu currentView={currentView} setCurrentView={setCurrentView} />

        {currentView === "templates" && (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <h3 style={{ marginBottom: 12, color: "#aaa" }}>Select a template to get started</h3>
            <TemplateCarousel />
          </div>
        )}

        {currentView === "build" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0f0f0f" }}>
            <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid #222" }}>
              <PromptForm />
              <ModeMenu />
            </div>

            {/* Workspace (position:relative so panels can overlay) */}
            <div
              style={{
                position: "relative",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#0a0a0a",
                borderTop: "1px solid #222",
                overflow: "hidden",
              }}
            >
              {viewMode === "preview" ? (
                <>
                  {previewView === "split" ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0, // important: no gap so divider looks real
                        flexGrow: 1,
                        overflow: "hidden",
                      }}
                    >
                      {/* LEFT PANE (client) */}
                      <div style={{ borderRight: "1px solid #222", overflow: "hidden" }}>
                        <Canvas
                          role="client"
                          showRightTools={true}
                          onSelectedIdChange={(id) =>
                            setSelectedByRole((prev) => ({ ...prev, client: id }))
                          }
                          onRequestBackground={() => {
                            setPanelTargetRole("client");
                            setShowBgPanel(true);
                            setShowDebug(false);
                          }}
                          onRequestDebug={() => {
                            setPanelTargetRole("client");
                            setShowDebug(true);
                            setShowBgPanel(false);
                          }}
                        />
                      </div>

                      {/* RIGHT PANE (host) */}
                      <div style={{ overflow: "hidden" }}>
                        <Canvas
                          role="host"
                          showRightTools={true}
                          onSelectedIdChange={(id) =>
                            setSelectedByRole((prev) => ({ ...prev, host: id }))
                          }
                          onRequestBackground={() => {
                            setPanelTargetRole("host");
                            setShowBgPanel(true);
                            setShowDebug(false);
                          }}
                          onRequestDebug={() => {
                            setPanelTargetRole("host");
                            setShowDebug(true);
                            setShowBgPanel(false);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ flexGrow: 1, overflow: "hidden" }}>
                      <Canvas
                        role={previewView}
                        showRightTools={true}
                        onSelectedIdChange={(id) =>
                          setSelectedByRole((prev) => ({ ...prev, [previewView]: id }))
                        }
                        onRequestBackground={() => {
                          setPanelTargetRole(previewView);
                          setShowBgPanel(true);
                          setShowDebug(false);
                        }}
                        onRequestDebug={() => {
                          setPanelTargetRole(previewView);
                          setShowDebug(true);
                          setShowBgPanel(false);
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 24 }}>
                  <h3 style={{ marginBottom: 10 }}>Actions Panel</h3>
                  <p style={{ color: "#aaa" }}>Here you’ll edit and connect actions between components.</p>
                </div>
              )}

              {/* ───────────────── Shared Background Panel ───────────────── */}
              {showBgPanel && (
                <div
                  style={{
                    position: "absolute",
                    right: showDebug ? 316 : 16,
                    bottom: 16,
                    width: 280,
                    zIndex: 2000,
                    background: "#141414",
                    border: "1px solid #2a2a2a",
                    borderRadius: 10,
                    padding: 10,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700 }}>
                      Background ({panelTargetRole})
                    </div>
                    <button
                      onClick={() => setShowBgPanel(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#aaa",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: "#888", marginBottom: 6 }}>Type</div>
                    <select
                      value={activeBg.kind}
                      onChange={(e) => updateActiveBackground({ kind: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#0f0f0f",
                        border: "1px solid #333",
                        color: "#ddd",
                        padding: "6px 8px",
                        borderRadius: 8,
                      }}
                    >
                      <option value="color">Solid color</option>
                      <option value="image">Image</option>
                    </select>
                  </div>

                  {activeBg.kind === "color" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={activeBg.color || "#020617"}
                        onChange={(e) => updateActiveBackground({ color: e.target.value })}
                        style={{ width: 44, height: 32, border: "none", background: "transparent" }}
                      />
                      <input
                        value={activeBg.color || "#020617"}
                        onChange={(e) => updateActiveBackground({ color: e.target.value })}
                        style={{
                          flex: 1,
                          background: "#0f0f0f",
                          border: "1px solid #333",
                          color: "#ddd",
                          padding: "6px 8px",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  )}

                  {activeBg.kind === "image" && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ color: "#888", marginBottom: 6 }}>Image URL</div>
                        <input
                          value={activeBg.imageUrl || ""}
                          onChange={(e) => updateActiveBackground({ imageUrl: e.target.value })}
                          placeholder="https://..."
                          style={{
                            width: "100%",
                            background: "#0f0f0f",
                            border: "1px solid #333",
                            color: "#ddd",
                            padding: "6px 8px",
                            borderRadius: 8,
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ color: "#888", marginBottom: 6 }}>Size / Repeat</div>
                        <select
                          value={activeBg.size || "cover"}
                          onChange={(e) => updateActiveBackground({ size: e.target.value })}
                          style={{
                            width: "100%",
                            background: "#0f0f0f",
                            border: "1px solid #333",
                            color: "#ddd",
                            padding: "6px 8px",
                            borderRadius: 8,
                          }}
                        >
                          <option value="cover">Cover</option>
                          <option value="contain">Contain</option>
                          <option value="repeat">Repeat</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ───────────────── Shared Debug Panel ───────────────── */}
              {showDebug && (
                <div
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                    width: 300,
                    maxHeight: "55vh",
                    overflow: "auto",
                    zIndex: 2000,
                    background: "#141414",
                    border: "1px solid #2a2a2a",
                    borderRadius: 10,
                    padding: 10,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                    fontFamily: "monospace",
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontFamily: "system-ui" }}>
                      Debug ({panelTargetRole})
                    </div>
                    <button
                      onClick={() => setShowDebug(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#aaa",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ color: "#999", marginBottom: 8 }}>
                    Selected: {activeSelectedId || "None"}
                  </div>

                  <DebugBindingsPanel selectedId={activeSelectedId} role={panelTargetRole} />
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "settings" && (
          <div style={{ padding: 16, color: "#aaa" }}>
            <h3>Settings</h3>
            <p>Coming soon – configuration options for your app builder.</p>
          </div>
        )}
      </div>
    </div>
  );
}
