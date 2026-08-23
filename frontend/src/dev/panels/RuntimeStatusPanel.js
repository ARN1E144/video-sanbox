import React from "react";

import {
  useRuntimeValue,
} from "../../hooks/useRuntimeValue";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";


export default function RuntimeStatusPanel() {

  const runtime =
    useRuntimeState();


  // =====================================================
  // RUNTIME READY
  // =====================================================

  const runtimeReady =
    runtime.runtimeReady;


  // =====================================================
  // AGORA
  // =====================================================

  const agora =
    runtime.agora;


  // =====================================================
  // CALL
  // =====================================================

  const callId =
    useRuntimeValue(
      "call.id"
    );


  const channel =
    useRuntimeValue(
      "call.channel"
    );


  const state =
    useRuntimeValue(
      "call.state"
    );


  const joined =
    useRuntimeValue(
      "call.joined"
    );


  // =====================================================
  // MEDIA
  // =====================================================

  const micEnabled =
    useRuntimeValue(
      "media.micEnabled"
    );


  const videoEnabled =
    useRuntimeValue(
      "media.videoEnabled"
    );


  // =====================================================
  // PARTICIPANTS
  //
  // This is a NUMBER.
  //
  // RuntimeState:
  // call.participants = 1
  // =====================================================

  const participants =
    useRuntimeValue(
      "call.participants"
    );


  // =====================================================
  // REMOTE USERS
  //
  // This is an OBJECT keyed by Agora UID.
  //
  // Example:
  //
  // {
  //   "13510": {
  //     uid: 13510,
  //     hasAudio: true,
  //     hasVideo: true
  //   }
  // }
  // =====================================================

  const remoteUsers =
    useRuntimeValue(
      "call.remoteUsers"
    );


  const remoteUserCount =
    remoteUsers &&
    typeof remoteUsers === "object"
      ? Object.keys(remoteUsers).length
      : 0;


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "[RuntimeStatusPanel] status",
    {
      callId,
      channel,
      state,
      joined,
      micEnabled,
      videoEnabled,
      participants,
      remoteUserCount,
      agoraUid:
        agora?.uid || null,
    }
  );


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div>

      <h4>
        Runtime Status
      </h4>


      <Status
        label="Runtime Ready"
        value={runtimeReady}
      />


      <Status
        label="Call ID"
        value={
          callId || "none"
        }
      />


      <Status
        label="Channel"
        value={
          channel || "none"
        }
      />


      <Status
        label="State"
        value={
          state || "idle"
        }
      />


      <Status
        label="Joined"
        value={
          joined
        }
      />


      <Status
        label="Mic Enabled"
        value={
          micEnabled
        }
      />


      <Status
        label="Video Enabled"
        value={
          videoEnabled
        }
      />


      <Status
        label="Remote Users"
        value={
          remoteUserCount
        }
      />


      <Status
        label="Participants"
        value={
          participants ?? 0
        }
      />


      <Status
        label="Agora UID"
        value={
          agora?.uid || "none"
        }
      />

    </div>

  );

}


// =======================================================
// STATUS
// =======================================================

function Status({
  label,
  value
}) {

  return (

    <div
      style={{
        marginBottom: 6,
      }}
    >

      {label}:

      <strong
        style={{
          marginLeft: 8,

          color:
            value
              ? "#00d26a"
              : "#ff6b6b",
        }}
      >

        {String(value)}

      </strong>

    </div>

  );

}