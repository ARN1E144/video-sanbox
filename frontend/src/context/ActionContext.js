// src/context/ActionContext.js

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

import { runRuntimeAction } from "../runtime/runRuntimeAction";
import { runActionPipeline } from "../utils/actionPipeline";

import { useRuntimeState } from "./RuntimeStateContext";
import { useRuntimeEvents } from "./RuntimeEventContext";
import { useRuntimeAuth } from "./RuntimeAuthContext";


const ActionContext =
  createContext(null);


export function ActionProvider({
  children,
}) {

  // ===================================================
  // BINDINGS
  // ===================================================

  const [
    bindings,
    setBindings,
  ] = useState({});


  // ===================================================
  // RUNTIME CONTEXTS
  // ===================================================

  const runtimeState =
    useRuntimeState();

  const runtimeEvents =
    useRuntimeEvents();

  const runtimeAuth =
    useRuntimeAuth();


  // ===================================================
  // ACTION REF
  // ===================================================

  const executeActionRef =
    useRef(null);


  // ===================================================
  // RECORDING COMPLETION WAITERS
  // ===================================================
  //
  // Key:
  //
  //   VideoFeed id
  //
  // Value:
  //
  //   {
  //     resolve,
  //     reject,
  //     timer
  //   }
  //
  // This is intentionally separate from runtime state.
  //
  // It represents an asynchronous operation rather than
  // application state.
  //
  // ===================================================

  const recordingWaitersRef =
    useRef(
      new Map()
    );


  // ===================================================
  // RUNTIME STATE SHORTCUTS
  // ===================================================

  const get =
    runtimeState.get;

  const getAll =
    runtimeState.getAll;

  const set =
    runtimeState.set;

  const patch =
    runtimeState.patch;


  // ===================================================
  // BINDINGS
  // ===================================================

  const getBinding =
    useCallback(
      id =>
        bindings?.[id] ||
        null,
      [
        bindings,
      ]
    );


  const updateBinding =
    useCallback(
      (
        id,
        patchData = {}
      ) => {

        if (!id) {
          return;
        }


        setBindings(
          prev => {

            const current =
              prev[id] ||
              {};


            return {

              ...prev,

              [id]: {

                ...current,

                ...patchData,

                config: {

                  ...(current.config || {}),

                  ...(patchData.config || {}),

                },

                state: {

                  ...(current.state || {}),

                  ...(patchData.state || {}),

                },

              },

            };

          }
        );

      },
      []
    );


  const removeBinding =
    useCallback(
      id => {

        if (!id) {
          return;
        }


        setBindings(
          prev => {

            const next =
              {
                ...prev,
              };


            delete next[id];


            return next;

          }
        );

      },
      []
    );


  const clearBindings =
    useCallback(
      () => {

        setBindings({});

      },
      []
    );


  const appendFeedItem =
    useCallback(
      (
        id,
        item
      ) => {

        if (!id) {
          return;
        }


        setBindings(
          prev => {

            const current =
              prev[id] ||
              {};


            return {

              ...prev,

              [id]: {

                ...current,

                items: [

                  ...(current.items || []),

                  item,

                ],

              },

            };

          }
        );

      },
      []
    );


  // ===================================================
  // NOTIFY
  // ===================================================

  const notify =
    useCallback(
      msg => {

        console.log(
          "[notify]",
          msg
        );

      },
      []
    );


  // ===================================================
  // WAIT FOR RECORDING COMPLETION
  // ===================================================
  //
  // IMPORTANT:
  //
  // This is NOT polling bindings.
  //
  // The Promise is resolved directly by VideoFeed after
  // video.uploadRecording has completed successfully.
  //
  // ===================================================

  const waitForRecordingCompletion =
    useCallback(
      (
        id,
        timeoutMs = 120000
      ) => {

        if (!id) {

          return Promise.reject(
            new Error(
              "RECORDING_TARGET_REQUIRED"
            )
          );

        }


        // -----------------------------------------------
        // Replace an existing waiter for the same target.
        // -----------------------------------------------

        const existing =
          recordingWaitersRef.current.get(
            id
          );


        if (existing) {

          clearTimeout(
            existing.timer
          );


          existing.reject(
            new Error(
              "RECORDING_WAIT_REPLACED"
            )
          );

        }


        return new Promise(
          (
            resolve,
            reject
          ) => {

            const timer =
              setTimeout(
                () => {

                  recordingWaitersRef.current.delete(
                    id
                  );


                  reject(
                    new Error(
                      "RECORDING_COMPLETION_TIMEOUT"
                    )
                  );

                },
                timeoutMs
              );


            recordingWaitersRef.current.set(
              id,
              {

                resolve,

                reject,

                timer,

              }
            );

          }
        );

      },
      []
    );


  // ===================================================
  // RESOLVE RECORDING COMPLETION
  // ===================================================

  const resolveRecordingCompletion =
    useCallback(
      (
        id,
        result
      ) => {

        if (!id) {
          return false;
        }


        const waiter =
          recordingWaitersRef.current.get(
            id
          );


        if (!waiter) {

          return false;

        }


        clearTimeout(
          waiter.timer
        );


        recordingWaitersRef.current.delete(
          id
        );


        waiter.resolve(
          result
        );


        return true;

      },
      []
    );


  // ===================================================
  // REJECT RECORDING COMPLETION
  // ===================================================

  const rejectRecordingCompletion =
    useCallback(
      (
        id,
        error
      ) => {

        if (!id) {
          return false;
        }


        const waiter =
          recordingWaitersRef.current.get(
            id
          );


        if (!waiter) {

          return false;

        }


        clearTimeout(
          waiter.timer
        );


        recordingWaitersRef.current.delete(
          id
        );


        waiter.reject(
          error instanceof Error
            ? error
            : new Error(
                String(
                  error ||
                  "RECORDING_COMPLETION_FAILED"
                )
              )
        );


        return true;

      },
      []
    );


  // ===================================================
  // CLEANUP WAITERS
  // ===================================================

  useEffect(
    () => {

      return () => {

        recordingWaitersRef.current.forEach(
          waiter => {

            clearTimeout(
              waiter.timer
            );


            waiter.reject(
              new Error(
                "ACTION_CONTEXT_UNMOUNTED"
              )
            );

          }
        );


        recordingWaitersRef.current.clear();

      };

    },
    []
  );


  // ===================================================
  // RUNTIME ACTION CONTEXT
  // ===================================================

  const buildRuntimeContext =
    useCallback(
      () => {

        return {

          // --------------------------------------------
          // BINDINGS
          // --------------------------------------------

          bindings,


          // --------------------------------------------
          // AUTH
          // --------------------------------------------

          runtimeAuth,


          // --------------------------------------------
          // RUNTIME STATE
          // --------------------------------------------

          get,

          getAll,

          set,

          patch,


          // --------------------------------------------
          // HELPERS
          // --------------------------------------------

          notify,

          getBinding,

          updateBinding,

          removeBinding,

          clearBindings,

          appendFeedItem,


          // --------------------------------------------
          // RECORDING HANDSHAKE
          // --------------------------------------------

          waitForRecordingCompletion,

          resolveRecordingCompletion,

          rejectRecordingCompletion,


          // --------------------------------------------
          // AGORA
          // --------------------------------------------

          agora:
            runtimeState.agora ||
            null,


          // --------------------------------------------
          // ACTION CHAIN
          // --------------------------------------------

          runAction:
            (...args) =>
              executeActionRef.current?.(
                ...args
              ),

        };

      },
      [
        bindings,

        runtimeAuth,

        get,
        getAll,

        set,
        patch,

        notify,

        getBinding,
        updateBinding,
        removeBinding,
        clearBindings,
        appendFeedItem,

        waitForRecordingCompletion,
        resolveRecordingCompletion,
        rejectRecordingCompletion,

        runtimeState.agora,
      ]
    );


  // ===================================================
  // EXECUTE ACTION
  // ===================================================

  const executeAction =
    useCallback(
      async (
        actionName,
        params = {}
      ) => {

        // ---------------------------------------------
        // AUTH
        // ---------------------------------------------

        console.log(
          "[AUTH CHECK]",
          {
            role:
              runtimeAuth.role,

            action:
              actionName,

            allowed:
              runtimeAuth.allowedActions,

            hasExactMatch:
              runtimeAuth.allowedActions.includes(
                actionName
              ),

          }
        );


        if (
          !runtimeAuth.allowedActions.includes(
            actionName
          )
        ) {

          console.warn(
            "[AUTH BLOCKED ACTION]",
            {
              role:
                runtimeAuth.role,

              action:
                actionName,

              allowed:
                runtimeAuth.allowedActions,
            }
          );


          return {

            ok:
              false,

            error:
              "permission_denied",

          };

        }


        // ---------------------------------------------
        // RUNTIME READY
        // ---------------------------------------------

        if (
          !runtimeState.runtimeReady
        ) {

          console.warn(
            "[ACTION BLOCKED] Runtime not ready"
          );


          return {

            ok:
              false,

            error:
              "runtime_not_ready",

          };

        }


        // ---------------------------------------------
        // TRANSACTION
        // ---------------------------------------------

        runtimeState.beginTransaction();


        const ctx =
          buildRuntimeContext();


        try {

          const result =
            await runRuntimeAction(
              actionName,
              ctx,
              params
            );


          if (
            result?.ok
          ) {

            await runtimeState.flush();


            const committedState =
              getAll();


            runtimeEvents.emit(
              actionName,
              {

                action:
                  actionName,

                targetId:
                  params?.targetId ??
                  null,

                params,

                state:
                  committedState,

                result,

                timestamp:
                  Date.now(),

              }
            );


            console.log(
              "[AFTER COMMIT]",
              committedState
            );

          }


          return result;

        }
        catch (
          err
        ) {

          runtimeState.commit();


          console.error(
            "[Action Error]",
            actionName,
            err
          );


          return {

            ok:
              false,

            error:
              err?.message ||
              "ACTION_FAILED",

          };

        }

      },
      [
        runtimeState,
        runtimeEvents,
        buildRuntimeContext,
        getAll,
        runtimeAuth,
      ]
    );


  executeActionRef.current =
    executeAction;


  // ===================================================
  // PIPELINE
  // ===================================================

  const executePipeline =
    useCallback(
      async (
        pipeline = [],
        payload = {}
      ) => {

        return runActionPipeline(
          pipeline,
          payload,
          {

            runRuntimeAction:
              executeAction,

            get,

            set,

            notify,

          }
        );

      },
      [
        executeAction,
        get,
        set,
        notify,
      ]
    );


  // ===================================================
  // PROVIDER VALUE
  // ===================================================

  const value =
    useMemo(
      () => ({

        runtimeState,


        bindings,


        getBinding,

        updateBinding,

        removeBinding,

        clearBindings,

        appendFeedItem,


        get,

        set,


        runRuntimeAction:
          executeAction,


        runActionPipeline:
          executePipeline,


        runAction:
          executeAction,


        // ---------------------------------------------
        // RECORDING HANDSHAKE
        // ---------------------------------------------

        waitForRecordingCompletion,

        resolveRecordingCompletion,

        rejectRecordingCompletion,


        notify,

      }),
      [
        runtimeState,

        bindings,

        getBinding,

        updateBinding,

        removeBinding,

        clearBindings,

        appendFeedItem,

        get,

        set,

        executeAction,

        executePipeline,

        waitForRecordingCompletion,

        resolveRecordingCompletion,

        rejectRecordingCompletion,

        notify,
      ]
    );


  return (

    <ActionContext.Provider
      value={
        value
      }
    >

      {
        children
      }

    </ActionContext.Provider>

  );

}


export function useActionContext() {

  const ctx =
    useContext(
      ActionContext
    );


  if (!ctx) {

    throw new Error(
      "useActionContext must be used inside provider"
    );

  }


  return ctx;

}