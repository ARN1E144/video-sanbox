
// src/dev/RuntimeTestPanel.js

import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import {
  useActionContext,
} from "../context/ActionContext";

import {
  useProjectContext,
} from "../context/ProjectContext";

import RuntimeStatusPanel
  from "./panels/RuntimeStatusPanel";

import CallControlsPanel
  from "./panels/CallControlsPanel";

import CallsPanel
  from "../components/call/CallsPanel";

import InterviewControlsPanel
  from "./panels/InterviewControlsPanel";


// =====================================================
// FIND PROJECT ELEMENT BY SOURCE ID
// =====================================================
//
// Confo source:
//
// interview-video
//
// Installed project may contain:
//
// confo-interview-video-0-2
//
// We resolve the generated Canvas ID dynamically.
//
// =====================================================

function findElementBySourceId(
  node,
  sourceId
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  // ---------------------------------------------------
  // Direct sourceId match
  // ---------------------------------------------------

  if (
    node?.meta?.sourceId ===
    sourceId
  ) {

    return node;

  }


  // ---------------------------------------------------
  // Some older installed structures may preserve the
  // source ID in props.metadata.
  //
  // This is only a diagnostic fallback.
  // ---------------------------------------------------

  if (
    node?.props?.meta?.sourceId ===
    sourceId
  ) {

    return node;

  }


  // ---------------------------------------------------
  // Children
  // ---------------------------------------------------

  if (
    Array.isArray(
      node.children
    )
  ) {

    for (
      const child of node.children
    ) {

      const match =
        findElementBySourceId(
          child,
          sourceId
        );


      if (
        match
      ) {

        return match;

      }

    }

  }


  return null;

}


