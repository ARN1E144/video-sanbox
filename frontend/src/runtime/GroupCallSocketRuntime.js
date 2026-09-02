// src/runtime/GroupCallSocketRuntime.js

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import {
  useActionContext,
} from "../context/ActionContext";

import agoraEngine
  from "../services/agoraEngine";

import groupCallSocket
  from "../services/groupCallSocket";


// =====================================================
// HELPERS
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const text =
    String(
      value
    ).trim();


  return text ||
    null;

}


// =====================================================
// RESOLVE CURRENT USER ID
// =====================================================
//
// We deliberately support several possible runtime/session
// locations because the authentication context and runtime
// authentication state can evolve independently.
//
// =====================================================

function resolveCurrentUserId(
  runtime,
  session
) {

  const candidates = [

    // -----------------------------------------------
    // Runtime auth
    // -----------------------------------------------

    runtime.get?.(
      "auth.userId"
    ),

    runtime.get?.(
      "auth.id"
    ),

    runtime.get?.(
      "user.id"
    ),

    runtime.get?.(
      "user.userId"
    ),

    // -----------------------------------------------
    // Session
    // -----------------------------------------------

    session?.userId,

    session?.user?.userId,

    session?.user?.id,

    session?.user?._id,

    session?.user?._id?.toString?.(),

  ];


  for (
    const candidate of
      candidates
  ) {

    const id =
      normaliseId(
        candidate
      );


    if (
      id
    ) {

      return id;

    }

  }


  return null;

}


// =====================================================
// COMPONENT
// =====================================================
//
// Runtime-level Socket.IO bridge for group calls.
//
// Responsibilities:
//
//   authenticated user
//       ↓
//   Socket.IO connection
//       ↓
//   group-call room membership
//       ↓
//   realtime lifecycle events
//       ↓
//   Runtime / Agora cleanup
//
// Realtime events:
//
//   GROUP_CALL_INVITED
//   GROUP_CALL_PARTICIPANT_LEFT
//   GROUP_CALL_ENDED
//
// HTTP polling remains the fallback/reconciliation path.
//
// IMPORTANT:
//
// This component renders nothing.
//
// It must live below:
//
//   RuntimeStateProvider
//   ActionProvider
//
// =====================================================

