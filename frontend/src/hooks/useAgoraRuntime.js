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


// =====================================================
// HOOK
// =====================================================

export default function useAgoraRuntime() {

  // ===================================================
  // RUNTIME SYSTEMS
  // ===================================================

  const runtime =
    useRuntimeEvents();


  const runtimeState =
    useRuntimeState();


  // ===================================================
  // REMOTE USER BRIDGE
  // ===================================================
  //
  // IMPORTANT:
  //
  // Agora remote users are NOT the same thing as
  // application-level call participants.
  //
  // call.remoteUsers
  //   = users currently visible through Agora
  //
  // call.participants
  //   = participant count from the application/backend
  //
  // Therefore this handler MUST NOT write:
  //
  //   call.participants
  //
  // ===================================================

  const handleRemoteUsersChanged =
    useCallback(
      ({
        users = {},
        count = 0,
      } = {}) => {

        console.log(
          "[AgoraRuntime] remote users changed",
          {
            count,
            users,
          }
        );


        // -----------------------------------------------
        // Runtime remote users
        // -----------------------------------------------

        runtimeState.set(
          "call.remoteUsers",
          users
        );


        // -----------------------------------------------
        // DO NOT WRITE call.participants HERE.
        //
        // The backend/application owns that value.
        // -----------------------------------------------

        const currentParticipants =
          runtimeState.get(
            "call.participants"
          );


        console.log(
          "[AgoraRuntime] AFTER RUNTIME STATE WRITE",
          {

            remoteUsers:
              runtimeState.get(
                "call.remoteUsers"
              ),

            participants:
              currentParticipants,

            agoraRemoteUserCount:
              count,

          }
        );


        // -----------------------------------------------
        // Runtime event
        // -----------------------------------------------

        runtime.emit(
          "REMOTE_USERS_CHANGED",
          {
            users,
            count,
          }
        );

      },
      [
        runtime,
        runtimeState,
      ]
    );


  // ===================================================
  // ENGINE EVENT BRIDGE
  // ===================================================

  useEffect(
    () => {

      console.log(
        "[AgoraRuntime] installing AgoraEngine bridge"
      );


      // =================================================
      // REMOTE USERS
      // =================================================

      const unsubscribeRemoteUsers =
        AgoraEngine.on(
          "REMOTE_USERS_CHANGED",
          handleRemoteUsersChanged
        );


      // =================================================
      // USER LEFT
      // =================================================
      //
      // Again:
      //
      // Do not change call.participants.
      //
      // A user leaving Agora does not necessarily mean
      // the application's participant record has been
      // removed from the call.
      //
      // =================================================

      const unsubscribeUserLeft =
        AgoraEngine.on(
          "USER_LEFT",
          ({
            uid,
          } = {}) => {

            console.log(
              "[AgoraRuntime] USER_LEFT",
              {
                uid,
              }
            );


            // ------------------------------------------------
            // Deterministic runtime departure event/state.
            // ------------------------------------------------

            runtimeState.set(
              "call.participantLeft",
              {
                uid,
                timestamp:
                  Date.now(),
              }
            );


            // ------------------------------------------------
            // Synchronise remote users only.
            // ------------------------------------------------

            const remoteUsers =
              AgoraEngine.getRemoteUsersSnapshot();


            runtimeState.set(
              "call.remoteUsers",
              remoteUsers
            );


            // ------------------------------------------------
            // IMPORTANT:
            //
            // Do NOT derive call.participants from
            // remoteUsers.
            // ------------------------------------------------

            console.log(
              "[AgoraRuntime] USER_LEFT state",
              {

                remoteUsers,

                remoteUserCount:
                  Object.keys(
                    remoteUsers
                  ).length,

                participants:
                  runtimeState.get(
                    "call.participants"
                  ),

              }
            );


            runtime.emit(
              "USER_LEFT",
              {
                uid,
              }
            );

          }
        );


      // =================================================
      // JOIN STARTED
      // =================================================

      const unsubscribeJoinStarted =
        AgoraEngine.on(
          "JOIN_STARTED",
          ({
            channel,
            uid,
          } = {}) => {

            runtimeState.patch(
              "call",
              {

                state:
                  "joining",

                channel,

                uid,

                joined:
                  false,

              }
            );


            runtimeState.patch(
              "agora",
              {

                uid,

                connected:
                  false,

              }
            );

          }
        );


      // =================================================
      // LOCAL TRACKS
      // =================================================

      const unsubscribeLocalTracks =
        AgoraEngine.on(
          "LOCAL_TRACKS_READY",
          ({
            audioTrack,
            videoTrack,
          } = {}) => {

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


      // =================================================
      // CALL JOINED
      // =================================================

      const unsubscribeJoined =
        AgoraEngine.on(
          "CALL_JOINED",
          ({
            channel,
            uid,
          } = {}) => {

            runtimeState.patch(
              "call",
              {

                state:
                  "joined",

                joined:
                  true,

                channel,

                uid,

              }
            );


            runtimeState.patch(
              "agora",
              {

                uid,

                connected:
                  true,

              }
            );


            runtime.emit(
              "CALL_JOINED",
              {
                channel,
                uid,
              }
            );

          }
        );


      // =================================================
      // JOIN FAILED
      // =================================================

      const unsubscribeJoinFailed =
        AgoraEngine.on(
          "CALL_JOIN_FAILED",
          ({
            error,
          } = {}) => {

            runtimeState.patch(
              "call",
              {

                state:
                  "accepted",

                joined:
                  false,

              }
            );


            runtimeState.patch(
              "agora",
              {

                uid:
                  null,

                connected:
                  false,

              }
            );


            runtimeState.patch(
              "media",
              {

                micEnabled:
                  false,

                videoEnabled:
                  false,

                audioPublished:
                  false,

                videoPublished:
                  false,

              }
            );


            // ---------------------------------------------
            // Remote users are reset.
            // ---------------------------------------------

            runtimeState.set(
              "call.remoteUsers",
              {}
            );


            // ---------------------------------------------
            // Do NOT derive participant count from Agora.
            //
            // A failed join should not silently rewrite
            // the application's participant membership.
            // ---------------------------------------------

            runtime.emit(
              "CALL_JOIN_FAILED",
              {
                error,
              }
            );

          }
        );


      // =================================================
      // CALL LEFT
      // =================================================

      const unsubscribeLeft =
        AgoraEngine.on(
          "CALL_LEFT",
          ({
            uid,
            channel,
          } = {}) => {

            runtimeState.patch(
              "call",
              {

                state:
                  "idle",

                joined:
                  false,

                channel:
                  null,

                uid:
                  null,

              }
            );


            runtimeState.patch(
              "agora",
              {

                uid:
                  null,

                connected:
                  false,

              }
            );


            runtimeState.patch(
              "media",
              {

                micEnabled:
                  false,

                videoEnabled:
                  false,

                audioPublished:
                  false,

                videoPublished:
                  false,

              }
            );


            // ---------------------------------------------
            // No remote users after leaving.
            // ---------------------------------------------

            runtimeState.set(
              "call.remoteUsers",
              {}
            );


            // ---------------------------------------------
            // The current call has ended for this client.
            //
            // Reset participant count here because the local
            // runtime is no longer attached to the active call.
            //
            // This is different from deriving participant
            // count from individual Agora events.
            // ---------------------------------------------

            runtimeState.set(
              "call.participants",
              0
            );


            runtime.emit(
              "CALL_LEFT",
              {
                uid,
                channel,
              }
            );

          }
        );


      // =================================================
      // MIC
      // =================================================

      const unsubscribeMic =
        AgoraEngine.on(
          "MIC_TOGGLED",
          ({
            enabled,
          } = {}) => {

            runtimeState.set(
              "media.micEnabled",
              enabled
            );


            runtime.emit(
              "MIC_TOGGLED",
              {
                enabled,
              }
            );

          }
        );


      // =================================================
      // VIDEO
      // =================================================

      const unsubscribeVideo =
        AgoraEngine.on(
          "VIDEO_TOGGLED",
          ({
            enabled,
          } = {}) => {

            runtimeState.set(
              "media.videoEnabled",
              enabled
            );


            runtime.emit(
              "VIDEO_TOGGLED",
              {
                enabled,
              }
            );

          }
        );


      // =================================================
      // INITIAL SYNCHRONISATION
      // =================================================

      const existingUsers =
        AgoraEngine.getRemoteUsersSnapshot();


      handleRemoteUsersChanged({
        users:
          existingUsers,

        count:
          Object.keys(
            existingUsers
          ).length,

      });


      // =================================================
      // CLEANUP
      // =================================================

      return () => {

        unsubscribeRemoteUsers?.();

        unsubscribeUserLeft?.();

        unsubscribeJoinStarted?.();

        unsubscribeLocalTracks?.();

        unsubscribeJoined?.();

        unsubscribeJoinFailed?.();

        unsubscribeLeft?.();

        unsubscribeMic?.();

        unsubscribeVideo?.();

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
  //
  // This is the low-level Agora join bridge.
  //
  // Group-call-specific backend membership is handled
  // by call.joinGroupCall BEFORE this reaches Agora.
  //
  // =====================================================

  const joinCall =
    useCallback(
      async ({
        channel = "test-call",
      } = {}) => {

        // -----------------------------------------------
        // Existing runtime state
        // -----------------------------------------------

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


        if (
          !channel
        ) {

          console.warn(
            "[AgoraRuntime] join blocked - missing channel"
          );


          return false;

        }


        // =================================================
        // RESET REMOTE USERS
        // =================================================
        //
        // Only remote-user discovery is reset here.
        //
        // Do NOT reset call.participants.
        //
        // The backend has already told us how many
        // application participants belong to the call.
        //
        // =================================================

        runtimeState.set(
          "call.remoteUsers",
          {}
        );


        // =================================================
        // CALL STATE
        // =================================================

        runtimeState.patch(
          "call",
          {

            state:
              "joining",

            channel,

            joined:
              false,

          }
        );


        // =================================================
        // AGORA STATE
        // =================================================

        runtimeState.patch(
          "agora",
          {

            connected:
              false,

            uid:
              null,

          }
        );


        try {

          console.log(
            "[AgoraRuntime] joining",
            {
              channel,
              participants:
                runtimeState.get(
                  "call.participants"
                ),
            }
          );


          const joined =
            await AgoraEngine.joinCall({
              channel,
            });


          if (
            !joined
          ) {

            console.warn(
              "[AgoraRuntime] AgoraEngine join returned false"
            );


            return false;

          }


          // ---------------------------------------------
          // CALL_JOINED is emitted by AgoraEngine.
          //
          // The event bridge handles:
          //
          // call
          // agora
          // media
          //
          // ---------------------------------------------

          return true;


        }
        catch (
          error
        ) {

          console.error(
            "[AgoraRuntime] join failed",
            error
          );


          runtimeState.patch(
            "call",
            {

              state:
                "accepted",

              joined:
                false,

            }
          );


          runtimeState.patch(
            "agora",
            {

              uid:
                null,

              connected:
                false,

            }
          );


          runtimeState.set(
            "call.remoteUsers",
            {}
          );


          // ---------------------------------------------
          // IMPORTANT:
          //
          // Do not reset call.participants here.
          //
          // An Agora failure is not a change to the
          // application's participant list.
          // ---------------------------------------------

          runtime.emit(
            "CALL_JOIN_FAILED",
            {
              error,
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


          if (
            !left
          ) {

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

        }
        catch (error) {

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
         * MIC_TOGGLED is emitted by AgoraEngine.
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
         * VIDEO_TOGGLED is emitted by AgoraEngine.
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