export default function RuntimeTestPanel() {

  // =====================================================
  // CONTEXT
  // =====================================================

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
    useActionContext();


  const {
    projectSchema,
    activeProject,
  } =
    useProjectContext();


  // =====================================================
  // PROJECT RUNTIME DIAGNOSTIC
  // =====================================================
  //
  // This is deliberately here while we stabilise the
  // project → runtime identity flow.
  //
  // Expected:
  //
  // activeProject
  //       ===
  // runtime.project.id
  //
  // =====================================================

  const runtimeProject =
    runtime.get?.(
      "project"
    );


  const runtimeProjectId =
    runtime.get?.(
      "project.id"
    );


  console.log(
    "[PROJECT RUNTIME TEST]",
    {
      activeProject,

      runtimeProject,

      runtimeProjectId,

    }
  );


  // =====================================================
  // STABLE CONFO SOURCE ID
  // =====================================================

  const VIDEO_FEED_SOURCE_ID =
    "interview-video";


  // =====================================================
  // RESOLVE CURRENT INSTALLED VIDEOFEED
  // =====================================================

  const videoFeedElement =
    findElementBySourceId(
      projectSchema?.tree,
      VIDEO_FEED_SOURCE_ID
    );


  const videoFeedId =
    videoFeedElement?.id ||
    null;


  // =====================================================
  // EXTRA VIDEO ELEMENT DEBUG
  // =====================================================

  console.log(
    "[RuntimeTest] VIDEOFEED RESOLUTION",
    {

      sourceId:
        VIDEO_FEED_SOURCE_ID,

      resolvedElement:
        videoFeedElement,

      resolvedId:
        videoFeedId,

      projectId:
        activeProject,

    }
  );


  // =====================================================
  // RESPONSIVE STATE
  // =====================================================

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    window.innerWidth <= 600
  );


  const [
    isOpen,
    setIsOpen,
  ] = useState(
    window.innerWidth > 600
  );


  useEffect(() => {

    const handleResize = () => {

      const mobile =
        window.innerWidth <= 600;


      setIsMobile(
        mobile
      );


      if (
        !mobile
      ) {

        setIsOpen(
          true
        );

      }

    };


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

  }, []);


  // =====================================================
  // DRAGGING
  // =====================================================

  const [
    position,
    setPosition,
  ] = useState({

    x:
      window.innerWidth > 600
        ? Math.max(
            20,
            window.innerWidth - 440
          )
        : 12,

    y:
      80,

  });


  const dragRef =
    useRef({

      dragging:
        false,

      offsetX:
        0,

      offsetY:
        0,

    });


  const handleDragStart =
    (e) => {

      if (
        e.target.closest(
          "[data-debug-close]"
        )
      ) {

        return;

      }


      dragRef.current.dragging =
        true;


      dragRef.current.offsetX =
        e.clientX -
        position.x;


      dragRef.current.offsetY =
        e.clientY -
        position.y;


      document.addEventListener(
        "pointermove",
        handleDragging
      );


      document.addEventListener(
        "pointerup",
        handleDragEnd
      );

    };


  const handleDragging =
    (e) => {

      if (
        !dragRef.current.dragging
      ) {

        return;

      }


      const panelWidth =
        isMobile
          ? window.innerWidth - 24
          : 420;


      const panelHeight =
        window.innerHeight * 0.9;


      const nextX =
        e.clientX -
        dragRef.current.offsetX;


      const nextY =
        e.clientY -
        dragRef.current.offsetY;


      setPosition({

        x:
          Math.max(
            8,
            Math.min(
              nextX,
              window.innerWidth -
                panelWidth -
                8
            )
          ),

        y:
          Math.max(
            8,
            Math.min(
              nextY,
              window.innerHeight -
                Math.min(
                  panelHeight,
                  window.innerHeight - 16
                )
            )
          ),

      });

    };


  const handleDragEnd =
    () => {

      dragRef.current.dragging =
        false;


      document.removeEventListener(
        "pointermove",
        handleDragging
      );


      document.removeEventListener(
        "pointerup",
        handleDragEnd
      );

    };


  // =====================================================
  // DEBUG SNAPSHOT
  // =====================================================

  const dumpRuntime =
    () => {

      console.group(
        "FULL RUNTIME SNAPSHOT"
      );


      console.log(
        runtime.getAll()
      );


      console.groupEnd();

    };


  // =====================================================
  // PROJECT RUNTIME DEBUG
  // =====================================================

  const dumpProjectRuntime =
    () => {

      console.group(
        "PROJECT RUNTIME DEBUG"
      );


      console.log(
        "[PROJECT RUNTIME TEST]",
        {

          activeProject,

          runtimeProject,

          runtimeProjectId,

          projectSchemaName:
            projectSchema?.name ||
            null,

          projectSchemaTree:
            projectSchema?.tree ||
            null,

        }
      );


      console.groupEnd();

    };


  // =====================================================
  // VIDEO TARGET VALIDATION
  // =====================================================

  const requireVideoFeed =
    () => {

      if (
        videoFeedId
      ) {

        return true;

      }


      console.warn(
        "[RuntimeTest] VideoFeed not found",
        {

          sourceId:
            VIDEO_FEED_SOURCE_ID,

          activeProject,

          projectRuntimeId:
            runtimeProjectId,

          projectTree:
            projectSchema?.tree,

        }
      );


      return false;

    };


  // =====================================================
  // VIDEO MIC TEST
  // =====================================================

  const toggleVideoFeedMic =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      console.log(
        "[RuntimeTest] Toggling VideoFeed microphone",
        {

          sourceId:
            VIDEO_FEED_SOURCE_ID,

          resolvedTargetId:
            videoFeedId,

        }
      );


      const result =
        await runAction(
          "video.toggleMic",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] video.toggleMic result:",
        result
      );

    };


  // =====================================================
  // VIDEO CAMERA TEST
  // =====================================================

  const toggleVideoFeedCamera =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      console.log(
        "[RuntimeTest] Toggling VideoFeed camera",
        {

          sourceId:
            VIDEO_FEED_SOURCE_ID,

          resolvedTargetId:
            videoFeedId,

        }
      );


      const result =
        await runAction(
          "video.toggleVideo",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] video.toggleVideo result:",
        result
      );

    };


  // =====================================================
  // START RECORDING
  // =====================================================

  const startVideoRecording =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      console.log(
        "[RuntimeTest] Starting VideoFeed recording",
        {

          sourceId:
            VIDEO_FEED_SOURCE_ID,

          resolvedTargetId:
            videoFeedId,

        }
      );


      const result =
        await runAction(
          "video.startRecording",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] startRecording result:",
        result
      );

    };


  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopVideoRecording =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      console.log(
        "[RuntimeTest] Stopping VideoFeed recording",
        {

          sourceId:
            VIDEO_FEED_SOURCE_ID,

          resolvedTargetId:
            videoFeedId,

        }
      );


      const result =
        await runAction(
          "video.stopRecording",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] stopRecording result:",
        result
      );

    };


  // =====================================================
  // MOBILE DEBUG BUTTON
  // =====================================================

  if (
    isMobile &&
    !isOpen
  ) {

    return (

      <button

        onClick={() => {
          setIsOpen(
            true
          );
        }}

        style={{

          position:
            "fixed",

          right:
            12,

          bottom:
            12,

          width:
            44,

          height:
            44,

          borderRadius:
            "50%",

          border:
            "1px solid rgba(255,255,255,.2)",

          background:
            "rgba(20,20,20,.92)",

          color:
            "#fff",

          fontSize:
            20,

          cursor:
            "pointer",

          zIndex:
            999999,

          boxShadow:
            "0 4px 16px rgba(0,0,0,.4)",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

        }}

        aria-label=
          "Open Runtime Test Panel"

        title=
          "Open Runtime Test Panel"

      >

        🔧

      </button>

    );

  }


  // =====================================================
  // PANEL
  // =====================================================

  return (

    <div

      style={{

        position:
          "fixed",

        left:
          isMobile
            ? 12
            : position.x,

        top:
          isMobile
            ? 12
            : position.y,

        width:
          isMobile
            ? "calc(100vw - 24px)"
            : window.innerWidth <= 900
              ? 340
              : 420,

        maxWidth:
          "calc(100vw - 24px)",

        maxHeight:
          isMobile
            ? "calc(100vh - 24px)"
            : "90vh",

        background:
          "#1d1d1d",

        color:
          "#fff",

        borderRadius:
          12,

        padding:
          16,

        zIndex:
          999999,

        fontFamily:
          "monospace",

        boxShadow:
          "0 10px 30px rgba(0,0,0,.45)",

        display:
          "flex",

        flexDirection:
          "column",

        boxSizing:
          "border-box",

      }}

    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div

        onPointerDown={
          isMobile
            ? undefined
            : handleDragStart
        }

        style={{

          cursor:
            isMobile
              ? "default"
              : "move",

          userSelect:
            "none",

          fontWeight:
            "bold",

          marginBottom:
            12,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

        }}

      >

        <span>
          Runtime Test Panel
        </span>


        {isMobile && (

          <button

            data-debug-close

            onClick={() => {
              setIsOpen(
                false
              );
            }}

            style={{

              border:
                "none",

              background:
                "rgba(255,255,255,.08)",

              color:
                "#fff",

              borderRadius:
                6,

              width:
                32,

              height:
                32,

              cursor:
                "pointer",

              fontSize:
                18,

            }}

            aria-label=
              "Close Runtime Test Panel"

          >

            ×

          </button>

        )}

      </div>


      {/* =================================================
          SCROLL CONTENT
      ================================================= */}

      <div

        style={{

          overflowY:
            "auto",

          overflowX:
            "hidden",

          paddingRight:
            8,

          minHeight:
            0,

          WebkitOverflowScrolling:
            "touch",

        }}

      >

        <RuntimeStatusPanel />

        <hr />


        {/* =================================================
            PROJECT RUNTIME DEBUG
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >
            Project Runtime
          </div>


          <div
            style={{
              fontSize:
                11,

              lineHeight:
                1.5,

              color:
                "#aaa",

              marginBottom:
                8,
            }}
          >

            Active Project:
            {" "}
            {activeProject ||
              "null"}

            <br />

            Runtime Project ID:
            {" "}
            {runtimeProjectId ||
              "null"}

            <br />

            Runtime Project Name:
            {" "}
            {runtimeProject?.name ||
              "null"}

          </div>


          <button

            onClick={
              dumpProjectRuntime
            }

            style={{

              width:
                "100%",

              minHeight:
                34,

              marginBottom:
                8,

              cursor:
                "pointer",

            }}

          >

            Debug Project Runtime

          </button>


          <div

            style={{

              fontSize:
                10,

              color:
                activeProject &&
                runtimeProjectId ===
                  activeProject

                  ? "#86efac"

                  : "#fca5a5",

            }}

          >

            {activeProject &&
            String(
              runtimeProjectId
            ) ===
              String(
                activeProject
              )

              ? "✓ Project identity synchronised"

              : "⚠ Project identity NOT synchronised"}

          </div>

        </div>


        <hr />


        {/* =================================================
            CALL CONTROLS
        ================================================= */}

        <CallControlsPanel />

        <hr />


        {/* =================================================
            AVAILABLE CALLS
        ================================================= */}

        <CallsPanel />

        <hr />


        {/* =================================================
            INTERVIEW CONTROLS
        ================================================= */}

        <InterviewControlsPanel />

        <hr />


        {/* =================================================
            VIDEOFEED MEDIA TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            VideoFeed Media Tests

          </div>


          <div
            style={{
              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.4,
            }}
          >

            Stable Confo source ID:
            {" "}
            {VIDEO_FEED_SOURCE_ID}

            <br />

            Resolved Canvas ID:
            {" "}
            {videoFeedId ||
              "Not found"}

          </div>


          {!videoFeedId && (

            <div
              style={{

                background:
                  "#3b1515",

                border:
                  "1px solid #7f1d1d",

                color:
                  "#fca5a5",

                padding:
                  10,

                borderRadius:
                  6,

                marginBottom:
                  10,

                fontSize:
                  11,

              }}
            >

              AI Interviewer VideoFeed is not
              currently installed in the project.

            </div>

          )}


          <button

            onClick={
              toggleVideoFeedMic
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test VideoFeed Mic Toggle

          </button>


          <button

            onClick={
              toggleVideoFeedCamera
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test VideoFeed Camera Toggle

          </button>


          <button

            onClick={
              startVideoRecording
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test Start Recording

          </button>


          <button

            onClick={
              stopVideoRecording
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test Stop Recording

          </button>


          <div
            style={{

              fontSize:
                10,

              color:
                "#777",

              marginTop:
                4,

              lineHeight:
                1.5,

            }}
          >

            Runtime actions:

            <br />

            video.toggleMic

            <br />

            video.toggleVideo

            <br />

            video.startRecording

            <br />

            video.stopRecording

          </div>

        </div>


        <hr />


        {/* =================================================
            FULL RUNTIME SNAPSHOT
        ================================================= */}

        <button

          onClick={
            dumpRuntime
          }

          style={{

            width:
              "100%",

            marginTop:
              12,

            minHeight:
              36,

            cursor:
              "pointer",

          }}

        >

          Dump Runtime

        </button>

      </div>

    </div>

  );

}

