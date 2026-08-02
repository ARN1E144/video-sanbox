// src/components/runtime/AgoraFeed.js

import React, {
  useEffect,
  useRef,
  useMemo,
} from "react";

import { useActionContext } from "../../context/ActionContext";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { bindActions } from "../../utils/actionBinder";
import { useRuntimeEvents } from "../../context/RuntimeEventContext";
import { useRuntimeState } from "../../context/RuntimeStateContext";

import {
  Video,
  Square,
  Play,
  Volume,
  VolumeX,
} from "lucide-react";


export default function AgoraFeed(props) {


  const {
    id,
    meta = {},
    style = {},
    borderRadius = 12,
    objectFit = "cover",
    mirror = true,
    autoJoin = false,
    tokenEndpoint,
    ...domProps
  } = props;




  const {
    runRuntimeAction
  } = useActionContext();

  const runtimeState =
    useRuntimeState();



  const remoteUsers =
    useRuntimeValue(
      "users.remoteUsers"
    ) || {};



  const micEnabled =
    useRuntimeValue(
      "media.micEnabled"
    );



  const videoEnabled =
    useRuntimeValue(
      "media.videoEnabled"
    );



  const channel =
    useRuntimeValue(
      "call.channel"
    );



  const uid =
    useRuntimeValue(
      "user.id"
    );




  const localRef =
    useRef(null);



  const remoteRef =
    useRef(null);







  /*
  ============================================
  REMOTE VIDEO
  ============================================
  */


  useEffect(()=>{


    const users =
      Object.values(remoteUsers);


    const first =
      users[0];



    if(
      !first?.videoTrack ||
      !remoteRef.current
    ){

      return;

    }



    first.videoTrack.play(
      remoteRef.current
    );



  },[
    remoteUsers
  ]);







  /*
  ============================================
  LOCAL VIDEO EVENT
  ============================================
  */


  useEffect(()=>{

    if(!localRef.current) return;


    const agora =
    runtimeState.agora;


    if(!agora) return;


    agora.onLocalTrackReady = (track)=>{

    console.log(
      "[AGORAFEED] local track ready",
      track
    );


    track.play(
      localRef.current
    );

    };


    return ()=>{

    agora.onLocalTrackReady=null;

    };


    },[]);








  /*
  ============================================
  AUTO JOIN
  ============================================
  */


  useEffect(()=>{


    if(
      !autoJoin ||
      !channel
    ){

      return;

    }



    runRuntimeAction(
      "call.joinCall",
      {
        channel,
        tokenEndpoint:
          meta.tokenEndpoint ||
          tokenEndpoint
      }
    );



    return ()=>{

      runRuntimeAction(
        "call.leaveCall"
      );

    };


  },[
    autoJoin,
    channel
  ]);









  const handleAction =
    (actionName)=>{


      runRuntimeAction(
        actionName,
        {
          channel,
          uid,
          targetId:id
        }
      );


    };







  const videoActions =
    useMemo(
      ()=>[
        "call.joinCall",
        "call.leaveCall",
        "call.toggleVideo",
        "call.toggleMic",
      ],
      []
    );




  const iconMap = {

    "call.joinCall":
      Video,


    "call.leaveCall":
      Square,


    "call.toggleVideo":
      Play,


    "call.toggleMic":
      micEnabled
        ? Volume
        : VolumeX,

  };




  const hasRemote =
    Object.keys(
      remoteUsers
    ).length > 0;







  console.log(
    "[AGORAFEED DOM PROPS]",
    domProps
  );







  return (

    <div
      {...bindActions(meta,null,id)}
      {...domProps}
      style={{
        ...style,
        width:"100%",
        height:"100%",
        position:"relative",
        background:"#000",
        overflow:"hidden",
        borderRadius,
      }}
    >



      <div
        ref={remoteRef}
        style={{
          width:"100%",
          height:"100%",
          objectFit
        }}
      />





      <div
        style={{
          position:"absolute",
          bottom:"4%",
          right:"4%",
          width:"25%",
          height:"25%",
          background:"#000",
          border:"1px solid #333",
          borderRadius:8,
          overflow:"hidden",
        }}
      >


        <div
          ref={localRef}
          style={{
            width:"100%",
            height:"100%",
            transform:
              mirror
              ? "scaleX(-1)"
              : "none",
          }}
        />



        {!videoEnabled &&
          <div
            style={{
              position:"absolute",
              inset:0,
              color:"#fff"
            }}
          >
            Camera off
          </div>
        }


      </div>






      {!hasRemote &&
        <div
          style={{
            position:"absolute",
            inset:0,
            color:"#fff"
          }}
        >
          Waiting for participant
        </div>
      }







      <div
        style={{
          position:"absolute",
          bottom:8,
          left:8,
          display:"flex",
          gap:8,
          background:"rgba(0,0,0,.6)",
          padding:6,
          borderRadius:8,
        }}
      >


      {
        videoActions.map(action=>{


          const Icon =
            iconMap[action];


          if(!Icon)
            return null;



          return (

            <button
              key={`${id}-${action}`}
              onClick={()=>
                handleAction(action)
              }
              style={{
                color:"white"
              }}
            >

              <Icon size={14}/>

            </button>

          );


        })
      }


      </div>




    </div>

  );


}