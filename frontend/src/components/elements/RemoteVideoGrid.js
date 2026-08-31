// src/components/elements/RemoteVideoGrid.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import agoraEngine
  from "../../services/agoraEngine";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";


// =====================================================
// SAFE HELPERS
// =====================================================

function isObject(
  value
) {

  return (
    value !== null &&
    typeof value === "object"
  );

}


function safeText(
  value,
  fallback = ""
) {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;

  }


  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return String(
      value
    );

  }


  if (
    isObject(
      value
    )
  ) {

    const candidate =
      value.uid ??
      value.id ??
      value.name ??
      value.userId ??
      value.type ??
      null;


    if (
      candidate !== null &&
      candidate !== value
    ) {

      return safeText(
        candidate,
        fallback
      );

    }


    try {

      return JSON.stringify(
        value
      );

    }
    catch (
      error
    ) {

      return fallback;

    }

  }


  return fallback;

}


// =====================================================
// RESOLVE REMOTE USERS
// =====================================================

function resolveRemoteUsers(
  runtime,
  source
) {

  // ---------------------------------------------------
  // No source
  // ---------------------------------------------------

  if (
    source === null ||
    source === undefined ||
    source === ""
  ) {

    return (
      runtime.get?.(
        "call.remoteUsers"
      ) || {}
    );

  }


  // ---------------------------------------------------
  // String source
  // ---------------------------------------------------

  if (
    typeof source === "string"
  ) {

    const trimmed =
      source.trim();


    if (
      !trimmed
    ) {

      return (
        runtime.get?.(
          "call.remoteUsers"
        ) || {}
      );

    }


    // -------------------------------------------------
    // Binding syntax:
    //
    // {{call.remoteUsers}}
    // -------------------------------------------------

    if (
      trimmed.startsWith(
        "{{"
      ) &&
      trimmed.endsWith(
        "}}"
      )
    ) {

      const path =
        trimmed
          .slice(
            2,
            -2
          )
          .trim();


      if (
        !path
      ) {

        return {};

      }


      return (
        runtime.get?.(
          path
        ) || {}
      );

    }


    return (
      runtime.get?.(
        trimmed
      ) || {}
    );

  }


  // ---------------------------------------------------
  // Already resolved object
  // ---------------------------------------------------

  if (
    isObject(
      source
    )
  ) {

    return source;

  }


  console.warn(
    "[RemoteVideoGrid] Unsupported source",
    {
      source,
      sourceType:
        typeof source,
    }
  );


  return {};

}


// =====================================================
// NORMALISE PARTICIPANTS
// =====================================================

function normaliseParticipants(
  remoteUsers
) {

  // ---------------------------------------------------
  // Array
  // ---------------------------------------------------

  if (
    Array.isArray(
      remoteUsers
    )
  ) {

    return remoteUsers
      .filter(
        participant =>
          participant !== null &&
          participant !== undefined
      )

      .map(
        (
          participant,
          index
        ) => ({

          participant,

          key:
            safeParticipantKey(
              participant,
              index
            ),

        })
      );

  }


  // ---------------------------------------------------
  // Object map
  // ---------------------------------------------------

  if (
    isObject(
      remoteUsers
    )
  ) {

    return Object.entries(
      remoteUsers
    )

      .map(
        (
          [
            key,
            participant,
          ],
          index
        ) => {

          if (
            participant === null ||
            participant === undefined
          ) {

            return null;

          }


          const participantWithUid =

            isObject(
              participant
            )

              ? {

                  ...participant,

                  uid:
                    participant.uid ??
                    participant.id ??
                    key,

                }

              : {

                  uid:
                    key,

                  value:
                    participant,

                };


          return {

            participant:
              participantWithUid,

            key:
              safeParticipantKey(
                participantWithUid,
                index
              ),

          };

        }
      )

      .filter(
        Boolean
      );

  }


  return [];

}


// =====================================================
// SAFE PARTICIPANT KEY
// =====================================================

