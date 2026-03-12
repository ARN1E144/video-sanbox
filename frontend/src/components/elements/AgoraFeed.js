// src/components/elements/AgoraFeed.js

import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../../services/api";
import { bindActions } from "../../utils/actionBinder";
import { useActionContext } from "../../context/ActionContext";
import { getActionOptions } from "../../actions/getActionsOptions";
import { runAction } from "../../utils/actionExecutor";
import { Play, Video, Square, VolumeX, Volume } from "lucide-react";

export default function AgoraFeed(props) {
  const {
    id,
    meta = {},
    style = {},
    borderRadius = 12,
    objectFit = "cover",
    mirror = true,
    ...rest
  } = props;

  const channel = meta.channel || "test-call";
  const tokenEndpoint = meta.tokenEndpoint || "/agora/token";

  const actionCtx = useActionContext?.();
  const { bindings } = actionCtx || {};
  const binding = bindings?.[id] || {};

  const isPlaying = binding?.playing ?? true;
 

  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const clientRef = useRef(null);
  const localVideoTrack = useRef(null);
  const localAudioTrack = useRef(null);
  const remoteUsersRef = useRef({});
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  const actionHandlers = bindActions(meta, actionCtx, id);

  const videoActions = getActionOptions().filter((a) =>
    [
      "agora.startAgoraStream",
      "agora.stopAgoraStream",
      "agora.toggleAgoraPlay",
      "agora.toggleAgoraAudio",
    ].includes(a.value)
  );

  const actionIcons = {
    "agora.startAgoraStream": Video,
    "agora.stopAgoraStream": Square,
    "agora.toggleAgoraPlay": Play,
    "agora.toggleAgoraAudio": isAudioEnabled ? Volume : VolumeX,
  };

  // --- INITIALIZE CLIENT ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);
          } catch (err) {
            console.warn("[AgoraFeed] subscribe skipped:", err?.message);
            return;
          }

          remoteUsersRef.current[user.uid] = user;

          if (mediaType === "video" && user.videoTrack) {
            setHasRemoteVideo(true);
            user.videoTrack.play(remoteRef.current);
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            delete remoteUsersRef.current[user.uid];
            setHasRemoteVideo(false);
          }
        });

        client.on("user-left", (user) => {
          delete remoteUsersRef.current[user.uid];
          setHasRemoteVideo(false);
        });

        // --- FETCH TOKEN & JOIN ---
        const { data } = await api.get(tokenEndpoint, { params: { channel } });
        const { appId, token, uid } = data;
        await client.join(appId, channel, token, uid);

        // --- CREATE LOCAL TRACKS ---
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localAudioTrack.current = audioTrack;
        localVideoTrack.current = videoTrack;

        videoTrack.play(localRef.current);
        await client.publish([audioTrack, videoTrack]);

        if (mounted) setIsLoading(false);
      } catch (err) {
        console.error("[AgoraFeed] init error", err);
      }
    };

    init();

    return () => {
      mounted = false;
      localVideoTrack.current?.stop();
      localVideoTrack.current?.close();
      localAudioTrack.current?.stop();
      localAudioTrack.current?.close();
      clientRef.current?.leave();
    };
  }, [channel, tokenEndpoint]);

  // --- TOGGLE CAMERA ---
  useEffect(() => {
    if (!localVideoTrack.current) return;
    if (binding?.playing === false) {
      localVideoTrack.current.setEnabled(false);
    } else {
      localVideoTrack.current.setEnabled(true);
      localVideoTrack.current.play(localRef.current);
    }
  }, [binding?.playing]);

  // --- TOGGLE AUDIO ---
  useEffect(() => {
    if (!localAudioTrack.current) return;
    localAudioTrack.current.setEnabled(isAudioEnabled);
  }, [isAudioEnabled]);

  // --- HANDLE ACTIONS ---
const handleAction = async (actionValue) => {
  if (actionValue === "agora.toggleAgoraPlay") {
    if (localVideoTrack.current) {
      const newState = !isVideoEnabled;
      setIsVideoEnabled(newState);
      localVideoTrack.current.setEnabled(newState);
      if (newState) localVideoTrack.current.play(localRef.current);
    }
    return;
  }

  if (actionValue === "agora.toggleAgoraAudio") {
    if (localAudioTrack.current) {
      const newState = !isAudioEnabled;
      setIsAudioEnabled(newState);
      localAudioTrack.current.setEnabled(newState);
    }
    return;
  }

  // Other actions like StopStream or StartStream (optional)
  await runAction(actionValue, actionCtx, {
    id,
    targetId: id,
    clientRef,
    localVideoTrack,
    localAudioTrack,
  });
};

  return (
    <div
      {...actionHandlers}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#000",
        overflow: "hidden",
        borderRadius,
      }}
      {...rest}
    >
      {/* REMOTE FULLSCREEN */}
      <div
        ref={remoteRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
        }}
      />

      {/* LOCAL PIP */}
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
            transform: mirror ? "scaleX(-1)" : "none",
          }}
        />

        {/* Camera off overlay */}
        {binding?.playing === false && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-60">
            Camera off
          </div>
        )}
      </div>

      {/* REMOTE WAITING SCREEN */}
      {!hasRemoteVideo && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-60">
          Waiting for participant
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="absolute bottom-2 left-2 flex gap-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
        {videoActions.map((act) => {
          const Icon =
            act.value === "agora.toggleAgoraAudio"
              ? isAudioEnabled
                ? Volume
                : VolumeX
              : actionIcons[act.value];
          if (!Icon) return null;
          return (
            <button
              key={`${id}-${act.value}`}
              className="p-1.5 text-white hover:bg-white/20 rounded"
              onClick={() => handleAction(act.value)}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
          Connecting...
        </div>
      )}
    </div>
  );
}