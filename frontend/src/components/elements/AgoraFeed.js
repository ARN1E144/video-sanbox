// src/components/runtime/AgoraFeed.js

import React, {
  useEffect,
  useRef,
} from "react";

import { useActionContext } from "../../context/ActionContext";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { bindActions } from "../../utils/actionBinder";
import { useRuntimeState } from "../../context/RuntimeStateContext";


export default function AgoraFeed(props) {

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
  } = useActionContext();


  const runtimeState =
    useRuntimeState();


  // =====================================================
  // RUNTIME STATE
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


  // =====================================================
  // DOM REFS
  // =====================================================

  const localRef =
    useRef(null);


  const remoteRef =
    useRef(null);


  // =====================================================
  // REMOTE VIDEO
  // =====================================================

  useEffect(() => {

    const users =
      Object.values(remoteUsers);


    const first =
      users[0];


    if (
      !first?.videoTrack ||
      !remoteRef.current
    ) {
      return;
    }


    first.videoTrack.play(
      remoteRef.current
    );

  }, [
    remoteUsers
  ]);


  // =====================================================
  // LOCAL VIDEO
  // =====================================================

  useEffect(() => {

    if (!localRef.current) {
      return;
    }


    const agora =
      runtimeState.agora;


    if (!agora) {
      return;
    }


    agora.onLocalTrackReady =
      (track) => {

        console.log(
          "[AGORAFEED] local track ready",
          track
        );


        if (!localRef.current) {
          return;
        }


        track.play(
          localRef.current
        );

      };


    return () => {

      agora.onLocalTrackReady = null;

    };

  }, [
    runtimeState.agora
  ]);


  // =====================================================
  // AUTO JOIN
  // =====================================================

  useEffect(() => {

    if (
      !autoJoin ||
      !channel
    ) {
      return;
    }


    runRuntimeAction(
      "call.joinCall",
      {
        channel,

        tokenEndpoint:
          meta.tokenEndpoint ||
          tokenEndpoint
      }
    );

  }, [
    autoJoin,
    channel,
    meta.tokenEndpoint,
    tokenEndpoint,
    runRuntimeAction
  ]);


  // =====================================================
  // REMOTE USER STATE
  // =====================================================

  const hasRemote =
    Object.keys(
      remoteUsers
    ).length > 0;


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "[AGORAFEED DOM PROPS]",
    domProps
  );


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


      {/* ================================================
          REMOTE VIDEO
      ================================================ */}

      <div
        ref={remoteRef}

        style={{
          width: "100%",
          height: "100%",
          objectFit
        }}
      />


      {/* ================================================
          LOCAL VIDEO
      ================================================ */}

      <div
        style={{
          position: "absolute",

          bottom: "4%",
          right: "4%",

          width: "25%",
          height: "25%",

          background: "#000",

          border: "1px solid #333",

          borderRadius: 8,

          overflow: "hidden"
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
                : "none"
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
                "rgba(0,0,0,.65)"
            }}
          >
            Camera off
          </div>

        )}

      </div>


      {/* ================================================
          WAITING FOR PARTICIPANT
      ================================================ */}

      {!hasRemote && (

        <div
          style={{
            position: "absolute",

            inset: 0,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            color: "#fff",

            pointerEvents: "none"
          }}
        >
          Waiting for participant
        </div>

      )}

    </div>

  );

}