// src/components/elements/FetchCallsDebug.js

import React, { useCallback } from "react";

import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useActionContext } from "../../context/ActionContext";


export default function FetchCallsDebug({
  element,
  binding,
}) {

  // =====================================================
  // RUNTIME STATE
  // =====================================================

  const calls =
    useRuntimeValue("calls.available") || [];


  // =====================================================
  // ACTION CONTEXT
  // =====================================================

  const {
    runAction,
  } = useActionContext();


  // =====================================================
  // ACCEPT CALL
  // =====================================================

  const handleAcceptCall = useCallback(
    async (call) => {

      const callId =
        call?._id ||
        call?.id;


      console.log(
        "[FetchCallsDebug] Accepting call:",
        {
          call,
          callId,
        }
      );


      if (!callId) {

        console.error(
          "[FetchCallsDebug] Cannot accept call - missing call ID",
          call
        );

        return;
      }


      try {

        const result =
          await runAction(
            "call.acceptCall",
            {
              callId,
            }
          );


        console.log(
          "[FetchCallsDebug] Accept result:",
          {
            callId,
            result,
          }
        );


        if (!result?.ok) {

          console.warn(
            "[FetchCallsDebug] Accept failed:",
            result
          );

        }

      }
      catch (err) {

        console.error(
          "[FetchCallsDebug] Accept threw error:",
          err
        );

      }

    },
    [
      runAction,
    ]
  );


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "🔥 FetchCallsDebug",
    {
      count: calls.length,
      calls,
      binding,
    }
  );


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 150,

        background: "#111827",
        color: "#fff",

        padding: 16,
        boxSizing: "border-box",

        overflow: "auto",

        border: "1px solid #374151",
        borderRadius: 8,
      }}
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <div
        style={{
          fontWeight: 700,
          marginBottom: 12,
          color: "#22c55e",
        }}
      >
        Available Calls: {calls.length}
      </div>


      {/* =================================================
          EMPTY STATE
          ================================================= */}

      {calls.length === 0 ? (

        <div
          style={{
            color: "#9ca3af",
          }}
        >
          No available calls
        </div>

      ) : (

        /* =================================================
           CALL LIST
           ================================================= */

        calls.map(
          (call, index) => {

            const callId =
              call?._id ||
              call?.id ||
              null;


            const clientName =
              call?.client
                ? `${call.client.firstName || ""} ${
                    call.client.lastName || ""
                  }`.trim()
                : "—";


            return (

              <div
                key={
                  callId ||
                  index
                }

                style={{
                  padding: 10,
                  marginBottom: 8,

                  background: "#1f2937",

                  borderRadius: 6,

                  border:
                    "1px solid #374151",
                }}
              >

                {/* =========================================
                    CALL INFORMATION
                    ========================================= */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >

                  <div>

                    <div
                      style={{
                        fontWeight: 600,
                        color: "#60a5fa",
                      }}
                    >
                      {call.channelName ||
                        "Unknown channel"}
                    </div>


                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 4,
                      }}
                    >
                      Status:{" "}
                      {call.status || "—"}
                    </div>


                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    >
                      Client:{" "}
                      {clientName}
                    </div>


                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 4,
                      }}
                    >
                      Call ID:{" "}
                      {callId || "—"}
                    </div>

                  </div>


                  {/* =========================================
                      ACCEPT BUTTON
                      ========================================= */}

                  <button
                    type="button"

                    disabled={!callId}

                    onClick={() =>
                      handleAcceptCall(call)
                    }

                    style={{
                      flexShrink: 0,

                      padding:
                        "8px 14px",

                      border: "none",

                      borderRadius: 6,

                      background:
                        callId
                          ? "#22c55e"
                          : "#4b5563",

                      color: "#fff",

                      cursor:
                        callId
                          ? "pointer"
                          : "not-allowed",

                      fontSize: 13,

                      fontWeight: 600,

                      opacity:
                        callId
                          ? 1
                          : 0.6,
                    }}
                  >
                    Accept
                  </button>

                </div>

              </div>

            );

          }
        )

      )}

    </div>

  );
}