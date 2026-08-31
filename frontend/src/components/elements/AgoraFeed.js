// src/components/runtime/AgoraFeed.js

import React, {
  useEffect,
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
  // COMPONENT PROPS
  // ===================================================
  //
  // IMPORTANT:
  //
  // Runtime / Confo properties are deliberately removed
  // from the DOM props.
  //
  // This prevents React warnings for:
  //
  // publishLocal
  // cameraOff
  // emit
  // action
  // targetId
  // params
  // nextActions
  // bindings
  //
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


  // ===================================================
  // CALL TYPE
  // ===================================================
  //
  // Group calls are rendered differently:
  //
  // AgoraFeed
  //   -> local camera
  //
  // RemoteVideoGrid
  //   -> remote participants
  //
  // ===================================================

  const callType =
    useRuntimeValue(
      "call.type"
    ) || null;


  const isGroupCall =
    callType === "group";


  // ===================================================
  // DOM REFS
  // ===================================================

  const localRef =
    useRef(null);


  const remoteRef =
    useRef(null);


  // ===================================================
  // ACTIVE TRACK REFERENCES
  // ===================================================
  //
  // These remain local to this component.
  //
  // They must NEVER be written to RuntimeState.
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
    track => {

      const container =
        localRef.current;


      if (
        !container ||
        !track
      ) {

        return;

      }


      // -----------------------------------------------
      // Already playing
      // -----------------------------------------------

      if (
        activeLocalTrackRef.current ===
        track
      ) {

        return;

      }


      try {

        container.replaceChildren();


        track.play(
          container
        );


        activeLocalTrackRef.current =
          track;


        console.log(
          "[AgoraFeed] local video playing"
        );

      }
      catch (error) {

        console.error(
          "[AgoraFeed] local video play failed",
          error
        );

      }

    };


  // =====================================================
  // LOCAL VIDEO
  // =====================================================
  //
  // AgoraEngine owns the actual camera track.
  //
  // AgoraFeed only owns the DOM surface.
  //
  // =====================================================

  useEffect(
    () => {

      if (
        !publishLocal
      ) {

        return undefined;

      }


      // -------------------------------------------------
      // Track already exists
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
    ]
  );


  // =====================================================
  // LOCAL CLEANUP
  // =====================================================
  //
  // AgoraEngine owns the track lifecycle.
  //
  // This component must NOT stop or close the track.
  //
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
  // CLEAR REMOTE PLAYBACK
  // =====================================================
  //
  // Important:
  //
  // We clear ONLY this component's DOM surface.
  //
  // We do not stop the shared Agora track because
  // RemoteVideoGrid may own it.
  //
  // =====================================================

  const clearRemotePlayback =
    () => {

      activeRemoteTrackRef.current =
        null;


      if (
        remoteRef.current
      ) {

        remoteRef.current.replaceChildren();

      }

    };


  // =====================================================
  // REMOTE VIDEO
  // =====================================================
  //
  // NON-GROUP:
  //
  // AgoraFeed may display the first remote participant.
  //
  // GROUP:
  //
  // RemoteVideoGrid owns remote playback.
  //
  // =====================================================

  useEffect(
    () => {

      const container =
        remoteRef.current;


      // -----------------------------------------------
      // Group calls do not use the remote surface.
      // -----------------------------------------------

      if (
        isGroupCall
      ) {

        clearRemotePlayback();


        console.log(
          "[AgoraFeed] group call - remote playback delegated to RemoteVideoGrid"
        );


        return undefined;

      }


      if (
        !container
      ) {

        return undefined;

      }


      // ------------------------------------------------
      // Resolve first remote participant
      // ------------------------------------------------

      const users =
        Object.values(
          remoteUsers || {}
        );


      const remoteUser =
        users[0] ||
        null;


      // ------------------------------------------------
      // No remote user
      // ------------------------------------------------

      if (
        !remoteUser
      ) {

        clearRemotePlayback();


        console.log(
          "[AgoraFeed] no remote user"
        );


        return undefined;

      }


      // ------------------------------------------------
      // Runtime UID
      // ------------------------------------------------

      const remoteUid =
        remoteUser.uid ??
        remoteUser.id ??
        remoteUser.userId;


      // ------------------------------------------------
      // Find live Agora user
      // ------------------------------------------------

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

          isGroupCall,

        }
      );


      // ------------------------------------------------
      // No video track
      // ------------------------------------------------

      if (
        !remoteTrack
      ) {

        clearRemotePlayback();


        return undefined;

      }


      // ------------------------------------------------
      // Already playing
      // ------------------------------------------------

      if (
        activeRemoteTrackRef.current ===
        remoteTrack
      ) {

        return undefined;

      }


      // ------------------------------------------------
      // Clear previous playback
      // ------------------------------------------------

      clearRemotePlayback();


      // ------------------------------------------------
      // Play remote
      // ------------------------------------------------

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
      catch (error) {

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


  // =====================================================
  // REMOTE CLEANUP
  // =====================================================
  //
  // Do not stop/close the Agora track.
  //
  // The engine owns it.
  //
  // =====================================================

  useEffect(
    () => {

      return () => {

        activeRemoteTrackRef.current =
          null;


        if (
          remoteRef.current
        ) {

          remoteRef.current.replaceChildren();

        }

      };

    },
    []
  );


  // =====================================================
  // AUTO JOIN
  // =====================================================
  //
  // Auto join remains available for normal calls.
  //
  // Group calls use:
  //
  // call.joinGroupCall
  //
  // so the backend participant state is updated first.
  //
  // =====================================================

  useEffect(
    () => {

      if (
        !autoJoin ||
        !channel ||
        joined ||
        isGroupCall
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
          catch (error) {

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
          NON-GROUP REMOTE VIDEO

          Only rendered for normal / targeted calls.
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
          GROUP CALL INDICATOR
      ================================================= */}

      {isGroupCall &&
      joined && (

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
          LOCAL CAMERA PREVIEW
      ================================================= */}

      {publishLocal && (

        <div

          style={{

            position:
              "absolute",

            bottom:
              "4%",

            right:
              "4%",

            width:
              isGroupCall
                ? "28%"
                : "25%",

            height:
              isGroupCall
                ? "28%"
                : "25%",

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

          }}

        >

          <div

            ref={
              localRef
            }

            style={{

              width:
                "100%",

              height:
                "100%",

              transform:
                mirror
                  ? "scaleX(-1)"
                  : "none",

              objectFit,

            }}

          />


          {/* ---------------------------------------------
              CAMERA OFF
          --------------------------------------------- */}

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
                  11,

              }}

            >

              Camera off

            </div>

          )}


          {/* ---------------------------------------------
              MUTED INDICATOR
          --------------------------------------------- */}

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