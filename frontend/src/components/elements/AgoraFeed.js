// src/components/elements/AgoraFeed.js

import React, { useEffect, useRef } from "react";
import { useActionContext } from "../../context/ActionContext";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { bindActions } from "../../utils/actionBinder";
import { runAction } from "../../utils/actionExecutor";

import {
  Video,
  Square,
  Play,
  Volume,
  VolumeX,
} from "lucide-react";

export default function AgoraFeed(props) {
  const {
    id,

    // 🔥 strip runtime/config props so they never hit DOM
    appId,
    tokenEndpoint,
    autoJoin,
    publishLocal,
    cameraOff,
    emitAction,

    meta = {},
    style = {},

    borderRadius = 12,
    objectFit = "cover",
    mirror = true,

    ...domProps
  } = props;

  // =====================================================
  // CONTEXT
  // =====================================================

  const actionCtx = useActionContext();

  const runRuntimeAction =
    actionCtx?.runRuntimeAction || (() => {});

  // =====================================================
  // RUNTIME STATE
  // =====================================================

  const joined =
    useRuntimeValue("call.joined");

  const remoteUsers =
    useRuntimeValue("users.remoteUsers") || {};

  const micEnabled =
    useRuntimeValue("media.micEnabled");

  const videoEnabled =
    useRuntimeValue("media.videoEnabled");

  const binding =
    useRuntimeValue(`bindings.${id}`);

  const localRef = useRef(null);
  const remoteRef = useRef(null);

  // =====================================================
  // AUTO JOIN / LEAVE
  // =====================================================

  useEffect(() => {
    if (!autoJoin) return;

    runRuntimeAction("agora.joinCall", {
      channel:
        meta.channel || "test-call",

      tokenEndpoint:
        meta.tokenEndpoint ||
        tokenEndpoint ||
        "/agora/token",
    });

    return () => {
      runRuntimeAction("agora.leaveCall");
    };
  }, [
    autoJoin,
    runRuntimeAction,
    meta.channel,
    meta.tokenEndpoint,
    tokenEndpoint,
  ]);

  // =====================================================
  // REMOTE VIDEO
  // =====================================================

  useEffect(() => {
    const users =
      Object.values(remoteUsers);

    const firstUser = users[0];

    if (
      !firstUser?.videoTrack ||
      !remoteRef.current
    ) {
      return;
    }

    try {
      firstUser.videoTrack.play(
        remoteRef.current
      );
    } catch (err) {
      console.warn(
        "[AgoraFeed] remote play failed",
        err
      );
    }
  }, [remoteUsers]);

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleAction = async (
    actionName
  ) => {
    await runAction(
      actionName,
      actionCtx,
      {
        targetId: id,
      }
    );
  };

  // =====================================================
  // UI CONFIG
  // =====================================================

  const videoActions = [
    "agora.joinCall",
    "agora.leaveCall",
    "agora.toggleVideo",
    "agora.toggleMic",
  ];

  const iconMap = {
    "agora.joinCall": Video,
    "agora.leaveCall": Square,
    "agora.toggleVideo": Play,
    "agora.toggleMic":
      micEnabled
        ? Volume
        : VolumeX,
  };

  const hasRemoteVideo =
    Object.keys(remoteUsers).length > 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      {...bindActions(
        meta,
        actionCtx,
        id
      )}
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
      {/* REMOTE VIDEO */}

      <div
        ref={remoteRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
        }}
      />

      {/* LOCAL VIDEO */}

      <div
        style={{
          position: "absolute",
          bottom: "4%",
          right: "4%",
          width: "25%",
          height: "25%",
          borderRadius: 8,
          overflow: "hidden",
          background: "#000",
          border: "1px solid #333",
        }}
      >
        <div
          ref={localRef}
          style={{
            width: "100%",
            height: "100%",
            transform:
              mirror
                ? "scaleX(-1)"
                : "none",
          }}
        />

        {!videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-60">
            Camera off
          </div>
        )}
      </div>

      {!hasRemoteVideo && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-60">
          Waiting for participant
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex gap-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
        {videoActions.map(
          (actionName) => {
            const Icon =
              iconMap[actionName];

            if (!Icon) return null;

            return (
              <button
                key={`${id}-${actionName}`}
                className="p-1.5 text-white hover:bg-white/20 rounded"
                onClick={() =>
                  handleAction(
                    actionName
                  )
                }
              >
                <Icon size={14} />
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}