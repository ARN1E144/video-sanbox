// src/components/elements/RemoteVideoGrid.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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


  return fallback;

}


// =====================================================
// RESOLVE RUNTIME PATH
// =====================================================

function resolveRuntimePath(
  source
) {

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
    trimmed.startsWith("{{") &&
    trimmed.endsWith("}}")
  ) {

    return trimmed
      .slice(
        2,
        -2
      )
      .trim();

  }


  return trimmed;

}


// =====================================================
// RESOLVE REMOTE USERS
// =====================================================

function resolveRemoteUsers(
  runtime,
  source
) {

  // ---------------------------------------------------
  // Direct object
  // ---------------------------------------------------

  if (
    isObject(
      source
    ) &&
    !Array.isArray(
      source
    )
  ) {

    return source;

  }


  // ---------------------------------------------------
  // Runtime path
  // ---------------------------------------------------

  const path =
    resolveRuntimePath(
      source
    );


  if (
    path
  ) {

    return (
      runtime.get?.(
        path
      ) || {}
    );

  }


  // ---------------------------------------------------
  // Default
  // ---------------------------------------------------

  return (
    runtime.get?.(
      "call.remoteUsers"
    ) || {}
  );

}


// =====================================================
// PARTICIPANT KEY
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
      String(
        index
      )
    );


  return (
    text ||
    String(
      index
    )
  );

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
        ) => {

          const participantWithUid =
            isObject(
              participant
            )
              ? {
                  ...participant,

                  uid:
                    participant.uid ??
                    participant.id ??
                    participant.userId ??
                    index,
                }

              : {
                  uid:
                    participant,
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
                    participant.userId ??
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
// REMOTE PARTICIPANT TILE
// =====================================================

function RemoteParticipantTile({

  participant,

  refreshVersion,

}) {

  const tileRef =
    useRef(null);


  const activeTrackRef =
    useRef(null);


  const retryTimerRef =
    useRef(null);


  const [
    playbackState,
    setPlaybackState,
  ] =
  useState(
    "waiting"
  );


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


  // ===================================================
  // DISPLAY NAME
  // ===================================================

  const displayName =
    safeText(
      participant?.displayName ??
      participant?.username ??
      participant?.name ??
      (
        [
          participant?.firstName,
          participant?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
      ),
      ""
    ) ||
    "Participant";


  // ===================================================
  // STOP PLAYBACK
  // ===================================================

  const stopPlayback =
    useCallback(
      () => {

        const activeTrack =
          activeTrackRef.current;


        if (
          activeTrack
        ) {

          try {

            activeTrack.stop();

          }
          catch (error) {

            console.warn(
              "[RemoteVideoTile] track stop failed",
              {
                uid,
                error,
              }
            );

          }

        }


        activeTrackRef.current =
          null;


        const container =
          tileRef.current;


        if (
          container
        ) {

          try {

            container.replaceChildren();

          }
          catch (error) {

            console.warn(
              "[RemoteVideoTile] DOM cleanup failed",
              {
                uid,
                error,
              }
            );

          }

        }

      },
      [
        uid,
      ]
    );


  // ===================================================
  // RECONCILE PLAYBACK
  // ===================================================

  const reconcilePlayback =
    useCallback(
      () => {

        if (
          rawUid === null ||
          rawUid === undefined
        ) {

          setPlaybackState(
            "waiting"
          );


          return false;

        }


        const agoraUser =
          agoraEngine.getRemoteUser(
            rawUid
          );


        const videoTrack =
          agoraUser?.videoTrack ||
          null;


        const readyState =
          videoTrack
            ?.mediaStreamTrack
            ?.readyState;


        console.log(
          "[RemoteVideoTile] TRACK CHECK",
          {

            uid,

            displayName,

            rawUid,

            hasAgoraUser:
              !!agoraUser,

            agoraUserUid:
              agoraUser?.uid,

            hasVideoTrack:
              !!videoTrack,

            readyState,

            refreshVersion,

          }
        );


        // ------------------------------------------------
        // No track
        // ------------------------------------------------

        if (
          !videoTrack
        ) {

          stopPlayback();


          setPlaybackState(
            "waiting"
          );


          return false;

        }


        // ------------------------------------------------
        // Track exists but native track is not live
        // ------------------------------------------------

        if (
          readyState &&
          readyState !== "live"
        ) {

          stopPlayback();


          setPlaybackState(
            "waiting"
          );


          return false;

        }


        // ------------------------------------------------
        // Already playing this exact track
        // ------------------------------------------------

        if (
          activeTrackRef.current ===
          videoTrack
        ) {

          setPlaybackState(
            "playing"
          );


          return true;

        }


        const container =
          tileRef.current;


        if (
          !container
        ) {

          setPlaybackState(
            "waiting"
          );


          return false;

        }


        // ------------------------------------------------
        // Replace previous track
        // ------------------------------------------------

        stopPlayback();


        try {

          console.log(
            "[RemoteVideoTile] PLAY",
            {

              uid,

              displayName,

              rawUid,

              refreshVersion,

            }
          );


          videoTrack.play(
            container
          );


          activeTrackRef.current =
            videoTrack;


          setPlaybackState(
            "playing"
          );


          console.log(
            "[RemoteVideoTile] PLAYING",
            {
              uid,
              displayName,
              rawUid,
            }
          );


          return true;

        }
        catch (error) {

          console.error(
            "[RemoteVideoTile] PLAY FAILED",
            {

              uid,

              displayName,

              rawUid,

              error,

            }
          );


          activeTrackRef.current =
            null;


          setPlaybackState(
            "error"
          );


          return false;

        }

      },
      [
        rawUid,
        uid,
        displayName,
        refreshVersion,
        stopPlayback,
      ]
    );


  // ===================================================
  // RETRY
  // ===================================================

  const scheduleRetry =
    useCallback(
      () => {

        if (
          retryTimerRef.current !==
          null
        ) {

          return;

        }


        retryTimerRef.current =
          window.setTimeout(
            () => {

              retryTimerRef.current =
                null;


              const playing =
                reconcilePlayback();


              if (
                !playing
              ) {

                scheduleRetry();

              }

            },
            250
          );

      },
      [
        reconcilePlayback,
      ]
    );


  // ===================================================
  // PLAYBACK EFFECT
  // ===================================================

  useEffect(
    () => {

      if (
        retryTimerRef.current !==
        null
      ) {

        window.clearTimeout(
          retryTimerRef.current
        );


        retryTimerRef.current =
          null;

      }


      const playing =
        reconcilePlayback();


      if (
        !playing
      ) {

        scheduleRetry();

      }


      return () => {

        if (
          retryTimerRef.current !==
          null
        ) {

          window.clearTimeout(
            retryTimerRef.current
          );


          retryTimerRef.current =
            null;

        }

      };

    },
    [
      reconcilePlayback,
      scheduleRetry,
    ]
  );


  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(
    () => {

      return () => {

        if (
          retryTimerRef.current !==
          null
        ) {

          window.clearTimeout(
            retryTimerRef.current
          );


          retryTimerRef.current =
            null;

        }


        stopPlayback();

      };

    },
    [
      stopPlayback,
    ]
  );


  // ===================================================
  // RENDER
  // ===================================================

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

        border:
          "1px solid #222",

      }}
    >

      {/* ===============================================
          VIDEO SURFACE
      =============================================== */}

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

          background:
            "#000",

        }}
      />


      {/* ===============================================
          WAITING / ERROR
      =============================================== */}

      {playbackState !== "playing" && (

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
              "#aaa",

            background:
              "#111",

            fontSize:
              11,

            textAlign:
              "center",

            pointerEvents:
              "none",

          }}
        >

          {
            playbackState ===
              "error"

              ? "Unable to play remote video"

              : "Waiting for remote video"
          }

        </div>

      )}


      {/* ===============================================
          PARTICIPANT NAME
      =============================================== */}

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
            "4px 7px",

          borderRadius:
            4,

          background:
            "rgba(0,0,0,.7)",

          color:
            "#fff",

          fontSize:
            10,

          fontWeight:
            600,

        }}
      >

        {displayName}

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
  // RUNTIME PATH
  // ===================================================

  const runtimePath =
    useMemo(
      () =>
        resolveRuntimePath(
          source
        ),
      [
        source,
      ]
    );


  // ===================================================
  // RUNTIME USERS
  // ===================================================

  const [
    runtimeRemoteUsers,
    setRuntimeRemoteUsers,
  ] =
  useState(
    () =>
      resolveRemoteUsers(
        runtime,
        source
      )
  );


  // ===================================================
  // REFRESH VERSION
  // ===================================================

  const [
    refreshVersion,
    setRefreshVersion,
  ] =
  useState(
    0
  );


  // ===================================================
  // RUNTIME SUBSCRIPTION
  // ===================================================

  useEffect(
    () => {

      // -------------------------------------------------
      // Direct object source
      // -------------------------------------------------

      if (
        typeof source !== "string"
      ) {

        setRuntimeRemoteUsers(
          source || {}
        );


        return undefined;

      }


      const path =
        runtimePath ||
        "call.remoteUsers";


      // -------------------------------------------------
      // Initial value
      // -------------------------------------------------

      const initialValue =
        runtime.get?.(
          path
        ) || {};


      setRuntimeRemoteUsers(
        initialValue
      );


      // -------------------------------------------------
      // Subscribe
      // -------------------------------------------------

      const unsubscribe =
        runtime.subscribe?.(
          path,
          value => {

            console.log(
              "[RemoteVideoGrid] RUNTIME UPDATE",
              {

                path,

                users:
                  value,

              }
            );


            setRuntimeRemoteUsers(
              value || {}
            );


            setRefreshVersion(
              current =>
                current + 1
            );

          }
        );


      return () => {

        unsubscribe?.();

      };

    },
    [
      runtime,
      runtimePath,
      source,
    ]
  );


  // ===================================================
  // AGORA EVENTS
  // ===================================================

  useEffect(
    () => {

      const handleAgoraRefresh =
        (
          event,
          payload = {}
        ) => {

          console.log(
            `[RemoteVideoGrid] ${event}`,
            payload
          );


          setRefreshVersion(
            current =>
              current + 1
          );

        };


      // -------------------------------------------------
      // Remote collection changed
      // -------------------------------------------------

      const unsubscribeRemoteUsers =
        agoraEngine.on(
          "REMOTE_USERS_CHANGED",
          payload =>
            handleAgoraRefresh(
              "REMOTE_USERS_CHANGED",
              payload
            )
        );


      // -------------------------------------------------
      // Individual remote video track ready
      // -------------------------------------------------

      const unsubscribeVideoReady =
        agoraEngine.on(
          "REMOTE_VIDEO_TRACK_READY",
          payload =>
            handleAgoraRefresh(
              "REMOTE_VIDEO_TRACK_READY",
              payload
            )
        );


      // -------------------------------------------------
      // Individual remote video track unavailable
      // -------------------------------------------------

      const unsubscribeVideoUnavailable =
        agoraEngine.on(
          "REMOTE_VIDEO_TRACK_UNAVAILABLE",
          payload =>
            handleAgoraRefresh(
              "REMOTE_VIDEO_TRACK_UNAVAILABLE",
              payload
            )
        );


      // -------------------------------------------------
      // User published
      // -------------------------------------------------

      const unsubscribePublished =
        agoraEngine.on(
          "USER_PUBLISHED",
          payload =>
            handleAgoraRefresh(
              "USER_PUBLISHED",
              payload
            )
        );


      // -------------------------------------------------
      // User unpublished
      // -------------------------------------------------

      const unsubscribeUnpublished =
        agoraEngine.on(
          "USER_UNPUBLISHED",
          payload =>
            handleAgoraRefresh(
              "USER_UNPUBLISHED",
              payload
            )
        );


      // -------------------------------------------------
      // User left
      // -------------------------------------------------

      const unsubscribeLeft =
        agoraEngine.on(
          "USER_LEFT",
          payload =>
            handleAgoraRefresh(
              "USER_LEFT",
              payload
            )
        );


      return () => {

        unsubscribeRemoteUsers?.();

        unsubscribeVideoReady?.();

        unsubscribeVideoUnavailable?.();

        unsubscribePublished?.();

        unsubscribeUnpublished?.();

        unsubscribeLeft?.();

      };

    },
    []
  );


  // ===================================================
  // PARTICIPANTS
  // ===================================================

  const resolvedRemoteUsers =
    resolveRemoteUsers(
      runtime,
      source
    );


  const effectiveRemoteUsers =
    isObject(
      runtimeRemoteUsers
    ) &&
    Object.keys(
      runtimeRemoteUsers
    ).length > 0

      ? runtimeRemoteUsers

      : resolvedRemoteUsers;


  const participants =
    useMemo(
      () =>
        normaliseParticipants(
          effectiveRemoteUsers
        ),
      [
        effectiveRemoteUsers,
      ]
    );


  // ===================================================
  // GRID SETTINGS
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

      runtimePath,

      participantCount:
        participants.length,

      columnCount,

      gridGap,

      refreshVersion,

      runtimeRemoteUsers:

        runtimeRemoteUsers,

    }
  );


  // ===================================================
  // RENDER
  // =====================================================

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

              refreshVersion={
                refreshVersion
              }

            />

          )
        )

      )}

    </div>

  );

}