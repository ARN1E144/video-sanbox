// src/context/RuntimeDebuggerContext.js

import React, {
  createContext,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";

import { createId } from "../utils/createId";

const RuntimeDebuggerContext =
  createContext(null);

const MAX_LOGS = 1000;

export function RuntimeDebuggerProvider({
  children,
}) {

  // =====================================================
  // 🔥 LOG STORAGE
  // =====================================================

  const logsRef = useRef([]);

  const subscribersRef =
    useRef(new Set());

  // =====================================================
  // 🔥 INTERNAL EMIT
  // =====================================================

  const emitUpdate =
    useCallback(() => {

      const snapshot = [
        ...logsRef.current,
      ];

      subscribersRef.current.forEach(
        (cb) => {

          try {
            cb(snapshot);
          } catch (err) {
            console.error(
              "[RuntimeDebugger subscriber error]",
              err
            );
          }

        }
      );

    }, []);

  // =====================================================
  // 🔥 ADD LOG
  // =====================================================

  const addLog =
    useCallback((type, data = {}) => {

      const entry = {

        id:
          createId(),

        type,

        timestamp:
          Date.now(),

        ...data,
      };

      logsRef.current.push(entry);

      // cap memory
      if (
        logsRef.current.length >
        MAX_LOGS
      ) {

        logsRef.current.shift();
      }

      emitUpdate();

      return entry;

    }, [emitUpdate]);

  // =====================================================
  // 🔥 EVENT LOG
  // =====================================================

  const logEvent =
    useCallback((event, payload) => {

      return addLog(
        "event",
        {
          event,
          payload,
        }
      );

    }, [addLog]);

  // =====================================================
  // 🔥 ACTION LOG
  // =====================================================

  const logAction =
    useCallback(({
      action,
      params,
      duration,
      transactionId,
      status = "success",
      error = null,
    }) => {

      return addLog(
        "action",
        {
          action,
          params,
          duration,
          transactionId,
          status,
          error,
        }
      );

    }, [addLog]);

  // =====================================================
  // 🔥 STATE MUTATION LOG
  // =====================================================

  const logState =
    useCallback(({
      key,
      prev,
      next,
      transactionId,
    }) => {

      return addLog(
        "state",
        {
          key,
          prev,
          next,
          transactionId,
        }
      );

    }, [addLog]);

  // =====================================================
  // 🔥 TRIGGER LOG
  // =====================================================

  const logTrigger =
    useCallback(({
      trigger,
      event,
      payload,
      passed,
      actions,
    }) => {

      return addLog(
        "trigger",
        {
          trigger,
          event,
          payload,
          passed,
          actions,
        }
      );

    }, [addLog]);

  // =====================================================
  // 🔥 TRANSACTION LOG
  // =====================================================

  const logTransaction =
    useCallback(({
      phase,
      transactionId,
      meta = {},
    }) => {

      return addLog(
        "transaction",
        {
          phase,
          transactionId,
          meta,
        }
      );

    }, [addLog]);

  // =====================================================
  // 🔥 GET LOGS
  // =====================================================

  const getLogs =
    useCallback(() => {

      return [
        ...logsRef.current,
      ];

    }, []);

  // =====================================================
  // 🔥 CLEAR LOGS
  // =====================================================

  const clearLogs =
    useCallback(() => {

      logsRef.current = [];

      emitUpdate();

    }, [emitUpdate]);

  // =====================================================
  // 🔥 SUBSCRIBE
  // =====================================================

  const subscribe =
    useCallback((callback) => {

      subscribersRef.current.add(
        callback
      );

      return () => {

        subscribersRef.current.delete(
          callback
        );
      };

    }, []);

  // =====================================================
  // 🔥 EXPORT SNAPSHOT
  // =====================================================

  const exportLogs =
    useCallback(() => {

      return JSON.stringify(
        logsRef.current,
        null,
        2
      );

    }, []);

  // =====================================================
  // 🔥 CONTEXT VALUE
  // =====================================================

  const value = useMemo(
    () => ({

      // generic
      addLog,

      // specialized
      logEvent,
      logAction,
      logState,
      logTrigger,
      logTransaction,

      // retrieval
      getLogs,
      clearLogs,
      exportLogs,

      // subscriptions
      subscribe,

    }),
    [

      addLog,

      logEvent,
      logAction,
      logState,
      logTrigger,
      logTransaction,

      getLogs,
      clearLogs,
      exportLogs,

      subscribe,
    ]
  );

  return (
    <RuntimeDebuggerContext.Provider
      value={value}
    >
      {children}
    </RuntimeDebuggerContext.Provider>
  );
}
export function useRuntimeDebugger() {
  const ctx = useContext(RuntimeDebuggerContext);

  return useMemo(() => {
    if (!ctx) {
      return {
        logEvent: () => {},
        logAction: () => {},
        logState: () => {},
        logTrigger: () => {},
        logTransaction: () => {},
        subscribe: () => {},
        getLogs: () => [],
      };
    }

    return ctx;
  }, [ctx]);
}