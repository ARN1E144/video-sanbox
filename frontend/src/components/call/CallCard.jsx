import React from "react";

import { useActionContext } from "../../context/ActionContext";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";


export default function CallCard({
  call
}) {

  const {
    runRuntimeAction
  } = useActionContext();


  const currentUser =
    useRuntimeValue(
      "user"
    );


  if(!call){
    return null;
  }


  const isOwner =
    call.owner?._id === currentUser?._id ||
    call.owner?.id === currentUser?.id;


  const execute = (
    action,
    params={}
  ) => {

    console.log(
      "[CallCard Action]",
      action,
      params
    );


    return runRuntimeAction(
      action,
      params
    );

  };



  /*
  =====================================================
  CALL ACTIONS
  =====================================================
  */


  const acceptCall = () => {

    execute(
      "call.acceptCall",
      {
        callId:call.id || call._id
      }
    );

  };


  const rejectCall = () => {

    execute(
      "call.rejectCall",
      {
        callId:call.id || call._id
      }
    );

  };


  const joinCall = () => {

    execute(
      "call.joinCall"
    );

  };


  const leaveCall = () => {

    execute(
      "call.leaveCall"
    );

  };


  const endCall = () => {

    execute(
      "call.endCall"
    );

  };


  const cancelCall = () => {

    execute(
      "call.cancelCall",
      {
        callId:call.id || call._id
      }
    );

  };



  /*
  =====================================================
  STATE RENDERERS
  =====================================================
  */


  const renderActions = () => {


    switch(call.state){


      case "ringing":

        /*
          If we created the call:
          show cancel

          If someone else created:
          show accept/reject
        */

        if(isOwner){

          return (
            <button
              onClick={cancelCall}
            >
              Cancel
            </button>
          );

        }


        return (
          <>
            <button
              onClick={acceptCall}
            >
              Accept
            </button>


            <button
              onClick={rejectCall}
            >
              Reject
            </button>
          </>
        );



      case "accepted":

        return (

          <button
            onClick={joinCall}
          >
            Join Call
          </button>

        );



      case "joined":

        return (

          <>

            <button
              onClick={leaveCall}
            >
              Leave
            </button>


            <button
              onClick={endCall}
            >
              End
            </button>

          </>

        );



      default:

        return null;

    }

  };



  /*
  =====================================================
  UI
  =====================================================
  */


  return (

    <div

      style={{

        border:"1px solid #ddd",

        borderRadius:12,

        padding:16,

        marginBottom:12,

        background:"#fff"

      }}

    >


      <h3>
        Video Call
      </h3>



      <p>

        Status:

        <strong>
          {" "}
          {call.state}
        </strong>

      </p>



      <p>

        Channel:

        {" "}

        {call.channel || "pending"}

      </p>



      <p>

        Participants:

        {" "}

        {call.participants?.length || 0}

      </p>



      <div

        style={{

          display:"flex",

          gap:8

        }}

      >

        {renderActions()}

      </div>


    </div>

  );

}