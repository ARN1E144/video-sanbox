// src/context/ActionContext.js
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

const ActionContext = createContext(null);

// Simple flag so logs are easy to filter
const LOG_PREFIX = "[ActionContext]";

export function ActionProvider({ children }) {
  // Per-element binding overrides (e.g. { [elementId]: { src, text, ... } })
  const [bindings, setBindings] = useState({});

  // Generic key/value state for actions (micState etc.)
  const [state, setState] = useState({});

  /* -------------------------------------------------------
   * Base binding helpers
   * ----------------------------------------------------- */

  const updateBinding = useCallback((elementId, partialProps) => {
    if (!elementId) return;

    setBindings((prev) => {
      const prevBinding = prev[elementId] || {};
      const nextBinding = { ...prevBinding, ...partialProps };

      console.log(
        `${LOG_PREFIX} updateBinding`,
        { elementId, partialProps, nextBinding }
      );

      return {
        ...prev,
        [elementId]: nextBinding,
      };
    });
  }, []);

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

      return {
        ...prev,
        [elementId]: nextBinding,
      };
    });
  }, []);

  /* -------------------------------------------------------
   * Global key/value state
   * ----------------------------------------------------- */

  const get = useCallback(
    (key) => state[key],
    [state]
  );

  const set = useCallback((key, value) => {
    console.log(`${LOG_PREFIX} set`, { key, value });
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const notify = useCallback((msg) => {
    console.log("[Action notify]", msg);
  }, []);

  /* -------------------------------------------------------
   * Camera helpers (used by camera:* actions)
   * ----------------------------------------------------- */

  const cameraOn = useCallback(
    (elementId) => {
      console.log(`${LOG_PREFIX} cameraOn`, { elementId });
      updateBinding(elementId, { enabled: true, playing: true });
    },
    [updateBinding]
  );

  const cameraOff = useCallback(
    (elementId) => {
      console.log(`${LOG_PREFIX} cameraOff`, { elementId });
      updateBinding(elementId, { enabled: false, playing: false });
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
        [elementId]: {
          ...current,
          enabled: nextEnabled,
        },
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
        [elementId]: {
          ...current,
          playing: nextPlaying,
        },
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

  const value = {
    // bindings
    bindings,
    updateBinding,
    clearBinding,
    clearAllBindings,
    appendFeed,

    // global state
    get,
    set,
    notify,

    // camera helpers
    cameraOn,
    cameraOff,
    cameraToggleEnabled,
    cameraTogglePlaying,
    cameraSetDevice,
    cameraSetMuted,
  };

  return (
    <ActionContext.Provider value={value}>
      {children}
    </ActionContext.Provider>
  );
}

export function useActionContext() {
  const ctx = useContext(ActionContext);
  if (!ctx) {
    throw new Error("useActionContext must be used inside <ActionProvider>");
  }
  return ctx;
}
