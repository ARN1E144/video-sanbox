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


  // ---------------------------------------------------
  // Object values must never be rendered directly.
  // ---------------------------------------------------

  if (
    isObject(
      value
    )
  ) {

    // Prefer common identity fields first.
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
  // Already-resolved runtime value
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


          // -----------------------------------------
          // Preserve Agora/runtime participant object
          // and provide a stable key.
          // -----------------------------------------

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

  const tileRef = React.useRef(null);

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

    const user =
      agoraEngine.getRemoteUser(
        rawUid
      );

    const videoTrack =
      user?.videoTrack;

    if (
      !videoTrack ||
      !tileRef.current
    ) {
      return;
    }

    const container =
      tileRef.current;

    console.log(
      "[RemoteVideoTile] PLAY",
      {
        uid,
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

    } catch (error) {

      console.error(
        "[RemoteVideoTile] play failed",
        {
          uid,
          error,
        }
      );

    }

    return () => {

      try {

        videoTrack.stop();

      } catch (error) {

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


  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        minHeight: 120,
        overflow: "hidden",
        borderRadius: 8,
        background: "#000",
      }}
    >

      <div
        ref={tileRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          zIndex: 10,
          padding: "3px 6px",
          borderRadius: 4,
          background: "rgba(0,0,0,.65)",
          color: "#fff",
          fontSize: 10,
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
  // RESOLVE SOURCE
  // ===================================================

  useEffect(() => {

    // -------------------------------------------------
    // Already-resolved object
    // -------------------------------------------------

    if (
      typeof source !==
        "string"
    ) {

      setRuntimeRemoteUsers(
        source || {}
      );


      return undefined;

    }


    const trimmed =
      source.trim();


    if (
      !trimmed
    ) {

      setRuntimeRemoteUsers(
        runtime.get?.(
          "call.remoteUsers"
        ) || {}
      );


      return undefined;

    }


    // -------------------------------------------------
    // Resolve binding syntax
    // -------------------------------------------------

    const runtimePath =
      trimmed.startsWith(
        "{{"
      ) &&
      trimmed.endsWith(
        "}}"
      )

        ? trimmed
            .slice(
              2,
              -2
            )
            .trim()

        : trimmed;


    if (
      !runtimePath
    ) {

      setRuntimeRemoteUsers(
        {}
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

          setRuntimeRemoteUsers(
            value || {}
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
    source,
  ]);
  
  useEffect(() => {

  return agoraEngine.on(
    "REMOTE_USERS_CHANGED",
    () => {
      forceRemoteRender(
        value => value + 1
      );
    }
  );

}, []);


  // ===================================================
  // PARTICIPANTS
  // ===================================================

  const participants =
    useMemo(
      () =>
        normaliseParticipants(
          runtimeRemoteUsers
        ),
      [
        runtimeRemoteUsers,
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

      {participants.length ===
      0 ? (

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