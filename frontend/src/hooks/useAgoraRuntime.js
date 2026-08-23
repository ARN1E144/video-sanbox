// src/hooks/useAgoraRuntime.js

import {
  useCallback,
  useEffect,
} from "react";

import {
  useRuntimeEvents,
} from "../context/RuntimeEventContext";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import AgoraEngine
  from "../services/agoraEngine";


export default function useAgoraRuntime() {

  // =====================================================
  // RUNTIME SYSTEMS
  // =====================================================

  const runtime =
    useRuntimeEvents();

  const runtimeState =
    useRuntimeState();


  // =====================================================
  // REMOTE USER BRIDGE
  //
  // AgoraEngine
  //      ↓
  // RuntimeState
  //      ↓
  // AgoraFeed
  // =====================================================

  const handleRemoteUsersChanged =
    useCallback(
      ({
        users = {},
        count = 0
      } = {}) => {

        console.log(
          "[AgoraRuntime] remote users changed",
          {
            count,
            users
          }
        );


        runtimeState.set(
          "call.remoteUsers",
          users
        );


        runtimeState.set(
          "call.participants",
          count
        );

        console.log(
          "[AgoraRuntime] AFTER RUNTIME STATE WRITE",
          {
            remoteUsers:
              runtimeState.get("call.remoteUsers"),

            participants:
              runtimeState.get("call.participants"),
          });


        runtime.emit(
          "REMOTE_USERS_CHANGED",
          {
            users,
            count
          }
        );

      },
      [
        runtime,
        runtimeState,
      ]
    );


  // =====================================================
  // ENGINE EVENT BRIDGE
  // =====================================================

  useEffect(
    () => {

      console.log(
        "[AgoraRuntime] installing AgoraEngine bridge"
      );


      const unsubscribeRemoteUsers =
        AgoraEngine.on(
          "REMOTE_USERS_CHANGED",
          handleRemoteUsersChanged
        );

        const unsubscribeUserLeft =
  AgoraEngine.on(
    "USER_LEFT",
    ({
      uid
    }) => {

      console.log(
        "[AgoraRuntime] USER_LEFT",
        {
          uid
        }
      );


      // -------------------------------------------------
      // Record the departure as a runtime state change.
      //
      // This gives RuntimeTriggersProvider something
      // deterministic to react to.
      // -------------------------------------------------

      runtimeState.set(
        "call.participantLeft",
        {
          uid,
          timestamp: Date.now()
        }
      );


      // -------------------------------------------------
      // Keep participant/remote-user state consistent.
      // -------------------------------------------------

      const remoteUsers =
        AgoraEngine.getRemoteUsersSnapshot();


      const count =
        Object.keys(
          remoteUsers
        ).length;


      runtimeState.set(
        "call.remoteUsers",
        remoteUsers
      );


      runtimeState.set(
        "call.participants",
        count
      );


      // -------------------------------------------------
      // Runtime event for debugger / other consumers.
      // -------------------------------------------------

      runtime.emit(
        "USER_LEFT",
        {
          uid
        }
      );

    }
  );


      const unsubscribeJoinStarted =
        AgoraEngine.on(
          "JOIN_STARTED",
          ({
            channel,
            uid
          }) => {

            runtimeState.patch(
              "call",
              {
                state: "joining",

                channel,

                uid,

                joined: false,
              }
            );


            runtimeState.patch(
              "agora",
              {
                uid,

                connected: false,
              }
            );

          }
        );


      const unsubscribeLocalTracks =
        AgoraEngine.on(
          "LOCAL_TRACKS_READY",
          ({
            audioTrack,
            videoTrack
          }) => {

            runtimeState.patch(
              "media",
              {
                micEnabled:
                  !!audioTrack?.enabled,

                videoEnabled:
                  !!videoTrack?.enabled,

                audioPublished:
                  !!audioTrack,

                videoPublished:
                  !!videoTrack,
              }
            );

          }
        );


      const unsubscribeJoined =
        AgoraEngine.on(
          "CALL_JOINED",
          ({
            channel,
            uid
          }) => {

            runtimeState.patch(
              "call",
              {
                state: "joined",

                joined: true,

                channel,

                uid,
              }
            );


            runtimeState.patch(
              "agora",
              {
                uid,

                connected: true,
              }
            );


            runtime.emit(
              "CALL_JOINED",
              {
                channel,
                uid
              }
            );

          }
        );


      const unsubscribeJoinFailed =
        AgoraEngine.on(
          "CALL_JOIN_FAILED",
          ({
            error
          }) => {

            runtimeState.patch(
              "call",
              {
                state: "accepted",

                joined: false,
              }
            );


            runtimeState.patch(
              "agora",
              {
                uid: null,

                connected: false,
              }
            );


            runtimeState.patch(
              "media",
              {
                micEnabled: false,

                videoEnabled: false,

                audioPublished: false,

                videoPublished: false,
              }
            );


            runtimeState.set(
              "call.remoteUsers",
              {}
            );


            runtimeState.set(
              "call.participants",
              0
            );


            runtime.emit(
              "CALL_JOIN_FAILED",
              {
                error
              }
            );

          }
        );


      const unsubscribeLeft =
        AgoraEngine.on(
          "CALL_LEFT",
          ({
            uid,
            channel
          }) => {

            runtimeState.patch(
              "call",
              {
                state: "idle",

                joined: false,

                channel: null,

                uid: null,
              }
            );


            runtimeState.patch(
              "agora",
              {
                uid: null,

                connected: false,
              }
            );


            runtimeState.patch(
              "media",
              {
                micEnabled: false,

                videoEnabled: false,

                audioPublished: false,

                videoPublished: false,
              }
            );


            runtimeState.set(
              "call.remoteUsers",
              {}
            );


            runtimeState.set(
              "call.participants",
              0
            );


            runtime.emit(
              "CALL_LEFT",
              {
                uid,
                channel
              }
            );

          }
        );


      const unsubscribeMic =
        AgoraEngine.on(
          "MIC_TOGGLED",
          ({
            enabled
          }) => {

            runtimeState.set(
              "media.micEnabled",
              enabled
            );


            runtime.emit(
              "MIC_TOGGLED",
              {
                enabled
              }
            );

          }
        );


      const unsubscribeVideo =
        AgoraEngine.on(
          "VIDEO_TOGGLED",
          ({
            enabled
          }) => {

            runtimeState.set(
              "media.videoEnabled",
              enabled
            );


            runtime.emit(
              "VIDEO_TOGGLED",
              {
                enabled
              }
            );

          }
        );


      // -------------------------------------------------
      // Initial synchronisation
      // -------------------------------------------------

      const existingUsers =
        AgoraEngine.getRemoteUsersSnapshot();


      handleRemoteUsersChanged({
        users:
          existingUsers,

        count:
          Object.keys(existingUsers).length
      });


      // -------------------------------------------------
      // Cleanup
      // -------------------------------------------------

      return () => {

        unsubscribeRemoteUsers();

        unsubscribeUserLeft();

        unsubscribeJoinStarted();

        unsubscribeLocalTracks();

        unsubscribeJoined();

        unsubscribeJoinFailed();

        unsubscribeLeft();

        unsubscribeMic();

        unsubscribeVideo();

      };

    },
    [
      handleRemoteUsersChanged,
      runtime,
      runtimeState,
    ]
  );


  // =====================================================
  // JOIN CALL
  // =====================================================

  const joinCall =
    useCallback(
      async ({
        channel = "test-call",
      } = {}) => {

        // -------------------------------------------------
        // Existing runtime state
        // -------------------------------------------------

        const alreadyJoined =
          runtimeState.get(
            "call.joined"
          );


        if (
          alreadyJoined
        ) {

          console.log(
            "[AgoraRuntime] already joined"
          );

          return true;

        }


        if (!channel) {

          console.warn(
            "[AgoraRuntime] join blocked - missing channel"
          );

          return false;

        }


        // -------------------------------------------------
        // Reset runtime state
        // -------------------------------------------------

        runtimeState.set(
          "call.remoteUsers",
          {}
        );


        runtimeState.set(
          "call.participants",
          0
        );


        runtimeState.patch(
          "call",
          {
            state: "joining",

            channel,

            joined: false,
          }
        );


        runtimeState.patch(
          "agora",
          {
            connected: false,

            uid: null,
          }
        );


        try {

          console.log(
            "[AgoraRuntime] joining",
            {
              channel
            }
          );


          const joined =
            await AgoraEngine.joinCall({
              channel
            });


          if (!joined) {

            console.warn(
              "[AgoraRuntime] AgoraEngine join returned false"
            );


            return false;

          }


          /*
           * CALL_JOINED is emitted by AgoraEngine.
           *
           * The engine event bridge above updates:
           *
           * call
           * agora
           * media
           *
           * so we deliberately do NOT duplicate those
           * state writes here.
           */


          return true;


        } catch (error) {

          console.error(
            "[AgoraRuntime] join failed",
            error
          );


          runtimeState.patch(
            "call",
            {
              state: "accepted",

              joined: false,
            }
          );


          runtimeState.patch(
            "agora",
            {
              uid: null,

              connected: false,
            }
          );


          runtimeState.set(
            "call.remoteUsers",
            {}
          );


          runtimeState.set(
            "call.participants",
            0
          );


          runtime.emit(
            "CALL_JOIN_FAILED",
            {
              error
            }
          );


          return false;

        }

      },
      [
        runtime,
        runtimeState,
      ]
    );


  // =====================================================
  // LEAVE CALL
  // =====================================================

  const leaveCall =
    useCallback(
      async () => {

        try {

          console.log(
            "[AgoraRuntime] leaving"
          );


          const left =
            await AgoraEngine.leaveCall();


          if (!left) {

            console.warn(
              "[AgoraRuntime] AgoraEngine leave failed"
            );

            return false;

          }


          /*
           * CALL_LEFT is emitted by AgoraEngine.
           *
           * Runtime state is reset by the event bridge.
           */


          return true;


        } catch (error) {

          console.error(
            "[AgoraRuntime] leave failed",
            error
          );


          return false;

        }

      },
      []
    );


  // =====================================================
  // TOGGLE MIC
  // =====================================================

  const toggleMic =
    useCallback(
      async () => {

        const result =
          await AgoraEngine.toggleMic();


        if (
          result === false ||
          result === undefined
        ) {

          return result;

        }


        /*
         * MIC_TOGGLED is emitted by the engine.
         *
         * The event bridge updates runtime state.
         */


        return result;

      },
      []
    );


  // =====================================================
  // TOGGLE VIDEO
  // =====================================================

  const toggleVideo =
    useCallback(
      async () => {

        const result =
          await AgoraEngine.toggleVideo();


        if (
          result === false ||
          result === undefined
        ) {

          return result;

        }


        /*
         * VIDEO_TOGGLED is emitted by the engine.
         *
         * The event bridge updates runtime state.
         */


        return result;

      },
      []
    );


  // =====================================================
  // PUBLIC API
  // =====================================================

  return {

    joinCall,

    leaveCall,

    toggleMic,

    toggleVideo,

  };

}