function safeParticipantKey(
  participant,
  index
) {

  const candidate =
    participant?.uid ??
    participant?.id ??
    participant?.userId ??
    index;


  const text =
    safeText(
      candidate,
      String(index)
    );


  return text ||
    String(index);

}



// =====================================================
// REMOTE PARTICIPANT TILE
// =====================================================

function RemoteParticipantTile({
  participant,
}) {

  const tileRef =
    React.useRef(null);


  const rawUid =
    participant?.uid ??
    participant?.id ??
    participant?.userId ??
    null;


  const uid =
    safeText(
      rawUid,
      "Participant"
    );


  const [, forceRender] =
    React.useState(0);


  React.useEffect(() => {

    // =================================================
    // LOOK UP ACTUAL AGORA USER
    // =================================================

    const agoraUser =
      agoraEngine.getRemoteUser(
        rawUid
      );


    // =================================================
    // LOOK UP ACTUAL VIDEO TRACK
    // =================================================

    const videoTrack =
      agoraUser?.videoTrack;


    // =================================================
    // TRACK DIAGNOSTIC
    // =================================================

    console.log(
      "[RemoteVideoTile] TRACK DIAGNOSTIC",
      {

        rawUid,

        uid,

        hasAgoraUser:
          !!agoraUser,

        agoraUserUid:
          agoraUser?.uid,

        hasVideoTrack:
          !!videoTrack,

        trackState:
          videoTrack
            ?.mediaStreamTrack
            ?.readyState,

        enabled:
          videoTrack?.enabled,

        muted:
          videoTrack?.isMuted,

      }
    );


    // =================================================
    // NO TRACK YET
    // =================================================

    if (
      !videoTrack ||
      !tileRef.current
    ) {

      console.log(
        "[RemoteVideoTile] waiting for video track",
        {
          uid,
          rawUid,
          hasAgoraUser:
            !!agoraUser,
        }
      );


      return;

    }


    const container =
      tileRef.current;


    // =================================================
    // PLAY
    // =================================================

    console.log(
      "[RemoteVideoTile] PLAY",
      {
        uid,
        rawUid,
        container,
        track:
          videoTrack,
      }
    );


    try {

      videoTrack.play(
        container
      );


      forceRender(
        value =>
          value + 1
      );


      console.log(
        "[RemoteVideoTile] PLAYING",
        {
          uid,
          rawUid,
        }
      );


    }
    catch (
      error
    ) {

      console.error(
        "[RemoteVideoTile] play failed",
        {
          uid,
          rawUid,
          error,
        }
      );

    }


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      try {

        videoTrack.stop();

      }
      catch (
        error
      ) {

        console.warn(
          "[RemoteVideoTile] stop failed",
          {
            uid,
            error,
          }
        );

      }

    };

  }, [
    rawUid,
    uid,
  ]);


  // =================================================
  // RENDER
  // =================================================

  return (

    <div
      style={{

        position:
          "relative",

        width:
          "100%",

        aspectRatio:
          "16 / 9",

        minHeight:
          120,

        overflow:
          "hidden",

        borderRadius:
          8,

        background:
          "#000",

      }}
    >

      <div
        ref={
          tileRef
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

        }}
      />


      <div
        style={{

          position:
            "absolute",

          left:
            8,

          bottom:
            8,

          zIndex:
            10,

          padding:
            "3px 6px",

          borderRadius:
            4,

          background:
            "rgba(0,0,0,.65)",

          color:
            "#fff",

          fontSize:
            10,

        }}
      >

        {uid}

      </div>

    </div>

  );

}



// =====================================================
// COMPONENT
// =====================================================

