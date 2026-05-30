// src/context/RuntimeEventContext.js

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { useRuntimeDebugger }
from "./RuntimeDebuggerContext";

const RuntimeEventContext =
  createContext(null);

export function RuntimeEventProvider({
  children,
}) {

  const listenersRef =
    useRef({});

  const debuggerRuntime =
    useRuntimeDebugger?.();

  // =====================================================
  // 🔥 EMIT
  // =====================================================

  const emit =
    useCallback((
      event,
      payload = {}
    ) => {

      console.log(
        `%c[RUNTIME EVENT] ${event}`,
        "color: orange;",
        payload
      );

      // =========================================
      // DEBUG LOG
      // =========================================

      debuggerRuntime?.logEvent?.(
        event,
        payload
      );

      const listeners =
        listenersRef.current[event];

      if (!listeners) return;

      listeners.forEach((callback) => {

        try {

          callback(payload);

        } catch (err) {

          console.error(
            `[RuntimeEvent Error] ${event}`,
            err
          );
        }
      });

    }, [debuggerRuntime]);

  // =====================================================
  // 🔥 ON
  // =====================================================

  const on =
    useCallback((
      event,
      callback
    ) => {

      if (
        !listenersRef.current[event]
      ) {

        listenersRef.current[event] =
          [];
      }

      listenersRef.current[event]
        .push(callback);

      return () => {

        listenersRef.current[event] =
          listenersRef.current[event]
            .filter(
              (cb) => cb !== callback
            );
      };

    }, []);

  // =====================================================
  // 🔥 VALUE
  // =====================================================

  const value = useMemo(
    () => ({
      emit,
      on,
    }),
    [emit, on]
  );

  return (
    <RuntimeEventContext.Provider
      value={value}
    >
      {children}
    </RuntimeEventContext.Provider>
  );
}

export function useRuntimeEvents() {

  const ctx =
    useContext(
      RuntimeEventContext
    );

  if (!ctx) {

    throw new Error(
      "useRuntimeEvents must be used inside RuntimeEventProvider"
    );
  }

  return ctx;
}