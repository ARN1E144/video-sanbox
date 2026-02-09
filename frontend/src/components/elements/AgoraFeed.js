import React, { useRef, useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../../services/api";
import "../../css/AgoraFeed.css";

export default function AgoraFeed({
  tokenEndpoint = "/agora/token",
  channel = "test-call",

  muted = false,
  cameraOff = false,

  mirror = true,
  objectFit = "cover",
  borderRadius = 12,
  style = {},
  autoJoin = false, // new prop
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
   * Init client ONCE
   * ------------------------------------------ */
  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    console.log("[AgoraFeed] Client created");
  }
  const client = clientRef.current;

  /* --------------------------------------------
   * Join call (USER GESTURE REQUIRED)
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
        }
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.on("user-unpublished", (_, mediaType) => {
        if (mediaType === "video") setRemoteJoined(false);
      });

      // Play local video preview
      video.play(localRef.current, { fit: objectFit });

      // Publish local tracks
      await client.publish([audio, video]);
      setJoined(true);
      console.log("[AgoraFeed] Joined + published");
    } catch (err) {
      console.error("[AgoraFeed] Join error", err);
      setError(err.message || "Failed to join call");
      await cleanup();
    } finally {
      setJoining(false);
    }
  };

  /* --------------------------------------------
   * Cleanup
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
   * Auto-join (only if explicitly requested)
   * ------------------------------------------ */
  useEffect(() => {
    if (autoJoin) {
      handleJoin();
    }
  }, [autoJoin]);

  /* --------------------------------------------
   * Mic / Camera toggles
   * ------------------------------------------ */
  useEffect(() => {
    tracksRef.current.audio?.setEnabled(!muted).catch(() => {});
  }, [muted]);

  useEffect(() => {
    tracksRef.current.video?.setEnabled(!cameraOff).catch(() => {});
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
        style={{ width: "100%", height: "100%", transform: mirror ? "scaleX(-1)" : "none" }}
      />

      {/* Local preview */}
      {joined && (
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
            style={{ padding: "8px 14px", fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer" }}
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
