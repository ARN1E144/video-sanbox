// src/context/ActionContext.js

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

import { runRuntimeAction } from "../runtime/runRuntimeAction";
import { runActionPipeline } from "../utils/actionPipeline";
import { useRuntimeState } from "./RuntimeStateContext";

const ActionContext = createContext(null);

export function ActionProvider({ children }) {
  const [bindings, setBindings] = useState({});

  // =====================================================
  // RUNTIME STATE (SINGLE SOURCE OF TRUTH)
  // =====================================================
  const runtimeState = useRuntimeState();

  const get = runtimeState.get;
  const set = runtimeState.set;
  const patch = runtimeState.patch;

  // =====================================================
  // BINDINGS
  // =====================================================
  const getBinding = useCallback(
    (id) => bindings[id] || null,
    [bindings]
  );

  const updateBinding = useCallback((id, patchData = {}) => {
    setBindings((prev) => {
      const cur = prev[id] || {};

      return {
        ...prev,
        [id]: {
          ...cur,
          ...patchData,
          config: { ...(cur.config || {}), ...(patchData.config || {}) },
          state: { ...(cur.state || {}), ...(patchData.state || {}) },
        },
      };
    });
  }, []);

  const removeBinding = useCallback((id) => {
    setBindings((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearBindings = useCallback(() => setBindings({}), []);

  const appendFeedItem = useCallback((id, item) => {
    setBindings((prev) => {
      const cur = prev[id] || {};
      return {
        ...prev,
        [id]: {
          ...cur,
          items: [...(cur.items || []), item],
        },
      };
    });
  }, []);

  // =====================================================
  // NOTIFY (V1)
  // =====================================================
  const notify = useCallback((msg) => {
    console.log("[notify]", msg);
  }, []);

  // =====================================================
  // SAFE RUNTIME CONTEXT BUILDER
  // =====================================================
  const buildRuntimeContext = useCallback(() => {
    return {
      bindings,

      get,
      set,
      patch,

      notify,

      getBinding,
      updateBinding,
      removeBinding,
      clearBindings,
      appendFeedItem,

      // 🔥 SAFE OPTIONAL MODULE (NO HARD DEPENDENCY)
      agora: runtimeState?.agora ?? null,
    };
  }, [
    bindings,
    get,
    set,
    patch,
    notify,
    getBinding,
    updateBinding,
    removeBinding,
    clearBindings,
    appendFeedItem,
    runtimeState,
  ]);

  // =====================================================
  // ACTION EXECUTION
  // =====================================================
  const executeAction = useCallback(
    async (actionName, params = {}) => {
      runtimeState.beginTransaction();

      const ctx = buildRuntimeContext();

      try {
        const result = await runRuntimeAction(
          actionName,
          ctx,
          params
        );

        runtimeState.commit();

        return result;
      } catch (err) {
        runtimeState.commit();
        throw err;
      }
    },
    [runtimeState, buildRuntimeContext]
  );

  const executePipeline = useCallback(
    async (pipeline = [], payload = {}) => {
      return runActionPipeline(pipeline, payload, {
        runRuntimeAction: executeAction,
        get,
        set,
        notify,
      });
    },
    [executeAction, get, set, notify]
  );

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
  const value = useMemo(
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

      runRuntimeAction: executeAction,
      runActionPipeline: executePipeline,

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
      notify,
    ]
  );

  return (
    <ActionContext.Provider value={value}>
      {children}
    </ActionContext.Provider>
  );
}

export function useActionContext() {
  const ctx = useContext(ActionContext);

  if (!ctx) {
    throw new Error("useActionContext must be used inside provider");
  }

  return ctx;
}