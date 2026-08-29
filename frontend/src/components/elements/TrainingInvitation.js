// src/components/elements/TrainingInvitation.js

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../services/api";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";

import {
  useActionContext,
} from "../../context/ActionContext";


// =====================================================
// POLLING
// =====================================================

const PENDING_POLL_INTERVAL_MS =
  5000;

const SESSION_POLL_INTERVAL_MS =
  3000;


// =====================================================
// TRAINING INVITATION
// =====================================================
//
// Client-side Remote Training lifecycle:
//
//   NO SESSION
//        ↓
//   INVITED / WAITING
//        ↓
//   ACTIVE / READY
//        ↓
//   JOINED
//        ↓
//   ENDED
//
// Runtime namespace:
//
//   training.pendingSessions
//   training.pendingSession
//   training.hasPendingSession
//   training.sessionId
//   training.status
//   training.channel
//   training.joined
//
// Runtime actions:
//
//   training.fetchPendingSessions
//   training.joinSession
//
// Temporary Agora bridge:
//
//   call.joinCall
//   call.leaveCall
//
// =====================================================

export default function TrainingInvitation({

  title =
    "Training invitation",

  waitingText =
    "Waiting for your training session...",

}) {

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
    useActionContext();


  // ===================================================
  // INITIAL RUNTIME STATE
  // ===================================================

  const initialPendingSession =
    runtime.get?.(
      "training.pendingSession"
    ) || null;


  const initialHasPendingSession =
    !!runtime.get?.(
      "training.hasPendingSession"
    );


  const initialJoined =
    !!runtime.get?.(
      "training.joined"
    );


  const initialSessionId =
    runtime.get?.(
      "training.sessionId"
    ) || null;


  const initialStatus =
    runtime.get?.(
      "training.status"
    ) || null;


  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [
    invitation,
    setInvitation,
  ] =
    useState(
      initialPendingSession
    );


  const [
    hasInvitation,
    setHasInvitation,
  ] =
    useState(
      initialHasPendingSession ||
      !!initialPendingSession
    );


  const [
    joined,
    setJoined,
  ] =
    useState(
      initialJoined
    );


  const [
    sessionId,
    setSessionId,
  ] =
    useState(
      initialSessionId
    );


  const [
    sessionStatus,
    setSessionStatus,
  ] =
    useState(
      initialStatus
    );


  const [
    ended,
    setEnded,
  ] =
    useState(
      initialStatus ===
      "ended"
    );


  const [
    checking,
    setChecking,
  ] =
    useState(false);


  const [
    joining,
    setJoining,
  ] =
    useState(false);


  const [
    ending,
    setEnding,
  ] =
    useState(false);


  // ===================================================
  // REQUEST LOCKS
  // ===================================================

  const checkingRef =
    useRef(false);


  const joiningRef =
    useRef(false);


  const sessionCheckingRef =
    useRef(false);


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    const unsubscribePendingSessions =
      runtime.subscribe(
        "training.pendingSessions",
        value => {

          const sessions =
            Array.isArray(
              value
            )
              ? value
              : [];


          setHasInvitation(
            sessions.length >
            0
          );

        }
      );


    const unsubscribePendingSession =
      runtime.subscribe(
        "training.pendingSession",
        value => {

          const nextSession =
            value ||
            null;


          setInvitation(
            nextSession
          );


          setHasInvitation(
            !!nextSession
          );


          if (
            nextSession?.id
          ) {

            setSessionId(
              nextSession.id
            );

          }


          if (
            nextSession?.status
          ) {

            setSessionStatus(
              nextSession.status
            );

          }

        }
      );


    const unsubscribeHasPending =
      runtime.subscribe(
        "training.hasPendingSession",
        value => {

          setHasInvitation(
            !!value
          );

        }
      );


    const unsubscribeSessionId =
      runtime.subscribe(
        "training.sessionId",
        value => {

          setSessionId(
            value ||
            null
          );

        }
      );


    const unsubscribeStatus =
      runtime.subscribe(
        "training.status",
        value => {

          const nextStatus =
            value ||
            null;


          setSessionStatus(
            nextStatus
          );


          if (
            nextStatus ===
            "ended"
          ) {

            setEnded(
              true
            );

            setJoined(
              false
            );

          }

          if (
            nextStatus ===
              "inviting" ||
            nextStatus ===
              "active"
          ) {

            setEnded(
              false
            );

          }

        }
      );


    const unsubscribeJoined =
      runtime.subscribe(
        "training.joined",
        value => {

          const isJoined =
            !!value;


          setJoined(
            isJoined
          );


          if (
            isJoined
          ) {

            setEnded(
              false
            );

          }

        }
      );


    return () => {

      unsubscribePendingSessions?.();

      unsubscribePendingSession?.();

      unsubscribeHasPending?.();

      unsubscribeSessionId?.();

      unsubscribeStatus?.();

      unsubscribeJoined?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // FETCH PENDING SESSIONS
  // ===================================================

  const checkForTraining =
    useCallback(
      async () => {

        if (
          joined ||
          ended
        ) {

          return;

        }


        if (
          checkingRef.current
        ) {

          return;

        }


        checkingRef.current =
          true;


        setChecking(
          true
        );


        try {

          const result =
            await runAction(
              "training.fetchPendingSessions"
            );


          console.log(
            "[TrainingInvitation] Pending session check",
            result
          );


          // ---------------------------------------------
          // Keep local state immediately synchronised
          // even if runtime notifications are delayed.
          // ---------------------------------------------

          const pendingSession =
            result?.result?.pendingSession ||
            null;


          const sessions =
            Array.isArray(
              result?.result?.sessions
            )
              ? result.result.sessions
              : [];


          if (
            pendingSession
          ) {

            setInvitation(
              pendingSession
            );


            setHasInvitation(
              true
            );


            setSessionId(
              pendingSession.id
            );


            setSessionStatus(
              pendingSession.status
            );

          }
          else {

            setInvitation(
              null
            );


            setHasInvitation(
              false
            );

          }

        }
        catch (
          error
        ) {

          console.error(
            "[TrainingInvitation] Pending session check failed",
            error
          );

        }
        finally {

          checkingRef.current =
            false;

          setChecking(
            false
          );

        }

      },
      [
        joined,
        ended,
        runAction,
      ]
    );


  // ===================================================
  // PENDING SESSION POLLING
  // ===================================================
  //
  // Runs while:
  //
  //   - not joined
  //   - session has not ended
  //
  // This allows Bob to detect when Anish changes:
  //
  //   inviting → active
  //
  // ===================================================

  useEffect(() => {

    if (
      joined ||
      ended
    ) {

      return;

    }


    let cancelled =
      false;


    const runInitialCheck =
      async () => {

        if (
          cancelled
        ) {

          return;

        }


        await checkForTraining();

      };


    runInitialCheck();


    const interval =
      window.setInterval(
        () => {

          if (
            cancelled
          ) {

            return;

          }


          checkForTraining();

        },
        PENDING_POLL_INTERVAL_MS
      );


    return () => {

      cancelled =
        true;

      window.clearInterval(
        interval
      );

    };

  }, [
    joined,
    ended,
    checkForTraining,
  ]);


  // ===================================================
  // SESSION STATUS POLLING
  // ===================================================
  //
  // GET /api/training/sessions/:sessionId
  //
  // Used once we have a known training session.
  //
  // This detects:
  //
  //   active → ended
  //
  // ===================================================

  useEffect(() => {

    if (
      !sessionId ||
      ended
    ) {

      return;

    }


    // -------------------------------------------------
    // The pending-session polling already handles the
    // inviting → active transition.
    //
    // Once joined, this polling becomes responsible
    // for active → ended.
    // -------------------------------------------------

    if (
      !joined
    ) {

      return;

    }


    let cancelled =
      false;


    const checkSession =
      async () => {

        if (
          cancelled ||
          sessionCheckingRef.current
        ) {

          return;

        }


        sessionCheckingRef.current =
          true;


        try {

          console.log(
            "[TrainingInvitation] Checking training session",
            {

              sessionId,

            }
          );


          const response =
            await api.get(
              `/training/sessions/${sessionId}`
            );


          const session =
            response?.data?.session;


          const participant =
            response?.data?.participant;


          if (
            cancelled ||
            !session
          ) {

            return;

          }


          console.log(
            "[TrainingInvitation] Session status",
            {

              sessionId:
                session.id,

              status:
                session.status,

              participantStatus:
                participant?.status,

            }
          );


          setSessionStatus(
            session.status
          );


          // -------------------------------------------
          // SESSION ENDED
          // -------------------------------------------

          if (
            session.status ===
            "ended"
          ) {

            console.log(
              "[TrainingInvitation] Training session ended"
            );


            setEnded(
              true
            );


            setJoined(
              false
            );


            runtime.patch?.(
              "training",
              {

                sessionId:
                  session.id,

                channel:
                  session.channelName,

                status:
                  "ended",

                joined:
                  false,

                hostUserId:
                  session.hostUserId,

                startedAt:
                  session.startedAt ||
                  null,

                endedAt:
                  session.endedAt ||
                  Date.now(),

              }
            );


            runtime.patch?.(
              "call",
              {

                state:
                  "ended",

                joined:
                  false,

              }
            );

          }

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
            "[TrainingInvitation] Session status check failed",
            error
          );

        }
        finally {

          sessionCheckingRef.current =
            false;

        }

      };


    // -----------------------------------------------
    // Check immediately
    // -----------------------------------------------

    checkSession();


    const interval =
      window.setInterval(
        checkSession,
        SESSION_POLL_INTERVAL_MS
      );


    return () => {

      cancelled =
        true;

      window.clearInterval(
        interval
      );

    };

  }, [
    joined,
    sessionId,
    ended,
    runtime,
  ]);


  // ===================================================
  // JOIN TRAINING
  // ===================================================

  const handleJoin =
    useCallback(
      async () => {

        if (
          joiningRef.current ||
          joined ||
          !invitation ||
          sessionStatus !==
            "active"
        ) {

          return;

        }


        joiningRef.current =
          true;


        setJoining(
          true
        );


        const invitationSessionId =
          invitation?.id ||
          sessionId ||
          null;


        console.log(
          "[TrainingInvitation] Joining training session",
          {

            sessionId:
              invitationSessionId,

            invitation,

          }
        );


        try {

          const result =
            await runAction(
              "training.joinSession",
              {

                sessionId:
                  invitationSessionId,

              }
            );


          console.log(
            "[TrainingInvitation] Join result",
            result
          );


          if (
            result?.ok
          ) {

            const joinedSessionId =
              result?.result?.sessionId ||
              invitationSessionId ||
              null;


            setSessionId(
              joinedSessionId
            );


            setSessionStatus(
              "active"
            );


            setInvitation(
              null
            );


            setHasInvitation(
              false
            );

          }

        }
        catch (
          error
        ) {

          console.error(
            "[TrainingInvitation] Join failed",
            error
          );

        }
        finally {

          joiningRef.current =
            false;

          setJoining(
            false
          );

        }

      },
      [
        invitation,
        joined,
        runAction,
        sessionId,
        sessionStatus,
      ]
    );


  // ===================================================
  // DERIVED STATES
  // ===================================================

  const isConnected =
    joined &&
    !ended;


  const isWaitingForHost =
    !joined &&
    !ended &&
    hasInvitation &&
    !!invitation &&
    (
      sessionStatus ===
        "inviting" ||
      invitation.status ===
        "inviting"
    );


  const isReady =
    !joined &&
    !ended &&
    hasInvitation &&
    !!invitation &&
    (
      sessionStatus ===
        "active" ||
      invitation.status ===
        "active"
    );


  // ===================================================
  // CONNECTED
  // ===================================================

  if (
    isConnected
  ) {

    return (

      <div
        style={{
          width:
            "100%",

          boxSizing:
            "border-box",

          padding:
            12,

          border:
            "1px solid #166534",

          borderRadius:
            10,

          background:
            "#102619",

          color:
            "#86efac",

          fontSize:
            12,

          fontWeight:
            600,

        }}
      >

        ✓ Training session connected

      </div>

    );

  }


  // ===================================================
  // ENDED
  // ===================================================

  if (
    ended
  ) {

    return (

      <div
        style={{
          width:
            "100%",

          boxSizing:
            "border-box",

          padding:
            12,

          border:
            "1px solid #444",

          borderRadius:
            10,

          background:
            "#151515",

          color:
            "#aaa",

          fontSize:
            12,

          fontWeight:
            600,

        }}
      >

        Training session ended

      </div>

    );

  }


  // ===================================================
  // INVITED / WAITING FOR TRAINER
  // ===================================================

  if (
    isWaitingForHost
  ) {

    const host =
      invitation?.host ||
      null;


    const hostName =
      host
        ? `${host.firstName || ""} ${host.lastName || ""}`
            .trim()
        : "Your trainer";


    return (

      <div
        style={{
          width:
            "100%",

          boxSizing:
            "border-box",

          padding:
            14,

          border:
            "1px solid #334155",

          borderRadius:
            10,

          background:
            "#111827",

          color:
            "#fff",

        }}
      >

        <div
          style={{
            fontSize:
              14,

            fontWeight:
              700,

            marginBottom:
              5,

          }}
        >

          {title}

        </div>


        <div
          style={{
            color:
              "#cbd5e1",

            fontSize:
              12,

            marginBottom:
              5,

          }}
        >

          {hostName} has invited you
          to a training session.

        </div>


        <div
          style={{
            color:
              "#94a3b8",

            fontSize:
              11,

          }}
        >

          Waiting for your trainer to
          start the session...

        </div>

      </div>

    );

  }


  // ===================================================
  // WAITING / NO INVITATION
  // ===================================================

  if (
    !isReady
  ) {

    return (

      <div
        style={{
          width:
            "100%",

          boxSizing:
            "border-box",

          padding:
            "10px 12px",

          border:
            "1px solid #2a2a2a",

          borderRadius:
            8,

          background:
            "#111",

          color:
            "#aaa",

          fontSize:
            12,

        }}
      >

        {checking
          ? "Checking for your training session..."
          : waitingText}

      </div>

    );

  }


  // ===================================================
  // TRAINER INFORMATION
  // ===================================================

  const host =
    invitation?.host ||
    null;


  const hostName =
    host
      ? `${host.firstName || ""} ${host.lastName || ""}`
          .trim()
      : "Your trainer";


  // ===================================================
  // READY
  // ===================================================

  return (

    <div
      style={{
        width:
          "100%",

        boxSizing:
          "border-box",

        padding:
          14,

        border:
          "1px solid #2563eb",

        borderRadius:
          10,

        background:
          "#101a33",

        color:
          "#fff",

      }}
    >

      <div
        style={{
          fontSize:
            14,

          fontWeight:
            700,

          marginBottom:
            5,

        }}
      >

        {title}

      </div>


      <div
        style={{
          color:
            "#cbd5e1",

          fontSize:
            12,

          marginBottom:
            5,

        }}
      >

        {hostName} has started
        your training session.

      </div>


      <div
        style={{
          color:
            "#94a3b8",

          fontSize:
            11,

          marginBottom:
            12,

        }}
      >

        Your training session is ready.

      </div>


      <button
        type="button"

        onClick={
          handleJoin
        }

        disabled={
          joining
        }

        style={{
          width:
            "100%",

          padding:
            "9px 12px",

          border:
            "none",

          borderRadius:
            7,

          background:
            joining
              ? "#334155"
              : "#2563eb",

          color:
            "#fff",

          fontWeight:
            600,

          cursor:
            joining
              ? "default"
              : "pointer",

        }}
      >

        {joining
          ? "Joining Training..."
          : "Join Training"}

      </button>

    </div>

  );

}