import { useEffect } from "react";
import { useRuntimeState } from "../context/RuntimeStateContext";
import agoraEngine from "../services/agoraEngine";

export default function RuntimeBootstrap() {
  const runtime = useRuntimeState();

  useEffect(() => {
    runtime.setAgora?.(agoraEngine);

    // 🔥 IMPORTANT: seed safe defaults
    runtime.set("call.channel", null);
    runtime.set("call.joined", false);
    runtime.set("call.state", "idle");
    runtime.set("media.micEnabled", true);
    runtime.set("media.videoEnabled", true);

    runtime.setRuntimeReady?.(true);
  }, []);

  return null;
}