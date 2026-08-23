import { useEffect } from "react";

import { useRuntimeState }
  from "../context/RuntimeStateContext";

import useAgoraRuntime
  from "../hooks/useAgoraRuntime";

import agoraEngine
  from "../services/agoraEngine";


export default function RuntimeBootstrap() {

  const runtime =
    useRuntimeState();


  // =====================================================
  // RUNTIME BRIDGES
  // =====================================================

  useAgoraRuntime();


  // =====================================================
  // RUNTIME INITIALISATION
  // =====================================================

  useEffect(() => {

    runtime.setAgora?.(
      agoraEngine
    );

    runtime.setRuntimeReady?.(
      true
    );

  }, [runtime]);


  return null;

}