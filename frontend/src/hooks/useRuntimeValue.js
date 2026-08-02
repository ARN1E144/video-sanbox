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

  const initial = get(key);

  console.log(
    "🔥 useRuntimeValue READ",
    key,
    initial
  );

  const [value, setValue] = useState(initial);

  const keyRef = useRef(key);

  keyRef.current = key;

  useEffect(() => {

    const current = get(key);

    console.log(
      "🔥 useRuntimeValue EFFECT",
      key,
      current
    );

    setValue(current);

    const unsubscribe = subscribe(
      key,
      (nextValue) => {

        console.log(
          "🔥 useRuntimeValue UPDATE",
          key,
          nextValue
        );

        setValue(nextValue);

      }
    );

    return () => unsubscribe?.();

  }, [
    key,
    get,
    subscribe
  ]);

  return value;
}