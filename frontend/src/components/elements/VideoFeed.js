// src/components/elements/VideoFeed.js
import React, { useEffect, useRef, useState } from "react";

export default function VideoFeed(props) {
  const {
    mode = "auto", // "auto" | "local" | "remote"
    src, // remote URL (mp4/webm/m3u8)
    deviceId,
    enabled = true,
    playing = true,
    muted = true,
    mirror = true,
    objectFit = "cover",
    borderRadius = 12,
    style = {},
    ...rest
  } = props;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const hlsRef = useRef(null);

  const [error, setError] = useState(null);

  const isHlsUrl = (u) =>
    typeof u === "string" && /\.m3u8(\?.*)?$/i.test(u.trim());

  const destroyHls = () => {
    try {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const stopLocalStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.srcObject = null;
    }
  };

  const resetRemotePlayback = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    destroyHls();

    // stop any remote playback cleanly
    try {
      videoEl.pause();
    } catch {
      // ignore
    }

    // ensure src + srcObject are cleared
    videoEl.srcObject = null;
    videoEl.removeAttribute("src");
    videoEl.load();
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      destroyHls();
      stopLocalStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachRemote = async ({ videoEl, url }) => {
    if (!videoEl) return;

    // stop local camera
    stopLocalStream();

    // reset any previous remote pipeline
    resetRemotePlayback();

    videoEl.playsInline = true;
    videoEl.muted = muted;

    if (!url) {
      setError(null);
      return;
    }

    // HLS (.m3u8)
    if (isHlsUrl(url)) {
      const canNativeHls =
        typeof videoEl.canPlayType === "function" &&
        videoEl.canPlayType("application/vnd.apple.mpegurl") !== "";

      // Safari/iOS native HLS
      if (canNativeHls) {
        videoEl.src = url;
        videoEl.load();
        if (playing) {
          try {
            await videoEl.play();
          } catch {
            // autoplay may be blocked
          }
        } else {
          videoEl.pause();
        }
        setError(null);
        return;
      }

      // Chrome/Firefox/Edge: hls.js
      try {
        const mod = await import("hls.js");
        const Hls = mod.default || mod;

        if (!Hls?.isSupported?.()) {
          setError("HLS is not supported in this browser.");
          return;
        }

        const hls = new Hls();
        hlsRef.current = hls;

        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(url);
        });

        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data?.fatal) {
            setError(`HLS error: ${data?.type || "fatal"}`);
          }
        });

        if (playing) {
          // allow attach to settle
          setTimeout(() => {
            videoEl.play().catch(() => {});
          }, 0);
        } else {
          videoEl.pause();
        }

        setError(null);
        return;
      } catch {
        setError(
          "This .m3u8 stream needs hls.js installed (npm i hls.js), or use Safari native HLS."
        );
        return;
      }
    }

    // Non-HLS remote (MP4/WebM/etc.)
    videoEl.src = url;
    videoEl.load();

    if (playing) {
      try {
        await videoEl.play();
      } catch {
        // autoplay may be blocked
      }
    } else {
      videoEl.pause();
    }

    setError(null);
  };

  // main mode effect
  useEffect(() => {
    const videoEl = videoRef.current;

    // disabled stops everything hard
    if (!enabled) {
      destroyHls();
      stopLocalStream();
      if (videoEl) videoEl.pause();
      setError(null);
      return;
    }

    // REMOTE
    if (mode === "remote") {
      attachRemote({ videoEl, url: src || "" });
      return;
    }

    // LOCAL/AUTO
    resetRemotePlayback(); // avoids src fighting srcObject
    if (videoEl) {
      videoEl.playsInline = true;
    }

    // pause only (keep stream alive)
    if (!playing) {
      if (videoEl) videoEl.pause();
      setError(null);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // reuse existing stream
        if (streamRef.current && videoEl) {
          videoEl.srcObject = streamRef.current;
          videoEl.muted = muted;
          try {
            await videoEl.play();
          } catch {
            // ignore
          }
          setError(null);
          return;
        }

        const constraints = {
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        if (deviceId) {
          constraints.video.deviceId = { exact: deviceId };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.muted = muted;
          try {
            await videoEl.play();
          } catch {
            // ignore
          }
        }

        setError(null);
      } catch (err) {
        console.error("getUserMedia failed:", err);
        setError(err?.message || "Camera error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, src, deviceId, enabled, playing]);

  // muted effect: no lifecycle changes
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = muted;

    if (streamRef.current && typeof streamRef.current.getAudioTracks === "function") {
      streamRef.current.getAudioTracks().forEach((track) => {
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
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          transform: mirror ? "scaleX(-1)" : "none",
        }}
      />

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
