// src/hooks/useGroupCallInvitations.js

import {
  useCallback,
  useEffect,
  useRef,
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
// Socket.IO is now the primary realtime invitation path.
//
// HTTP polling remains a reconciliation fallback.
//
// =====================================================

const DEFAULT_POLL_INTERVAL_MS =
  10000;


// =====================================================
// HOOK
// =====================================================

export default function useGroupCallInvitations({

  enabled =
    true,

  intervalMs =
    DEFAULT_POLL_INTERVAL_MS,

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
  // REFS
  // ===================================================
  //
  // IMPORTANT:
  //
  // Do not place the runtime context object itself
  // inside effect dependencies.
  //
  // Runtime state commits can change the context object
  // identity and would otherwise recreate the polling
  // effect and immediately fetch again.
  //
  // ===================================================

  const runActionRef =
    useRef(
      runAction
    );


  const runtimeRef =
    useRef(
      runtime
    );


  const intervalRef =
    useRef(null);


  const requestRunningRef =
    useRef(false);


  const mountedRef =
    useRef(false);


  // ===================================================
  // KEEP SERVICE REFS CURRENT
  // ===================================================

  runActionRef.current =
    runAction;


  runtimeRef.current =
    runtime;


  // ===================================================
  // FETCH INVITATIONS
  // ===================================================

  const fetchInvitations =
    useCallback(
      async ({
        reason = "poll",
      } = {}) => {

        // ---------------------------------------------
        // Mounted
        // ---------------------------------------------

        if (
          !mountedRef.current
        ) {

          return null;

        }


        // ---------------------------------------------
        // Enabled
        // ---------------------------------------------

        if (
          !enabled
        ) {

          return null;

        }


        // ---------------------------------------------
        // Runtime readiness
        // ---------------------------------------------

        const currentRuntime =
          runtimeRef.current;


        if (
          !currentRuntime?.runtimeReady
        ) {

          console.log(
            "[useGroupCallInvitations] Runtime not ready",
            {
              reason,
            }
          );


          return null;

        }


        // ---------------------------------------------
        // Prevent overlap
        // ---------------------------------------------

        if (
          requestRunningRef.current
        ) {

          console.log(
            "[useGroupCallInvitations] Request already running",
            {
              reason,
            }
          );


          return null;

        }


        requestRunningRef.current =
          true;


        try {

          console.log(
            "[useGroupCallInvitations] Fetching invitations",
            {
              reason,
            }
          );


          const result =
            await runActionRef.current(
              "call.fetchPendingInvitations",
              {}
            );


          if (
            result?.ok === false
          ) {

            console.warn(
              "[useGroupCallInvitations] Fetch failed",
              {

                reason,

                result,

              }
            );


            return result;

          }


          console.log(
            "[useGroupCallInvitations] Invitations updated",
            {
              reason,
              result,
            }
          );


          return result;

        }
        catch (error) {

          console.error(
            "[useGroupCallInvitations] Fetch exception",
            {

              reason,

              error,

            }
          );


          return {

            ok:
              false,

            error:
              error?.message ||
              "GROUP_INVITATION_POLL_FAILED",

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
  // POLLING LIFECYCLE
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    // -------------------------------------------------
    // Disabled
    // -------------------------------------------------

    if (
      !enabled
    ) {

      console.log(
        "[useGroupCallInvitations] Polling disabled"
      );


      return () => {

        mountedRef.current =
          false;

      };

    }


    // -------------------------------------------------
    // SAFE INTERVAL
    // -------------------------------------------------

    const safeInterval =
      Math.max(
        5000,
        Number(
          intervalMs
        ) ||
        DEFAULT_POLL_INTERVAL_MS
      );


    // -------------------------------------------------
    // INITIAL FETCH
    // -------------------------------------------------
    //
    // Only once when the hook instance starts.
    //
    // Runtime commits will NOT restart this effect.
    //
    // -------------------------------------------------

    fetchInvitations({
      reason:
        "initial",
    });


    // -------------------------------------------------
    // FALLBACK POLLING
    // -------------------------------------------------

    intervalRef.current =
      window.setInterval(
        () => {

          fetchInvitations({
            reason:
              "poll",
          });

        },
        safeInterval
      );


    console.log(
      "[useGroupCallInvitations] Polling started",
      {

        intervalMs:
          safeInterval,

      }
    );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      mountedRef.current =
        false;


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
        "[useGroupCallInvitations] Polling stopped"
      );

    };

    // IMPORTANT:
    //
    // Deliberately NOT depending on runtime or
    // runAction.
    //
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [
    enabled,
    intervalMs,
  ]);


  // ===================================================
  // PUBLIC API
  // ===================================================

  return {

    refresh:
      fetchInvitations,

    isPolling:
      Boolean(
        enabled
      ),

  };

}