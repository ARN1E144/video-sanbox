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


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


// =====================================================
// CURRENT USER ID
// =====================================================

function resolveCurrentUserId(
  runtime,
  session
) {

  const candidates = [

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
// Runtime bridge for:
//
//   Group Calls
//   Remote Training
//
// Responsibilities:
//
//   - connect authenticated socket
//   - join appropriate realtime rooms
//   - reconcile realtime events with runtime state
//   - clean up Agora when server ends a session
//
// NOT responsible for:
//
//   - database lifecycle
//   - socket implementation
//   - REST route implementation
//   - Agora implementation
//
// =====================================================

export default function GroupCallSocketRuntime() {

  // ===================================================
  // AUTH
  // ===================================================

  const {
    session,
    loading:
      authLoading,
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
  // AUTH TOKEN
  // ===================================================

  const accessToken =
    session?.tokens?.accessToken ||
    null;


  // ===================================================
  // USER
  // ===================================================

  const currentUserId =
    resolveCurrentUserId(
      runtime,
      session
    );


  // ===================================================
  // GROUP CALL STATE
  // ===================================================

  const [
    callId,
    setCallId,
  ] =
  useState(
    () =>
      normaliseId(
        runtime.get?.(
          "call.id"
        )
      )
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
    callJoined,
    setCallJoined,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.joined"
      ) === true
  );


  // ===================================================
  // TRAINING STATE
  // ===================================================

  const [
    trainingSessionId,
    setTrainingSessionId,
  ] =
  useState(
    () =>
      normaliseId(
        runtime.get?.(
          "training.sessionId"
        )
      )
  );


  const [
    trainingJoined,
    setTrainingJoined,
  ] =
  useState(
    () =>
      runtime.get?.(
        "training.joined"
      ) === true
  );


// ===================================================
// REFS
// ===================================================

const mountedRef =
  useRef(false);


// ---------------------------------------------------
// Group Call
// ---------------------------------------------------

const callIdRef =
  useRef(callId);

const callTypeRef =
  useRef(callType);

const callJoinedRef =
  useRef(callJoined);


// ---------------------------------------------------
// Training
// ---------------------------------------------------

const trainingSessionIdRef =
  useRef(trainingSessionId);

const trainingJoinedRef =
  useRef(trainingJoined);


// ---------------------------------------------------
// Connection
// ---------------------------------------------------

const connectedRef =
  useRef(false);


// ---------------------------------------------------
// Cleanup locks
// ---------------------------------------------------

const groupCallCleanupRunningRef =
  useRef(false);

const trainingCleanupRunningRef =
  useRef(false);


// ---------------------------------------------------
// Invitation refresh locks
// ---------------------------------------------------

const groupInvitationRefreshRef =
  useRef(false);

const trainingInvitationRefreshRef =
  useRef(false);


  // ===================================================
  // REF SYNCHRONISATION
  // ===================================================

  callIdRef.current =
    callId;


  callTypeRef.current =
    callType;


  callJoinedRef.current =
    callJoined;


  trainingSessionIdRef.current =
    trainingSessionId;


  trainingJoinedRef.current =
    trainingJoined;


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    setCallId(
      normaliseId(
        runtime.get?.(
          "call.id"
        )
      )
    );


    setCallType(
      runtime.get?.(
        "call.type"
      ) || null
    );


    setCallJoined(
      runtime.get?.(
        "call.joined"
      ) === true
    );


    setTrainingSessionId(
      normaliseId(
        runtime.get?.(
          "training.sessionId"
        )
      )
    );


    setTrainingJoined(
      runtime.get?.(
        "training.joined"
      ) === true
    );


    // -------------------------------------------------
    // Group Call ID
    // -------------------------------------------------

    const unsubscribeCallId =
      runtime.subscribe?.(
        "call.id",
        value => {

          const next =
            normaliseId(
              value
            );


          callIdRef.current =
            next;


          setCallId(
            next
          );

        }
      );


    // -------------------------------------------------
    // Call Type
    // -------------------------------------------------

    const unsubscribeCallType =
      runtime.subscribe?.(
        "call.type",
        value => {

          const next =
            value
              ? String(
                  value
                ).trim()
              : null;


          callTypeRef.current =
            next;


          setCallType(
            next
          );

        }
      );


    // -------------------------------------------------
    // Call Joined
    // -------------------------------------------------

    const unsubscribeCallJoined =
      runtime.subscribe?.(
        "call.joined",
        value => {

          const next =
            value === true;


          callJoinedRef.current =
            next;


          setCallJoined(
            next
          );

        }
      );


    // -------------------------------------------------
    // Training Session
    // -------------------------------------------------

    const unsubscribeTrainingSessionId =
      runtime.subscribe?.(
        "training.sessionId",
        value => {

          const next =
            normaliseId(
              value
            );


          trainingSessionIdRef.current =
            next;


          setTrainingSessionId(
            next
          );

        }
      );


    // -------------------------------------------------
    // Training Joined
    // -------------------------------------------------

    const unsubscribeTrainingJoined =
      runtime.subscribe?.(
        "training.joined",
        value => {

          const next =
            value === true;


          trainingJoinedRef.current =
            next;


          setTrainingJoined(
            next
          );

        }
      );


    return () => {

      mountedRef.current =
        false;


      unsubscribeCallId?.();

      unsubscribeCallType?.();

      unsubscribeCallJoined?.();

      unsubscribeTrainingSessionId?.();

      unsubscribeTrainingJoined?.();

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
            "[GroupCallSocketRuntime] SOCKET CONNECTED",
            payload
          );


          // ---------------------------------------------
          // GROUP CALL
          // ---------------------------------------------

          const activeCallId =
            callIdRef.current;


          const activeCallType =
            callTypeRef.current;


          const activeCallJoined =
            callJoinedRef.current;


          if (
            activeCallType ===
              "group" &&
            activeCallJoined &&
            activeCallId
          ) {

            groupCallSocket.joinCall(
              activeCallId
            );

          }


          // ---------------------------------------------
          // TRAINING
          // ---------------------------------------------

          const activeTrainingSessionId =
            trainingSessionIdRef.current;


          const activeTrainingJoined =
            trainingJoinedRef.current;


          if (
            activeTrainingSessionId &&
            activeTrainingJoined
          ) {

            groupCallSocket.joinTrainingSession(
              activeTrainingSessionId
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
            "[GroupCallSocketRuntime] SOCKET DISCONNECTED",
            payload
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // SOCKET ERROR
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "CONNECT_ERROR",
        payload => {

          connectedRef.current =
            false;


          console.error(
            "[GroupCallSocketRuntime] SOCKET ERROR",
            payload
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


  // ===================================================
  // GROUP CALL INVITATION
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


          if (
            !currentUserId
          ) {

            console.warn(
              "[GroupCallSocketRuntime] group invitation received without current user",
              {
                payload,
              }
            );


            return;

          }


          if (
            invitationUserId !==
            currentUserId
          ) {

            return;

          }


          if (
            groupInvitationRefreshRef.current
          ) {

            return;

          }


          groupInvitationRefreshRef.current =
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

              }
            );


            await runAction(
              "call.fetchPendingInvitations"
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] group invitation refresh failed",
              error
            );

          }
          finally {

            groupInvitationRefreshRef.current =
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
  // TRAINING INVITATION
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_INVITED",
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


          const invitationSessionId =
            normaliseId(
              payload?.sessionId
            );


          console.log(
            "[GroupCallSocketRuntime] TRAINING EVENT RECEIVED",
            {

              event:
                "TRAINING_SESSION_INVITED",

              sessionId:
                invitationSessionId,

              userId:
                invitationUserId,

              currentUserId,

            }
          );


          if (
            !currentUserId
          ) {

            console.warn(
              "[GroupCallSocketRuntime] training invitation received without current user"
            );


            return;

          }


          if (
            invitationUserId &&
            invitationUserId !==
              currentUserId
          ) {

            return;

          }


          if (
            trainingInvitationRefreshRef.current
          ) {

            return;

          }


          trainingInvitationRefreshRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] refreshing training invitations"
            );


            const result =
              await runAction(
                "training.fetchPendingSessions"
              );


            console.log(
              "[GroupCallSocketRuntime] training invitations refreshed",
              {

                sessionId:
                  invitationSessionId,

                result,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] training invitation refresh failed",
              error
            );

          }
          finally {

            trainingInvitationRefreshRef.current =
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
  // GROUP CALL ROOM SYNC
  // ===================================================

  useEffect(() => {

    if (
      callType !==
        "group"
    ) {

      return;

    }


    if (
      !callJoined ||
      !callId
    ) {

      return;

    }


    if (
      !groupCallSocket.isConnected()
    ) {

      return;

    }


    groupCallSocket.joinCall(
      callId
    );

  }, [
    callType,
    callJoined,
    callId,
  ]);


  // ===================================================
  // TRAINING ROOM SYNC
  // ===================================================

  useEffect(() => {

    if (
      !trainingSessionId ||
      !trainingJoined
    ) {

      return;

    }


    if (
      !groupCallSocket.isConnected()
    ) {

      return;

    }


    console.log(
      "[GroupCallSocketRuntime] joining training session",
      {

        sessionId:
          trainingSessionId,

      }
    );


    groupCallSocket.joinTrainingSession(
      trainingSessionId
    );

  }, [
    trainingSessionId,
    trainingJoined,
  ]);


  // ===================================================
  // GROUP CALL ENDED
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
            callIdRef.current;


          if (
            endedCallId &&
            activeCallId &&
            endedCallId !==
              activeCallId
          ) {

            return;

          }


          if (
            groupCallCleanupRunningRef.current
          ) {

            return;

          }


          groupCallCleanupRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] GROUP_CALL_ENDED received",
              payload
            );


            groupCallSocket.leaveCall(
              endedCallId ||
              activeCallId
            );


            await agoraEngine.leaveCall();


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


            callIdRef.current =
              null;


            callJoinedRef.current =
              false;


            setCallId(
              null
            );


            setCallJoined(
              false
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] group call cleanup failed",
              error
            );

          }
          finally {

            groupCallCleanupRunningRef.current =
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
  // TRAINING STARTED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_STARTED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const startedSessionId =
            normaliseId(
              payload?.sessionId
            );


          console.log(
            "[GroupCallSocketRuntime] TRAINING_SESSION_STARTED received",
            {

              sessionId:
                startedSessionId,

            }
          );


          // ------------------------------------------------
          // We don't automatically join.
          //
          // fetchPendingSessions will replace the invitation
          // state with the now-active session.
          // ------------------------------------------------

          try {

            await runAction(
              "training.fetchPendingSessions"
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] training start refresh failed",
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
  // TRAINING ENDED
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_ENDED",
        async payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const endedSessionId =
            normaliseId(
              payload?.sessionId
            );


          const activeSessionId =
            trainingSessionIdRef.current;


          // ------------------------------------------------
          // Strict session matching.
          //
          // If we don't have a current session, ignore the
          // event rather than accidentally tearing down
          // unrelated Agora media.
          // ------------------------------------------------

          if (
            !activeSessionId ||
            (
              endedSessionId &&
              endedSessionId !==
                activeSessionId
            )
          ) {

            console.log(
              "[GroupCallSocketRuntime] ignoring unrelated training end",
              {

                endedSessionId,

                activeSessionId,

              }
            );


            return;

          }


          if (
            trainingCleanupRunningRef.current
          ) {

            return;

          }


          trainingCleanupRunningRef.current =
            true;


          try {

            console.log(
              "[GroupCallSocketRuntime] TRAINING_SESSION_ENDED received",
              {

                sessionId:
                  endedSessionId ||
                  activeSessionId,

                reason:
                  payload?.reason,

                endedBy:
                  payload?.endedBy,

              }
            );


            // =========================================
            // LEAVE TRAINING SOCKET ROOM
            // =========================================

            groupCallSocket.leaveTrainingSession(
              endedSessionId ||
              activeSessionId
            );


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
            // CLEAR TRAINING STATE
            // =========================================

            runtime.patch?.(
              "training",
              {

                sessionId:
                  null,

                channel:
                  null,

                status:
                  "ended",

                joined:
                  false,

                participant:
                  null,

                participantIds:
                  [],

                participants:
                  [],

                pendingSession:
                  null,

                pendingSessions:
                  [],

                hasPendingSession:
                  false,

                endedAt:
                  payload?.endedAt ||
                  Date.now(),

              }
            );


            // =========================================
            // CLEAR LEGACY CALL STATE
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


            // =========================================
            // UPDATE LOCAL REFS
            // =========================================

            trainingSessionIdRef.current =
              null;


            trainingJoinedRef.current =
              false;


            setTrainingSessionId(
              null
            );


            setTrainingJoined(
              false
            );


            console.log(
              "[GroupCallSocketRuntime] training cleanup complete",
              {

                sessionId:
                  endedSessionId ||
                  activeSessionId,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocketRuntime] training cleanup failed",
              error
            );

          }
          finally {

            trainingCleanupRunningRef.current =
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
  // TRAINING PARTICIPANT LEFT
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      groupCallSocket.on(
        "TRAINING_SESSION_PARTICIPANT_LEFT",
        payload => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const eventSessionId =
            normaliseId(
              payload?.sessionId
            );


          const activeSessionId =
            trainingSessionIdRef.current;


          if (
            !activeSessionId ||
            (
              eventSessionId &&
              eventSessionId !==
                activeSessionId
            )
          ) {

            return;

          }


          console.log(
            "[GroupCallSocketRuntime] TRAINING participant left",
            {

              sessionId:
                activeSessionId,

              userId:
                payload?.userId,

            }
          );


          // ------------------------------------------------
          // We deliberately do not manipulate Agora here.
          //
          // AgoraEngine owns media lifecycle.
          //
          // The event is available for future participant
          // state reconciliation.
          // ------------------------------------------------

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, []);


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

      callJoined,

      trainingSessionId,

      trainingJoined,

      connected:
        groupCallSocket.isConnected(),

    }
  );


  return null;

}