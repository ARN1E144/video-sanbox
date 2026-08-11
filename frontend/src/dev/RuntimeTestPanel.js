
// src/dev/RuntimeTestPanel.js

import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import RuntimeStatusPanel from "./panels/RuntimeStatusPanel";
import CallControlsPanel from "./panels/CallControlsPanel";
import CallsPanel from "../components/call/CallsPanel";

export default function RuntimeTestPanel() {
  const runtime = useRuntimeState();

  // =====================================================
  // RESPONSIVE STATE
  // =====================================================

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 600
  );

  const [isOpen, setIsOpen] = useState(
    window.innerWidth > 600
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth <= 600;

      setIsMobile(mobile);

      // Automatically open on desktop.
      if (!mobile) {
        setIsOpen(true);
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

  const [position, setPosition] = useState({
    x:
      window.innerWidth > 600
        ? Math.max(
            20,
            window.innerWidth - 440
          )
        : 12,

    y: 80,
  });

  const dragRef = useRef({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  const handleDragStart = (e) => {
    // Don't drag from mobile close button.
    if (
      e.target.closest(
        "[data-debug-close]"
      )
    ) {
      return;
    }

    dragRef.current.dragging = true;

    dragRef.current.offsetX =
      e.clientX - position.x;

    dragRef.current.offsetY =
      e.clientY - position.y;

    document.addEventListener(
      "pointermove",
      handleDragging
    );

    document.addEventListener(
      "pointerup",
      handleDragEnd
    );
  };

  const handleDragging = (e) => {
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
      x: Math.max(
        8,
        Math.min(
          nextX,
          window.innerWidth -
            panelWidth -
            8
        )
      ),

      y: Math.max(
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

  const handleDragEnd = () => {
    dragRef.current.dragging = false;

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

  const dumpRuntime = () => {
    console.group(
      "FULL RUNTIME SNAPSHOT"
    );

    console.log(
      runtime.getAll()
    );

    console.groupEnd();
  };

  // =====================================================
  // MOBILE DEBUG BUTTON
  // =====================================================

  if (isMobile && !isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,

          width: 44,
          height: 44,

          borderRadius: "50%",

          border:
            "1px solid rgba(255,255,255,.2)",

          background:
            "rgba(20,20,20,.92)",

          color: "#fff",

          fontSize: 20,

          cursor: "pointer",

          zIndex: 999999,

          boxShadow:
            "0 4px 16px rgba(0,0,0,.4)",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Open Runtime Test Panel"
        title="Open Runtime Test Panel"
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
        position: "fixed",

        left: isMobile
          ? 12
          : position.x,

        top: isMobile
          ? 12
          : position.y,

        width: isMobile
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

        background: "#1d1d1d",

        color: "#fff",

        borderRadius: 12,

        padding: 16,

        zIndex: 999999,

        fontFamily: "monospace",

        boxShadow:
          "0 10px 30px rgba(0,0,0,.45)",

        display: "flex",

        flexDirection: "column",

        boxSizing: "border-box",
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

          userSelect: "none",

          fontWeight: "bold",

          marginBottom: 12,

          display: "flex",

          alignItems: "center",

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
              setIsOpen(false);
            }}
            style={{
              border: "none",

              background:
                "rgba(255,255,255,.08)",

              color: "#fff",

              borderRadius: 6,

              width: 32,

              height: 32,

              cursor: "pointer",

              fontSize: 18,
            }}
            aria-label="Close Runtime Test Panel"
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
          overflowY: "auto",

          overflowX: "hidden",

          paddingRight: 8,

          minHeight: 0,

          WebkitOverflowScrolling:
            "touch",
        }}
      >

        <RuntimeStatusPanel />

        <hr />

        <CallControlsPanel />

        <hr />

        <CallsPanel />

        <hr />

        <button
          onClick={dumpRuntime}
          style={{
            width: "100%",

            marginTop: 12,

            minHeight: 36,

            cursor: "pointer",
          }}
        >
          Dump Runtime
        </button>

      </div>

    </div>
  );
}
