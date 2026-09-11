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

const ActionContext = createContext(null);

export function ActionProvider({
  children,
}) {

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
  // PROJECT ID
  // ===================================================
  //
  // ProjectContext synchronises:
  //
  //   project.id
  //
  // into RuntimeState.
  //
  // ActionContext therefore does NOT depend on
  // ProjectContext directly.
  //
  // Flow:
  //
  // ProjectContext
  //      ↓
  // runtime.patch("project", ...)
  //      ↓
  // RuntimeState
  //      ↓
  // get("project.id")
  //      ↓
  // ctx.projectId
  //
  // ===================================================

  const projectId =
    get("project.id");


  // ===================================================
  // BINDINGS
  // ===================================================

  const [
    bindings,
    setBindings,
  ] = useState({});


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
  // This remains separate from runtime state because it
  // represents an asynchronous handshake rather than
  // application state.
  //
  // ===================================================

  const recordingWaitersRef =
    useRef(
      new Map()
    );


  // ===================================================
  // BINDING HELPERS
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

            const next = {
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
  // CLEANUP RECORDING WAITERS
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
  // RUNTIME EVENT EMITTER
  // ===================================================
  //
  // Domain actions receive ctx from this provider.
  //
  // Therefore:
  //
  //   action
  //      ↓
  //   ctx.emit(...)
  //      ↓
  //   RuntimeEventContext.emit(...)
  //      ↓
  //   RuntimeTriggersContext
  //
  // ===================================================

  const emit =
    useCallback(
      (
        event,
        payload = {}
      ) => {

        if (!event) {

          console.warn(
            "[ActionContext] Cannot emit event without event name",
            {
              event,
              payload,
            }
          );

          return false;

        }

        console.log(
          "[ActionContext] EMITTING RUNTIME EVENT",
          {
            event,
            payload,
          }
        );

        runtimeEvents.emit(
          event,
          payload
        );

        return true;

      },
      [
        runtimeEvents,
      ]
    );


  // ===================================================
  // RUNTIME ACTION CONTEXT
  // ===================================================
  //
  // This is the context supplied to every runtime action.
  //
  // Important:
  //
  // projectId comes from RuntimeState rather than
  // ProjectContext.
  //
  // ===================================================

  const buildRuntimeContext =
    useCallback(
      () => {

        return {

          // --------------------------------------------
          // PROJECT
          // --------------------------------------------

          projectId,


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
          // RUNTIME EVENTS
          // --------------------------------------------

          emit,


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
          //
          // Allows actions to invoke another runtime action
          // without directly depending on ActionProvider.
          //
          // --------------------------------------------

          runAction:
            (...args) =>
              executeActionRef.current?.(
                ...args
              ),

        };

      },
      [

        projectId,

        bindings,

        runtimeAuth,

        get,
        getAll,

        set,
        patch,

        emit,

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
        // RUNTIME EXECUTION FLAG
        // ---------------------------------------------

        const runtimeExecution =
          params?.__runtimeExecution === true;


        // ---------------------------------------------
        // RUNTIME READY
        // ---------------------------------------------

        if (
          !runtimeState.runtimeReady &&
          !runtimeExecution
        ) {

          console.warn(
            "[ACTION BLOCKED] Runtime not ready",
            {
              action:
                actionName,

              runtimeExecution,

              runtimeReady:
                runtimeState.runtimeReady,
            }
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

          const {
            __runtimeExecution,
            ...actionParams
          } = params;


          // -------------------------------------------
          // EXECUTE ACTION
          // -------------------------------------------

          const result =
            await runRuntimeAction(
              actionName,
              ctx,
              actionParams
            );


          // -------------------------------------------
          // COMMIT SUCCESSFUL ACTION
          // -------------------------------------------

          if (
            result?.ok
          ) {

            await runtimeState.flush();


            const committedState =
              getAll();


            // -----------------------------------------
            // GENERIC ACTION EVENT
            // -----------------------------------------

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

          // -------------------------------------------
          // ROLLBACK / FINALISE TRANSACTION
          // -------------------------------------------

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


  // ===================================================
  // ACTION REF
  // ===================================================
  //
  // Allows runtime context runAction() to call the
  // current executeAction implementation without creating
  // a circular dependency.
  //
  // ===================================================

  executeActionRef.current =
    executeAction;


  // ===================================================
  // ACTION PIPELINE
  // ===================================================

  const executePipeline =
    useCallback(
      async (
        pipeline = [],
        payload = {}
      ) => {

        const pipelineContext = {

          ...buildRuntimeContext(),

          runAction:
            executeAction,

        };


        return runActionPipeline(
          pipeline,
          pipelineContext,
          payload
        );

      },
      [
        buildRuntimeContext,
        executeAction,
      ]
    );


  // ===================================================
  // PROVIDER VALUE
  // ===================================================

  const value =
    useMemo(
      () => ({

        // ---------------------------------------------
        // RUNTIME
        // ---------------------------------------------

        runtimeState,


        // ---------------------------------------------
        // PROJECT
        // ---------------------------------------------

        projectId,


        // ---------------------------------------------
        // BINDINGS
        // ---------------------------------------------

        bindings,

        getBinding,

        updateBinding,

        removeBinding,

        clearBindings,

        appendFeedItem,


        // ---------------------------------------------
        // STATE
        // ---------------------------------------------

        get,

        set,


        // ---------------------------------------------
        // ACTIONS
        // ---------------------------------------------

        runRuntimeAction:
          executeAction,

        runActionPipeline:
          executePipeline,

        runAction:
          executeAction,


        // ---------------------------------------------
        // EVENTS
        // ---------------------------------------------

        emit,


        // ---------------------------------------------
        // RECORDING HANDSHAKE
        // ---------------------------------------------

        waitForRecordingCompletion,

        resolveRecordingCompletion,

        rejectRecordingCompletion,


        // ---------------------------------------------
        // NOTIFY
        // ---------------------------------------------

        notify,

      }),
      [
        runtimeState,

        projectId,

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

        emit,

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