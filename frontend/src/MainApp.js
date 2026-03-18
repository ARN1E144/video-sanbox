// src/MainApp.js
import React, { useState, useContext, useMemo, useCallback } from "react";
import PromptForm from "./components/PromptForm";
import ProjectSidebar from "./components/ProjectSidebar";
import TemplateCarousel from "./components/TemplateCarousel";
import ModeMenu from "./components/ModeMenu";
import MainMenu from "./components/MainMenu";
import Canvas from "./components/Canvas";
import DebugBindingsPanel from "./components/DebugBindingPanel";
import { ProjectContext } from "./context/ProjectContext";
import { usePreviewMode } from "./context/PreviewContext";
import AuthPortal from "./components/AuthPortal";
import CallsPortal from "./components/CallsPortal";
import { useAuth } from "./context/AuthContext";
import SplitPreviewLayout from "./components/splitPreviewLayout";
import { useCanvasState } from "./context/CanvasContext";
import InspectorContent from "./components/inspectorPanel/InspectorContent";




function DraggablePanel({ title, onClose, children, initial = { x: 16, y: 16 }, width = 300 }) {
  const [pos, setPos] = React.useState(initial);
  const draggingRef = React.useRef(false);
  const offsetRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      setPos({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      });
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onMouseDown = (e) => {
    draggingRef.current = true;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width,
        zIndex: 5000,
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        overflow: "hidden",
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          cursor: "grab",
          userSelect: "none",
          padding: "10px 10px",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 12 }}>{title}</div>
        <button
          onClick={onClose}
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

      <div style={{ padding: 10, maxHeight: "60vh", overflow: "auto" }}>{children}</div>
    </div>
  );
}


export default function MainApp() {
  const { viewMode, backgroundConfigs, setBackgroundConfigs, collapsed } = useContext(ProjectContext);
  const { previewView } = usePreviewMode();
  const { session, loading } = useAuth();
  const { elements, updateElement } = useCanvasState();

  const [currentView, setCurrentView] = useState("templates"); // templates | auth | build | settings

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

    const handleClientSelect = useCallback((id) => {
    setSelectedByRole((prev) =>
        prev.client === id ? prev : { ...prev, client: id }
      );
    }, []);

    const handleHostSelect = useCallback((id) => {
      setSelectedByRole((prev) =>
        prev.host === id ? prev : { ...prev, host: id }
      );
    }, []);

    const handleSingleSelect = useCallback((role, id) => {
      setSelectedByRole((prev) =>
        prev[role] === id ? prev : { ...prev, [role]: id }
      );
    }, []);


   if (loading) {
    return <div style={{ color: "#aaa", padding: 20 }}>Loading session…</div>;
  }

  if (!session) {
    return <AuthPortal />;
  }


  // NOTE:
  // We are now storing backgrounds per ROLE (client/host).
  // If you want it per device instead, tell me and I’ll flip it back,
  // but this matches “host/client independent” behavior better.

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: collapsed ? "40px 1fr" : "260px 1fr",
        height: "100vh",
        backgroundColor: "#0f0f0f",
        color: "#fff",
      }}
    >
      <ProjectSidebar />

      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <MainMenu currentView={currentView} setCurrentView={setCurrentView} />

        {/* <div style={{ padding: 8, borderBottom: "1px solid #222" }}>
          <button onClick={() => setCurrentView("auth")}>Auth</button>
        </div> */}


        {currentView === "templates" && (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <h3 style={{ marginBottom: 12, color: "#aaa" }}>Select a template to get started</h3>
            <TemplateCarousel />
          </div>
        )}

        {currentView === "build" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0f0f0f" }}>
            <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid #222" }}>
              <ModeMenu />
              <PromptForm />
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
                    <>
                      <SplitPreviewLayout
                        onClientSelect={handleClientSelect}
                        onHostSelect={handleHostSelect}
                        onRequestBackground={(role) => {
                          setPanelTargetRole(role);
                          setShowBgPanel(true);
                          setShowDebug(false);
                        }}
                        onRequestDebug={(role) => {
                          setPanelTargetRole(role);
                          setShowDebug(true);
                          setShowBgPanel(false);
                        }}
                      />

                      {/* ✅ GLOBAL BOTTOM INSPECTOR */}
                    </>
                  ) : (
                    <div style={{ flexGrow: 1, overflow: "hidden" }}>
                      <Canvas
                        role="host"
                        forcePreview={true}
                        onSelectedIdChange={handleHostSelect}
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
                <DraggablePanel
                  title={`Background (${panelTargetRole})`}
                  onClose={() => setShowBgPanel(false)}
                  initial={{ x: 16, y: 120 }}
                  width={300}
                >
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
                </DraggablePanel>
              )}


              {/* ───────────────── Shared Debug Panel ───────────────── */}
               {showDebug && (
                <DraggablePanel
                  title={`Debug (${panelTargetRole})`}
                  onClose={() => setShowDebug(false)}
                  initial={{ x: 340, y: 120 }}
                  width={320}
                >
                  <div style={{ color: "#999", marginBottom: 8, fontFamily: "system-ui" }}>
                    Selected: {activeSelectedId || "None"}
                  </div>

                  <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                    <DebugBindingsPanel selectedId={activeSelectedId} role={panelTargetRole} />
                  </div>
                </DraggablePanel>
              )}

            </div>
          </div>
        )}

        {/* {currentView === "auth" && (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <AuthPortal />
          </div>
        )} */}


        {currentView === "settings" && (
          <div style={{ padding: 16, color: "#aaa" }}>
            <h3>Settings</h3>
            <p>Coming soon – configuration options for your app builder.</p>
          </div>
        )}

        {currentView === "calls" && (
          <div style={{ height: "100%", overflow: "auto" }}>
            <CallsPortal />
          </div>
        )}

      </div>
    </div>
  );
}