// src/hooks/useGroupCallSync.js

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useActionContext,
} from "../context/ActionContext";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";


// =====================================================
// CONFIG
// =====================================================
//
// Socket.IO now provides immediate lifecycle events.
//
// HTTP reconciliation remains as a safety net.
//
// =====================================================

const DEFAULT_SYNC_INTERVAL_MS =
  10000;


// =====================================================
// NORMALISE CALL TYPE
// =====================================================

function normaliseCallType(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  return (
    String(
      value
    ).trim() ||
    null
  );

}


// =====================================================
// NORMALISE CALL ID
// =====================================================

function normaliseCallId(
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
// HOOK
// =====================================================

export default function useGroupCallSync({

  enabled =
    true,

  intervalMs =
    DEFAULT_SYNC_INTERVAL_MS,

} = {}) {

  // ===================================================
  // CONTEXT
  // ===================================================

  const {
    runAction,
  } =
    useActionContext();


  const runtime =
    useRuntimeState();


  // ===================================================
  // REFS FOR SERVICES
  // ===================================================

  const runActionRef =
    useRef(
      runAction
    );


  const runtimeRef =
    useRef(
      runtime
    );


  runActionRef.current =
    runAction;


  runtimeRef.current =
    runtime;


  // ===================================================
  // REACTIVE RUNTIME STATE
  // ===================================================

  const [
    callId,
    setCallId,
  ] =
    useState(
      () =>
        normaliseCallId(
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
        normaliseCallType(
          runtime.get?.(
            "call.type"
          )
        )
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

  const intervalRef =
    useRef(null);


  const mountedRef =
    useRef(false);


  const requestRunningRef =
    useRef(false);


  const callIdRef =
    useRef(callId);


  const joinedRef =
    useRef(joined);


  const callTypeRef =
    useRef(callType);


  // ===================================================
  // KEEP STATE REFS CURRENT
  // ===================================================

  callIdRef.current =
    callId;


  joinedRef.current =
    joined;


  callTypeRef.current =
    callType;


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================
  //
  // Register once for this hook instance.
  //
  // Do not re-register because the runtime context
  // object changed after a state commit.
  //
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    const currentRuntime =
      runtimeRef.current;


    // -------------------------------------------------
    // INITIAL STATE
    // -------------------------------------------------

    const initialCallId =
      normaliseCallId(
        currentRuntime?.get?.(
          "call.id"
        )
      );


    const initialCallType =
      normaliseCallType(
        currentRuntime?.get?.(
          "call.type"
        )
      );


    const initialJoined =
      currentRuntime?.get?.(
        "call.joined"
      ) === true;


    callIdRef.current =
      initialCallId;


    callTypeRef.current =
      initialCallType;


    joinedRef.current =
      initialJoined;


    setCallId(
      initialCallId
    );


    setCallType(
      initialCallType
    );


    setJoined(
      initialJoined
    );


    // -------------------------------------------------
    // CALL ID
    // -------------------------------------------------

    const unsubscribeCallId =
      currentRuntime?.subscribe?.(
        "call.id",
        value => {

          const nextCallId =
            normaliseCallId(
              value
            );


          callIdRef.current =
            nextCallId;


          setCallId(
            previous =>
              previous ===
              nextCallId
                ? previous
                : nextCallId
          );

        }
      );


    // -------------------------------------------------
    // CALL TYPE
    // -------------------------------------------------

    const unsubscribeCallType =
      currentRuntime?.subscribe?.(
        "call.type",
        value => {

          const nextCallType =
            normaliseCallType(
              value
            );


          callTypeRef.current =
            nextCallType;


          setCallType(
            previous =>
              previous ===
              nextCallType
                ? previous
                : nextCallType
          );

        }
      );


    // -------------------------------------------------
    // JOINED
    // -------------------------------------------------

    const unsubscribeJoined =
      currentRuntime?.subscribe?.(
        "call.joined",
        value => {

          const nextJoined =
            value === true;


          joinedRef.current =
            nextJoined;


          setJoined(
            previous =>
              previous ===
              nextJoined
                ? previous
                : nextJoined
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

    // Deliberately run once for this runtime instance.

  }, []);


  // ===================================================
  // ACTIVE STATE
  // ===================================================

  const isActive =
    Boolean(

      enabled &&

      callType ===
        "group" &&

      joined &&

      callId

    );


  // ===================================================
  // REFRESH
  // ===================================================

  const refresh =
    useCallback(
      async ({
        reason = "poll",
      } = {}) => {

        if (
          !mountedRef.current
        ) {

          return null;

        }


        if (
          !enabled
        ) {

          return null;

        }


        const activeCallId =
          callIdRef.current;


        const activeCallType =
          callTypeRef.current;


        const activeJoined =
          joinedRef.current;


        // -------------------------------------------------
        // MUST BE ACTIVE GROUP CALL
        // -------------------------------------------------

        if (
          !activeCallId ||
          activeCallType !==
            "group" ||
          !activeJoined
        ) {

          return null;

        }


        // -------------------------------------------------
        // PREVENT OVERLAP
        // -------------------------------------------------

        if (
          requestRunningRef.current
        ) {

          console.log(
            "[useGroupCallSync] Request already running",
            {

              reason,

              callId:
                activeCallId,

            }
          );


          return null;

        }


        requestRunningRef.current =
          true;


        try {

          console.log(
            "[useGroupCallSync] Refreshing group call",
            {

              reason,

              callId:
                activeCallId,

            }
          );


          const result =
            await runActionRef.current(
              "call.refreshGroupCall",
              {

                callId:
                  activeCallId,

              }
            );


          if (
            result?.ok === false
          ) {

            console.warn(
              "[useGroupCallSync] Refresh failed",
              {

                reason,

                callId:
                  activeCallId,

                result,

              }
            );


            return result;

          }


          console.log(
            "[useGroupCallSync] Group call synchronised",
            {

              reason,

              callId:
                activeCallId,

            }
          );


          return result;

        }
        catch (error) {

          console.error(
            "[useGroupCallSync] Refresh exception",
            {

              reason,

              callId:
                activeCallId,

              error,

            }
          );


          return {

            ok:
              false,

            error:
              error?.message ||
              "GROUP_CALL_SYNC_FAILED",

          };

        }
        finally {

          requestRunningRef.current =
            false;

        }

      },
      [
        enabled,
      ]
    );


  // ===================================================
  // SYNC LIFECYCLE
  // ===================================================

  useEffect(() => {

    if (
      intervalRef.current !==
      null
    ) {

      window.clearInterval(
        intervalRef.current
      );


      intervalRef.current =
        null;

    }


    // -------------------------------------------------
    // INACTIVE
    // -------------------------------------------------

    if (
      !enabled ||
      callType !==
        "group" ||
      !joined ||
      !callId
    ) {

      return undefined;

    }


    const safeInterval =
      Math.max(
        5000,
        Number(
          intervalMs
        ) ||
        DEFAULT_SYNC_INTERVAL_MS
      );


    console.log(
      "[useGroupCallSync] Sync started",
      {

        callId,

        callType,

        joined,

        intervalMs:
          safeInterval,

      }
    );


    // -------------------------------------------------
    // INITIAL RECONCILIATION
    // -------------------------------------------------

    refresh({
      reason:
        "initial",
    });


    // -------------------------------------------------
    // FALLBACK POLLING
    // -------------------------------------------------

    intervalRef.current =
      window.setInterval(
        () => {

          refresh({
            reason:
              "poll",
          });

        },
        safeInterval
      );


    return () => {

      if (
        intervalRef.current !==
        null
      ) {

        window.clearInterval(
          intervalRef.current
        );


        intervalRef.current =
          null;

      }


      console.log(
        "[useGroupCallSync] Sync stopped",
        {
          callId,
        }
      );

    };

  }, [
    enabled,
    callType,
    joined,
    callId,
    intervalMs,
    refresh,
  ]);


  // ===================================================
  // PUBLIC API
  // ===================================================

  return {

    refresh,

    isActive,

    isSyncing:
      requestRunningRef.current,

    callId,

    callType,

    joined,

  };

}
