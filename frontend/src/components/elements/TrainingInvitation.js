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

const PENDING_POLL_INTERVAL_MS = 5000;
const SESSION_POLL_INTERVAL_MS = 3000;


// =====================================================
// TRAINING INVITATION
// =====================================================
//
// Client-side Remote Training lifecycle:
//
//   WAITING
//      ↓
//   INVITED
//      ↓
//   CONNECTED
//      ↓
//   ENDED
//
// Runtime state:
//
//   call.pendingInvitation
//   call.hasPendingInvitation
//   call.joined
//   call.id
//   call.state
//
// Runtime actions:
//
//   call.fetchPendingCalls
//   call.joinInvitedCall
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

  const initialInvitation =
    runtime.get?.(
      "call.pendingInvitation"
    ) || null;


  const initialJoined =
    !!runtime.get?.(
      "call.joined"
    );


  const initialCallId =
    runtime.get?.(
      "call.id"
    ) || null;


  const initialHasInvitation =
    !!runtime.get?.(
      "call.hasPendingInvitation"
    );


  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [
    invitation,
    setInvitation,
  ] =
    useState(
      initialInvitation
    );


  const [
    hasInvitation,
    setHasInvitation,
  ] =
    useState(
      initialHasInvitation ||
      !!initialInvitation
    );


  const [
    joined,
    setJoined,
  ] =
    useState(
      initialJoined
    );


  const [
    callId,
    setCallId,
  ] =
    useState(
      initialCallId
    );


  const [
    ended,
    setEnded,
  ] =
    useState(false);


  const [
    checking,
    setChecking,
  ] =
    useState(false);


  // ===================================================
  // REQUEST LOCK
  // ===================================================
  //
  // IMPORTANT:
  //
  // Do not use `checking` to control request overlap.
  // `checking` changes React state and can recreate
  // callbacks/effects.
  //
  // This ref prevents overlapping network requests
  // without participating in React's render cycle.
  // ===================================================

  const checkingRef =
    useRef(false);


  // ===================================================
  // RUNTIME STATE SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    const unsubscribeInvitation =
      runtime.subscribe(
        "call.pendingInvitation",
        value => {

          setInvitation(
            value || null
          );

        }
      );


    const unsubscribeHasInvitation =
      runtime.subscribe(
        "call.hasPendingInvitation",
        value => {

          setHasInvitation(
            !!value
          );

        }
      );


    const unsubscribeJoined =
      runtime.subscribe(
        "call.joined",
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


    const unsubscribeCallId =
      runtime.subscribe(
        "call.id",
        value => {

          setCallId(
            value ||
            null
          );

        }
      );


    const unsubscribeCallState =
      runtime.subscribe(
        "call.state",
        value => {

          if (
            value ===
            "ended"
          ) {

            setEnded(
              true
            );

            setJoined(
              false
            );

          }

        }
      );


    return () => {

      unsubscribeInvitation?.();

      unsubscribeHasInvitation?.();

      unsubscribeJoined?.();

      unsubscribeCallId?.();

      unsubscribeCallState?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // FETCH PENDING TRAINING
  // ===================================================

  const checkForTraining =
    useCallback(
      async () => {

        // ---------------------------------------------
        // No need to check while connected or ended
        // ---------------------------------------------

        if (
          joined ||
          ended
        ) {

          return;

        }


        // ---------------------------------------------
        // Prevent overlapping requests
        // ---------------------------------------------

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
              "call.fetchPendingCalls"
            );


          console.log(
            "[TrainingInvitation] Pending check",
            result
          );

        }
        catch (
          error
        ) {

          console.error(
            "[TrainingInvitation] Pending check failed",
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
  // AUTOMATIC PENDING POLLING
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
  // Once connected, the client polls the backend to
  // detect when the host ends the training session.
  //
  // ===================================================

  useEffect(() => {

    if (
      !joined ||
      !callId ||
      ended
    ) {

      return;

    }


    let cancelled =
      false;


    const checkSession =
      async () => {

        try {

          const response =
            await api.get(
              `/calls/${callId}`
            );


          const call =
            response?.data?.call;


          if (
            cancelled ||
            !call
          ) {

            return;

          }


          // -------------------------------------------
          // SESSION ENDED
          // -------------------------------------------

          if (
            call.status ===
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

      };


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
    callId,
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
          !invitation ||
          joined
        ) {

          return;

        }


        console.log(
          "[TrainingInvitation] Joining training",
          {
            invitation,
          }
        );


        try {

          const result =
            await runAction(
              "call.joinInvitedCall"
            );


          console.log(
            "[TrainingInvitation] Join result",
            result
          );


          if (
            result?.ok
          ) {

            // -----------------------------------------
            // joinInvitedCall already clears:
            //
            // pendingInvitation
            // hasPendingInvitation
            //
            // and joinCall sets:
            //
            // call.joined = true
            //
            // The runtime subscription above will
            // transition this component to CONNECTED.
            // -----------------------------------------

            setInvitation(
              null
            );

            setHasInvitation(
              false
            );

            if (
              result?.result?.callId
            ) {

              setCallId(
                result.result.callId
              );

            }

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

      },
      [
        invitation,
        joined,
        runAction,
      ]
    );


  // ===================================================
  // DERIVED STATES
  // ===================================================

  const isConnected =
    joined &&
    !ended;


  const isInvited =
    !joined &&
    !ended &&
    hasInvitation &&
    !!invitation;


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
  // WAITING
  // ===================================================

  if (
    !isInvited
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
  // TRAINER
  // ===================================================

  const trainer =
    invitation?.trainer ||
    null;


  const trainerName =
    trainer
      ? `${trainer.firstName || ""} ${trainer.lastName || ""}`
          .trim()
      : "Your trainer";


  // ===================================================
  // INVITATION
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

        {trainerName} has invited you
        to a training session.

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
            "#2563eb",

          color:
            "#fff",

          fontWeight:
            600,

          cursor:
            "pointer",

        }}
      >

        Join Training

      </button>

    </div>

  );

}