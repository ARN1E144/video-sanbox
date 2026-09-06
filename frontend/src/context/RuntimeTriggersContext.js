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

import {
  useRuntimeEvents,
} from "../context/RuntimeEventContext";


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

  const runtimeEvents =
    useRuntimeEvents();


  // ===================================================
  // REGISTERED TRIGGERS
  // ===================================================

  const triggersRef =
    useRef([]);


  // ===================================================
  // EVENT SUBSCRIPTIONS
  //
  // {
  //   eventName: unsubscribeFunction
  // }
  // ===================================================

  const eventSubscriptionsRef =
    useRef({});


  // ===================================================
  // PENDING ACTIONS
  // ===================================================

  const pendingRef =
    useRef([]);


  // ===================================================
  // ACTIVE EXECUTION / COMMIT
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
  // ACTION FLUSH LOCK
  // ===================================================

  const flushingRef =
    useRef(false);


  // ===================================================
  // FLUSH REQUEST FLAG
  // ===================================================

  const flushRequestedRef =
    useRef(false);


  // ===================================================
  // BEGIN EXECUTION
  //
  // Every state commit and runtime event receives
  // its own execution identity.
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


        /*
         * Prevent the same event / commit from being
         * evaluated more than once.
         */

        if (
          activeCommitRef.current ===
          commitId
        ) {

          console.log(
            "[RuntimeTriggers] Execution already processed",
            {
              commitId,
            }
          );

          return false;

        }


        activeCommitRef.current =
          commitId;


        /*
         * Actions are deduplicated within this
         * execution cycle.
         */

        executedActionsRef.current.clear();


        console.log(
          "[RuntimeTriggers] BEGIN EXECUTION",
          {
            commitId,
          }
        );


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
        payload,
        trigger,
        commitId,
        source,
      }) => {

        if (
          !action
        ) {

          return;

        }


        /*
         * Same action cannot be executed twice within
         * the same trigger execution cycle.
         */

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
              source,
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

          payload,

          trigger,

          commitId,

          source,

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

            source,
          }
        );

      },
      []
    );


  // ===================================================
  // EVALUATE TRIGGER
  //
  // Shared by:
  //
  //   state triggers
  //   event triggers
  //
  // Conditions receive:
  //
  //   state
  //   changedKeys
  //   payload
  //   meta
  //   commitId
  //   source
  //   trigger
  // ===================================================

  const evaluateTrigger =
    useCallback(
      ({
        trigger,
        state,
        changedKeys = [],
        payload = null,
        meta = {},
        commitId,
        source,
      }) => {

        if (
          !trigger
        ) {

          return;

        }


        let passed =
          true;


        // ---------------------------------------------
        // CONDITION
        // ---------------------------------------------

        try {

          if (
            typeof trigger.condition ===
            "function"
          ) {

            passed =
              !!trigger.condition({

                state,

                changedKeys,

                payload,

                meta,

                commitId,

                source,

                trigger,

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

              commitId,

              source,

              error,
            }
          );


          return;

        }


        // ---------------------------------------------
        // CONDITION FAILED
        // ---------------------------------------------

        if (
          !passed
        ) {

          console.log(
            "[RuntimeTriggers] Condition rejected",
            {
              trigger:
                trigger.name,

              event:
                trigger.event,

              commitId,

              source,
            }
          );

          return;

        }


        // ---------------------------------------------
        // DEBUGGER
        // ---------------------------------------------

        debuggerRuntime?.logTrigger?.({

          trigger:
            trigger.name,

          event:
            trigger.event,

          commitId,

          source,

        });


        // ---------------------------------------------
        // TRIGGER FIRED
        // ---------------------------------------------

        console.log(
          "[RuntimeTriggers] TRIGGER FIRED",
          {
            name:
              trigger.name,

            event:
              trigger.event,

            commitId,

            source,
          }
        );


        // ---------------------------------------------
        // QUEUE ACTIONS
        // ---------------------------------------------

        for (
          const action of
            trigger.actions
        ) {

          queueAction({

            action,

            state,

            payload,

            trigger,

            commitId,

            source,

          });

        }

      },
      [
        debuggerRuntime,
        queueAction,
      ]
    );


  // ===================================================
  // EVALUATE STATE TRIGGERS
  // ===================================================

  const evaluateStateTriggers =
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


        if (
          !beginCommit(
            commitId
          )
        ) {

          return;

        }


        console.log(
          "[RuntimeTriggers] EVALUATING STATE TRIGGERS",
          {
            commitId,

            changedKeys,
          }
        );


        for (
          const trigger of
            triggersRef.current
        ) {

          /*
           * State trigger matching.
           *
           * Example:
           *
           * trigger.event:
           * "compliance.evidence"
           *
           * changedKeys:
           * ["compliance.evidence"]
           */

          if (
            !changedKeys.includes(
              trigger.event
            )
          ) {

            continue;

          }


          evaluateTrigger({

            trigger,

            state,

            changedKeys,

            payload:
              null,

            meta,

            commitId,

            source:
              "state",

          });

        }

      },
      [
        beginCommit,
        evaluateTrigger,
      ]
    );


  // ===================================================
  // EVALUATE EVENT TRIGGERS
  // ===================================================

  const evaluateEventTriggers =
    useCallback(
      (
        event,
        payload = {},
        eventRecord = null
      ) => {

        /*
         * RuntimeEventContext creates:
         *
         * {
         *   id,
         *   event,
         *   payload,
         *   timestamp
         * }
         *
         * The event ID becomes the trigger execution ID.
         */

        const commitId =
          eventRecord?.id ||
          `event_${event}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;


        const meta = {

          event,

          eventId:
            eventRecord?.id ||
            commitId,

          timestamp:
            eventRecord?.timestamp ||
            Date.now(),

          source:
            "event",

        };


        if (
          !beginCommit(
            commitId
          )
        ) {

          return;

        }


        console.log(
          "[RuntimeTriggers] EVENT RECEIVED",
          {
            event,

            commitId,

            payload,

            eventRecord,
          }
        );


        /*
         * Event triggers can inspect the current
         * runtime state while evaluating conditions.
         */

        const state =
          runtimeState.getAll?.() || {};


        for (
          const trigger of
            triggersRef.current
        ) {

          if (
            trigger.event !==
            event
          ) {

            continue;

          }


          evaluateTrigger({

            trigger,

            state,

            changedKeys:
              [],

            payload,

            meta,

            commitId,

            source:
              "event",

          });

        }

      },
      [
        beginCommit,
        evaluateTrigger,
        runtimeState,
      ]
    );


  // ===================================================
  // FLUSH ACTIONS
  //
  // Continuously drains the pending action queue.
  //
  // Event payloads are promoted into the action's
  // top-level parameters.
  //
  // Example:
  //
  // EVENT
  // compliance.evidenceUploaded
  //
  // payload:
  // {
  //   evidenceId,
  //   evidence
  // }
  //
  // becomes:
  //
  // compliance.analyseEvidence({
  //   evidenceId,
  //   evidence,
  //   __runtimeExecution: true,
  //   ...
  // })
  //
  // This allows event payloads to naturally become
  // inputs to triggered actions.
  //
  // Chains such as:
  //
  // evidenceUploaded
  //       ↓
  // analyseEvidence
  //       ↓
  // evidenceReviewRequired
  //       ↓
  // createReviewTask
  //
  // therefore work naturally through the runtime.
  // ===================================================

  const flushActions =
    useCallback(
      async () => {

        /*
         * Another flush is already running.
         *
         * The existing flush loop will pick up any
         * actions added to pendingRef.
         */

        if (
          flushingRef.current
        ) {

          flushRequestedRef.current =
            true;

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


        flushRequestedRef.current =
          false;


        try {

          /*
           * Continue until the action queue is empty.
           */

          while (
            pendingRef.current.length >
            0
          ) {

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


            for (
              const item of
                batch
            ) {

              try {

                console.log(
                  "[RuntimeTriggers] EXECUTING ACTION",
                  {
                    action:
                      item.action,

                    trigger:
                      item.trigger?.name,

                    event:
                      item.trigger?.event,

                    commitId:
                      item.commitId,

                    source:
                      item.source,
                  }
                );


                // -----------------------------------
                // BUILD ACTION PARAMETERS
                // -----------------------------------
                //
                // Event payload becomes the natural
                // input to the triggered action.
                //
                // This allows:
                //
                // payload.evidenceId
                //
                // to become:
                //
                // params.evidenceId
                //
                // while preserving the original
                // payload and runtime metadata.
                // -----------------------------------

                const actionParams = {

                  ...(item.payload &&
                  typeof item.payload ===
                    "object"
                    ? item.payload
                    : {}),

                  __runtimeExecution:
                    true,

                  state:
                    item.state,

                  payload:
                    item.payload,

                  trigger:
                    item.trigger,

                  commitId:
                    item.commitId,

                  source:
                    item.source,

                };


                console.log(
                  "[RuntimeTriggers] ACTION PARAMS",
                  {
                    action:
                      item.action,

                    payload:
                      item.payload,

                    actionParams,
                  }
                );


                const result =
                  await actions.runAction(
                    item.action,
                    actionParams
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

                    source:
                      item.source,

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

                    event:
                      item.trigger?.event,

                    commitId:
                      item.commitId,

                    source:
                      item.source,

                    error,
                  }
                );

              }

            }

          }

        }
        finally {

          flushingRef.current =
            false;


          /*
           * Something may have been queued while
           * the final batch was completing.
           */

          if (
            pendingRef.current.length >
            0 ||
            flushRequestedRef.current
          ) {

            flushRequestedRef.current =
              false;


            queueMicrotask(
              () => {

                flushActions();

              }
            );

          }

        }

      },
      [
        actions,
      ]
    );


  // ===================================================
  // EVENT SUBSCRIPTION MANAGEMENT
  // ===================================================

  const ensureEventSubscription =
    useCallback(
      (
        event
      ) => {

        if (
          !event
        ) {

          return;

        }


        /*
         * Already subscribed.
         */

        if (
          eventSubscriptionsRef.current[event]
        ) {

          return;

        }


        if (
          !runtimeEvents?.on
        ) {

          console.warn(
            "[RuntimeTriggers] Cannot subscribe to event; event bus unavailable",
            {
              event,
            }
          );

          return;

        }


        console.log(
          "[RuntimeTriggers] SUBSCRIBING TO EVENT",
          {
            event,
          }
        );


        const unsubscribe =
          runtimeEvents.on(
            event,
            (
              payload,
              eventRecord
            ) => {

              console.log(
                "[RuntimeTriggers] EVENT BUS RECEIVED",
                {
                  event,

                  payload,

                  eventRecord,
                }
              );


              evaluateEventTriggers(
                event,
                payload,
                eventRecord
              );


              queueMicrotask(
                () => {

                  flushActions();

                }
              );

            }
          );


        eventSubscriptionsRef.current[event] =
          unsubscribe;

      },
      [
        runtimeEvents,
        evaluateEventTriggers,
        flushActions,
      ]
    );


  // ===================================================
  // REMOVE EVENT SUBSCRIPTION
  // ===================================================

  const removeEventSubscription =
    useCallback(
      (
        event
      ) => {

        const unsubscribe =
          eventSubscriptionsRef.current[event];


        if (
          !unsubscribe
        ) {

          return;

        }


        try {

          unsubscribe();

        }
        catch (
          error
        ) {

          console.error(
            "[RuntimeTriggers] Event unsubscribe failed",
            {
              event,
              error,
            }
          );

        }


        delete
          eventSubscriptionsRef.current[event];


        console.log(
          "[RuntimeTriggers] EVENT UNSUBSCRIBED",
          {
            event,
          }
        );

      },
      []
    );


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
          typeof trigger !==
            "object"
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


        /*
         * Immediately subscribe to the event.
         *
         * A trigger can be registered at any point
         * during the lifetime of the provider and its
         * event immediately becomes active.
         */

        ensureEventSubscription(
          normalizedTrigger.event
        );


        /*
         * Unregister function.
         */

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


          /*
           * Only remove the event subscription if no
           * remaining trigger is listening for this event.
           */

          const stillUsed =
            triggersRef.current.some(
              registered =>
                registered.event ===
                normalizedTrigger.event
            );


          if (
            !stillUsed
          ) {

            removeEventSubscription(
              normalizedTrigger.event
            );

          }

        };

      },
      [
        ensureEventSubscription,
        removeEventSubscription,
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


            evaluateStateTriggers(
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
      evaluateStateTriggers,
      flushActions,
    ]
  );


  // ===================================================
  // CLEANUP ALL EVENT SUBSCRIPTIONS
  // ===================================================

  useEffect(
    () => {

      return () => {

        const subscriptions =
          eventSubscriptionsRef.current;


        Object.entries(
          subscriptions
        ).forEach(
          ([
            event,
            unsubscribe,
          ]) => {

            try {

              unsubscribe?.();

            }
            catch (
              error
            ) {

              console.error(
                "[RuntimeTriggers] Cleanup failed",
                {
                  event,
                  error,
                }
              );

            }

          }
        );


        eventSubscriptionsRef.current =
          {};


        triggersRef.current =
          [];


        pendingRef.current =
          [];


        executedActionsRef.current.clear();


        activeCommitRef.current =
          null;


        flushingRef.current =
          false;


        flushRequestedRef.current =
          false;


        console.log(
          "[RuntimeTriggers] Provider cleanup complete"
        );

      };

    },
    []
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