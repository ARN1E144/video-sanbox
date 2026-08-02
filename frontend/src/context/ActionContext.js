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
import { useRuntimeEvents } from "./RuntimeEventContext";

const ActionContext = createContext(null);

export function ActionProvider({ children }) {
  const [bindings, setBindings] = useState({});

  const runtimeState = useRuntimeState();
  const runtimeEvents = useRuntimeEvents();

  const inFlightActions = useRef(new Set());
  const executeActionRef = useRef(null);

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

    agora: agora || null,

    runAction: (...args) =>
      executeActionRef.current?.(...args),
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

          if (result?.ok) {

            runtimeEvents.emit(actionName, {

              action: actionName,

              targetId:
                params?.targetId ?? null,

              params: {
                ...params,

                channel:
                  result?.result?.channel ||
                  runtimeState.get("call.channel"),

                uid:
                  result?.result?.uid ||
                  runtimeState.get("user.id"),
              },

              state: getAll(),

              result,

              timestamp: Date.now(),

            });

            await runtimeState.flush();

              console.log(
                "[AFTER COMMIT]",
                runtimeState.getAll()
              );

          }

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
      getAll
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

  // Keep the ref pointing at the latest dispatcher
  executeActionRef.current = executeAction;

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
      runAction: executeAction,

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