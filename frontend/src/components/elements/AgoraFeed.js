import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../../services/api";
import "../../css/AgoraFeed.css";

export default function AgoraFeed(props) {
  const {
    tokenEndpoint = "/agora/token",

    autoJoin = true,
    publishLocal = true,
    preview = true,

    muted = false,
    cameraOff = false,

    mirror = true,
    objectFit = "cover",
    borderRadius = 12,
    style = {},
  } = props;

  const remoteRef = useRef(null);
  const localRef = useRef(null);

  const clientRef = useRef(null);
  const tracksRef = useRef({ audio: null, video: null });

  const [joined, setJoined] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [error, setError] = useState(null);

  const [session, setSession] = useState({
    appId: null,
    channel: null,
    uid: null,
    token: null,
  });

  /* --------------------------------------------
   * Logging helper
   * ------------------------------------------ */
  const log = (...args) => console.log("[AgoraFeed]", ...args);

  /* --------------------------------------------
   * Init client ONCE
   * ------------------------------------------ */
  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });
    log("Client created");
  }

  const client = clientRef.current;

  /* --------------------------------------------
   * STEP 1 — Local Preview (NO JOIN)
   * ------------------------------------------ */
  useEffect(() => {
    if (!preview || joined || !localRef.current) return;

    let alive = true;

    const startPreview = async () => {
      try {
        log("Starting local preview");

        const audio = await AgoraRTC.createMicrophoneAudioTrack();
        const video = await AgoraRTC.createCameraVideoTrack();

        if (!alive) return;

        await audio.setEnabled(!muted);
        await video.setEnabled(!cameraOff);

        tracksRef.current = { audio, video };
        video.play(localRef.current, { fit: objectFit });

        log("Local preview active");
      } catch (e) {
        console.error("[AgoraFeed] Preview error", e);
        setError("Camera or microphone access denied");
      }
    };

    startPreview();

    return () => {
      alive = false;
      const { audio, video } = tracksRef.current;
      audio?.stop();
      audio?.close();
      video?.stop();
      video?.close();
      tracksRef.current = { audio: null, video: null };
      log("Preview cleaned up");
    };
  }, [preview, joined, muted, cameraOff, objectFit]);

  /* --------------------------------------------
   * STEP 2 — Fetch Agora Token
   * ------------------------------------------ */
  useEffect(() => {
    if (!autoJoin) return;

    const fetchToken = async () => {
      try {
        log("Fetching Agora token…");

        const { data } = await api.get(tokenEndpoint, {
          params: {channel: "test-call"}
        });

        log("Token received", data);

        setSession({
          appId: data.appId,
          channel: data.channel || "test-call",
          uid: data.uid,
          token: data.token,
        });
      } catch (e) {
        console.error("[AgoraFeed] token error", e);
        setError("Failed to fetch Agora token");
      }
    };

    fetchToken();
  }, [autoJoin, tokenEndpoint]);

  /* --------------------------------------------
   * STEP 3 — Join Channel + Publish
   * ------------------------------------------ */
  useEffect(() => {
    const { appId, channel, token, uid } = session;
    if (!appId || !channel || !token) return;

    let alive = true;

    const cleanup = async () => {
      try {
        client.removeAllListeners();

        const { audio, video } = tracksRef.current;
        audio?.stop();
        audio?.close();
        video?.stop();
        video?.close();
        tracksRef.current = { audio: null, video: null };

        if (client.connectionState !== "DISCONNECTED") {
          await client.leave();
          log("Client left channel");
        }
      } catch (e) {
        log("Cleanup error", e);
      } finally {
        if (alive) {
          setJoined(false);
          setRemoteJoined(false);
        }
      }
    };

    const join = async () => {
      try {
        setError(null);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === "video" && remoteRef.current) {
            user.videoTrack.play(remoteRef.current, { fit: objectFit });
            setRemoteJoined(true);
          }

          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", (_, mediaType) => {
          if (mediaType === "video") setRemoteJoined(false);
        });

        log("Joining channel", channel);
        await client.join(appId, channel, token, uid);
        if (!alive) return;

        setJoined(true);

        if (publishLocal) {
          const audio = await AgoraRTC.createMicrophoneAudioTrack();
          const video = await AgoraRTC.createCameraVideoTrack();

          tracksRef.current = { audio, video };

          await audio.setEnabled(!muted);
          await video.setEnabled(!cameraOff);

          video.play(localRef.current, { fit: objectFit });
          await client.publish([audio, video]);

          log("Local tracks published");
        }
      } catch (e) {
        console.error("[AgoraFeed] Join error", e);
        setError(e.message || "Agora error");
        await cleanup();
      }
    };

    join();

    return () => {
      alive = false;
      cleanup();
    };
  }, [session, publishLocal, muted, cameraOff, objectFit]);

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
      {/* Remote */}
      <div
        ref={remoteRef}
        style={{
          width: "100%",
          height: "100%",
          transform: mirror ? "scaleX(-1)" : "none",
        }}
      />

      {/* Local */}
      {(preview || publishLocal) && (
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

      {!joined && !error && session.appId && (
        <Overlay>Connecting…</Overlay>
      )}

      {joined && !remoteJoined && (
        <Overlay>Waiting for other participant…</Overlay>
      )}

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
        color: error ? "tomato" : "#aaa",
        fontSize: 12,
        padding: 10,
        textAlign: "center",
        background: "rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </div>
  );
}
