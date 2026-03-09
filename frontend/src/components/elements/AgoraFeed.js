// src/components/elements/AgoraFeed.js
import React, { useRef, useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../../services/api";
import "../../css/AgoraFeed.css";

export default function AgoraFeed({
  // Runtime props
  tokenEndpoint = "/agora/token",
  channel = "test-call",
  muted = false,
  cameraOff = false,
  autoJoin = false,
  publishLocal = true,

  // Build/visual props
  mirror = true,
  objectFit = "cover",
  borderRadius = 12,
  style = {},

  // Universal action system
  emit,
  id, // element id
}) {
  const remoteRef = useRef(null);
  const localRef = useRef(null);
  const clientRef = useRef(null);
  const tracksRef = useRef({ audio: null, video: null });

  const [joined, setJoined] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  /* --------------------------------------------
   * Init Agora client ONCE
   * ------------------------------------------ */
  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    console.log("[AgoraFeed] Client created");
  }
  const client = clientRef.current;

  /* --------------------------------------------
   * Emit helper
   * ------------------------------------------ */
  const emitEvent = (eventName, payload = {}) => {
    if (typeof emit === "function") {
      emit(eventName, { ...payload, elementId: id });
    }
  };

  /* --------------------------------------------
   * Join call
   * ------------------------------------------ */
  const handleJoin = async () => {
    if (joining || joined) return;

    setJoining(true);
    setError(null);

    try {
      console.log("[AgoraFeed] Fetching token…");
      const { data } = await api.get(tokenEndpoint, { params: { channel } });
      const { appId, token, uid } = data;
      console.log("[AgoraFeed] Token received");

      // Create tracks
      const audio = await AgoraRTC.createMicrophoneAudioTrack();
      const video = await AgoraRTC.createCameraVideoTrack();
      await audio.setEnabled(!muted);
      await video.setEnabled(!cameraOff);
      tracksRef.current = { audio, video };

      // Join channel
      await client.join(appId, channel, token, uid);

      // Subscribe to remote users
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && remoteRef.current) {
          user.videoTrack.play(remoteRef.current, { fit: objectFit });
          setRemoteJoined(true);
          emitEvent("RemoteJoined", { uid: user.uid, mediaType });
        }
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.on("user-unpublished", (_, mediaType) => {
        if (mediaType === "video") {
          setRemoteJoined(false);
          emitEvent("RemoteLeft", { mediaType });
        }
      });

      // Play local preview if publishing
      if (publishLocal) video.play(localRef.current, { fit: objectFit });

      // Publish local tracks if enabled
      if (publishLocal) await client.publish([audio, video]);

      setJoined(true);
      emitEvent("JoinedCall", { uid, channel });
      console.log("[AgoraFeed] Joined + published");
    } catch (err) {
      console.error("[AgoraFeed] Join error", err);
      setError(err.message || "Failed to join call");
      emitEvent("JoinError", { error: err.message || err });
      await cleanup();
    } finally {
      setJoining(false);
    }
  };

  /* --------------------------------------------
   * Cleanup / leave
   * ------------------------------------------ */
  const cleanup = async () => {
    try {
      client.removeAllListeners();
      const { audio, video } = tracksRef.current;
      audio?.stop();
      audio?.close();
      video?.stop();
      video?.close();
      tracksRef.current = { audio: null, video: null };
      if (client.connectionState !== "DISCONNECTED") await client.leave();
      emitEvent("LeftCall", { channel });
    } catch (e) {
      console.warn("[AgoraFeed] Cleanup error", e);
    } finally {
      setJoined(false);
      setRemoteJoined(false);
    }
  };

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------
   * Auto-join if requested
   * ------------------------------------------ */
  useEffect(() => {
    if (autoJoin) handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoin]);

  /* --------------------------------------------
   * Mic / Camera toggles
   * ------------------------------------------ */
  useEffect(() => {
    tracksRef.current.audio?.setEnabled(!muted).catch(() => {});
    emitEvent("MicToggled", { muted });
  }, [muted]);

  useEffect(() => {
    tracksRef.current.video?.setEnabled(!cameraOff).catch(() => {});
    emitEvent("CameraToggled", { cameraOff });
  }, [cameraOff]);

  /* --------------------------------------------
   * Render
   * ------------------------------------------ */
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius,
        backgroundColor: "#000",
        ...style,
      }}
    >
      {/* Remote video */}
      <div
        ref={remoteRef}
        style={{
          width: "100%",
          height: "100%",
          transform: mirror ? "scaleX(-1)" : "none",
        }}
      />

      {/* Local preview */}
      {joined && publishLocal && (
        <div
          ref={localRef}
          className="agora_video_player"
          style={{
            position: "absolute",
            right: 5,
            bottom: 5,
            width: "35%",
            height: "35%",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "#000",
            transform: mirror ? "scaleX(-1)" : "none",
          }}
        />
      )}

      {/* Overlay states */}
      {!joined && !error && !autoJoin && (
        <Overlay>
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            {joining ? "Connecting…" : "Join Call"}
          </button>
        </Overlay>
      )}

      {joined && !remoteJoined && <Overlay>Waiting for other participant…</Overlay>}
      {error && <Overlay error>{error}</Overlay>}
    </div>
  );
}

/* --------------------------------------------
 * Overlay helper
 * ------------------------------------------ */
function Overlay({ children, error }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: error ? "tomato" : "#fff",
        fontSize: 12,
        padding: 10,
        textAlign: "center",
        background: "rgba(0,0,0,0.6)",
        zIndex: 5,
      }}
    >
      {children}
    </div>
  );
}
