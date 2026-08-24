import { useEffect } from "react";

import { useRuntimeState }
  from "../context/RuntimeStateContext";

import useAgoraRuntime
  from "../hooks/useAgoraRuntime";

import agoraEngine
  from "../services/agoraEngine";

import { useAuth } 
  from "../context/AuthContext";

export default function RuntimeBootstrap() {

  const runtime =
    useRuntimeState();

  const {
    session,
  } = useAuth();


  // =====================================================
  // RUNTIME BRIDGES
  // =====================================================

  useAgoraRuntime();


  // =====================================================
  // AUTHENTICATED RUNTIME STATE
  // =====================================================

  useEffect(() => {

    const isAvailable =
      session?.me?.membership?.isAvailable;


    if (typeof isAvailable !== "boolean") {

      console.log(
        "[RuntimeBootstrap] Availability not available yet"
      );

      return;

    }


    console.log(
      "[RuntimeBootstrap] Hydrating availability:",
      isAvailable
    );


    runtime.patch(
      "availability",
      {
        isAvailable,
      }
    );

  }, [
    session,
    runtime,
  ]);


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