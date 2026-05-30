import React, { useEffect } from "react";
import { useRuntimeTriggers } from "../context/RuntimeTriggersContext";

export default function RuntimeDevWiring() {
  const triggers = useRuntimeTriggers();

  useEffect(() => {
    const unregister = triggers.registerTrigger({
      name: "mic-toggle-log",
      event: "media.micEnabled",

      condition: ({ state }) => {
        return state?.media?.micEnabled !== undefined;
      },

      actions: ["log.debug"],
    });

    return () => unregister?.();
  }, [triggers]);

  return null;
}