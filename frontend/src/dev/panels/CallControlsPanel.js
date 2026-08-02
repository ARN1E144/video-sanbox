// src/dev/panels/CallControlsPanel.js

import React from "react";

import {
  useActionContext
} from "../../context/ActionContext";

import {
  useRuntimeValue
} from "../../hooks/useRuntimeValue";


export default function CallControlsPanel(){

  const {
    runRuntimeAction
  } = useActionContext();



  const callId =
    useRuntimeValue(
      "call.id"
    );



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




  return (

    <div>


      <h4>
        Call Controls
      </h4>



      <ControlButton
        label="Start Call"
        onClick={()=>
          run(
            "call.startCall",
            {
              recipientId:null
            }
          )
        }
      />



      <ControlButton
        label="Accept Call"
        onClick={()=>
          run(
            "call.acceptCall",
            {
              callId
            }
          )
        }
      />



      <ControlButton
        label="Join Call"
        onClick={()=>
          run(
            "call.joinCall"
          )
        }
      />



      <ControlButton
        label="Toggle Mic"
        onClick={()=>
          run(
            "call.toggleMic"
          )
        }
      />



      <ControlButton
        label="Toggle Video"
        onClick={()=>
          run(
            "call.toggleVideo"
          )
        }
      />



      <ControlButton
        label="Leave Call"
        onClick={()=>
          run(
            "call.leaveCall"
          )
        }
      />



      <ControlButton
        label="End Call"
        onClick={()=>
          run(
            "call.endCall"
          )
        }
      />



      <ControlButton
        label="Fetch Available Calls"
        onClick={()=>
          run(
            "call.fetchAvailableCalls"
          )
        }
      />


    </div>

  );

}



function ControlButton({
  label,
  onClick
}){


  return (

    <button

      onClick={onClick}

      style={{

        width:"100%",

        marginBottom:8

      }}

    >

      {label}

    </button>

  );

}