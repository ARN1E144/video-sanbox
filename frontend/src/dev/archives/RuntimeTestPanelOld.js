// src/dev/RuntimeTestPanel.js

import React, {
  useState,
  useRef,
} from "react";

import { useActionContext } from "../context/ActionContext";
import { useRuntimeValue } from "../hooks/useRuntimeValue";
import { useRuntimeState } from "../context/RuntimeStateContext";
import CallsPanel from "../components/call/CallsPanel";


export default function RuntimeTestPanel() {

  const runtime = useRuntimeState();

  const {
    runRuntimeAction
  } = useActionContext();



  // =====================================================
  // DRAGGING
  // =====================================================

  const [position,setPosition] = useState({

    x:
      window.innerWidth - 390,

    y:
      window.innerHeight - 620

  });



  const dragRef = useRef({

    dragging:false,

    offsetX:0,

    offsetY:0

  });



  const handleDragStart = (e)=>{


    dragRef.current.dragging = true;


    dragRef.current.offsetX =
      e.clientX - position.x;


    dragRef.current.offsetY =
      e.clientY - position.y;



    document.addEventListener(
      "pointermove",
      handleDragging
    );


    document.addEventListener(
      "pointerup",
      handleDragEnd
    );

  };



  const handleDragging = (e)=>{


    if(
      !dragRef.current.dragging
    ){
      return;
    }



    setPosition({

      x:
        e.clientX -
        dragRef.current.offsetX,


      y:
        e.clientY -
        dragRef.current.offsetY

    });


  };



  const handleDragEnd = ()=>{


    dragRef.current.dragging = false;



    document.removeEventListener(
      "pointermove",
      handleDragging
    );


    document.removeEventListener(
      "pointerup",
      handleDragEnd
    );


  };





  // =====================================================
  // RUNTIME
  // =====================================================

  const runtimeReady =
    runtime.runtimeReady;



  const agora =
    runtime.agora;



  // =====================================================
  // CALL STATE
  // =====================================================

  const callId =
    useRuntimeValue(
      "call.id"
    );


  const callChannel =
    useRuntimeValue(
      "call.channel"
    );


  const callState =
    useRuntimeValue(
      "call.state"
    );


  const joined =
    useRuntimeValue(
      "call.joined"
    );


  const micMuted =
    useRuntimeValue(
      "call.micMuted"
    );


  const videoEnabled =
    useRuntimeValue(
      "call.videoEnabled"
    );





  // =====================================================
  // ACTION RUNNER
  // =====================================================

  const run = async(
    action,
    params={}
  )=>{


    console.group(
      `▶ ${action}`
    );


    try{


      const result =
        await runRuntimeAction(
          action,
          params
        );


      console.log(
        "Result:",
        result
      );


      return result;


    }
    catch(err){


      console.error(
        err
      );


    }
    finally{


      console.groupEnd();


    }

  };






  // =====================================================
  // SNAPSHOT
  // =====================================================

  const snapshotRuntime = ()=>{


    return {


      runtimeReady,


      call:{


        id:
          callId ?? null,


        channel:
          callChannel ?? null,


        state:
          callState ?? "idle",


        joined:
          joined ?? false,


        micMuted:
          micMuted ?? false,


        videoEnabled:
          videoEnabled ?? false,


      },



      agora:{


        uid:
          agora?.uid ?? null,


        localAudioTrack:
          !!agora?.localAudioTrack,


        localVideoTrack:
          !!agora?.localVideoTrack


      }


    };


  };






  // =====================================================
  // CLEANUP VALIDATION
  // =====================================================

  const validateCleanup = ()=>{


  const snapshot =
    snapshotRuntime();


  const runtimePassed =

    snapshot.call.id === null &&

    snapshot.call.channel === null &&

    snapshot.call.state === "idle" &&

    snapshot.call.joined === false &&

    snapshot.call.micMuted === false &&

    snapshot.call.videoEnabled === false;



  const agoraPassed =

    snapshot.agora.uid === null &&

    snapshot.agora.localAudioTrack === false &&

    snapshot.agora.localVideoTrack === false;



  const passed =
    runtimePassed &&
    agoraPassed;



  console.group(
    passed
      ? "✅ RUNTIME CLEANUP PASSED"
      : "❌ RUNTIME CLEANUP FAILED"
  );


  console.log(snapshot);


  console.log({
    runtimePassed,
    agoraPassed
  });


  console.groupEnd();

};

  const callUid =
  useRuntimeValue(
    "call.uid"
  );

  
  console.log(
    "CALL STATE:",
    runtime.get("call")
  );

  console.log(
      "JOINED:",
      runtime.get("call.joined")
  );

    // =====================================================
  // CALL DISCOVERY
  // =====================================================

    const calls =
    useRuntimeValue("calls");


    const availableCalls =
    useRuntimeValue("calls.available");

    console.log(
        "AVAILABLE CALLS:",
        availableCalls
    );



  // =====================================================
  // UI
  // =====================================================

  return (


    <div

      style={{

        position:"fixed",


        left:position.x,


        top:position.y,


        width:360,


        background:"#1d1d1d",


        color:"#fff",


        borderRadius:12,


        padding:16,


        zIndex:999999,


        fontFamily:"monospace",


        boxShadow:
          "0 10px 30px rgba(0,0,0,.35)"

      }}

    >



      <div

        onPointerDown={
          handleDragStart
        }

        style={{

          cursor:"move",

          userSelect:"none",

          fontWeight:"bold",

          marginBottom:12

        }}

      >

        Runtime Test Panel

      </div>




      <Status
        label="Runtime Ready"
        value={runtimeReady}
      />


      <Status
        label="Call ID"
        value={callId ?? "none"}
      />


      <Status
        label="Channel"
        value={callChannel ?? "none"}
      />


      <Status
        label="State"
        value={callState ?? "idle"}
      />


      <Status
        label="Joined"
        value={joined ?? false}
      />


      <Status
        label="Mic Enabled"
        value={micMuted ?? false}
      />


      <Status
        label="Video Enabled"
        value={videoEnabled ?? false}
      />
      
      <Status
        label="Available Calls"
        value={
            availableCalls?.length ?? 0
        }
      />

      <Status
        label="Call UID"
        value={callUid ?? "none"}
      />


      <hr />



      <Status
        label="Agora UID"
        value={agora?.uid ?? null}
      />


      <Status
        label="Audio Track"
        value={!!agora?.localAudioTrack}
      />


      <Status
        label="Video Track"
        value={!!agora?.localVideoTrack}
      />




      <div

        style={{

          display:"grid",

          gap:8,

          marginTop:16

        }}

      >



        <button
          onClick={() =>
            console.log(
              "[FULL SNAPSHOT]",
              snapshotRuntime()
            )
          }
        >
          Dump Runtime
        </button>




        <button
          onClick={() =>
            run(
              "call.startCall",
              {

                appId:
                  process.env.REACT_APP_AGORA_APP_ID,


                channel:
                  "test-room",


                token:null,


                uid:null

              }
            )
          }
        >
          Start Call
        </button>




        <button
          onClick={() =>
            run(
              "call.joinCall",
              {

                channel:
                  "test-room",


                token:null,


                uid:
                  "test-user"

              }
            )
          }
        >
          Join Call
        </button>




        <button
          onClick={() =>
            run(
              "call.toggleMic"
            )
          }
        >
          Toggle Mic
        </button>




        <button
          onClick={() =>
            run(
              "call.toggleVideo"
            )
          }
        >
          Toggle Video
        </button>




        <button
          onClick={() =>
            run(
              "call.leaveCall"
            )
          }
        >
          Leave Meeting
        </button>




        <button
          onClick={() =>
            run(
              "call.endCall"
            )
          }
        >
          End Meeting
        </button>




        <button
          onClick={
            validateCleanup
          }
        >
          Validate Cleanup
        </button>

        <button
              onClick={() =>
                run(
                  "call.fetchAvailableCalls"
                )
              }
            >
              Fetch Available Calls
            </button>

            <button
              onClick={() =>
                run(
                  "call.acceptCall",
                  {
                    callId
                      : callId
                  }
                )
              }
            >
              Accept Call
      </button>

      <div
        style={{
          marginTop: 20,
          borderTop: "1px solid #444",
          paddingTop: 12,
        }}
      >
        <h3 style={{ marginBottom: 8 }}>
          Available Calls ({availableCalls?.length ?? 0})
        </h3>

        <div
          style={{
            maxHeight: 250,
            overflowY: "auto",
            border: "1px solid #333",
            borderRadius: 8,
            padding: 8,
            background: "#151515",
          }}
        >
          <CallsPanel />
        </div>
      </div>



      </div>



    </div>


  );


}




// =====================================================
// STATUS COMPONENT
// =====================================================

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