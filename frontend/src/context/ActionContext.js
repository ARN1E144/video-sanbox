// src/context/ActionContext.js

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { runRuntimeAction } from "../runtime/runRuntimeAction";
import { runActionPipeline } from "../utils/actionPipeline";
import { useRuntimeState } from "./RuntimeStateContext";

const ActionContext = createContext(null);

export function ActionProvider({ children }) {
  const [bindings, setBindings] = useState({});

  const runtimeState = useRuntimeState();

  const inFlightActions = useRef(new Set());

  const get = runtimeState.get;
  const getAll = runtimeState.getAll;
  const set = runtimeState.set;
  const patch = runtimeState.patch;

  /* ---------------- BINDINGS ---------------- */

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

  /* ---------------- NOTIFY ---------------- */

  const notify = useCallback((msg) => {
    console.log("[notify]", msg);
  }, []);

  /* ---------------- SAFE CTX BUILDER ---------------- */

  const buildRuntimeContext = useCallback(() => {
    
    const agora = runtimeState?.agora;

    console.log("[CTX AGORA]", runtimeState.agora);

    return {
      bindings,

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

      // safe optional service
      agora: agora || null,
    };
  }, [
    bindings,
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
    runtimeState,
  ]);

  /* ---------------- ACTION EXECUTION (HARDENED) ---------------- */

  const executeAction = useCallback(
    async (actionName, params) => {
      if (!runtimeState.runtimeReady) return;

      runtimeState.beginTransaction();

      const ctx = buildRuntimeContext();

      try {
        const result = await runRuntimeAction(
          actionName,
          ctx,
          params
        );

        console.log(
          "%c[ACTION EXECUTED]%c %c" + actionName,
          "color: #10B981; font-weight: bold;",
          "",
          "color: #3B82F6; font-weight: bold;",
          {
            params,
            result,
          }
        );

        runtimeState.commit();

        console.log("[ACTION RAW RESULT]", {
          actionName,
          result,
        });

        return result;

      } catch (err) {
        runtimeState.commit();

        console.error(
          "[Action Error]",
          actionName,
          err
        );

        return null;
      }
    },
    [
      runtimeState,
      buildRuntimeContext,
    ]
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

  /* ---------------- CONTEXT VALUE ---------------- */

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
  if (!ctx) throw new Error("useActionContext must be used inside provider");
  return ctx;
}