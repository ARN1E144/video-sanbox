// src/hooks/useAgoraRuntime.js

import { useRef, useCallback } from "react";

import AgoraRTC from "agora-rtc-sdk-ng";

import api from "../services/api";

import { useRuntimeEvents }
from "../context/RuntimeEventContext";

import { useRuntimeState }
from "../context/RuntimeStateContext";

export default function useAgoraRuntime() {

  // =====================================================
  // 🔥 RUNTIME SYSTEMS
  // =====================================================

  const runtime =
    useRuntimeEvents();

  const runtimeState =
    useRuntimeState();

  // =====================================================
  // 🔥 RTC REFS
  // =====================================================

  const clientRef =
    useRef(null);

  const localAudioTrackRef =
    useRef(null);

  const localVideoTrackRef =
    useRef(null);

  const remoteUsersRef =
    useRef({});

  // =====================================================
  // 🔥 JOIN CALL
  // =====================================================

  const joinCall = useCallback(async ({
    channel = "test-call",
    tokenEndpoint = "/agora/token",
  }) => {

    // already joined
    if (
      runtimeState.get("call.joined")
    ) {
      return;
    }

    try {

      // ============================================
      // CREATE CLIENT
      // ============================================

      const client =
        AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        });

      clientRef.current = client;

      // ============================================
      // REMOTE USER PUBLISHED
      // ============================================

      client.on(
        "user-published",
        async (user, mediaType) => {

          await client.subscribe(
            user,
            mediaType
          );

          // -------------------------
          // update users ref
          // -------------------------

          remoteUsersRef.current = {
            ...remoteUsersRef.current,
            [user.uid]: user,
          };

          // -------------------------
          // runtime graph
          // -------------------------

          runtimeState.set(
            "users.remoteUsers",
            remoteUsersRef.current
          );

          // -------------------------
          // runtime events
          // -------------------------

          runtime.emit(
            "USER_JOINED",
            {
              uid: user.uid,
              user,
            }
          );

          runtime.emit(
            "TRACK_PUBLISHED",
            {
              uid: user.uid,
              user,
              mediaType,
            }
          );

          // -------------------------
          // autoplay audio
          // -------------------------

          if (
            mediaType === "audio"
          ) {
            user.audioTrack?.play();
          }
        }
      );

      // ============================================
      // USER UNPUBLISHED
      // ============================================

      client.on(
        "user-unpublished",
        (user, mediaType) => {

          runtime.emit(
            "TRACK_UNPUBLISHED",
            {
              uid: user.uid,
              user,
              mediaType,
            }
          );
        }
      );

      // ============================================
      // USER LEFT
      // ============================================

      client.on(
        "user-left",
        (user) => {

          const next = {
            ...remoteUsersRef.current,
          };

          delete next[user.uid];

          remoteUsersRef.current =
            next;

          // -------------------------
          // runtime graph
          // -------------------------

          runtimeState.set(
            "users.remoteUsers",
            next
          );

          // -------------------------
          // runtime event
          // -------------------------

          runtime.emit(
            "USER_LEFT",
            {
              uid: user.uid,
              user,
            }
          );
        }
      );

      // ============================================
      // TOKEN REQUEST
      // ============================================

      const { data } =
        await api.get(
          tokenEndpoint,
          {
            params: {
              channel,
            },
          }
        );

      const {
        appId,
        token,
        uid,
      } = data;

      // ============================================
      // JOIN AGORA
      // ============================================

      await client.join(
        appId,
        channel,
        token,
        uid
      );

      // ============================================
      // CREATE LOCAL TRACKS
      // ============================================

      const audioTrack =
        await AgoraRTC
          .createMicrophoneAudioTrack();

      const videoTrack =
        await AgoraRTC
          .createCameraVideoTrack();

      localAudioTrackRef.current =
        audioTrack;

      localVideoTrackRef.current =
        videoTrack;

      // ============================================
      // PUBLISH TRACKS
      // ============================================

      await client.publish([
        audioTrack,
        videoTrack,
      ]);

      // ============================================
      // RUNTIME GRAPH
      // ============================================

      runtimeState.patch(
        "call",
        {
          joined: true,
          channel,
          uid,
        }
      );

      runtimeState.patch(
        "media",
        {
          micEnabled: true,
          videoEnabled: true,
        }
      );

      // ============================================
      // RUNTIME EVENTS
      // ============================================

      runtime.emit(
        "CALL_JOINED",
        {
          uid,
          channel,
        }
      );

      console.log(
        "[AgoraRuntime] joined",
        channel
      );

    } catch (err) {

      console.error(
        "[AgoraRuntime] join failed",
        err
      );

      runtime.emit(
        "CALL_JOIN_FAILED",
        {
          error: err,
        }
      );
    }

  }, [
    runtime,
    runtimeState,
  ]);

  // =====================================================
  // 🔥 LEAVE CALL
  // =====================================================

  const leaveCall =
    useCallback(async () => {

      try {

        localAudioTrackRef
          .current
          ?.stop();

        localAudioTrackRef
          .current
          ?.close();

        localVideoTrackRef
          .current
          ?.stop();

        localVideoTrackRef
          .current
          ?.close();

        await clientRef
          .current
          ?.leave();

        // ========================================
        // RESET REFS
        // ========================================

        clientRef.current =
          null;

        localAudioTrackRef.current =
          null;

        localVideoTrackRef.current =
          null;

        remoteUsersRef.current =
          {};

        // ========================================
        // RESET GRAPH
        // ========================================

        runtimeState.patch(
          "call",
          {
            joined: false,
            channel: null,
            uid: null,
          }
        );

        runtimeState.set(
          "users.remoteUsers",
          {}
        );

        // ========================================
        // EVENTS
        // ========================================

        runtime.emit(
          "CALL_LEFT",
          {}
        );

        console.log(
          "[AgoraRuntime] left call"
        );

      } catch (err) {

        console.error(
          "[AgoraRuntime] leave failed",
          err
        );
      }

    }, [
      runtime,
      runtimeState,
    ]);

  // =====================================================
  // 🔥 TOGGLE MIC
  // =====================================================

  const toggleMic =
    useCallback(async () => {

      const track =
        localAudioTrackRef.current;

      if (!track) return;

      const current =
        runtimeState.get(
          "media.micEnabled"
        );

      const next = !current;

      await track.setEnabled(next);

      // ========================================
      // GRAPH
      // ========================================

      runtimeState.set(
        "media.micEnabled",
        next
      );

      // ========================================
      // EVENT
      // ========================================

      runtime.emit(
        "MIC_TOGGLED",
        {
          enabled: next,
        }
      );

      return next;

    }, [
      runtime,
      runtimeState,
    ]);

  // =====================================================
  // 🔥 TOGGLE VIDEO
  // =====================================================

  const toggleVideo =
    useCallback(async () => {

      const track =
        localVideoTrackRef.current;

      if (!track) return;

      const current =
        runtimeState.get(
          "media.videoEnabled"
        );

      const next = !current;

      await track.setEnabled(next);

      // ========================================
      // GRAPH
      // ========================================

      runtimeState.set(
        "media.videoEnabled",
        next
      );

      // ========================================
      // EVENT
      // ========================================

      runtime.emit(
        "VIDEO_TOGGLED",
        {
          enabled: next,
        }
      );

      return next;

    }, [
      runtime,
      runtimeState,
    ]);

  // =====================================================
  // 🔥 PUBLIC API
  // =====================================================

  return {

    // rtc
    clientRef,

    localAudioTrackRef,
    localVideoTrackRef,

    remoteUsersRef,

    // actions
    joinCall,
    leaveCall,

    toggleMic,
    toggleVideo,
  };
}