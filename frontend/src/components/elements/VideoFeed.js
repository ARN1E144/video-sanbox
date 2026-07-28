import React, { useEffect, useRef, useState } from "react";

import { useActionContext } from "../../context/ActionContext";
import { bindActions } from "../../utils/actionBinder";


export default function VideoFeed(props) {
  const {
    id,
    meta = {},
    style = {},
    ...restProps
  } = props;

  // =====================================================
  // CONTEXT
  // =====================================================

  const actionCtx = useActionContext?.();
  const { bindings = {} } = actionCtx || {};

  const binding = bindings?.[id] || {};

  // =====================================================
  // META DEFAULTS (INSPECTOR DRIVEN)
  // =====================================================

  const defaults = meta?.editableProps || {};

  const mode =
    binding.mode ??
    defaults.mode?.default ??
    "local";

  const src =
    binding.src ??
    defaults.src?.default ??
    null;

  const enabled =
    binding.enabled ??
    defaults.enabled?.default ??
    true;

  const playing =
    binding.playing ??
    defaults.playing?.default ??
    true;

  const muted =
    binding.muted ??
    defaults.muted?.default ??
    true;

  const mirror =
    binding.mirror ??
    defaults.mirror?.default ??
    true;

  const objectFit =
    binding.objectFit ??
    defaults.objectFit?.default ??
    "cover";

  const borderRadius =
    binding.borderRadius ??
    defaults.borderRadius?.default ??
    12;

  // =====================================================
  // STATE (FIXED — REQUIRED FOR YOUR LOGIC)
  // =====================================================

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // =====================================================
  // REFS
  // =====================================================

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const hlsRef = useRef(null);

  // =====================================================
  // ACTION BINDING
  // =====================================================

  const actionHandlers = bindActions(meta, actionCtx, id);

  // =====================================================
  // HELPERS
  // =====================================================

  const isHlsUrl = (u) =>
    typeof u === "string" && /\.m3u8(\?.*)?$/i.test(u.trim());

  const destroyHls = () => {
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
  };

  const stopLocalStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const resetVideoElement = () => {
    const video = videoRef.current;
    if (!video) return;

    destroyHls();
    stopLocalStream();

    try { video.pause(); } catch {}

    video.srcObject = null;
    video.removeAttribute("src");
    video.load();
  };

  // =====================================================
  // MEDIA ATTACHMENT
  // =====================================================

  const attachLocalCamera = async () => {
    const video = videoRef.current;
    if (!video || streamRef.current) return;

    resetVideoElement();
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;

      await video.play()?.catch(() => {});
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error("[VideoFeed] local camera error:", err);
      setError("Camera unavailable");
      setIsLoading(false);
    }
  };

  const attachRemote = async (url) => {
    const video = videoRef.current;
    if (!video || !url) return;

    resetVideoElement();
    setIsLoading(true);

    if (isHlsUrl(url)) {
      try {
        const mod = await import("hls.js");
        const Hls = mod.default || mod;

        if (!Hls.isSupported()) {
          setError("HLS not supported");
          setIsLoading(false);
          return;
        }

        const hls = new Hls();
        hlsRef.current = hls;

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(url);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setError(null);
          if (playing) video.play()?.catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data?.fatal) {
            setError("Stream error");
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error("[VideoFeed] HLS load error", err);
        setError("Stream load failed");
        setIsLoading(false);
      }
    } else {
      video.srcObject = null;
      video.src = url;
      video.load();

      if (playing) video.play()?.catch(() => {});

      setIsLoading(false);
      setError(null);
    }
  };

  // =====================================================
  // ACTION MAPPING
  // =====================================================

  const VIDEO_ACTION_KEY_MAP = {
    startStream: "video.startStream",
    stopStream: "video.stopStream",
    togglePlay: "video.togglePlay",
  };

  const handleAction = async (actionValue) => {
  if (!actionValue) return;

  const actionName =
    VIDEO_ACTION_KEY_MAP[actionValue] || actionValue;

  if (!actionCtx?.runRuntimeAction) {
    console.warn(
      "[VideoFeed] runtime action unavailable",
      actionName
    );
    return;
  }

  return actionCtx.runRuntimeAction(
    actionName,
    {
      id,
      targetId: id,
      videoRef,
      streamRef,
    }
  );
  };

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    if (!enabled) {
      resetVideoElement();
      return;
    }

    if (mode === "local") {
      attachLocalCamera();
    }

    if (mode === "remote" && src) {
      attachRemote(src);
    }

    return () => {
      stopLocalStream();
      destroyHls();
    };
  }, [mode, src, enabled]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      {...actionHandlers}
      {...restProps}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius,
        backgroundColor: "#000",
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          transform:
            mirror && mode === "local"
              ? "scaleX(-1)"
              : "none",
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs bg-black/40">
          Loading…
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs bg-black/70">
          {error}
        </div>
      )}
    </div>
  );
}