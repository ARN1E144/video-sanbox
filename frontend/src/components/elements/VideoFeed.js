// src/components/elements/VideoFeed.js
import React, { useEffect, useRef, useState } from "react";

export default function VideoFeed(props) {
  const {
    mode = "auto",       // "auto" | "local" | "remote"
    src,                 // remote stream URL
    deviceId,            // camera deviceId
    enabled = true,      // when false we HARD stop the camera
    playing = true,      // play / pause (render only, doesn't kill tracks)
    muted = true,
    mirror = true,
    objectFit = "cover",
    borderRadius = 12,
    style = {},
    ...rest
  } = props;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main effect: decide whether to use local camera or remote URL
  useEffect(() => {
    const videoEl = videoRef.current;

    // If disabled, *always* stop camera + pause video
    if (!enabled) {
      stopStream();
      if (videoEl) {
        videoEl.pause();
      }
      return;
    }

    // Remote mode → no local camera, just use src
    if (mode === "remote") {
      // make sure local camera is fully stopped
      stopStream();

      if (videoEl) {
        videoEl.srcObject = null;

        if (src) {
          videoEl.src = src;
        }

        if (playing && src) {
          videoEl
            .play()
            .catch((err) => console.warn("Video play failed", err));
        } else {
          videoEl.pause();
        }
      }
      return;
    }

    // Local / auto camera

    // If not playing, just pause the element but keep any active stream alive.
    // This means toggling playback doesn't re-request getUserMedia.
    if (!playing) {
      if (videoEl) {
        videoEl.pause();
      }
      return;
    }

    // At this point: enabled === true, playing === true, and mode is "auto" or "local"
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // If we already have a stream, just attach it and play
        if (streamRef.current && videoEl) {
          videoEl.srcObject = streamRef.current;
          try {
            await videoEl.play();
          } catch (e) {
            // ignore
          }
          setError(null);
          return;
        }

        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        if (deviceId) {
          constraints.video.deviceId = { exact: deviceId };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          // If effect cleaned up before we got the stream, stop it immediately
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoEl) {
          videoEl.srcObject = stream;
          // muted is handled in a separate effect, but set once here as a sane default
          videoEl.muted = muted;
          try {
            await videoEl.play();
          } catch (e) {
            // ignore
          }
        }

        setError(null);
      } catch (err) {
        console.error("getUserMedia failed:", err);
        setError(err.message || "Camera error");
      }
    })();

    // On deps change we only cancel the async; actual track cleanup is handled
    // either by `enabled=false`, `mode==="remote"`, or unmount effect.
    return () => {
      cancelled = true;
    };
    // NOTE: we intentionally do NOT depend on `muted` here so mute doesn't
    // re-run getUserMedia or touch the stream.
  }, [mode, src, deviceId, enabled, playing]);

  // Mute effect: ONLY toggles audio behavior, never touches the stream lifecycle.
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Mute/unmute HTMLMediaElement
    videoEl.muted = muted;

    // If/when we add audio tracks, toggle them here as well.
    if (streamRef.current && typeof streamRef.current.getAudioTracks === "function") {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !muted;
      });
    }
  }, [muted]);

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
      {...rest}
    >
      <video
        ref={videoRef}
        playsInline
        // Keep muted prop too so initial render is consistent;
        // runtime toggling is handled in the mute effect.
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          transform: mirror ? "scaleX(-1)" : "none",
        }}
      />

      {/* Optional overlays */}
      {!enabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontSize: 12,
          }}
        >
          Camera off
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            color: "tomato",
            fontSize: 12,
            padding: 8,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
