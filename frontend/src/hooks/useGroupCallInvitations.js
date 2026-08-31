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


const DEFAULT_POLL_INTERVAL_MS =
  5000;


export default function useGroupCallInvitations({

  enabled =
    true,

  intervalMs =
    DEFAULT_POLL_INTERVAL_MS,

} = {}) {

  // ===================================================
  // RUNTIME / ACTION CONTEXT
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

  const intervalRef =
    useRef(null);


  const requestRunningRef =
    useRef(false);


  const mountedRef =
    useRef(false);


  // ===================================================
  // FETCH INVITATIONS
  // ===================================================

  const fetchInvitations =
    useCallback(
      async ({
        reason = "poll",
      } = {}) => {

        // ---------------------------------------------
        // Don't run after unmount.
        // ---------------------------------------------

        if (
          !mountedRef.current
        ) {

          return null;

        }


        // ---------------------------------------------
        // Runtime must be ready.
        // ---------------------------------------------

        if (
          !runtime.runtimeReady
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
        // Prevent overlapping requests.
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
            await runAction(
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
        runAction,
        runtime,
      ]
    );


  // ===================================================
  // START / STOP POLLING
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    // -----------------------------------------------
    // Disabled
    // -----------------------------------------------

    if (
      !enabled
    ) {

      return () => {

        mountedRef.current =
          false;

      };

    }


    // -----------------------------------------------
    // Normalise interval.
    // -----------------------------------------------

    const safeInterval =
      Math.max(
        1000,
        Number(
          intervalMs
        ) ||
        DEFAULT_POLL_INTERVAL_MS
      );


    // -----------------------------------------------
    // Immediate initial fetch.
    //
    // This means the user does not have to wait for
    // the first interval.
    // -----------------------------------------------

    fetchInvitations({
      reason:
        "initial",
    });


    // -----------------------------------------------
    // Polling interval.
    // -----------------------------------------------

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


    // -----------------------------------------------
    // Cleanup.
    // -----------------------------------------------

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

  }, [
    enabled,
    intervalMs,
    fetchInvitations,
  ]);


  // ===================================================
  // PUBLIC API
  // ===================================================

  return {

    refresh:
      fetchInvitations,

    isPolling:
      enabled,

  };

}