export default function GroupCallSocketRuntime() {

  // ===================================================
  // AUTH
  // ===================================================

  const {
    session,
    loading: authLoading,
  } =
    useAuth();


  // ===================================================
  // RUNTIME
  // ===================================================

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
    useActionContext();


  // ===================================================
  // SOCKET TOKEN
  // ===================================================

  const accessToken =
    session?.tokens?.accessToken ||
    null;


  // ===================================================
  // CURRENT USER ID
  // ===================================================

  const currentUserId =
    resolveCurrentUserId(
      runtime,
      session
    );


  // ===================================================
  // REACTIVE CALL STATE
  // ===================================================

  const [
    callId,
    setCallId,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.id"
      ) || null
  );


  const [
    callType,
    setCallType,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.type"
      ) || null
  );


  const [
    joined,
    setJoined,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.joined"
      ) === true
  );


  // ===================================================
  // REFS
  // ===================================================

  const mountedRef =
    useRef(false);


  const activeCallIdRef =
    useRef(null);


  const joinedRef =
    useRef(false);


  const callTypeRef =
    useRef(null);


  const cleanupRunningRef =
    useRef(false);


  const invitationRefreshRunningRef =
    useRef(false);


  const connectedRef =
    useRef(false);


  // ===================================================
  // KEEP REFS IN SYNC
  // ===================================================

  activeCallIdRef.current =
    callId;


  joinedRef.current =
    joined;


  callTypeRef.current =
    callType;


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    // -------------------------------------------------
    // INITIAL VALUES
    // -------------------------------------------------

    setCallId(
      runtime.get?.(
        "call.id"
      ) || null
    );


    setCallType(
      runtime.get?.(
        "call.type"
      ) || null
    );


    setJoined(
      runtime.get?.(
        "call.joined"
      ) === true
    );


    // -------------------------------------------------
    // CALL ID
    // -------------------------------------------------

    const unsubscribeCallId =
      runtime.subscribe?.(
        "call.id",
        value => {

          const nextCallId =
            normaliseId(
              value
            );


          console.log(
            "[GroupCallSocketRuntime] call.id changed",
            {
              callId:
                nextCallId,
            }
          );


          activeCallIdRef.current =
            nextCallId;


          setCallId(
            nextCallId
          );

        }
      );


    // -------------------------------------------------
    // CALL TYPE
    // -------------------------------------------------

    const unsubscribeCallType =
      runtime.subscribe?.(
        "call.type",
        value => {

          const nextCallType =
            value
              ? String(
                  value
                ).trim()
              : null;


          console.log(
            "[GroupCallSocketRuntime] call.type changed",
            {
              callType:
                nextCallType,
            }
          );


          callTypeRef.current =
            nextCallType;


          setCallType(
            nextCallType
          );

        }
      );


    // -------------------------------------------------
    // JOINED
    // -------------------------------------------------

    const unsubscribeJoined =
      runtime.subscribe?.(
        "call.joined",
        value => {

          const nextJoined =
            value === true;


          console.log(
            "[GroupCallSocketRuntime] call.joined changed",
            {
              joined:
                nextJoined,
            }
          );


          joinedRef.current =
            nextJoined;


          setJoined(
            nextJoined
          );

        }
      );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      mountedRef.current =
        false;


      unsubscribeCallId?.();

      unsubscribeCallType?.();

      unsubscribeJoined?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // SOCKET CONNECTION
  // ===================================================

  useEffect(() => {

    if (
      authLoading ||
      !accessToken
    ) {

      return undefined;

    }


    console.log(
      "[GroupCallSocketRuntime] connecting socket"
    );


    const socket =
      groupCallSocket.connect(
        accessToken
      );


    if (
      !socket
    ) {

      console.warn(
        "[GroupCallSocketRuntime] socket connection unavailable"
      );


      return undefined;

    }


    return undefined;

  }, [
    authLoading,
    accessToken,
  ]);


  // ===================================================
  // SOCKET CONNECTED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CONNECTED",
        payload => {

          connectedRef.current =
            true;


          console.log(
            "[GroupCallSocketRuntime] socket connected",
            payload
          );


          // -------------------------------------------
          // Re-establish current group-call room.
          // -------------------------------------------

          const activeCallId =
            activeCallIdRef.current;


          const activeJoined =
            joinedRef.current;


          const activeCallType =
            callTypeRef.current;


          if (
            activeCallType ===
              "group" &&
            activeJoined &&
            activeCallId
          ) {

            console.log(
              "[GroupCallSocketRuntime] joining active call after socket connect",
              {
                callId:
                  activeCallId,
              }
            );


            groupCallSocket.joinCall(
              activeCallId
            );

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // SOCKET DISCONNECTED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "DISCONNECTED",
        payload => {

          connectedRef.current =
            false;


          console.log(
            "[GroupCallSocketRuntime] socket disconnected",
            payload
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // SOCKET CONNECTION ERROR
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CONNECT_ERROR",
        payload => {

          connectedRef.current =
            false;


          console.error(
            "[GroupCallSocketRuntime] socket connection error",
            payload
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // NEW GROUP CALL INVITATION
  // ===================================================
  //
  // Backend emits:
  //
  //   group-call:invited
  //
  // The backend currently broadcasts this event to the
  // namespace, so EVERY connected user receives it.
  //
  // We therefore filter locally by userId.
  //
  // Only the intended recipient triggers a pending
  // invitation refresh.
  //
  // This gives us immediate invitation delivery while
  // keeping the existing HTTP polling as fallback.
  //
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "GROUP_CALL_INVITED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const invitationUserId =
            normaliseId(
              payload?.userId
            );


          const invitationCallId =
            normaliseId(
              payload?.callId
            );


          // ------------------------------------------------
          // Cannot safely target the current user.
          // ------------------------------------------------

          if (
            !currentUserId
          ) {

            console.warn(
              "[GroupCallSocketRuntime] invitation received but current user ID unavailable",
              {
                payload,
              }
            );


            return;

          }


          // ------------------------------------------------
          // Ignore invitations belonging to another user.
          // ------------------------------------------------

          if (
            !invitationUserId ||
            invitationUserId !==
              currentUserId
          ) {

            console.log(
              "[GroupCallSocketRuntime] ignoring invitation for another user",
              {

                invitationUserId,

                currentUserId,

                callId:
                  invitationCallId,

              }
            );


            return;

          }


          // ------------------------------------------------
          // Prevent duplicate refreshes if several
          // invitation events arrive together.
          // ------------------------------------------------

          if (
            invitationRefreshRunningRef.current
          ) {

            console.log(
              "[GroupCallSocketRuntime] invitation refresh already running"
            );


            return;

          }


          invitationRefreshRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] GROUP_CALL_INVITED received",
              {

                callId:
                  invitationCallId,

                userId:
                  invitationUserId,

                invitedBy:
                  payload?.invitedBy,

                reason:
                  payload?.reason,

              }
            );


            // =========================================
            // REFRESH AUTHORITATIVE INVITATIONS
            // =========================================

            const result =
              await runAction(
                "call.fetchPendingInvitations"
              );


            console.log(
              "[GroupCallSocketRuntime] pending invitations refreshed after realtime invitation",
              {

                callId:
                  invitationCallId,

                result,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] realtime invitation refresh failed",
              error
            );

          }
          finally {

            invitationRefreshRunningRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    currentUserId,
    runAction,
  ]);


  // ===================================================
  // JOIN ACTIVE GROUP CALL
  // ===================================================
  //
  // When:
  //
  //   call.type = group
  //   call.joined = true
  //   call.id exists
  //
  // join the corresponding Socket.IO room.
  //
  // ===================================================

  useEffect(() => {

    if (
      callType !==
        "group" ||
      !joined ||
      !callId
    ) {

      return;

    }


    console.log(
      "[GroupCallSocketRuntime] joining active group call",
      {

        callId,

        callType,

        joined,

        socketConnected:
          groupCallSocket.isConnected(),

      }
    );


    if (
      groupCallSocket.isConnected()
    ) {

      groupCallSocket.joinCall(
        callId
      );

    }

  }, [
    callType,
    joined,
    callId,
  ]);


  // ===================================================
  // GROUP CALL ENDED
  // ===================================================
  //
  // The server is authoritative.
  //
  // DO NOT call call.endGroupCall here.
  //
  // The server has already ended the call.
  //
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "GROUP_CALL_ENDED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const endedCallId =
            normaliseId(
              payload?.callId
            );


          const activeCallId =
            activeCallIdRef.current;


          // ------------------------------------------------
          // Ignore unrelated call.
          // ------------------------------------------------

          if (
            endedCallId &&
            activeCallId &&
            endedCallId !==
              activeCallId
          ) {

            console.log(
              "[GroupCallSocketRuntime] ignoring unrelated ended call",
              {

                endedCallId,

                activeCallId,

              }
            );


            return;

          }


          // ------------------------------------------------
          // Prevent duplicate cleanup.
          // ------------------------------------------------

          if (
            cleanupRunningRef.current
          ) {

            console.log(
              "[GroupCallSocketRuntime] cleanup already running"
            );


            return;

          }


          cleanupRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] GROUP_CALL_ENDED received",
              {

                callId:
                  endedCallId,

                reason:
                  payload?.reason,

                endedBy:
                  payload?.endedBy,

              }
            );


            // =========================================
            // LEAVE SOCKET ROOM
            // =========================================

            if (
              endedCallId
            ) {

              groupCallSocket.leaveCall(
                endedCallId
              );

            }


            // =========================================
            // LEAVE AGORA
            // =========================================

            try {

              await agoraEngine.leaveCall();

            }
            catch (error) {

              console.warn(
                "[GroupCallSocketRuntime] Agora leave warning",
                error
              );

            }


            // =========================================
            // CLEAR RUNTIME CALL STATE
            // =========================================

            runtime.patch?.(
              "call",
              {

                id:
                  null,

                channel:
                  null,

                type:
                  null,

                state:
                  "ended",

                joined:
                  false,

                remoteUsers:
                  {},

                participants:
                  [],

                selectedParticipantIds:
                  [],

              }
            );


            console.log(
              "[GroupCallSocketRuntime] group call cleanup complete",
              {

                callId:
                  endedCallId,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] GROUP_CALL_ENDED handling failed",
              error
            );

          }
          finally {

            cleanupRunningRef.current =
              false;

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // PARTICIPANT LEFT
  // ===================================================
  //
  // AgoraEngine owns the actual remote media removal.
  //
  // We refresh application-level participant state so
  // the runtime sees the authoritative server state.
  //
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "GROUP_CALL_PARTICIPANT_LEFT",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventCallId =
            normaliseId(
              payload?.callId
            );


          const activeCallId =
            activeCallIdRef.current;


          if (
            eventCallId &&
            activeCallId &&
            eventCallId !==
              activeCallId
          ) {

            return;

          }


          if (
            !activeCallId
          ) {

            return;

          }


          console.log(
            "[GroupCallSocketRuntime] participant left",
            {

              callId:
                activeCallId,

              userId:
                payload?.userId,

            }
          );


          try {

            const result =
              await runAction(
                "call.refreshGroupCall",
                {

                  callId:
                    activeCallId,

                }
              );


            console.log(
              "[GroupCallSocketRuntime] participant state refreshed",
              {

                callId:
                  activeCallId,

                result,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] participant refresh failed",
              error
            );

          }

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runAction,
  ]);


  // ===================================================
  // COMPONENT CLEANUP
  // ===================================================

  useEffect(() => {

    return () => {

      mountedRef.current =
        false;


      console.log(
        "[GroupCallSocketRuntime] unmounted"
      );

    };

  }, []);


  // ===================================================
  // DEVELOPMENT DIAGNOSTIC
  // ===================================================

  console.log(
    "[GroupCallSocketRuntime]",
    {

      currentUserId,

      callId,

      callType,

      joined,

      connected:
        groupCallSocket.isConnected(),

    }
  );


  return null;

}