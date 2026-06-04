// src/context/RuntimeStateContext.js

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";

import agoraEngine from "../services/agoraEngine";

import { useRuntimeDebugger } from "./RuntimeDebuggerContext";

const RuntimeStateContext = createContext(null);

export function RuntimeStateProvider({ children }) {
  // =====================================================
  // 🔥 BASE STATE
  // =====================================================

  const stateRef = useRef({});

  const subscribersRef = useRef({});
  const globalSubscribersRef = useRef(new Set());


    // =====================================================
  // 🔥 RUNTIME CONTEXT STATE
  // =====================================================

  const [runtimeReady, setRuntimeReady] = useState(false);

   // =====================================================
  // 🔥 AGORA STATE
  // =====================================================

  const [agora, setAgora] = useState(null);

  // =====================================================
  // 🧠 COMPUTED GRAPH
  // =====================================================

  const computedRef = useRef({});
  const dependencyMapRef = useRef({});
  const computedDepsRef = useRef({});
  const activeComputedRef = useRef(null);

  // =====================================================
  // 🔥 TRANSACTION ENGINE
  // =====================================================

  const transactionRef = useRef(null);

  const debuggerRuntime = useRuntimeDebugger?.();

  // =====================================================
  // 🔥 GET (dependency tracking)
  // =====================================================

  const get = useCallback((key) => {
    const active = activeComputedRef.current;

    if (active) {
      if (!computedDepsRef.current[active]) {
        computedDepsRef.current[active] = new Set();
      }

      computedDepsRef.current[active].add(key);

      if (!dependencyMapRef.current[key]) {
        dependencyMapRef.current[key] = new Set();
      }

      dependencyMapRef.current[key].add(active);
    }

    return stateRef.current[key];
  }, []);

  const getAll = useCallback(() => stateRef.current, []);
  const snapshot = useCallback(() => ({ ...stateRef.current }), []);

  // =====================================================
  // 🔥 TRANSACTION START
  // =====================================================

  const beginTransaction = useCallback(() => {
    if (transactionRef.current) return;

    transactionRef.current = {
      id: crypto.randomUUID(),
      startedAt: performance.now(),
      pendingWrites: new Map(),
      isCommitting: false,
    };

    debuggerRuntime?.logTransaction?.({
      phase: "TX_START",
      transactionId: transactionRef.current.id,
    });
  }, [debuggerRuntime]);

  // =====================================================
  // 🔥 QUEUE WRITE
  // =====================================================

  const queueSet = useCallback((key, value) => {
    if (!transactionRef.current) beginTransaction();

    transactionRef.current.pendingWrites.set(key, value);
  }, [beginTransaction]);

  // =====================================================
  // 🔥 FLUSH (defined BEFORE set)
  // =====================================================

  const commit = useCallback(() => {
  const tx = transactionRef.current;
  if (!tx || tx.isCommitting) return;

  tx.isCommitting = true;

  

  // =====================================================
  // 🔥 1. APPLY STATE (COLLECT PREV FIRST)
  // =====================================================

  const writes = tx.pendingWrites;
  const changed = [];
  const prevValues = new Map();

  // APPLY STATE
  for (const [key, value] of writes.entries()) {
    const prev = stateRef.current[key];

    if (Object.is(prev, value)) continue;

    prevValues.set(key, prev);
    stateRef.current[key] = value;

    changed.push(key);

    debuggerRuntime?.logState?.({
      key,
      prev,
      next: value,
      transactionId: tx.id,
    });
  }
  // =====================================================
  // 🔥 2. COMPUTED GRAPH RE-EVALUATION
  // =====================================================

  const recomputed = new Set();

    const collect = (key) => {
      const deps = dependencyMapRef.current[key];
      if (!deps) return;

      for (const dep of deps) {
        if (recomputed.has(dep)) continue;
        recomputed.add(dep);
        collect(dep);
      }
    };

    for (const key of changed) {
      collect(key);
    }

    for (const computedKey of recomputed) {
      const fn = computedRef.current[computedKey];
      if (!fn) continue;

      const prev = stateRef.current[computedKey];
      const next = fn(stateRef.current);

      if (!Object.is(prev, next)) {
        stateRef.current[computedKey] = next;
      }
    }

    // =====================================================
    // 🔥 3. SUBSCRIBERS (USE SNAPSHOT CONSISTENCY)
    // =====================================================

    for (const [key] of writes.entries()) {
      const prev = prevValues.get(key);
      const next = stateRef.current[key];

      subscribersRef.current[key]?.forEach((cb) =>
        cb(next, prev, key)
      );
    }

    // =====================================================
    // 🔥 4. GLOBAL SUBSCRIBERS (SINGLE SOURCE OF TRUTH)
    // =====================================================

    const snapshot = stateRef.current;

    globalSubscribersRef.current.forEach(cb =>
      cb(stateRef.current, changed, {
        commitId: "immediate",
      })
    );

    // =====================================================
    // 🔥 5. CLEANUP
    // =====================================================

    transactionRef.current = null;
    tx.isCommitting = false;

    debuggerRuntime?.logTransaction?.({
      phase: "TX_COMMIT",
      transactionId: tx.id,
      changed,
    });
  }, [debuggerRuntime]);

  const flush = useCallback(() => {
    queueMicrotask(() => {
      if (transactionRef.current) commit();
    });
  }, [commit]);

  // =====================================================
  // 🔥 SET (transaction aware)
  // =====================================================

  const set = useCallback((key, value) => {
    if (transactionRef.current) {
      queueSet(key, value);
      return;
    }

    const prev = stateRef.current[key];
    if (Object.is(prev, value)) return;

    stateRef.current[key] = value;

    subscribersRef.current[key]?.forEach(cb =>
      cb(value, prev, key)
    );

    debuggerRuntime?.logState?.({
      key,
      prev,
      next: value,
      transactionId: null,
    });

    flush();
  }, [queueSet, flush, debuggerRuntime]);

  // =====================================================
  // 🔥 PATCH
  // =====================================================

  const patch = useCallback((ns, obj) => {
    const prev = stateRef.current[ns] || {};
    set(ns, { ...prev, ...obj });
  }, [set]);

  // =====================================================
  // 🔥 COMPUTE
  // =====================================================

  const compute = useCallback((key, fn) => {
    const old = computedDepsRef.current[key];

    if (old) {
      old.forEach(dep =>
        dependencyMapRef.current[dep]?.delete(key)
      );
    }

    computedDepsRef.current[key] = new Set();
    activeComputedRef.current = key;

    const value = fn(stateRef.current);

    activeComputedRef.current = null;

    stateRef.current[key] = value;
    computedRef.current[key] = fn;

    return value;
  }, []);

  // =====================================================
  // 🔥 SUBSCRIPTIONS
  // =====================================================

  const subscribe = useCallback((key, cb) => {
    if (!subscribersRef.current[key]) {
      subscribersRef.current[key] = new Set();
    }

    subscribersRef.current[key].add(cb);

    return () => {
      subscribersRef.current[key]?.delete(cb);
    };
  }, []);

  const subscribeAll = useCallback((cb) => {
    globalSubscribersRef.current.add(cb);
    return () => globalSubscribersRef.current.delete(cb);
  }, []);

  // =====================================================
  // 🔥 CONTEXT
  // =====================================================

  const value = useMemo(() => ({
    get,
    set,
    patch,

    getAll,
    snapshot,

    compute,

    subscribe,
    subscribeAll,

    beginTransaction,
    commit,
    flush,
    queueSet,
    agora,
    setAgora,
    runtimeReady,
    setRuntimeReady,
  }), [
    get,
    set,
    patch,
    getAll,
    snapshot,
    compute,
    subscribe,
    subscribeAll,
    beginTransaction,
    commit,
    flush,
    queueSet,
    runtimeReady,
    setRuntimeReady,
  ]);

  return (
    <RuntimeStateContext.Provider value={value}>
      {children}
    </RuntimeStateContext.Provider>
  );
}

export function useRuntimeState() {
  const ctx = useContext(RuntimeStateContext);
  if (!ctx) throw new Error("useRuntimeState must be used inside provider");
  return ctx;
}