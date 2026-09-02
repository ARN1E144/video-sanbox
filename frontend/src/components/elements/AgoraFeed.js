// src/components/runtime/AgoraFeed.js

import React, {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  useActionContext,
} from "../../context/ActionContext";

import {
  useRuntimeValue,
} from "../../hooks/useRuntimeValue";

import {
  bindActions,
} from "../../utils/actionBinder";

import AgoraEngine
  from "../../services/agoraEngine";


// =====================================================
// COMPONENT
// =====================================================

export default function AgoraFeed(
  props
) {

  // ===================================================
  // PROPS
  // ===================================================

  const {
    id,

    meta = {},

    style = {},

    borderRadius = 12,

    objectFit = "cover",

    mirror = true,

    autoJoin = false,

    publishLocal = true,

    muted = false,

    cameraOff = false,

    tokenEndpoint,

    localLayout =
      "preview",

    emit,

    action,

    targetId,

    params,

    nextActions,

    bindings,

    channel: propChannel,

    uid: propUid,

    ...domProps
  } = props;


  // ===================================================
  // NORMALISE LOCAL LAYOUT
  // ===================================================

  const resolvedLocalLayout =
    useMemo(
      () => {

        const value =
          String(
            localLayout ||
            "preview"
          )
            .trim()
            .toLowerCase();


        return (
          value === "full"
            ? "full"
            : "preview"
        );

      },
      [
        localLayout,
      ]
    );


  const isLocalFull =
    resolvedLocalLayout ===
    "full";


  // ===================================================
  // ACTION CONTEXT
  // ===================================================

  const {
    runRuntimeAction,
  } =
    useActionContext();


  // ===================================================
  // RUNTIME STATE
  // ===================================================

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


  const callType =
    useRuntimeValue(
      "call.type"
    ) || null;


  const isGroupCall =
    callType ===
    "group";


  // ===================================================
  // DOM REFS
  // ===================================================

  const localRef =
    useRef(null);


  const remoteRef =
    useRef(null);


  // ===================================================
  // TRACK REFS
  // ===================================================
  //
  // These hold non-serialisable Agora objects locally.
  //
  // They NEVER enter RuntimeState.
  //
  // ===================================================

  const activeLocalTrackRef =
    useRef(null);


  const activeRemoteTrackRef =
    useRef(null);


  // ===================================================
  // PLAY LOCAL TRACK
  // ===================================================

  const playLocalTrack =
    (
      track
    ) => {

      const container =
        localRef.current;


      if (
        !container ||
        !track
      ) {

        return false;

      }


      // -------------------------------------------------
      // Same track already mounted
      // -------------------------------------------------

      if (
        activeLocalTrackRef.current ===
        track
      ) {

        return true;

      }


      try {

        // ------------------------------------------------
        // Clear previous Agora DOM
        // ------------------------------------------------

        container.replaceChildren();


        // ------------------------------------------------
        // Play
        // ------------------------------------------------

        track.play(
          container
        );


        activeLocalTrackRef.current =
          track;


        console.log(
          "[AgoraFeed] local video playing",
          {
            localLayout:
              resolvedLocalLayout,

            isGroupCall,

          }
        );


        return true;

      }
      catch (
        error
      ) {

        console.error(
          "[AgoraFeed] local video play failed",
          {
            error,

            localLayout:
              resolvedLocalLayout,

            isGroupCall,

          }
        );


        activeLocalTrackRef.current =
          null;


        return false;

      }

    };


  // ===================================================
  // LOCAL VIDEO LIFECYCLE
  // ===================================================
  //
  // AgoraEngine owns:
  // - creation
  // - publishing
  // - stopping
  // - closing
  //
  // AgoraFeed owns only the DOM playback surface.
  //
  // ===================================================

  useEffect(
    () => {

      if (
        !publishLocal
      ) {

        return undefined;

      }


      // -------------------------------------------------
      // Track already available
      // -------------------------------------------------

      const existingTrack =
        AgoraEngine.getLocalVideoTrack();


      if (
        existingTrack
      ) {

        playLocalTrack(
          existingTrack
        );

      }


      // -------------------------------------------------
      // Track becomes available later
      // -------------------------------------------------

      const unsubscribe =
        AgoraEngine.on(
          "LOCAL_TRACKS_READY",
          ({
            videoTrack,
          } = {}) => {

            playLocalTrack(
              videoTrack
            );

          }
        );


      return () => {

        unsubscribe?.();

      };

    },
    [
      publishLocal,
      resolvedLocalLayout,
      isGroupCall,
    ]
  );


  // ===================================================
  // LOCAL PLAYBACK CLEANUP
  // ===================================================

  useEffect(
    () => {

      return () => {

        // IMPORTANT:
        //
        // Never stop or close the shared Agora track.
        //
        activeLocalTrackRef.current =
          null;

      };

    },
    []
  );


  // ===================================================
  // CLEAR REMOTE PLAYBACK
  // ===================================================

  const clearRemotePlayback =
    () => {

      activeRemoteTrackRef.current =
        null;


      if (
        remoteRef.current
      ) {

        try {

          remoteRef.current.replaceChildren();

        }
        catch (
          error
        ) {

          console.warn(
            "[AgoraFeed] remote DOM cleanup failed",
            error
          );

        }

      }

    };


  // ===================================================
  // NON-GROUP REMOTE VIDEO
  // ===================================================
  //
  // Normal / targeted calls may still use AgoraFeed
  // as the single remote video surface.
  //
  // Group calls do NOT.
  //
  // ===================================================

  useEffect(
    () => {

      // -------------------------------------------------
      // GROUP CALL
      // -------------------------------------------------
      //
      // RemoteVideoGrid owns all remote playback.
      //
      // -------------------------------------------------

      if (
        isGroupCall
      ) {

        clearRemotePlayback();


        console.log(
          "[AgoraFeed] group call - remote playback delegated to RemoteVideoGrid"
        );


        return undefined;

      }


      // -------------------------------------------------
      // Non-group call
      // -------------------------------------------------

      const container =
        remoteRef.current;


      if (
        !container
      ) {

        return undefined;

      }


      const users =
        Object.values(
          remoteUsers || {}
        );


      const remoteUser =
        users[0] ||
        null;


      // -------------------------------------------------
      // No remote user
      // -------------------------------------------------

      if (
        !remoteUser
      ) {

        clearRemotePlayback();


        return undefined;

      }


      // -------------------------------------------------
      // Resolve remote UID
      // -------------------------------------------------

      const remoteUid =
        remoteUser.uid ??
        remoteUser.id ??
        remoteUser.userId ??
        null;


      if (
        remoteUid === null ||
        remoteUid === undefined
      ) {

        clearRemotePlayback();


        return undefined;

      }


      // -------------------------------------------------
      // Get actual Agora user
      // -------------------------------------------------

      const agoraRemoteUser =
        AgoraEngine.getRemoteUser(
          remoteUid
        );


      const remoteTrack =
        agoraRemoteUser?.videoTrack ||
        null;


      console.log(
        "[AgoraFeed] remote user lookup",
        {

          remoteUid,

          runtimeUser:
            remoteUser,

          engineUser:
            agoraRemoteUser,

          hasVideoTrack:
            !!remoteTrack,

        }
      );


      // -------------------------------------------------
      // No remote track yet
      // -------------------------------------------------

      if (
        !remoteTrack
      ) {

        clearRemotePlayback();


        return undefined;

      }


      // -------------------------------------------------
      // Already playing
      // -------------------------------------------------

      if (
        activeRemoteTrackRef.current ===
        remoteTrack
      ) {

        return undefined;

      }


      // -------------------------------------------------
      // Replace previous remote playback
      // -------------------------------------------------

      clearRemotePlayback();


      // -------------------------------------------------
      // Play remote
      // -------------------------------------------------

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
              remoteUid,
          }
        );

      }
      catch (
        error
      ) {

        console.error(
          "[AgoraFeed] remote video play failed",
          {
            uid:
              remoteUid,

            error,
          }
        );


        activeRemoteTrackRef.current =
          null;

      }


      return undefined;

    },
    [
      remoteUsers,
      isGroupCall,
    ]
  );


  // ===================================================
  // REMOTE CLEANUP
  // ===================================================

  useEffect(
    () => {

      return () => {

        activeRemoteTrackRef.current =
          null;


        if (
          remoteRef.current
        ) {

          try {

            remoteRef.current.replaceChildren();

          }
          catch (
            error
          ) {

            // Ignore cleanup errors.

          }

        }

      };

    },
    []
  );


  // ===================================================
  // AUTO JOIN
  // ===================================================
  //
  // Only normal calls use the generic call.joinCall
  // path.
  //
  // Group calls deliberately use:
  //
  //   call.joinGroupCall
  //
  // through the runtime action system.
  //
  // ===================================================

  useEffect(
    () => {

      if (
        !autoJoin ||
        !channel ||
        joined ||
        isGroupCall
      ) {

        return undefined;

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
                    tokenEndpoint,

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

          }
          catch (
            error
          ) {

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
      isGroupCall,
      meta.tokenEndpoint,
      tokenEndpoint,
      runRuntimeAction,
    ]
  );


  // ===================================================
  // REMOTE STATE
  // =====================================================

  const remoteUserList =
    Object.values(
      remoteUsers || {}
    );


  const hasRemote =
    remoteUserList.length >
    0;


  // ===================================================
  // LOCAL SURFACE STYLE
  // =====================================================

  const localSurfaceStyle =
    isLocalFull
      ? {

          position:
            "absolute",

          inset:
            0,

          width:
            "100%",

          height:
            "100%",

          background:
            "#000",

          border:
            "none",

          borderRadius:
            0,

          overflow:
            "hidden",

          zIndex:
            1,

        }

      : {

          position:
            "absolute",

          bottom:
            "4%",

          right:
            "4%",

          width:
            "25%",

          height:
            "25%",

          minWidth:
            100,

          minHeight:
            80,

          background:
            "#000",

          border:
            "1px solid #333",

          borderRadius:
            8,

          overflow:
            "hidden",

          zIndex:
            10,

        };


  // ===================================================
  // LOCAL VIDEO STYLE
  // =====================================================

  const localVideoStyle =
    {

      width:
        "100%",

      height:
        "100%",

      transform:
        mirror
          ? "scaleX(-1)"
          : "none",

      objectFit,

    };


  // ===================================================
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

        width:
          "100%",

        height:
          "100%",

        position:
          "relative",

        background:
          "#000",

        overflow:
          "hidden",

        borderRadius,

      }}

    >

      {/* =================================================
          NON-GROUP REMOTE SURFACE
      ================================================= */}

      {!isGroupCall && (

        <div

          ref={
            remoteRef
          }

          style={{

            position:
              "absolute",

            inset:
              0,

            width:
              "100%",

            height:
              "100%",

            overflow:
              "hidden",

            background:
              "#000",

          }}

        />

      )}


      {/* =================================================
          NON-GROUP WAITING STATE
      ================================================= */}

      {!isGroupCall &&
      !hasRemote && (

        <div

          style={{

            position:
              "absolute",

            inset:
              0,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            color:
              "#fff",

            background:
              "rgba(0,0,0,.15)",

            pointerEvents:
              "none",

            zIndex:
              2,

          }}

        >

          {joined
            ? "Waiting for participant"
            : "Not connected"}

        </div>

      )}


      {/* =================================================
          GROUP CALL LABEL
          Only shown when using preview layout.
      ================================================= */}

      {isGroupCall &&
      joined &&
      !isLocalFull && (

        <div

          style={{

            position:
              "absolute",

            top:
              8,

            left:
              8,

            zIndex:
              3,

            padding:
              "3px 6px",

            borderRadius:
              4,

            background:
              "rgba(0,0,0,.55)",

            color:
              "#fff",

            fontSize:
              9,

          }}

        >

          Group call

        </div>

      )}


      {/* =================================================
          LOCAL CAMERA
      ================================================= */}

      {publishLocal && (

        <div
          style={
            localSurfaceStyle
          }
        >

          <div

            ref={
              localRef
            }

            style={
              localVideoStyle
            }

          />


          {/* =============================================
              CAMERA OFF
          ============================================= */}

          {(
            !videoEnabled ||
            cameraOff
          ) && (

            <div

              style={{

                position:
                  "absolute",

                inset:
                  0,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  "#fff",

                background:
                  "rgba(0,0,0,.65)",

                zIndex:
                  2,

                fontSize:
                  isLocalFull
                    ? 14
                    : 11,

              }}

            >

              Camera off

            </div>

          )}


          {/* =============================================
              MUTED INDICATOR
          ============================================= */}

          {muted && (

            <div

              style={{

                position:
                  "absolute",

                left:
                  6,

                top:
                  6,

                zIndex:
                  3,

                padding:
                  "2px 5px",

                borderRadius:
                  4,

                background:
                  "rgba(0,0,0,.65)",

                color:
                  "#fff",

                fontSize:
                  9,

              }}

            >

              Muted

            </div>

          )}

        </div>

      )}

    </div>

  );

}
