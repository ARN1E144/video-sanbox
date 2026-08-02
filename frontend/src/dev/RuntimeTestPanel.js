// src/dev/RuntimeTestPanel.js

import React, {
  useState,
  useRef,
} from "react";

import {
  useRuntimeState
} from "../context/RuntimeStateContext";

import RuntimeStatusPanel from "./panels/RuntimeStatusPanel";
import CallControlsPanel from "./panels/CallControlsPanel";
import CallsPanel from "../components/call/CallsPanel";



export default function RuntimeTestPanel(){

  const runtime =
    useRuntimeState();



  // =====================================================
  // DRAGGING
  // =====================================================

  const [position,setPosition] =
    useState({

      x:
        window.innerWidth - 420,

      y:
        80

    });



  const dragRef =
    useRef({

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
  // DEBUG SNAPSHOT
  // =====================================================

  const dumpRuntime = ()=>{


    console.group(
      "FULL RUNTIME SNAPSHOT"
    );


    console.log(
      runtime.getAll()
    );


    console.groupEnd();

  };



  // =====================================================
  // UI
  // =====================================================


  return (

    <div

      style={{

        position:"fixed",

        left:position.x,

        top:position.y,

        width:420,

        maxHeight:"90vh",

        background:"#1d1d1d",

        color:"#fff",

        borderRadius:12,

        padding:16,

        zIndex:999999,

        fontFamily:"monospace",

        boxShadow:
          "0 10px 30px rgba(0,0,0,.35)",


        display:"flex",

        flexDirection:"column"

      }}

    >


      {/* HEADER */}

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



      {/* SCROLL CONTENT */}

      <div

        style={{

          overflowY:"auto",

          paddingRight:8

        }}

      >



        <RuntimeStatusPanel />



        <hr />



        <CallControlsPanel />



        <hr />



        <CallsPanel />



        <hr />



        <button

          onClick={
            dumpRuntime
          }

          style={{

            width:"100%",

            marginTop:12

          }}

        >

          Dump Runtime

        </button>



      </div>


    </div>

  );

}