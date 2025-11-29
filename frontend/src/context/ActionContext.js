// src/context/ActionContext.js
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

const ActionContext = createContext(null);

export function ActionProvider({ children }) {
  // Per-element binding overrides (e.g. { [elementId]: { src, label, ... } })
  const [bindings, setBindings] = useState({});

  // Generic key/value state for actions (micState etc.)
  const [state, setState] = useState({});

  /* -------------------------------------------------------
   * Base binding helpers
   * ----------------------------------------------------- */
  const updateBinding = useCallback((elementId, partialProps) => {
    if (!elementId) return;
    setBindings((prev) => ({
      ...prev,
      [elementId]: {
        ...(prev[elementId] || {}),
        ...partialProps,
      },
    }));
  }, []);

  const clearBinding = useCallback((elementId) => {
    if (!elementId) return;
    setBindings((prev) => {
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
  }, []);

  const clearAllBindings = useCallback(() => {
    setBindings({});
  }, []);

  const appendFeed = useCallback((elementId, message) => {
    if (!elementId) return;
    setBindings((prev) => {
      const existing = prev[elementId]?.items || [];
      return {
        ...prev,
        [elementId]: {
          ...(prev[elementId] || {}),
          items: [...existing, message],
        },
      };
    });
  }, []);

  /* -------------------------------------------------------
   * Global key/value state
   * ----------------------------------------------------- */
  const get = useCallback((key) => state[key], [state]);

  const set = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const notify = useCallback((msg) => {
    // You can swap this for a toast/snackbar later
    console.log("[Action notify]", msg);
  }, []);

  /* -------------------------------------------------------
   * Camera helpers (used by camera:* actions)
   * ----------------------------------------------------- */

  // Turn camera on: enabled + playing
  const cameraOn = useCallback(
    (elementId) => {
      updateBinding(elementId, { enabled: true, playing: true });
    },
    [updateBinding]
  );

  // Turn camera off: disabled + paused
  const cameraOff = useCallback(
    (elementId) => {
      updateBinding(elementId, { enabled: false, playing: false });
    },
    [updateBinding]
  );

  // Toggle enabled (on/off)
  const cameraToggleEnabled = useCallback((elementId) => {
    if (!elementId) return;
    setBindings((prev) => {
      const current = prev[elementId] || {};
      const nextEnabled = !(current.enabled ?? true);
      return {
        ...prev,
        [elementId]: {
          ...current,
          enabled: nextEnabled,
        },
      };
    });
  }, []);

  // Toggle playing (play/pause)
  const cameraTogglePlaying = useCallback((elementId) => {
    if (!elementId) return;
    setBindings((prev) => {
      const current = prev[elementId] || {};
      const nextPlaying = !(current.playing ?? true);
      return {
        ...prev,
        [elementId]: {
          ...current,
          playing: nextPlaying,
        },
      };
    });
  }, []);

  // Set deviceId explicitly
  const cameraSetDevice = useCallback(
    (elementId, deviceId) => {
      updateBinding(elementId, { deviceId });
    },
    [updateBinding]
  );

  // Set muted explicitly
  const cameraSetMuted = useCallback(
    (elementId, muted) => {
      updateBinding(elementId, { muted });
    },
    [updateBinding]
  );

  const value = {
    // existing API
    bindings,
    updateBinding,
    appendFeed,
    get,
    set,
    notify,

    // new helpers
    clearBinding,
    clearAllBindings,
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
