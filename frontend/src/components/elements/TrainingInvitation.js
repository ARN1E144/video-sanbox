// src/components/elements/TrainingInvitation.js

import React, {
  useCallback,
  useEffect,
  useMemo,
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
// CONFIG
// =====================================================

const PENDING_POLL_INTERVAL_MS =
  5000;

const SESSION_POLL_INTERVAL_MS =
  3000;


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
// BUILD HOST NAME
// =====================================================

function getHostName(
  session
) {

  const host =
    session?.host ||
    null;

  if (
    !host
  ) {

    return "Your trainer";

  }

  const fullName =
    [
      host.firstName,
      host.lastName,
    ]
      .filter(Boolean)
      .map(
        value =>
          String(
            value
          ).trim()
      )
      .filter(Boolean)
      .join(" ")
      .trim();

  return (
    fullName ||
    host.email ||
    "Your trainer"
  );

}


// =====================================================
// NORMALISE PENDING SESSION COLLECTION
// =====================================================
//
// Only an "invited" participant/session is actionable
// from this component.
//
// This gives us an additional client-side defence
// against stale/cancelled records entering the UI.
//
// =====================================================

function normalisePendingSessions(
  sessions
) {

  if (
    !Array.isArray(
      sessions
    )
  ) {

    return [];

  }

  return sessions.filter(
    session => {

      if (
        !session
      ) {

        return false;

      }

      const id =
        normaliseId(
          session?.id
        );

      if (
        !id
      ) {

        return false;

      }

      // -----------------------------------------------
      // Session itself must be actionable.
      // -----------------------------------------------

      if (
        session.status !==
          "inviting" &&
        session.status !==
          "active"
      ) {

        return false;

      }

      // -----------------------------------------------
      // If participant status is supplied, it must
      // explicitly still be invited.
      //
      // This prevents a cancelled/left/joined record
      // from being displayed accidentally.
      // -----------------------------------------------

      if (
        session?.participant?.status &&
        session.participant.status !==
          "invited"
      ) {

        return false;

      }

      return true;

    }
  );

}


// =====================================================
// COMPONENT
// =====================================================
//
// AUTHORITATIVE STATE MODEL
//
// Pending invitations:
//
//   training.pendingSessions
//
// Current training:
//
//   training.sessionId
//   training.status
//   training.channel
//   training.joined
//
// IMPORTANT:
//
// training.pendingSession is deliberately NOT consumed.
//
// The backend's /training/sessions/pending endpoint is
// the authoritative source for actionable invitations.
//
// Cancelled invitations:
//
//   invited -> cancelled
//
// are therefore automatically excluded by the backend
// query and additionally rejected by the client-side
// normalisation above.
//
// =====================================================

export default function TrainingInvitation({

  title =
    "Training invitation",

  waitingText =
    "Waiting for your training session...",

}) {

  // ===================================================
  // CONTEXT
  // ===================================================

  const runtime =
    useRuntimeState();

  const {
    runAction,
  } =
  useActionContext();


  // ===================================================
  // INITIAL RUNTIME STATE
  // ===================================================

  const initialPendingSessions =
    normalisePendingSessions(
      runtime.get?.(
        "training.pendingSessions"
      )
    );

  const initialJoined =
    runtime.get?.(
      "training.joined"
    ) === true;

  const initialCurrentSessionId =
    normaliseId(
      runtime.get?.(
        "training.sessionId"
      )
    );

  const initialCurrentStatus =
    runtime.get?.(
      "training.status"
    ) || null;


  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [
    pendingSessions,
    setPendingSessions,
  ] =
  useState(
    initialPendingSessions
  );

  const [
    currentSessionId,
    setCurrentSessionId,
  ] =
  useState(
    initialCurrentSessionId
  );

  const [
    joined,
    setJoined,
  ] =
  useState(
    initialJoined
  );

  const [
    sessionStatus,
    setSessionStatus,
  ] =
  useState(
    initialCurrentStatus
  );

  const [
    ended,
    setEnded,
  ] =
  useState(
    initialCurrentStatus ===
    "ended"
  );

  const [
    checking,
    setChecking,
  ] =
  useState(
    false
  );

  const [
    joining,
    setJoining,
  ] =
  useState(
    false
  );


  // ===================================================
  // REFS
  // ===================================================

  const mountedRef =
    useRef(false);

  const checkingRef =
    useRef(false);

  const joiningRef =
    useRef(false);

  const sessionCheckingRef =
    useRef(false);

  const currentSessionIdRef =
    useRef(
      initialCurrentSessionId
    );

  const joinedRef =
    useRef(
      initialJoined
    );

  const endedRef =
    useRef(
      initialCurrentStatus ===
      "ended"
    );


  // ===================================================
  // KEEP REFS SYNCHRONISED
  // ===================================================

  currentSessionIdRef.current =
    currentSessionId;

  joinedRef.current =
    joined;

  endedRef.current =
    ended;


  // ===================================================
  // DERIVE CURRENT INVITATION
  // ===================================================
  //
  // SINGLE SOURCE OF TRUTH:
  //
  // training.pendingSessions
  //
  // ===================================================

  const invitation =
    useMemo(
      () => {

        if (
          pendingSessions.length ===
          0
        ) {

          return null;

        }

        return (
          pendingSessions[0] ||
          null
        );

      },
      [
        pendingSessions,
      ]
    );


  // ===================================================
  // CLEAR PENDING INVITATIONS
  // ===================================================

  const clearPendingInvitations =
    useCallback(
      () => {

        setPendingSessions(
          []
        );

        runtime.patch?.(
          "training",
          {

            pendingSessions:
              [],

            pendingSession:
              null,

            hasPendingSession:
              false,

          }
        );

      },
      [
        runtime,
      ]
    );


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    // -------------------------------------------------
    // AUTHORITATIVE PENDING SESSION COLLECTION
    // -------------------------------------------------

    const unsubscribePendingSessions =
      runtime.subscribe?.(
        "training.pendingSessions",
        value => {

          const sessions =
            normalisePendingSessions(
              value
            );

          setPendingSessions(
            sessions
          );

          console.log(
            "[TrainingInvitation] pendingSessions updated",
            {

              count:
                sessions.length,

              sessionIds:
                sessions.map(
                  session =>
                    normaliseId(
                      session.id
                    )
                ),

              statuses:
                sessions.map(
                  session =>
                    session.status
                ),

            }
          );

        }
      );



    // -------------------------------------------------
    // CURRENT SESSION ID
    // -------------------------------------------------

    const unsubscribeSessionId =
      runtime.subscribe?.(
        "training.sessionId",
        value => {

          const nextId =
            normaliseId(
              value
            );

          currentSessionIdRef.current =
            nextId;

          setCurrentSessionId(
            nextId
          );

        }
      );


    // -------------------------------------------------
    // CURRENT SESSION STATUS
    // -------------------------------------------------

    const unsubscribeStatus =
      runtime.subscribe?.(
        "training.status",
        value => {

          const nextStatus =
            value ||
            null;

          setSessionStatus(
            nextStatus
          );


          // -------------------------------------------
          // SESSION ENDED
          // -------------------------------------------

          if (
            nextStatus ===
            "ended"
          ) {

            endedRef.current =
              true;

            joinedRef.current =
              false;

            setEnded(
              true
            );

            setJoined(
              false
            );

          }


          // -------------------------------------------
          // SESSION ACTIVE / INVITING
          // -------------------------------------------

          if (
            nextStatus ===
              "inviting" ||
            nextStatus ===
              "active"
          ) {

            endedRef.current =
              false;

            setEnded(
              false
            );

          }

        }
      );


    // -------------------------------------------------
    // CURRENT SESSION JOINED
    // -------------------------------------------------

    const unsubscribeJoined =
      runtime.subscribe?.(
        "training.joined",
        value => {

          const nextJoined =
            value === true;

          joinedRef.current =
            nextJoined;

          setJoined(
            nextJoined
          );

          if (
            nextJoined
          ) {

            endedRef.current =
              false;

            setEnded(
              false
            );

          }

        }
      );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      mountedRef.current =
        false;

      unsubscribePendingSessions?.();

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
  //
  // The backend endpoint is authoritative.
  //
  // Only returned actionable invitations are accepted.
  //
  // ===================================================

  const checkForTraining =
    useCallback(
      async ({
        reason =
          "poll",
      } = {}) => {

        if (
          !mountedRef.current
        ) {

          return null;

        }


        // ---------------------------------------------
        // Do not fetch invitations while already inside
        // a training session.
        // ---------------------------------------------

        if (
          joinedRef.current
        ) {

          return null;

        }


        if (
          checkingRef.current
        ) {

          return null;

        }


        checkingRef.current =
          true;

        setChecking(
          true
        );


        try {

          console.log(
            "[TrainingInvitation] Checking pending sessions",
            {
              reason,
            }
          );


          const result =
            await runAction(
              "training.fetchPendingSessions"
            );


          if (
            result?.ok ===
            false
          ) {

            console.warn(
              "[TrainingInvitation] Pending session fetch failed",
              {

                reason,

                result,

              }
            );

            return result;

          }


          const sessions =
            normalisePendingSessions(
              result?.result?.sessions
            );


          // -------------------------------------------
          // AUTHORITATIVE LOCAL REPLACEMENT
          //
          // This is intentionally a REPLACEMENT rather
          // than an append/merge.
          //
          // Therefore a cancelled invitation disappears
          // immediately when the backend no longer
          // reports it.
          // -------------------------------------------

          setPendingSessions(
            sessions
          );


          console.log(
            "[TrainingInvitation] Pending sessions synchronised",
            {

              reason,

              count:
                sessions.length,

              sessionIds:
                sessions.map(
                  session =>
                    normaliseId(
                      session.id
                    )
                ),

            }
          );


          return result;

        }
        catch (error) {

          console.error(
            "[TrainingInvitation] Pending session check failed",
            error
          );


          return {

            ok:
              false,

            error:
              error?.message ||
              "TRAINING_PENDING_SESSION_FETCH_FAILED",

          };

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
        runAction,
      ]
    );


  // ===================================================
  // PENDING INVITATION POLLING
  // ===================================================

  useEffect(() => {

    if (
      joined
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

        await checkForTraining({
          reason:
            "initial",
        });

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

          checkForTraining({
            reason:
              "poll",
          });

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
    checkForTraining,
  ]);


  // ===================================================
  // CURRENT SESSION STATUS POLLING
  // ===================================================
  //
  // Only monitors the session actually joined by the
  // current user.
  //
  // ===================================================

  useEffect(() => {

    const activeSessionId =
      normaliseId(
        currentSessionId
      );


    if (
      !activeSessionId ||
      !joined ||
      ended
    ) {

      return;

    }


    let cancelled =
      false;


    const checkCurrentSession =
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
            "[TrainingInvitation] Checking current training session",
            {

              sessionId:
                activeSessionId,

            }
          );


          const response =
            await api.get(
              `/training/sessions/${activeSessionId}`
            );


          const session =
            response?.data?.session;

          const participant =
            response?.data?.participant;


          if (
            cancelled
          ) {

            return;

          }


          if (
            !session
          ) {

            return;

          }


          const serverSessionId =
            normaliseId(
              session.id
            );


          // -------------------------------------------
          // Ignore another session's response.
          // -------------------------------------------

          if (
            serverSessionId !==
            currentSessionIdRef.current
          ) {

            console.warn(
              "[TrainingInvitation] Ignoring mismatched session response",
              {

                expected:
                  currentSessionIdRef.current,

                received:
                  serverSessionId,

              }
            );

            return;

          }


          console.log(
            "[TrainingInvitation] Current training session status",
            {

              sessionId:
                serverSessionId,

              status:
                session.status,

              participantStatus:
                participant?.status,

            }
          );


          setSessionStatus(
            session.status ||
            null
          );


          // -------------------------------------------
          // SESSION ENDED
          // -------------------------------------------

          if (
            session.status ===
            "ended"
          ) {

            await handleCurrentSessionEnded({
              session,
            });

          }

        }
        catch (error) {

          if (
            cancelled
          ) {

            return;

          }


          // -------------------------------------------
          // A missing session is no longer usable.
          // -------------------------------------------

          if (
            error?.response?.status ===
            404
          ) {

            console.warn(
              "[TrainingInvitation] Current training session no longer exists",
              {

                sessionId:
                  activeSessionId,

              }
            );


            await handleCurrentSessionEnded({
              session:
                null,
            });

          }
          else {

            console.error(
              "[TrainingInvitation] Current session check failed",
              error
            );

          }

        }
        finally {

          sessionCheckingRef.current =
            false;

        }

      };


    checkCurrentSession();


    const interval =
      window.setInterval(
        checkCurrentSession,
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
    currentSessionId,
    joined,
    ended,
  ]);


  // ===================================================
  // HANDLE CURRENT SESSION ENDED
  // ===================================================

  const handleCurrentSessionEnded =
    useCallback(
      async ({
        session =
          null,
      } = {}) => {

        const endedSessionId =
          normaliseId(
            session?.id
          ) ||
          currentSessionIdRef.current;


        console.log(
          "[TrainingInvitation] Current training session ended",
          {

            sessionId:
              endedSessionId,

          }
        );


        // ---------------------------------------------
        // CURRENT SESSION STATE
        // ---------------------------------------------

        joinedRef.current =
          false;

        endedRef.current =
          true;

        setJoined(
          false
        );

        setEnded(
          true
        );

        setSessionStatus(
          "ended"
        );


        currentSessionIdRef.current =
          null;

        setCurrentSessionId(
          null
        );


        // ---------------------------------------------
        // Remove the ended session from any accidental
        // pending representation.
        // ---------------------------------------------

        setPendingSessions(
          previous => {

            const filtered =
              previous.filter(
                pending =>
                  normaliseId(
                    pending?.id
                  ) !==
                  endedSessionId
              );

            return filtered;

          }
        );


        // ---------------------------------------------
        // Runtime reconciliation
        // ---------------------------------------------

        const remainingPending =
          pendingSessions.filter(
            pending =>
              normaliseId(
                pending?.id
              ) !==
              endedSessionId
          );


        runtime.patch?.(
          "training",
          {

            pendingSession:
              null,

            pendingSessions:
              remainingPending,

            hasPendingSession:
              remainingPending.length >
              0,

          }
        );

      },
      [
        pendingSessions,
        runtime,
      ]
    );


  // ===================================================
  // JOIN TRAINING
  // ===================================================

  const handleJoin =
    useCallback(
      async () => {

        if (
          joiningRef.current ||
          joinedRef.current ||
          !invitation
        ) {

          return;

        }


        const invitationSessionId =
          normaliseId(
            invitation?.id
          );


        if (
          !invitationSessionId
        ) {

          console.warn(
            "[TrainingInvitation] Invitation has no session ID"
          );

          clearPendingInvitations();

          return;

        }


        // ---------------------------------------------
        // Only an active invitation can be joined.
        // ---------------------------------------------

        if (
          invitation?.status !==
          "active"
        ) {

          console.warn(
            "[TrainingInvitation] Training session is not active",
            {

              sessionId:
                invitationSessionId,

              status:
                invitation?.status,

            }
          );

          return;

        }


        // ---------------------------------------------
        // Defensive participant-state check.
        // ---------------------------------------------

        if (
          invitation?.participant?.status &&
          invitation.participant.status !==
            "invited"
        ) {

          console.warn(
            "[TrainingInvitation] Invitation is no longer actionable",
            {

              sessionId:
                invitationSessionId,

              participantStatus:
                invitation.participant.status,

            }
          );


          clearPendingInvitations();

          return;

        }


        joiningRef.current =
          true;

        setJoining(
          true
        );


        console.log(
          "[TrainingInvitation] Joining training",
          {

            sessionId:
              invitationSessionId,

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


          if (
            result?.ok ===
            false
          ) {

            console.warn(
              "[TrainingInvitation] Join action failed",
              result
            );


            // -----------------------------------------
            // Expired/cancelled/non-actionable
            // invitation: immediately remove it from
            // local UI and allow the next invitation
            // poll to reconcile the backend.
            // -----------------------------------------

            const errorCode =
              result?.error ||
              result?.result?.error ||
              null;


            if (
              errorCode ===
                "TRAINING_INVITATION_EXPIRED" ||
              errorCode ===
                "TRAINING_PARTICIPANT_NOT_JOINABLE" ||
              errorCode ===
                "TRAINING_SESSION_NOT_ACTIVE"
            ) {

              clearPendingInvitations();

            }


            return result;

          }


          const joinedId =
            normaliseId(
              result?.result?.sessionId
            ) ||
            invitationSessionId;


          // -------------------------------------------
          // CURRENT SESSION
          // -------------------------------------------

          currentSessionIdRef.current =
            joinedId;

          setCurrentSessionId(
            joinedId
          );


          joinedRef.current =
            true;

          setJoined(
            true
          );


          endedRef.current =
            false;

          setEnded(
            false
          );


          setSessionStatus(
            "active"
          );


          // -------------------------------------------
          // CONSUME INVITATION
          // -------------------------------------------

          clearPendingInvitations();


          console.log(
            "[TrainingInvitation] Training joined successfully",
            {

              sessionId:
                joinedId,

            }
          );


          return result;

        }
        catch (error) {

          console.error(
            "[TrainingInvitation] Join failed",
            error
          );


          return {

            ok:
              false,

            error:
              error?.response?.data?.error ||
              error?.message ||
              "TRAINING_JOIN_FAILED",

            result:
              error?.response?.data ||
              null,

          };

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
        clearPendingInvitations,
        invitation,
        runAction,
      ]
    );


  // ===================================================
  // DERIVED UI STATE
  // ===================================================

  const hasInvitation =
    !!invitation &&
    !!normaliseId(
      invitation?.id
    );


  const invitationStatus =
    invitation?.status ||
    null;


  const waitingForHost =
    hasInvitation &&
    !joined &&
    invitationStatus ===
      "inviting";


  const readyToJoin =
    hasInvitation &&
    !joined &&
    invitationStatus ===
      "active";


  // ===================================================
  // CONNECTED
  // ===================================================

  if (
    joined
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
  // WAITING FOR HOST
  // ===================================================

  if (
    waitingForHost
  ) {

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

          {getHostName(
            invitation
          )}{" "}
          has invited you to a training
          session.

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
  // READY TO JOIN
  // ===================================================

  if (
    readyToJoin
  ) {

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

          {getHostName(
            invitation
          )}{" "}
          has started your training session.

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


  // ===================================================
  // ENDED
  // ===================================================

  if (
    ended &&
    !hasInvitation
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
  // WAITING / NO INVITATION
  // ===================================================

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