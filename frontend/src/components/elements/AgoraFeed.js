import React, { useEffect, useRef, useMemo } from "react";
import { useActionContext } from "../../context/ActionContext";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useReactiveBindings } from "../../hooks/useReactiveBindings";
import { bindActions } from "../../utils/actionBinder";

import { Video, Square, Play, Volume, VolumeX } from "lucide-react";

export default function AgoraFeed(props) {
  const {
    id,
    meta = {},
    style = {},
    borderRadius = 12,
    objectFit = "cover",
    mirror = true,
    autoJoin = false,
    tokenEndpoint,
    ...domProps
  } = props;

  // =====================================================
  // CONTEXT
  // =====================================================
  const { runRuntimeAction } = useActionContext();

  // =====================================================
  // RUNTIME STATE (FLAT)
  // =====================================================
  const remoteUsers = useRuntimeValue("users.remoteUsers") || {};
  const micEnabled = useRuntimeValue("media.micEnabled");
  const videoEnabled = useRuntimeValue("media.videoEnabled");

  // =====================================================
  // REACTIVE BINDING (SINGLE SOURCE)
  // =====================================================
  const channel =
  useRuntimeValue("call.channel");

  const appId =
    useRuntimeValue("agora.appId");

  const uid =
    useRuntimeValue("user.id");

  // =====================================================
  // REFS
  // =====================================================
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  // =====================================================
  // AUTO JOIN (SAFE + DETERMINISTIC)
  // =====================================================
  useEffect(() => {
    if (!autoJoin) return;
    if (!channel) return;

    runRuntimeAction("agora.joinCall", {
      channel,
      tokenEndpoint: meta.tokenEndpoint || tokenEndpoint,
    });

    return () => {
      runRuntimeAction("agora.leaveCall");
    };
  }, [autoJoin, channel]);

  // =====================================================
  // REMOTE VIDEO
  // =====================================================
  useEffect(() => {
    const users = Object.values(remoteUsers);
    const first = users[0];

    if (!first?.videoTrack || !remoteRef.current) return;

    first.videoTrack.play(remoteRef.current);
  }, [remoteUsers]);

  // =====================================================
  // ACTION HANDLER
  // =====================================================
  const handleAction = (actionName) => {
    runRuntimeAction(actionName, {
      channel,
      appId,
      uid,
      targetId: id,
    });
  };

  // =====================================================
  // UI ACTIONS
  // =====================================================
  const videoActions = useMemo(
    () => [
      "agora.joinCall",
      "agora.leaveCall",
      "agora.toggleVideo",
      "agora.toggleMic",
    ],
    []
  );

  const iconMap = {
    "agora.joinCall": Video,
    "agora.leaveCall": Square,
    "agora.toggleVideo": Play,
    "agora.toggleMic": micEnabled ? Volume : VolumeX,
  };

  const hasRemote = Object.keys(remoteUsers).length > 0;

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div
      {...bindActions(meta, null, id)}
      {...domProps}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#000",
        overflow: "hidden",
        borderRadius,
      }}
    >
      {/* REMOTE */}
      <div
        ref={remoteRef}
        style={{ width: "100%", height: "100%", objectFit }}
      />

      {/* LOCAL */}
      <div
        style={{
          position: "absolute",
          bottom: "4%",
          right: "4%",
          width: "25%",
          height: "25%",
          background: "#000",
          border: "1px solid #333",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          ref={localRef}
          style={{
            width: "100%",
            height: "100%",
            transform: mirror ? "scaleX(-1)" : "none",
          }}
        />

        {!videoEnabled && (
          <div style={{ position: "absolute", inset: 0, color: "#fff" }}>
            Camera off
          </div>
        )}
      </div>

      {!hasRemote && (
        <div style={{ position: "absolute", inset: 0, color: "#fff" }}>
          Waiting for participant
        </div>
      )}

      {/* CONTROLS */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          display: "flex",
          gap: 8,
          background: "rgba(0,0,0,0.6)",
          padding: 6,
          borderRadius: 8,
        }}
      >
        {videoActions.map((a) => {
          const Icon = iconMap[a];
          if (!Icon) return null;

          return (
            <button
              key={`${id}-${a}`}
              onClick={() => handleAction(a)}
              style={{ color: "white" }}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}