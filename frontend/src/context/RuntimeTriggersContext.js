import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import {
  useActionContext,
} from "../context/ActionContext";

import {
  useRuntimeDebugger,
} from "../context/RuntimeDebuggerContext";


const RuntimeTriggersContext =
  createContext(null);


// =====================================================
// PROVIDER
// =====================================================

export function RuntimeTriggersProvider({
  children,
}) {

  const runtimeState =
    useRuntimeState();

  const actions =
    useActionContext();

  const debuggerRuntime =
    useRuntimeDebugger?.();


  // ===================================================
  // REGISTERED TRIGGERS
  // ===================================================

  const triggersRef =
    useRef([]);


  // ===================================================
  // PENDING ACTIONS
  // ===================================================

  const pendingRef =
    useRef([]);


  // ===================================================
  // COMMIT LOCK
  // ===================================================

  const activeCommitRef =
    useRef(null);


  // ===================================================
  // PER-COMMIT ACTION DEDUPE
  // ===================================================

  const executedActionsRef =
    useRef(
      new Set()
    );


  // ===================================================
  // ACTION FLUSH
  // ===================================================

  const flushingRef =
    useRef(false);


  // ===================================================
  // REGISTER TRIGGER
  // ===================================================

  const registerTrigger =
    useCallback(
      (
        trigger
      ) => {

        if (
          !trigger ||
          typeof trigger !== "object"
        ) {

          console.warn(
            "[RuntimeTriggers] Invalid trigger registration",
            trigger
          );

          return () => {};

        }


        if (
          !trigger.event
        ) {

          console.warn(
            "[RuntimeTriggers] Trigger requires an event",
            trigger
          );

          return () => {};

        }


        const normalizedTrigger = {

          ...trigger,

          actions:
            Array.isArray(
              trigger.actions
            )
              ? trigger.actions
              : [],

        };


        triggersRef.current.push(
          normalizedTrigger
        );


        console.log(
          "[RuntimeTriggers] Registered",
          normalizedTrigger
        );


        return () => {

          triggersRef.current =
            triggersRef.current.filter(
              registered =>
                registered !==
                normalizedTrigger
            );


          console.log(
            "[RuntimeTriggers] Unregistered",
            normalizedTrigger
          );

        };

      },
      []
    );


  // ===================================================
  // CLEAR PER-COMMIT STATE
  // ===================================================

  const beginCommit =
    useCallback(
      (
        commitId
      ) => {

        if (
          !commitId
        ) {

          return false;

        }


        if (
          activeCommitRef.current ===
          commitId
        ) {

          return false;

        }


        activeCommitRef.current =
          commitId;


        executedActionsRef.current.clear();


        return true;

      },
      []
    );


  // ===================================================
  // QUEUE ACTION
  // ===================================================

  const queueAction =
    useCallback(
      ({
        action,
        state,
        trigger,
        commitId,
      }) => {

        if (
          !action
        ) {

          return;

        }


        const actionKey =
          `${action}_${commitId}`;


        if (
          executedActionsRef.current.has(
            actionKey
          )
        ) {

          console.log(
            "[RuntimeTriggers] Action deduped",
            {
              action,
              commitId,
            }
          );

          return;

        }


        executedActionsRef.current.add(
          actionKey
        );


        pendingRef.current.push({

          action,

          state,

          trigger,

          commitId,

        });


        console.log(
          "[RuntimeTriggers] Action queued",
          {

            action,

            trigger:
              trigger?.name,

            event:
              trigger?.event,

            commitId,

          }
        );

      },
      []
    );


  // ===================================================
  // EVALUATE TRIGGERS
  // ===================================================

  const evaluateTriggers =
    useCallback(
      (
        state,
        changedKeys = [],
        meta = {}
      ) => {

        const commitId =
          meta?.commitId;


        if (
          !commitId
        ) {

          return;

        }


        // -----------------------------------------------
        // Start commit
        // -----------------------------------------------

        if (
          !beginCommit(
            commitId
          )
        ) {

          return;

        }


        // -----------------------------------------------
        // Evaluate each registered trigger
        // -----------------------------------------------

        for (
          const trigger of
            triggersRef.current
        ) {

          if (
            !changedKeys.includes(
              trigger.event
            )
          ) {

            continue;

          }


          let passed =
            true;


          try {

            if (
              typeof trigger.condition ===
              "function"
            ) {

              passed =
                !!trigger.condition({
                  state,
                  changedKeys,
                  meta,
                });

            }

          }
          catch (
            error
          ) {

            console.error(
              "[RuntimeTriggers] Condition failed",
              {

                trigger:
                  trigger.name,

                event:
                  trigger.event,

                error,

              }
            );


            continue;

          }


          if (
            !passed
          ) {

            continue;

          }


          // ---------------------------------------------
          // Debugger
          // ---------------------------------------------

          debuggerRuntime?.logTrigger?.({

            trigger:
              trigger.name,

            event:
              trigger.event,

            commitId,

          });


          console.log(
            "[RuntimeTriggers] TRIGGER FIRED",
            {

              name:
                trigger.name,

              event:
                trigger.event,

              commitId,

            }
          );


          // ---------------------------------------------
          // Queue actions
          // ---------------------------------------------

          for (
            const action of
              trigger.actions
          ) {

            queueAction({

              action,

              state,

              trigger,

              commitId,

            });

          }

        }

      },
      [
        beginCommit,
        debuggerRuntime,
        queueAction,
      ]
    );


  // ===================================================
  // FLUSH ACTIONS
  // ===================================================

  const flushActions =
    useCallback(
      async () => {

        if (
          flushingRef.current
        ) {

          return;

        }


        if (
          pendingRef.current.length ===
          0
        ) {

          return;

        }


        flushingRef.current =
          true;


        const batch =
          [
            ...pendingRef.current,
          ];


        pendingRef.current =
          [];


        console.log(
          "[RuntimeTriggers] FLUSH",
          {
            count:
              batch.length,
          }
        );


        try {

          for (
            const item of
              batch
          ) {

            try {

              const result =
                await actions.runAction(
                  item.action,
                  {

                    state:
                      item.state,

                    trigger:
                      item.trigger,

                    commitId:
                      item.commitId,

                  }
                );


              console.log(
                "[RuntimeTriggers] ACTION RESULT",
                {

                  action:
                    item.action,

                  trigger:
                    item.trigger?.name,

                  commitId:
                    item.commitId,

                  result,

                }
              );

            }
            catch (
              error
            ) {

              console.error(
                "[RuntimeTriggers] Action failed",
                {

                  action:
                    item.action,

                  trigger:
                    item.trigger?.name,

                  error,

                }
              );

            }

          }

        }
        finally {

          flushingRef.current =
            false;

        }

      },
      [
        actions,
      ]
    );


  // ===================================================
  // RUNTIME STATE SUBSCRIPTION
  // ===================================================

  useEffect(
    () => {

      const unsubscribe =
        runtimeState.subscribeAll(
          (
            state,
            changedKeys,
            meta = {}
          ) => {

            const safeChangedKeys =
              Array.isArray(
                changedKeys
              )
                ? changedKeys
                : [];


            const commitId =
              meta?.commitId;


            console.log(
              "[RuntimeTriggers] STATE COMMIT RECEIVED",
              {

                commitId,

                changedKeys:
                  safeChangedKeys,

                participants:
                  state?.call?.participants,

                joined:
                  state?.call?.joined,

              }
            );


            if (
              !commitId
            ) {

              return;

            }


            evaluateTriggers(
              state,
              safeChangedKeys,
              meta
            );


            queueMicrotask(
              () => {

                flushActions();

              }
            );

          }
        );


      return unsubscribe;

    },
    [
      runtimeState,
      evaluateTriggers,
      flushActions,
    ]
  );


  // ===================================================
  // API
  // ===================================================

  const value =
    useMemo(
      () => ({

        registerTrigger,

      }),
      [
        registerTrigger,
      ]
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <RuntimeTriggersContext.Provider
      value={
        value
      }
    >

      {
        children
      }

    </RuntimeTriggersContext.Provider>

  );

}


// =====================================================
// HOOK
// =====================================================

export function useRuntimeTriggers() {

  const ctx =
    useContext(
      RuntimeTriggersContext
    );


  if (
    !ctx
  ) {

    throw new Error(
      "useRuntimeTriggers must be used inside provider"
    );

  }


  return ctx;

}