import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";

import {
  useCanvasState,
} from "./context/CanvasContext";

import PromptForm
  from "./components/PromptForm";

import ProjectSidebar
  from "./components/ProjectSidebar";

import TemplateCarousel
  from "./components/TemplateCarousel";

import ModeMenu
  from "./components/ModeMenu";

import MainMenu
  from "./components/MainMenu";

import Canvas
  from "./components/Canvas";

import DebugBindingsPanel
  from "./components/DebugBindingPanel";

import {
  ProjectContext,
} from "./context/ProjectContext";

import {
  usePreviewMode,
} from "./context/PreviewContext";

import CallsPortal
  from "./components/CallsPortal";

import {
  useAuth,
} from "./context/AuthContext";

import SplitPreviewLayout
  from "./components/splitPreviewLayout";

import DataHub
  from "./components/DataHub";

import InterviewConfigurationPanel
  from "./components/projects/InterviewConfigurationPanel";

import TenantTeamSettings
  from "./components/TenantTeamSettings";


// =====================================================
// DRAGGABLE PANEL
// =====================================================

function DraggablePanel({
  title,
  onClose,
  children,
  initial = {
    x: 16,
    y: 16,
  },
  width = 300,
}) {

  const [
    pos,
    setPos,
  ] = React.useState(
    initial
  );

  const draggingRef =
    React.useRef(false);

  const offsetRef =
    React.useRef({
      x: 0,
      y: 0,
    });


  React.useEffect(
    () => {

      const onMove =
        event => {

          if (
            !draggingRef.current
          ) {

            return;

          }

          setPos({
            x:
              event.clientX -
              offsetRef.current.x,

            y:
              event.clientY -
              offsetRef.current.y,
          });

        };


      const onUp =
        () => {

          draggingRef.current =
            false;

        };


      window.addEventListener(
        "mousemove",
        onMove
      );

      window.addEventListener(
        "mouseup",
        onUp
      );


      return () => {

        window.removeEventListener(
          "mousemove",
          onMove
        );

        window.removeEventListener(
          "mouseup",
          onUp
        );

      };

    },
    []
  );


  const onMouseDown =
    event => {

      draggingRef.current =
        true;

      offsetRef.current = {

        x:
          event.clientX -
          pos.x,

        y:
          event.clientY -
          pos.y,

      };

    };


  return (

    <div
      style={{

        position:
          "fixed",

        left:
          pos.x,

        top:
          pos.y,

        width,

        maxWidth:
          "calc(100vw - 24px)",

        maxHeight:
          "calc(100dvh - 24px)",

        zIndex:
          5000,

        background:
          "#141414",

        border:
          "1px solid #2a2a2a",

        borderRadius:
          10,

        boxShadow:
          "0 12px 40px rgba(0,0,0,0.45)",

        overflow:
          "hidden",

      }}
    >

      <div
        onMouseDown={
          onMouseDown
        }

        style={{

          cursor:
            "grab",

          userSelect:
            "none",

          padding:
            "10px",

          borderBottom:
            "1px solid #2a2a2a",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

        }}
      >

        <div
          style={{

            fontWeight:
              700,

            fontSize:
              12,

          }}
        >
          {title}
        </div>


        <button
          onClick={
            onClose
          }

          style={{

            background:
              "transparent",

            border:
              "none",

            color:
              "#aaa",

            cursor:
              "pointer",

            fontSize:
              14,

          }}

          title="Close"
        >
          ✕
        </button>

      </div>


      <div
        style={{

          padding:
            10,

          maxHeight:
            "60vh",

          overflow:
            "auto",

        }}
      >
        {children}
      </div>

    </div>

  );

}


// =====================================================
// SETTINGS NAVIGATION
// =====================================================

const SETTINGS_SECTIONS = [

  {
    id:
      "team",

    label:
      "Team & Members",

    scope:
      "tenant",
  },

  {
    id:
      "project",

    label:
      "Project Settings",

    scope:
      "project",
  },

];


