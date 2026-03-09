// src/components/elements/VideoFeed.js
import React, { useEffect, useRef, useState } from "react";
import { bindActions } from "../../utils/actionBinder";
import { useActionContext } from "../../context/ActionContext";
import { getActionOptions } from "../../actions/getActionsOptions";
import { actionRegistry } from "../../actions/actionsRegistry";
import { Play, Pause, Video, Square } from "lucide-react";

export default function VideoFeed(props) {
  const {
    id,
    meta,
    poster,
    showSpinner = true,
    objectFit = "cover",
    borderRadius = 12,
    style = {},
    mirror = true,
    mode: propMode = "local",
    src: propSrc = null,
    enabled: propEnabled = true,
    playing: propPlaying = true,
    muted: propMuted = true,
    ...restProps
  } = props;

  const { bindings } = useActionContext();
  const binding = bindings[id] || {};

  const mode = binding.mode?.value ?? propMode;
  const src = binding.src ?? propSrc;
  const enabled = binding.enabled ?? propEnabled;
  const playing = binding.playing ?? propPlaying;
  const muted = binding.muted ?? propMuted;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const hlsRef = useRef(null);

  const actionCtx = useActionContext?.();
  const actionHandlers = bindActions(meta, actionCtx, id);

  const videoActions = getActionOptions().filter((a) =>
    ["startStream", "stopStream", "togglePlay"].includes(a.value)
  );

  const actionIcons = {
    startStream: Video,
    stopStream: Square,
    togglePlay: playing ? Pause : Play
  };

  const isHlsUrl = (u) => typeof u === "string" && /\.m3u8(\?.*)?$/i.test(u.trim());

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

  const attachLocalCamera = async () => {
    const video = videoRef.current;
    if (!video || streamRef.current) return;

    resetVideoElement();
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
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

  /* -------------------- Playback / Mute -------------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.play()?.catch(() => {});
    else video.pause();
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (streamRef.current?.getAudioTracks) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }, [muted]);

  /* -------------------- Video Mode Effect -------------------- */
  useEffect(() => {
    if (!enabled) {
      resetVideoElement();
      return;
    }

    if (mode === "local") {
      attachLocalCamera();
    } else if (mode === "remote") {
      stopLocalStream();
      if (src) attachRemote(src);
      else {
        resetVideoElement(); // black screen until URL provided
        setIsLoading(false);
      }
    }
    return () => {
      stopLocalStream();
      destroyHls();
    };
  }, [mode, src, enabled]);

  /* -------------------- Actions -------------------- */
  const handleAction = async (actionValue) => {
    if (!actionValue) return;

    const flattened = Object.values(actionRegistry).flatMap((cat) =>
      Object.entries(cat).map(([key, fn]) => ({ key, fn }))
    );

    const found = flattened.find((a) => a.key === actionValue);
    if (found?.fn) {
      try {
        await found.fn(actionCtx, { id, targetId: id, videoRef, streamRef });
      } catch (err) {
        console.error("[VideoFeed] Action error:", err);
      }
    }
  };

  /* -------------------- Render -------------------- */
  return (
    <div
      {...actionHandlers}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius,
        backgroundColor: "#000",
        ...style,
      }}
      {...restProps}
    >
      {(mode === "local" || (mode === "remote" && src)) && (
        <video
          ref={videoRef}
          playsInline
          muted={muted}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
            transform: mirror && mode === "local" ? "scaleX(-1)" : "none",
          }}
        />
      )}

      {isLoading && poster && (
        <img
          src={poster}
          alt="Video poster"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}

      {isLoading && showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* -------------------- Video Controls Overlay -------------------- */}
      {(mode === "local" || mode === "remote") && (
        <div className="absolute bottom-2 left-2 flex gap-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
          {videoActions.map((act) => {
            const Icon = actionIcons[act.value];
            if (!Icon) return null;

            return (
              <button
                key={act.value}
                onClick={() => handleAction(act.value)}
                title={act.label}
                className="p-1.5 text-white hover:bg-white/20 rounded"
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400 text-xs p-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}