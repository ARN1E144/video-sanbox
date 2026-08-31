// src/components/elements/GroupCallControls.js

import React, {
  useState,
} from "react";

import {
  useRuntimeValue,
} from "../../hooks/useRuntimeValue";

import {
  useActionContext,
} from "../../context/ActionContext";


// =====================================================
// SAFE TEXT
// =====================================================

function safeText(
  value,
  fallback = ""
) {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;

  }


  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return String(
      value
    );

  }


  return fallback;

}


// =====================================================
// COMPONENT
// =====================================================

export default function GroupCallControls({

  showCallInfo =
    true,

  showParticipants =
    true,

  showMic =
    true,

  showVideo =
    true,

  showLeave =
    true,

  showEnd =
    true,

  micLabel =
    "Mute Mic",

  micEnabledLabel =
    "Unmute Mic",

  videoLabel =
    "Turn Camera Off",

  videoDisabledLabel =
    "Turn Camera On",

  leaveLabel =
    "Leave Call",

  endLabel =
    "End Call",

  style =
    {},

}) {

  const {
    runAction,
  } =
  useActionContext();


  // ===================================================
  // RUNTIME
  // ===================================================

  const callId =
    useRuntimeValue(
      "call.id"
    );


  const channel =
    useRuntimeValue(
      "call.channel"
    );


  const callState =
    useRuntimeValue(
      "call.state"
    ) ||
    "idle";


  const joined =
    useRuntimeValue(
      "call.joined"
    );


  const participantCount =
    useRuntimeValue(
      "call.participants"
    ) ||
    0;


  const remoteUsers =
    useRuntimeValue(
      "call.remoteUsers"
    ) || {};


  const micEnabled =
    useRuntimeValue(
      "media.micEnabled"
    );


  const videoEnabled =
    useRuntimeValue(
      "media.videoEnabled"
    );


  // ===================================================
  // LOCAL ACTION STATE
  // ===================================================

  const [
    runningAction,
    setRunningAction,
  ] =
  useState(null);


  // ===================================================
  // REMOTE USER COUNT
  // ===================================================

  const remoteUserCount =
    remoteUsers &&
    typeof remoteUsers === "object"
      ? Object.keys(
          remoteUsers
        ).length
      : 0;


  // ===================================================
  // RUN ACTION
  // ===================================================

  const execute =
    async (
      action,
      params = {}
    ) => {

      if (
        runningAction
      ) {

        return;

      }


      setRunningAction(
        action
      );


      try {

        console.log(
          "[GroupCallControls] ACTION",
          {
            action,
            params,
          }
        );


        const result =
          await runAction(
            action,
            params
          );


        console.log(
          "[GroupCallControls] RESULT",
          {
            action,
            result,
          }
        );


        return result;

      }
      catch (error) {

        console.error(
          "[GroupCallControls] ACTION FAILED",
          {
            action,
            error,
          }
        );


        return {
          ok:
            false,

          error:
            error?.message ||
            "Action failed",
        };

      }
      finally {

        setRunningAction(
          null
        );

      }

    };


  // ===================================================
  // MIC
  // ===================================================

  const handleMic =
    () => {

      execute(
        "call.toggleMic",
        {
          callId:
            callId || undefined,
        }
      );

    };


  // ===================================================
  // VIDEO
  // ===================================================

  const handleVideo =
    () => {

      execute(
        "call.toggleVideo",
        {
          callId:
            callId || undefined,
        }
      );

    };


  // ===================================================
  // LEAVE
  // ===================================================

  const handleLeave =
    () => {

      execute(
        "call.leaveGroupCall",
        {
          callId:
            callId || undefined,
        }
      );

    };


  // ===================================================
  // END
  // ===================================================

  const handleEnd =
    () => {

      execute(
        "call.endGroupCall",
        {
          callId:
            callId || undefined,
        }
      );

    };


  // ===================================================
  // NO ACTIVE GROUP CALL
  // ===================================================

  if (
    !callId ||
    !joined
  ) {

    return null;

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{

        width:
          "100%",

        boxSizing:
          "border-box",

        display:
          "flex",

        flexDirection:
          "column",

        gap:
          10,

        ...style,

      }}
    >

      {/* =============================================
          CALL INFO
      ============================================= */}

      {showCallInfo && (

        <div
          style={{

            padding:
              10,

            border:
              "1px solid #292929",

            borderRadius:
              8,

            background:
              "#111",

            color:
              "#aaa",

            fontSize:
              10,

            lineHeight:
              1.5,

          }}
        >

          <div>

            State:
            {" "}

            <strong
              style={{
                color:
                  "#fff",
              }}
            >

              {safeText(
                callState,
                "unknown"
              )}

            </strong>

          </div>


          <div>

            Remote users:
            {" "}

            <strong
              style={{
                color:
                  "#fff",
              }}
            >
              {remoteUserCount}
            </strong>

          </div>


          {showParticipants && (

            <div>

              Participants:
              {" "}

              <strong
                style={{
                  color:
                    "#fff",
                }}
              >
                {participantCount}
              </strong>

            </div>

          )}


          {channel && (

            <div
              style={{
                marginTop:
                  3,

                color:
                  "#555",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

                whiteSpace:
                  "nowrap",
              }}
            >

              {channel}

            </div>

          )}

        </div>

      )}


      {/* =============================================
          MEDIA CONTROLS
      ============================================= */}

      <div
        style={{

          display:
            "flex",

          flexWrap:
            "wrap",

          gap:
            8,

        }}
      >

        {showMic && (

          <button

            type="button"

            onClick={
              handleMic
            }

            disabled={
              Boolean(
                runningAction
              )
            }

            style={{

              flex:
                "1 1 140px",

              minHeight:
                40,

              border:
                "1px solid #444",

              borderRadius:
                7,

              background:
                "#222",

              color:
                "#fff",

              cursor:
                runningAction
                  ? "default"
                  : "pointer",

            }}

          >

            {runningAction ===
              "call.toggleMic"

              ? "Working..."

              : micEnabled
                ? micLabel
                : micEnabledLabel}

          </button>

        )}


        {showVideo && (

          <button

            type="button"

            onClick={
              handleVideo
            }

            disabled={
              Boolean(
                runningAction
              )
            }

            style={{

              flex:
                "1 1 140px",

              minHeight:
                40,

              border:
                "1px solid #444",

              borderRadius:
                7,

              background:
                "#222",

              color:
                "#fff",

              cursor:
                runningAction
                  ? "default"
                  : "pointer",

            }}

          >

            {runningAction ===
              "call.toggleVideo"

              ? "Working..."

              : videoEnabled
                ? videoLabel
                : videoDisabledLabel}

          </button>

        )}

      </div>


      {/* =============================================
          CALL LIFECYCLE
      ============================================= */}

      <div
        style={{

          display:
            "flex",

          gap:
            8,

        }}
      >

        {showLeave && (

          <button

            type="button"

            onClick={
              handleLeave
            }

            disabled={
              Boolean(
                runningAction
              )
            }

            style={{

              flex:
                1,

              minHeight:
                40,

              border:
                "1px solid #555",

              borderRadius:
                7,

              background:
                "#2a2a2a",

              color:
                "#fff",

              cursor:
                runningAction
                  ? "default"
                  : "pointer",

            }}

          >

            {runningAction ===
              "call.leaveGroupCall"

              ? "Leaving..."

              : leaveLabel}

          </button>

        )}


        {showEnd && (

          <button

            type="button"

            onClick={
              handleEnd
            }

            disabled={
              Boolean(
                runningAction
              )
            }

            style={{

              flex:
                1,

              minHeight:
                40,

              border:
                "none",

              borderRadius:
                7,

              background:
                "#991b1b",

              color:
                "#fff",

              fontWeight:
                600,

              cursor:
                runningAction
                  ? "default"
                  : "pointer",

              opacity:
                runningAction
                  ? 0.65
                  : 1,

            }}

          >

            {runningAction ===
              "call.endGroupCall"

              ? "Ending..."

              : endLabel}

          </button>

        )}

      </div>

    </div>

  );

}