// =====================================================
// MAIN APP
// =====================================================

export default function MainApp() {

  const {
    viewMode,

    backgroundConfigs,

    setBackgroundConfigs,

    collapsed,

    setCollapsed,

    projectSchema,

    hasUnsavedChanges,

    confirmDiscardUnsavedChanges,

  } =
    useContext(
      ProjectContext
    );


  console.log(
    "[MainApp projectSchema]",
    projectSchema
  );


  const {
    previewView,
  } =
    usePreviewMode();


  const {
    session,

    loading,
  } =
    useAuth();


  const {
    elements,

    updateElement,
  } =
    useCanvasState();


  // ===================================================
  // MAIN VIEW
  // ===================================================

  const [
    currentView,
    setCurrentView,
  ] =
    useState(
      "templates"
    );


  // ===================================================
  // GUARDED MAIN VIEW NAVIGATION
  // ===================================================

  const handleViewChange =
    useCallback(
      nextView => {

        if (
          nextView ===
          currentView
        ) {

          return;

        }


        const allowed =
          typeof confirmDiscardUnsavedChanges ===
            "function"

            ? confirmDiscardUnsavedChanges(
                "You have unsaved changes to this project. Leave without saving?"
              )

            : true;


        if (
          !allowed
        ) {

          console.log(
            "[MainApp] Navigation cancelled",
            {
              currentView,
              nextView,
            }
          );


          return;

        }


        console.log(
          "[MainApp] View changed",
          {

            from:
              currentView,

            to:
              nextView,

          }
        );


        setCurrentView(
          nextView
        );

      },
      [
        currentView,
        confirmDiscardUnsavedChanges,
      ]
    );


  // ===================================================
  // SETTINGS VIEW
  // ===================================================

  const [
    settingsSection,
    setSettingsSection,
  ] =
    useState(
      "team"
    );


  // ===================================================
  // MOBILE
  // ===================================================

  const [
    isMobile,
    setIsMobile,
  ] =
    useState(
      () =>
        window.innerWidth <=
        768
    );


  useEffect(
    () => {

      const handleResize =
        () => {

          setIsMobile(
            window.innerWidth <=
            768
          );

        };


      handleResize();


      window.addEventListener(
        "resize",
        handleResize
      );


      return () => {

        window.removeEventListener(
          "resize",
          handleResize
        );

      };

    },
    []
  );


  // ===================================================
  // SHARED PANELS
  // ===================================================

  const [
    showBgPanel,
    setShowBgPanel,
  ] =
    useState(false);


  const [
    showDebug,
    setShowDebug,
  ] =
    useState(false);


  const [
    panelTargetRole,
    setPanelTargetRole,
  ] =
    useState(
      "client"
    );


  // ===================================================
  // SELECTED ELEMENTS BY ROLE
  // ===================================================

  const [
    selectedByRole,
    setSelectedByRole,
  ] =
    useState({

      client:
        null,

      host:
        null,

    });


  const activeSelectedId =
    useMemo(
      () => {

        return (
          selectedByRole[
            panelTargetRole
          ] ||
          null
        );

      },
      [
        selectedByRole,
        panelTargetRole,
      ]
    );


  // ===================================================
  // DEFAULT BACKGROUND
  // ===================================================

  const defaultBg =
    useMemo(
      () => ({

        kind:
          "color",

        color:
          "#020617",

        imageUrl:
          "",

        size:
          "cover",

      }),
      []
    );


  // ===================================================
  // ACTIVE BACKGROUND
  // ===================================================

  const activeBg =
    useMemo(
      () => {

        return (

          backgroundConfigs &&
          backgroundConfigs[
            panelTargetRole
          ]

        ) || defaultBg;

      },
      [
        backgroundConfigs,
        panelTargetRole,
        defaultBg,
      ]
    );


  // ===================================================
  // UPDATE BACKGROUND
  // ===================================================

  const updateActiveBackground =
    patch => {

      if (
        typeof setBackgroundConfigs !==
        "function"
      ) {

        return;

      }


      setBackgroundConfigs(
        previous => {

          const safePrevious =
            previous || {};


          const current =
            safePrevious[
              panelTargetRole
            ] ||
            defaultBg;


          return {

            ...safePrevious,

            [panelTargetRole]: {

              ...current,

              ...patch,

            },

          };

        }
      );

    };


  // ===================================================
  // SELECTION CALLBACKS
  // ===================================================

  const handleClientSelect =
    useCallback(
      id => {

        setSelectedByRole(
          previous => {

            if (
              previous.client ===
              id
            ) {

              return previous;

            }


            return {

              ...previous,

              client:
                id,

            };

          }
        );

      },
      []
    );


  const handleHostSelect =
    useCallback(
      id => {

        setSelectedByRole(
          previous => {

            if (
              previous.host ===
              id
            ) {

              return previous;

            }


            return {

              ...previous,

              host:
                id,

            };

          }
        );

      },
      []
    );


  const handleSingleSelect =
    useCallback(
      (
        role,
        id
      ) => {

        setSelectedByRole(
          previous => {

            if (
              previous[
                role
              ] === id
            ) {

              return previous;

            }


            return {

              ...previous,

              [role]:
                id,

            };

          }
        );

      },
      []
    );


  // ===================================================
  // MOBILE SIDEBAR
  // ===================================================

  const closeMobileSidebar =
    () => {

      if (
        isMobile
      ) {

        setCollapsed(
          true
        );

      }

    };


  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading
  ) {

    return (

      <div
        style={{

          color:
            "#aaa",

          padding:
            20,

        }}
      >
        Loading session…
      </div>

    );

  }


  if (
    !session
  ) {

    return null;

  }


  // ===================================================
  // MAIN SHELL
  // ===================================================

  return (

    <div
      style={{

        width:
          "100%",

        height:
          "100dvh",

        minHeight:
          0,

        maxWidth:
          "100vw",

        overflow:
          "hidden",

        position:
          "relative",

        backgroundColor:
          "#0f0f0f",

        color:
          "#fff",

        boxSizing:
          "border-box",

      }}
    >

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      {!isMobile && (

        <div
          style={{

            position:
              "absolute",

            left:
              0,

            top:
              0,

            bottom:
              0,

            width:
              collapsed
                ? 40
                : 260,

            zIndex:
              1000,

            transition:
              "width 0.25s ease",

            overflow:
              "hidden",

          }}
        >

          <ProjectSidebar />

        </div>

      )}


      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      {isMobile &&
        !collapsed && (
          <>

            <div
              onClick={
                closeMobileSidebar
              }

              style={{

                position:
                  "fixed",

                inset:
                  0,

                background:
                  "rgba(0,0,0,0.55)",

                zIndex:
                  1999,

              }}
            />


            <div
              style={{

                position:
                  "fixed",

                left:
                  0,

                top:
                  0,

                bottom:
                  0,

                width:
                  "min(300px, 85vw)",

                zIndex:
                  2000,

                background:
                  "#141414",

                boxShadow:
                  "8px 0 30px rgba(0,0,0,.45)",

                overflow:
                  "hidden",

              }}
            >

              <ProjectSidebar />

            </div>

          </>
        )}


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div
        style={{

          position:
            "absolute",

          left:

            isMobile
              ? 0
              : collapsed
                ? 40
                : 260,

          right:
            0,

          top:
            0,

          bottom:
            0,

          width:
            isMobile
              ? "100%"
              : "auto",

          maxWidth:
            isMobile
              ? "100vw"
              : "none",

          minWidth:
            0,

          minHeight:
            0,

          display:
            "flex",

          flexDirection:
            "column",

          overflow:
            "hidden",

          boxSizing:
            "border-box",

          transition:
            isMobile
              ? "none"
              : "left 0.25s ease",

        }}
      >

        {/* =================================================
            MAIN MENU
        ================================================= */}

        <div
          style={{

            position:
              "relative",

          }}
        >

          <MainMenu
            currentView={
              currentView
            }

            setCurrentView={
              handleViewChange
            }
          />


          {/* ===============================================
              UNSAVED INDICATOR
          =============================================== */}

          {hasUnsavedChanges && (

            <div
              style={{

                position:
                  "absolute",

                right:
                  12,

                top:
                  "50%",

                transform:
                  "translateY(-50%)",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  7,

                padding:
                  "5px 9px",

                border:
                  "1px solid #92400e",

                borderRadius:
                  999,

                background:
                  "rgba(120,53,15,.35)",

                color:
                  "#fbbf24",

                fontSize:
                  11,

                fontWeight:
                  600,

                pointerEvents:
                  "none",

                zIndex:
                  2,

                whiteSpace:
                  "nowrap",

              }}
            >

              <span
                style={{

                  width:
                    6,

                  height:
                    6,

                  borderRadius:
                    "50%",

                  background:
                    "#f59e0b",

                }}
              />

              Unsaved changes

            </div>

          )}

        </div>


        {/* =================================================
            TEMPLATES
        ================================================= */}

        {currentView ===
          "templates" && (

          <div
            style={{

              padding:
                isMobile
                  ? 10
                  : 16,

              display:
                "flex",

              flexDirection:
                "column",

              flex:
                1,

              minWidth:
                0,

              minHeight:
                0,

              overflow:
                "hidden",

            }}
          >

            <h3
              style={{

                margin:
                  "0 0 12px 0",

                color:
                  "#aaa",

                fontSize:
                  isMobile
                    ? 16
                    : 18,

                flexShrink:
                  0,

              }}
            >

              Select a template
              to get started

            </h3>


            <div
              style={{

                minWidth:
                  0,

                overflowX:
                  "auto",

                overflowY:
                  "hidden",

              }}
            >

              <TemplateCarousel />

            </div>

          </div>

        )}


        {/* =================================================
            DATA HUB
        ================================================= */}

        {currentView ===
          "data" && (

          <div
            style={{

              flex:
                1,

              minWidth:
                0,

              minHeight:
                0,

              overflow:
                "hidden",

              backgroundColor:
                "#0f0f0f",

            }}
          >

            <DataHub />

          </div>

        )}


        {/* =================================================
            BUILD
        ================================================= */}

        {currentView ===
          "build" && (

          <div
            style={{

              display:
                "flex",

              flexDirection:
                "column",

              flex:
                1,

              minWidth:
                0,

              minHeight:
                0,

              backgroundColor:
                "#0f0f0f",

              overflow:
                "hidden",

            }}
          >

            {/* TOOLBAR */}

            <div
              style={{

                flexShrink:
                  0,

                width:
                  "100%",

                maxWidth:
                  "100%",

                minWidth:
                  0,

                padding:
                  isMobile
                    ? "8px 10px"
                    : "12px 16px",

                borderBottom:
                  "1px solid #222",

                boxSizing:
                  "border-box",

                overflowX:
                  "hidden",

                overflowY:
                  "visible",

              }}
            >

              <ModeMenu />

              <PromptForm />

            </div>


            {/* WORKSPACE */}

            <div
              style={{

                position:
                  "relative",

                flex:
                  1,

                minWidth:
                  0,

                minHeight:
                  0,

                display:
                  "flex",

                flexDirection:
                  "column",

                backgroundColor:
                  "#0a0a0a",

                borderTop:
                  "1px solid #222",

                overflow:
                  "hidden",

              }}
            >

              {viewMode ===
                "preview" ? (

                <>

                  {/* =========================================
                      SPLIT VIEW
                  ========================================= */}

                  {previewView ===
                    "split" ? (

                    <div
                      style={{

                        flex:
                          1,

                        minWidth:
                          0,

                        minHeight:
                          0,

                        overflow:
                          "hidden",

                      }}
                    >

                      <SplitPreviewLayout

                        onClientSelect={
                          handleClientSelect
                        }

                        onHostSelect={
                          handleHostSelect
                        }

                        onRequestBackground={
                          role => {

                            setPanelTargetRole(
                              role
                            );

                            setShowBgPanel(
                              true
                            );

                            setShowDebug(
                              false
                            );

                          }
                        }

                        onRequestDebug={
                          role => {

                            setPanelTargetRole(
                              role
                            );

                            setShowDebug(
                              true
                            );

                            setShowBgPanel(
                              false
                            );

                          }
                        }

                      />

                    </div>

                  ) : (

                    <div
                      style={{

                        flex:
                          1,

                        minWidth:
                          0,

                        minHeight:
                          0,

                        overflow:
                          "hidden",

                      }}
                    >

                      <Canvas

                        role={
                          previewView
                        }

                        onSelectedIdChange={

                          previewView ===
                          "client"

                            ? handleClientSelect

                            : handleHostSelect

                        }

                        onRequestBackground={
                          () => {

                            setPanelTargetRole(
                              previewView
                            );

                            setShowBgPanel(
                              true
                            );

                            setShowDebug(
                              false
                            );

                          }
                        }

                        onRequestDebug={
                          () => {

                            setPanelTargetRole(
                              previewView
                            );

                            setShowDebug(
                              true
                            );

                            setShowBgPanel(
                              false
                            );

                          }
                        }

                      />

                    </div>

                  )}

                </>

              ) : (

                <div
                  style={{

                    padding:
                      isMobile
                        ? 16
                        : 24,

                    overflow:
                      "auto",

                  }}
                >

                  <h3>
                    Actions Panel
                  </h3>


                  <p
                    style={{
                      color:
                        "#aaa",
                    }}
                  >

                    Here you’ll edit and
                    connect actions between
                    components.

                  </p>

                </div>

              )}


              {/* =================================================
                  BACKGROUND PANEL
              ================================================= */}

              {showBgPanel && (

                <DraggablePanel

                  title={
                    `Background (${panelTargetRole})`
                  }

                  onClose={
                    () =>
                      setShowBgPanel(
                        false
                      )
                  }

                  initial={{

                    x:
                      isMobile
                        ? 12
                        : 16,

                    y:
                      isMobile
                        ? 70
                        : 120,

                  }}

                  width={

                    isMobile

                      ? Math.min(
                          300,
                          window.innerWidth -
                            24
                        )

                      : 300

                  }

                >

                  <div
                    style={{
                      marginBottom:
                        10,
                    }}
                  >

                    <div
                      style={{

                        color:
                          "#888",

                        marginBottom:
                          6,

                      }}
                    >
                      Type
                    </div>


                    <select

                      value={
                        activeBg.kind
                      }

                      onChange={
                        event =>
                          updateActiveBackground({
                            kind:
                              event.target
                                .value,
                          })
                      }

                      style={{

                        width:
                          "100%",

                        background:
                          "#0f0f0f",

                        border:
                          "1px solid #333",

                        color:
                          "#ddd",

                        padding:
                          "6px 8px",

                        borderRadius:
                          8,

                      }}
                    >

                      <option value="color">
                        Solid color
                      </option>

                      <option value="image">
                        Image
                      </option>

                    </select>

                  </div>


                  {activeBg.kind ===
                    "color" && (

                    <div
                      style={{

                        display:
                          "flex",

                        gap:
                          8,

                        alignItems:
                          "center",

                      }}
                    >

                      <input
                        type="color"

                        value={
                          activeBg.color ||
                          "#020617"
                        }

                        onChange={
                          event =>
                            updateActiveBackground({
                              color:
                                event.target
                                  .value,
                            })
                        }

                        style={{

                          width:
                            44,

                          height:
                            32,

                          border:
                            "none",

                          background:
                            "transparent",

                        }}

                      />


                      <input

                        value={
                          activeBg.color ||
                          "#020617"
                        }

                        onChange={
                          event =>
                            updateActiveBackground({
                              color:
                                event.target
                                  .value,
                            })
                        }

                        style={{

                          flex:
                            1,

                          minWidth:
                            0,

                          background:
                            "#0f0f0f",

                          border:
                            "1px solid #333",

                          color:
                            "#ddd",

                          padding:
                            "6px 8px",

                          borderRadius:
                            8,

                        }}

                      />

                    </div>

                  )}


                  {activeBg.kind ===
                    "image" && (

                    <>

                      <div
                        style={{
                          marginBottom:
                            10,
                        }}
                      >

                        <div
                          style={{
                            color:
                              "#888",

                            marginBottom:
                              6,

                          }}
                        >
                          Image URL
                        </div>


                        <input

                          value={
                            activeBg.imageUrl ||
                            ""
                          }

                          onChange={
                            event =>
                              updateActiveBackground({
                                imageUrl:
                                  event.target
                                    .value,
                              })
                          }

                          placeholder=
                            "https://..."

                          style={{

                            width:
                              "100%",

                            boxSizing:
                              "border-box",

                            background:
                              "#0f0f0f",

                            border:
                              "1px solid #333",

                            color:
                              "#ddd",

                            padding:
                              "6px 8px",

                            borderRadius:
                              8,

                          }}

                        />

                      </div>


                      <div>

                        <div
                          style={{
                            color:
                              "#888",

                            marginBottom:
                              6,
                          }}
                        >
                          Size / Repeat
                        </div>


                        <select

                          value={
                            activeBg.size ||
                            "cover"
                          }

                          onChange={
                            event =>
                              updateActiveBackground({
                                size:
                                  event.target
                                    .value,
                              })
                          }

                          style={{

                            width:
                              "100%",

                            background:
                              "#0f0f0f",

                            border:
                              "1px solid #333",

                            color:
                              "#ddd",

                            padding:
                              "6px 8px",

                            borderRadius:
                              8,

                          }}
                        >

                          <option value="cover">
                            Cover
                          </option>

                          <option value="contain">
                            Contain
                          </option>

                          <option value="repeat">
                            Repeat
                          </option>

                        </select>

                      </div>

                    </>

                  )}

                </DraggablePanel>

              )}


              {/* =================================================
                  DEBUG PANEL
              ================================================= */}

              {showDebug && (

                <DraggablePanel

                  title={
                    `Debug (${panelTargetRole})`
                  }

                  onClose={
                    () =>
                      setShowDebug(
                        false
                      )
                  }

                  initial={{

                    x:
                      isMobile
                        ? 12
                        : 340,

                    y:
                      isMobile
                        ? 70
                        : 120,

                  }}

                  width={

                    isMobile

                      ? Math.min(
                          320,
                          window.innerWidth -
                            24
                        )

                      : 320

                  }

                >

                  <div
                    style={{

                      color:
                        "#999",

                      marginBottom:
                        8,

                      fontFamily:
                        "system-ui",

                    }}
                  >

                    Selected:{" "}

                    {activeSelectedId ||
                      "None"}

                  </div>


                  <div
                    style={{

                      fontFamily:
                        "monospace",

                      fontSize:
                        11,

                    }}
                  >

                    <DebugBindingsPanel

                      selectedId={
                        activeSelectedId
                      }

                      role={
                        panelTargetRole
                      }

                    />

                  </div>

                </DraggablePanel>

              )}

            </div>

          </div>

        )}


        {/* =================================================
            SETTINGS
        ================================================= */}

        {currentView ===
          "settings" && (

          <div
            style={{

              flex:
                1,

              minWidth:
                0,

              minHeight:
                0,

              display:
                "flex",

              overflow:
                "hidden",

              backgroundColor:
                "#0f0f0f",

            }}
          >

            <div
              style={{

                width:
                  isMobile
                    ? 150
                    : 220,

                flexShrink:
                  0,

                borderRight:
                  "1px solid #242424",

                background:
                  "#121212",

                padding:
                  isMobile
                    ? 10
                    : 14,

                overflowY:
                  "auto",

                boxSizing:
                  "border-box",

              }}
            >

              <div
                style={{

                  fontSize:
                    11,

                  fontWeight:
                    700,

                  color:
                    "#777",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.05em",

                  marginBottom:
                    10,

                }}
              >

                Settings

              </div>


              <div
                style={{

                  fontSize:
                    10,

                  fontWeight:
                    700,

                  color:
                    "#555",

                  textTransform:
                    "uppercase",

                  marginBottom:
                    5,

                }}
              >

                Workspace

              </div>


              <button

                type="button"

                onClick={() =>
                  setSettingsSection(
                    "team"
                  )
                }

                style={{

                  width:
                    "100%",

                  textAlign:
                    "left",

                  padding:
                    "9px 10px",

                  border:
                    "none",

                  borderRadius:
                    7,

                  background:
                    settingsSection ===
                    "team"

                      ? "#242424"

                      : "transparent",

                  color:
                    settingsSection ===
                    "team"

                      ? "#fff"

                      : "#aaa",

                  cursor:
                    "pointer",

                  marginBottom:
                    4,

                }}
              >

                Team & Members

              </button>


              <div
                style={{

                  fontSize:
                    10,

                  fontWeight:
                    700,

                  color:
                    "#555",

                  textTransform:
                    "uppercase",

                  marginTop:
                    16,

                  marginBottom:
                    5,

                }}
              >

                Project

              </div>


              <button

                type="button"

                onClick={() =>
                  setSettingsSection(
                    "project"
                  )
                }

                style={{

                  width:
                    "100%",

                  textAlign:
                    "left",

                  padding:
                    "9px 10px",

                  border:
                    "none",

                  borderRadius:
                    7,

                  background:
                    settingsSection ===
                    "project"

                      ? "#242424"

                      : "transparent",

                  color:
                    settingsSection ===
                    "project"

                      ? "#fff"

                      : "#aaa",

                  cursor:
                    "pointer",

                }}
              >

                Project Settings

              </button>

            </div>


            <div
              style={{

                flex:
                  1,

                minWidth:
                  0,

                minHeight:
                  0,

                overflow:
                  "auto",

              }}
            >

              {settingsSection ===
                "team" && (

                <TenantTeamSettings />

              )}


              {settingsSection ===
                "project" && (

                <div
                  style={{

                    padding:
                      isMobile
                        ? 12
                        : 20,

                    maxWidth:
                      1100,

                    boxSizing:
                      "border-box",

                  }}
                >

                  <div
                    style={{

                      marginBottom:
                        20,

                    }}
                  >

                    <h2
                      style={{
                        margin:
                          0,
                      }}
                    >
                      Project Settings
                    </h2>


                    <div
                      style={{

                        marginTop:
                          6,

                        color:
                          "#777",

                        fontSize:
                          13,

                      }}
                    >

                      Settings for the
                      currently selected
                      project.

                    </div>

                  </div>


                  <InterviewConfigurationPanel />

                </div>

              )}

            </div>

          </div>

        )}


        {/* =================================================
            CALLS
        ================================================= */}

        {currentView ===
          "calls" && (

          <div
            style={{

              flex:
                1,

              minWidth:
                0,

              minHeight:
                0,

              overflow:
                "auto",

            }}
          >

            <CallsPortal />

          </div>

        )}

      </div>

    </div>

  );

}