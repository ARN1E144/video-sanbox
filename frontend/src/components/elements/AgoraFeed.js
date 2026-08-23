// src/components/runtime/AgoraFeed.js

import React, {
  useEffect,
  useRef,
} from "react";

import {
  useActionContext
} from "../../context/ActionContext";

import {
  useRuntimeValue
} from "../../hooks/useRuntimeValue";

import {
  bindActions
} from "../../utils/actionBinder";

import AgoraEngine
  from "../../services/agoraEngine";


export default function AgoraFeed(
  props
) {

  const {
    id,
    meta = {},
    style = {},
    borderRadius = 12,
    objectFit = "cover",
    mirror = true,
    autoJoin = false,
    tokenEndpoint,
    ...domProps
  } = props;


  const {
    runRuntimeAction
  } =
    useActionContext();


  // =====================================================
  // RUNTIME STATE
  //
  // IMPORTANT:
  //
  // call.remoteUsers contains ONLY serialisable metadata.
  //
  // Example:
  //
  // {
  //   "33748": {
  //     uid: 33748,
  //     hasAudio: true,
  //     hasVideo: true
  //   }
  // }
  //
  // The actual Agora RemoteVideoTrack remains inside
  // AgoraEngine.
  // =====================================================

  const remoteUsers =
    useRuntimeValue(
      "call.remoteUsers"
    ) || {};


  const videoEnabled =
    useRuntimeValue(
      "media.videoEnabled"
    );


  const channel =
    useRuntimeValue(
      "call.channel"
    );


  const joined =
    useRuntimeValue(
      "call.joined"
    );


  // =====================================================
  // DOM REFS
  // =====================================================

  const localRef =
    useRef(null);


  const remoteRef =
    useRef(null);


  // =====================================================
  // ACTIVE TRACK REFS
  //
  // These are deliberately NOT runtime state.
  //
  // Agora tracks are non-serialisable objects.
  // =====================================================

  const activeLocalTrackRef =
    useRef(null);


  const activeRemoteTrackRef =
    useRef(null);


  // =====================================================
  // PLAY LOCAL TRACK
  // =====================================================

  const playLocalTrack =
    (track) => {

      const container =
        localRef.current;


      if (
        !container ||
        !track
      ) {

        return;

      }


      // Already playing this track.

      if (
        activeLocalTrackRef.current ===
        track
      ) {

        return;

      }


      try {

        // Clear any previous DOM created by Agora.

        container.replaceChildren();


        track.play(
          container
        );


        activeLocalTrackRef.current =
          track;


        console.log(
          "[AgoraFeed] local video playing"
        );

      } catch (error) {

        console.error(
          "[AgoraFeed] local video play failed",
          error
        );

      }

    };


  // =====================================================
  // LOCAL VIDEO
  //
  // The local camera track belongs to AgoraEngine.
  //
  // AgoraFeed:
  //
  // 1. Checks whether a track already exists.
  // 2. Listens for LOCAL_TRACKS_READY.
  // 3. Plays the same local track in this component.
  //
  // This means multiple AgoraFeed instances can display
  // the same local camera track.
  // =====================================================

  useEffect(
    () => {

      // -------------------------------------------------
      // Existing track
      // -------------------------------------------------

      const existingTrack =
        AgoraEngine.getLocalVideoTrack();


      if (existingTrack) {

        playLocalTrack(
          existingTrack
        );

      }


      // -------------------------------------------------
      // Future track
      // -------------------------------------------------

      const unsubscribe =
        AgoraEngine.on(
          "LOCAL_TRACKS_READY",
          ({
            videoTrack
          } = {}) => {

            playLocalTrack(
              videoTrack
            );

          }
        );


      return () => {

        unsubscribe();

      };

    },
    []
  );


  // =====================================================
  // LOCAL TRACK CLEANUP
  //
  // IMPORTANT:
  //
  // AgoraFeed does NOT stop or close the track.
  //
  // AgoraEngine owns the track lifecycle.
  // =====================================================

  useEffect(
    () => {

      return () => {

        activeLocalTrackRef.current =
          null;

      };

    },
    []
  );


  // =====================================================
  // REMOTE VIDEO
  //
  // IMPORTANT ARCHITECTURE:
  //
  // RuntimeState:
  //
  // call.remoteUsers
  //        ↓
  //        UID
  //
  // AgoraEngine:
  //
  // UID
  //        ↓
  // RemoteUser
  //        ↓
  // RemoteVideoTrack
  //
  // AgoraFeed:
  //
  // RemoteVideoTrack.play(container)
  // =====================================================

  useEffect(
    () => {

      const container =
        remoteRef.current;


      if (!container) {

        return;

      }


      const users =
        Object.values(
          remoteUsers || {}
        );


      // =================================================
      // CURRENT REMOTE USER
      // =================================================

      const remoteUser =
        users[0];


      // =================================================
      // NO REMOTE USER
      // =================================================

      if (!remoteUser) {

        if (
          activeRemoteTrackRef.current
        ) {

          try {

            activeRemoteTrackRef.current.stop();

          } catch (error) {

            // Ignore cleanup errors.

          }

        }


        activeRemoteTrackRef.current =
          null;


        container.replaceChildren();


        console.log(
          "[AgoraFeed] no remote user"
        );


        return;

      }


      // =================================================
      // REMOTE UID
      //
      // This comes from serialisable runtime state.
      // =================================================

      const remoteUid =
        remoteUser.uid;


      // =================================================
      // GET ACTUAL AGORA USER
      //
      // The actual Agora object stays inside the engine.
      // =================================================

      const agoraRemoteUser =
        AgoraEngine.getRemoteUser(
          remoteUid
        );


      // =================================================
      // GET ACTUAL VIDEO TRACK
      // =================================================

      const remoteTrack =
        agoraRemoteUser?.videoTrack;


      console.log(
        "[AgoraFeed] remote user lookup",
        {
          remoteUid,

          runtimeUser:
            remoteUser,

          engineUser:
            agoraRemoteUser,

          hasVideoTrack:
            !!remoteTrack
        }
      );


      // =================================================
      // USER EXISTS BUT VIDEO IS NOT AVAILABLE
      // =================================================

      if (!remoteTrack) {

        if (
          activeRemoteTrackRef.current
        ) {

          try {

            activeRemoteTrackRef.current.stop();

          } catch (error) {

            // Ignore cleanup errors.

          }

        }


        activeRemoteTrackRef.current =
          null;


        container.replaceChildren();


        return;

      }


      // =================================================
      // SAME TRACK ALREADY PLAYING
      // =================================================

      if (
        activeRemoteTrackRef.current ===
        remoteTrack
      ) {

        return;

      }


      // =================================================
      // STOP PREVIOUS REMOTE TRACK
      // =================================================

      if (
        activeRemoteTrackRef.current
      ) {

        try {

          activeRemoteTrackRef.current.stop();

        } catch (error) {

          // Ignore cleanup errors.

        }

      }


      activeRemoteTrackRef.current =
        null;


      container.replaceChildren();


      // =================================================
      // PLAY REMOTE VIDEO
      // =================================================

      try {

        remoteTrack.play(
          container
        );


        activeRemoteTrackRef.current =
          remoteTrack;


        console.log(
          "[AgoraFeed] remote video playing",
          {
            uid:
              remoteUid
          }
        );

      } catch (error) {

        console.error(
          "[AgoraFeed] remote video play failed",
          {
            uid:
              remoteUid,

            error
          }
        );


        activeRemoteTrackRef.current =
          null;

      }

    },
    [
      remoteUsers
    ]
  );


  // =====================================================
  // REMOTE TRACK CLEANUP
  //
  // Stop playback when THIS feed disappears.
  //
  // Do not close the Agora track.
  // =====================================================

  useEffect(
    () => {

      return () => {

        if (
          activeRemoteTrackRef.current
        ) {

          try {

            activeRemoteTrackRef.current.stop();

          } catch (error) {

            // Ignore cleanup errors.

          }

        }


        activeRemoteTrackRef.current =
          null;

      };

    },
    []
  );


  // =====================================================
  // AUTO JOIN
  // =====================================================

  useEffect(
    () => {

      if (
        !autoJoin ||
        !channel ||
        joined
      ) {

        return;

      }


      let cancelled =
        false;


      const join =
        async () => {

          try {

            const result =
              await runRuntimeAction(
                "call.joinCall",
                {
                  channel,

                  tokenEndpoint:
                    meta.tokenEndpoint ||
                    tokenEndpoint
                }
              );


            if (
              cancelled
            ) {

              return;

            }


            console.log(
              "[AgoraFeed] autoJoin result",
              result
            );

          } catch (error) {

            if (
              cancelled
            ) {

              return;

            }


            console.error(
              "[AgoraFeed] autoJoin failed",
              error
            );

          }

        };


      join();


      return () => {

        cancelled =
          true;

      };

    },
    [
      autoJoin,
      channel,
      joined,
      meta.tokenEndpoint,
      tokenEndpoint,
      runRuntimeAction,
    ]
  );


  // =====================================================
  // REMOTE STATE
  // =====================================================

  const remoteUserList =
    Object.values(
      remoteUsers || {}
    );


  const hasRemote =
    remoteUserList.length > 0;


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      {...bindActions(
        meta,
        null,
        id
      )}

      {...domProps}

      style={{
        ...style,

        width: "100%",

        height: "100%",

        position: "relative",

        background: "#000",

        overflow: "hidden",

        borderRadius
      }}
    >

      {/* =================================================
          MAIN REMOTE VIDEO

          This displays the OTHER participant.

          User A sees B.
          User B sees A.
      ================================================= */}

      <div
        ref={remoteRef}

        style={{
          position: "absolute",

          inset: 0,

          width: "100%",

          height: "100%",

          overflow: "hidden",

          background: "#000"
        }}
      />


      {/* =================================================
          WAITING STATE
      ================================================= */}

      {!hasRemote && (

        <div
          style={{
            position: "absolute",

            inset: 0,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            color: "#fff",

            background:
              "rgba(0,0,0,.15)",

            pointerEvents: "none",

            zIndex: 2
          }}
        >

          {joined
            ? "Waiting for participant"
            : "Not connected"}

        </div>

      )}


      {/* =================================================
          LOCAL CAMERA PREVIEW
          
          This displays THIS user's camera.

          User A → A's camera
          User B → B's camera
      ================================================= */}

      <div
        style={{
          position: "absolute",

          bottom: "4%",

          right: "4%",

          width: "25%",

          height: "25%",

          background: "#000",

          border:
            "1px solid #333",

          borderRadius: 8,

          overflow: "hidden",

          zIndex: 10
        }}
      >

        <div
          ref={localRef}

          style={{
            width: "100%",

            height: "100%",

            transform:
              mirror
                ? "scaleX(-1)"
                : "none",

            objectFit
          }}
        />


        {!videoEnabled && (

          <div
            style={{
              position: "absolute",

              inset: 0,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              color: "#fff",

              background:
                "rgba(0,0,0,.65)",

              zIndex: 2
            }}
          >

            Camera off

          </div>

        )}

      </div>

    </div>

  );

}