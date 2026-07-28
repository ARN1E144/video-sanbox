import { useMemo } from "react";
import { useRuntimeValue } from "./useRuntimeValue";

/**
 * V1 Binding Resolver
 * Always resolves from runtime first, then fallback object store.
 */
export function useReactiveBindings(id) {
  const binding = useRuntimeValue(`bindings.${id}`) || {};

  const callChannel = useRuntimeValue("call.channel");
  const userId = useRuntimeValue("user.id");

  return useMemo(() => {
    return {
      ...binding,

      // 🔥 HARD GUARANTEED RESOLUTION LAYER
      channel: binding.channel || callChannel || null,
      uid: binding.uid || userId || null,
    };
  }, [binding, callChannel, userId]);
}