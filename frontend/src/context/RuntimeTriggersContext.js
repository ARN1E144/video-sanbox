import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import { useRuntimeState } from "../context/RuntimeStateContext";
import { useActionContext } from "../context/ActionContext";
import { useRuntimeDebugger } from "../context/RuntimeDebuggerContext";

const RuntimeTriggersContext = createContext(null);

export function RuntimeTriggersProvider({ children }) {
  const runtimeState = useRuntimeState();
  const actions = useActionContext();
  const debuggerRuntime = useRuntimeDebugger?.();

  const triggersRef = useRef([]);

  // queued actions per commit
  const pendingRef = useRef([]);

  // 🔥 LOOP PROTECTION STATE
  const activeCommitRef = useRef(null);
  const executedActionsRef = useRef(new Set());

  const flushingRef = useRef(false);

  // =====================================================
  // REGISTER
  // =====================================================

  const registerTrigger = useCallback((trigger) => {
    triggersRef.current.push(trigger);

    return () => {
      triggersRef.current =
        triggersRef.current.filter((t) => t !== trigger);
    };
  }, []);

  // =====================================================
  // TRIGGER EVALUATION
  // =====================================================

  const evaluateTriggers = useCallback(
    (state, changedKeys = [], meta = {}) => {
      const commitId = meta?.commitId;

      // lock commit context
      if (commitId) {
        if (activeCommitRef.current === commitId) return;
        activeCommitRef.current = commitId;

        // reset per commit
        executedActionsRef.current.clear();
      }

      for (const trigger of triggersRef.current) {
        if (!changedKeys.includes(trigger.event)) continue;

        try {
          const passed =
            typeof trigger.condition === "function"
              ? trigger.condition({ state, changedKeys })
              : true;

          if (!passed) continue;

          debuggerRuntime?.logTrigger?.({
            trigger: trigger.name,
            event: trigger.event,
            commitId,
          });

          for (const action of trigger.actions || []) {
            const actionKey = `${action}_${commitId}`;

            // 🔥 DEDUPE ACTIONS PER COMMIT
            if (executedActionsRef.current.has(actionKey)) continue;

            executedActionsRef.current.add(actionKey);

            pendingRef.current.push({
              action,
              state,
              trigger,
              commitId,
            });
          }
        } catch (err) {
          console.error("[Trigger Error]", err);
        }
      }
    },
    [debuggerRuntime]
  );

  // =====================================================
  // ACTION FLUSH (SAFE BATCH)
  // =====================================================

  const flushActions = useCallback(async () => {
    if (flushingRef.current) return;

    flushingRef.current = true;

    const batch = [...pendingRef.current];
    pendingRef.current = [];

    for (const item of batch) {
      try {
        await actions.runAction(item.action, {
          state: item.state,
          trigger: item.trigger,
          commitId: item.commitId,
        });
      } catch (err) {
        console.error("[Action Error]", err);
      }
    }

    flushingRef.current = false;
  }, [actions]);

  // =====================================================
  // COMMIT-AWARE SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    const unsubscribe = runtimeState.subscribeAll(
      (state, changedKeys, meta = {}) => {

        const safeChangedKeys = Array.isArray(changedKeys) ? changedKeys : [];
        const commitId = meta?.commitId;

        if (!commitId) return;

        evaluateTriggers(state, safeChangedKeys, meta);

        queueMicrotask(() => {
          flushActions();
        });
      }
    );

    return unsubscribe;
  }, [runtimeState, evaluateTriggers, flushActions]);

  // =====================================================
  // API
  // =====================================================

  const value = useMemo(
    () => ({
      registerTrigger,
    }),
    [registerTrigger]
  );

  return (
    <RuntimeTriggersContext.Provider value={value}>
      {children}
    </RuntimeTriggersContext.Provider>
  );
}

export function useRuntimeTriggers() {
  const ctx = useContext(RuntimeTriggersContext);

  if (!ctx) {
    throw new Error("useRuntimeTriggers must be used inside provider");
  }

  return ctx;
}