export default function RemoteVideoGrid({

  source =
    "call.remoteUsers",

  columns =
    2,

  gap =
    8,

  emptyText =
    "No remote participants",

  style =
    {},

}) {

  const runtime =
    useRuntimeState();


  // ===================================================
  // STATE
  // ===================================================

  const [
    runtimeRemoteUsers,
    setRuntimeRemoteUsers,
  ] =
    useState(
      {}
    );


  const [, forceRemoteRender] =
    useState(0);


  // ===================================================
  // RUNTIME PATH
  // ===================================================

  const runtimePath =
    useMemo(
      () => {

        if (
          typeof source !== "string"
        ) {

          return null;

        }


        const trimmed =
          source.trim();


        if (
          !trimmed
        ) {

          return null;

        }


        if (
          trimmed.startsWith(
            "{{"
          ) &&
          trimmed.endsWith(
            "}}"
          )
        ) {

          return trimmed
            .slice(
              2,
              -2
            )
            .trim();

        }


        return trimmed;

      },
      [
        source,
      ]
    );


  // ===================================================
  // INITIAL VALUE + RUNTIME SUBSCRIPTION
  // ===================================================

  useEffect(() => {

    // -------------------------------------------------
    // Already resolved object
    // -------------------------------------------------

    if (
      typeof source !== "string"
    ) {

      setRuntimeRemoteUsers(
        source || {}
      );


      return undefined;

    }


    // -------------------------------------------------
    // No runtime path
    // -------------------------------------------------

    if (
      !runtimePath
    ) {

      setRuntimeRemoteUsers(
        runtime.get?.(
          "call.remoteUsers"
        ) || {}
      );


      return undefined;

    }


    // -------------------------------------------------
    // Initial runtime value
    // -------------------------------------------------

    const initialValue =
      runtime.get?.(
        runtimePath
      ) || {};


    setRuntimeRemoteUsers(
      initialValue
    );


    // -------------------------------------------------
    // Runtime subscription
    // -------------------------------------------------

    const unsubscribe =
      runtime.subscribe?.(
        runtimePath,
        value => {

          console.log(
            "[RemoteVideoGrid] RUNTIME UPDATE",
            {
              path:
                runtimePath,

              users:
                value,
            }
          );


          setRuntimeRemoteUsers(
            value || {}
          );


          forceRemoteRender(
            value =>
              value + 1
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
    runtimePath,
    source,
  ]);


  // ===================================================
  // AGORA REFRESH
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      agoraEngine.on(
        "REMOTE_USERS_CHANGED",
        payload => {

          console.log(
            "[RemoteVideoGrid] REMOTE_USERS_CHANGED",
            payload
          );


          forceRemoteRender(
            value =>
              value + 1
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // PARTICIPANTS
  // ===================================================

  const remoteUsers =
    resolveRemoteUsers(
      runtime,
      source
    );


  const participants =
    useMemo(
      () =>
        normaliseParticipants(
          runtimeRemoteUsers &&
          Object.keys(
            runtimeRemoteUsers
          ).length
            ? runtimeRemoteUsers
            : remoteUsers
        ),
      [
        runtimeRemoteUsers,
        remoteUsers,
      ]
    );


  // ===================================================
  // GRID CONFIG
  // ===================================================

  const columnCount =
    Math.max(
      1,
      Number(
        columns
      ) || 1
    );


  const gridGap =
    Math.max(
      0,
      Number(
        gap
      ) || 0
    );


  const safeEmptyText =
    safeText(
      emptyText,
      "No remote participants"
    );


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[RemoteVideoGrid]",
    {

      source,

      sourceType:
        typeof source,

      participantCount:
        participants.length,

      columnCount,

      gridGap,

      runtimeRemoteUsers,

    }
  );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{

        width:
          "100%",

        display:
          "grid",

        gridTemplateColumns:
          `repeat(${columnCount}, minmax(0, 1fr))`,

        gap:
          gridGap,

        ...style,

      }}
    >

      {participants.length === 0 ? (

        <div
          style={{

            gridColumn:
              "1 / -1",

            padding:
              16,

            border:
              "1px solid #222",

            borderRadius:
              8,

            background:
              "#111",

            color:
              "#777",

            fontSize:
              11,

            textAlign:
              "center",

          }}
        >

          {safeEmptyText}

        </div>

      ) : (

        participants.map(
          ({
            participant,
            key,
          }) => (

            <RemoteParticipantTile

              key={
                key
              }

              participant={
                participant
              }

            />

          )
        )

      )}

    </div>

  );

}
