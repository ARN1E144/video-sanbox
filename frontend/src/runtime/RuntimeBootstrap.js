import { useEffect } from "react";
import { useRuntimeState } from "../context/RuntimeStateContext";
import agoraEngine from "../services/agoraEngine";

export default function RuntimeBootstrap() {

  const runtime = useRuntimeState();


  useEffect(() => {

    runtime.setAgora?.(agoraEngine);

    runtime.setRuntimeReady?.(true);

  }, []);


  return null;
}