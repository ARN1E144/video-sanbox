// src/context/ActionContext.js

import React, { createContext, useContext, useState, useCallback } from "react";
import { actionRegistry } from "../actions/actionsRegistry";
import { runAction } from "../utils/actionExecutor";
import { runActionPipeline } from "../utils/actionPipeline";

const ActionContext = createContext(null);

const LOG_PREFIX = "[ActionContext]";

export function ActionProvider({ children }) {
  /**
   * Element bindings
   * Runtime state applied to elements (VideoFeed, ChatPanel etc)
   */
  const [bindings, setBindings] = useState({});

  /**
   * Global runtime state
   * Used for workflows, API results, etc
   */
  const [state, setState] = useState({});

  /**
   * --------------------------------
   * Element Binding Management
   * --------------------------------
   */

  const updateBinding = useCallback((elementId, partialProps) => {
    if (!elementId) return;

    setBindings((prev) => {
      const prevBinding = prev[elementId] || {};
      const nextBinding = { ...prevBinding, ...partialProps };

      console.log(`${LOG_PREFIX} updateBinding`, {
        elementId,
        partialProps,
        nextBinding,
      });

      return { ...prev, [elementId]: nextBinding };
    });
  }, []);

  const getBinding = useCallback(
    (elementId) => (elementId ? bindings[elementId] : undefined),
    [bindings]
  );

  const clearBinding = useCallback((elementId) => {
    if (!elementId) return;

    setBindings((prev) => {
      if (!prev[elementId]) return prev;

      const next = { ...prev };
      delete next[elementId];

      console.log(`${LOG_PREFIX} clearBinding`, { elementId });

      return next;
    });
  }, []);

  const clearAllBindings = useCallback(() => {
    console.log(`${LOG_PREFIX} clearAllBindings`);
    setBindings({});
  }, []);

  /**
   * --------------------------------
   * Chat / Feed helpers
   * --------------------------------
   */

  const appendFeed = useCallback((elementId, message) => {
    if (!elementId) return;

    setBindings((prev) => {
      const existing = prev[elementId]?.items || [];
      const nextItems = [...existing, message];

      const nextBinding = {
        ...(prev[elementId] || {}),
        items: nextItems,
      };

      console.log(`${LOG_PREFIX} appendFeed`, {
        elementId,
        message,
        nextBinding,
      });

      return { ...prev, [elementId]: nextBinding };
    });
  }, []);

  /**
   * --------------------------------
   * Global State
   * --------------------------------
   */

  const get = useCallback((key) => state[key], [state]);

  const set = useCallback((key, value) => {
    console.log(`${LOG_PREFIX} set`, { key, value });

    setState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * --------------------------------
   * Notifications
   * --------------------------------
   */

  const notify = useCallback((msg) => {
    console.log("[Action notify]", msg);
  }, []);

  /**
   * --------------------------------
   * Camera Helpers (VideoFeed)
   * --------------------------------
   */

  const cameraOn = useCallback(
    (elementId) => {
      console.log(`${LOG_PREFIX} cameraOn`, { elementId });

      updateBinding(elementId, {
        enabled: true,
        playing: true,
      });
    },
    [updateBinding]
  );

  const cameraOff = useCallback(
    (elementId) => {
      console.log(`${LOG_PREFIX} cameraOff`, { elementId });

      updateBinding(elementId, {
        enabled: false,
        playing: false,
      });
    },
    [updateBinding]
  );

  const cameraToggleEnabled = useCallback((elementId) => {
    if (!elementId) return;

    setBindings((prev) => {
      const current = prev[elementId] || {};
      const nextEnabled = !(current.enabled ?? true);

      console.log(`${LOG_PREFIX} cameraToggleEnabled`, {
        elementId,
        prevEnabled: current.enabled,
        nextEnabled,
      });

      return {
        ...prev,
        [elementId]: { ...current, enabled: nextEnabled },
      };
    });
  }, []);

  const cameraTogglePlaying = useCallback((elementId) => {
    if (!elementId) return;

    setBindings((prev) => {
      const current = prev[elementId] || {};
      const nextPlaying = !(current.playing ?? true);

      console.log(`${LOG_PREFIX} cameraTogglePlaying`, {
        elementId,
        prevPlaying: current.playing,
        nextPlaying,
      });

      return {
        ...prev,
        [elementId]: { ...current, playing: nextPlaying },
      };
    });
  }, []);

  const cameraSetDevice = useCallback(
    (elementId, deviceId) => {
      console.log(`${LOG_PREFIX} cameraSetDevice`, { elementId, deviceId });

      updateBinding(elementId, { deviceId });
    },
    [updateBinding]
  );

  const cameraSetMuted = useCallback(
    (elementId, muted) => {
      console.log(`${LOG_PREFIX} cameraSetMuted`, { elementId, muted });

      updateBinding(elementId, { muted });
    },
    [updateBinding]
  );

  /**
   * --------------------------------
   * ACTION EXECUTION (Registry Based)
   * --------------------------------
   */

  const executeAction = useCallback(
    async (actionName, payload = {}) => {
      const entry = actionRegistry[actionName];

      if (!entry) {
        console.warn(`${LOG_PREFIX} Unknown action`, actionName);
        return;
      }

      try {
        console.log(`${LOG_PREFIX} executeAction`, {
          action: actionName,
          payload,
        });

        await entry.run(payload, {
          bindings,
          state,
          get,
          set,
          notify,
          updateBinding,
          appendFeed,
        });
      } catch (err) {
        console.error(`${LOG_PREFIX} Action failed`, actionName, err);
      }
    },
    [bindings, state, get, set, notify, updateBinding, appendFeed]
  );

  /**
   * --------------------------------
   * ACTION PIPELINE (Workflows)
   * --------------------------------
   */

  const executePipeline = useCallback(
    async (pipeline = [], payload = {}) => {
      console.log(`${LOG_PREFIX} executePipeline`, pipeline);

      await runActionPipeline(pipeline, payload, {
        runAction: executeAction,
        get,
        set,
        notify,
      });
    },
    [executeAction, get, set, notify]
  );

  /**
   * --------------------------------
   * Context Value
   * --------------------------------
   */

  const value = {
    bindings,

    getBinding,
    updateBinding,
    clearBinding,
    clearAllBindings,
    appendFeed,

    get,
    set,

    notify,

    cameraOn,
    cameraOff,
    cameraToggleEnabled,
    cameraTogglePlaying,
    cameraSetDevice,
    cameraSetMuted,

    runAction: executeAction,
    runActionPipeline: executePipeline,
  };

  return <ActionContext.Provider value={value}>{children}</ActionContext.Provider>;
}

export function useActionContext() {
  const ctx = useContext(ActionContext);

  if (!ctx) {
    throw new Error("useActionContext must be used inside <ActionProvider>");
  }

  return ctx;
}