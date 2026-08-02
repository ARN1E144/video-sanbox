// src/dev/panels/RuntimeStatusPanel.js

import React from "react";

import {
  useRuntimeValue
} from "../../hooks/useRuntimeValue";

import {
  useRuntimeState
} from "../../context/RuntimeStateContext";


export default function RuntimeStatusPanel(){

  const runtime =
    useRuntimeState();


  const runtimeReady =
    runtime.runtimeReady;


  const agora =
    runtime.agora;



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


  const micEnabled =
    useRuntimeValue(
      "media.micEnabled"
    );


  const videoEnabled =
  useRuntimeValue(
    "media.videoEnabled"
  );


  const participants =
    useRuntimeValue(
      "call.participants"
    );


  const remoteUsers =
    useRuntimeValue(
      "call.remoteUsers"
    );

    console.log(
        "%c🔥 NEW RuntimeStatusPanel loaded",
        "color: #FF5722; font-weight: bold; font-size: 13px;"
        );
    
    console.log(
    "🔥 STATUS VALUES",
    {
        joined,
        micEnabled,
        videoEnabled,
        runtime: runtime.getAll()
    }
    );


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
        value={callId || "none"}
      />


      <Status
        label="Channel"
        value={channel || "none"}
      />


      <Status
        label="State"
        value={state || "idle"}
      />


      <Status
        label="Joined"
        value={joined}
      />


      <Status
        label="Mic Enabled"
        value={micEnabled}
      />


      <Status
        label="Video Enabled"
        value={videoEnabled}
      />


      <Status
        label="Remote Users"
        value={
          remoteUsers?.length || 0
        }
      />


      <Status
        label="Participants"
        value={
          participants?.length || 0
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



function Status({
  label,
  value
}){


  return (

    <div
      style={{
        marginBottom:6
      }}
    >

      {label}:

      <strong

        style={{

          marginLeft:8,

          color:
            value
              ? "#00d26a"
              : "#ff6b6b"

        }}

      >

        {String(value)}

      </strong>


    </div>

  );

}