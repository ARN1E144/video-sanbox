import { useEffect, useState, useRef } from "react";
import { useRuntimeState } from "../context/RuntimeStateContext";

/**
 * useRuntimeValue
 * - reactive selector into runtime graph
 * - subscribes to state key(s)
 * - returns latest runtime value
 *
 * V1: intentionally minimal, no selector memoization layer yet
 */
export function useRuntimeValue(key) {
  const runtime = useRuntimeState();

  const get = runtime.get;
  const subscribe = runtime.subscribe;

  const [value, setValue] = useState(() => get(key));

  const keyRef = useRef(key);

  // keep latest key
  keyRef.current = key;

  useEffect(() => {
    // initial sync
    setValue(get(key));

    // subscribe to runtime changes
    const unsubscribe = subscribe(key, (nextValue) => {
      setValue(nextValue);
    });

    return () => unsubscribe?.();
  }, [key, get, subscribe]);

  return value;
}