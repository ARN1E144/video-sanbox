// src/hooks/useRuntimeProps.js

import {
  useRuntimeState
}
from "../context/RuntimeStateContext";

import {
  useState,
  useEffect
}
from "react";



// =====================================================
// RESOLVE SINGLE VALUE
// =====================================================

function resolveValue(
  value,
  runtime
){

  if(
    typeof value !== "string"
  ){

    return value;

  }


  const match =
    value.match(
      /^{{(.+)}}$/
    );


  if(!match){

    return value;

  }


  const path =
    match[1]
      .trim();


  return path
    .split(".")
    .reduce(
      (obj,key)=>obj?.[key],
      runtime
    );

}



// =====================================================
// RECURSIVE PROP RESOLVER
// =====================================================

function resolveProps(
  props,
  runtime
){

  if(!props)
    return {};


  const output = {};


  Object.entries(props)
    .forEach(
      ([key,value])=>{


        if(
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ){

          output[key] =
            resolveProps(
              value,
              runtime
            );

        }
        else {

          output[key] =
            resolveValue(
              value,
              runtime
            );

        }


      }
    );


  return output;

}



// =====================================================
// MAIN HOOK
// =====================================================

export function useRuntimeProps(
  props
){

  const runtimeState =
    useRuntimeState();



  const [runtime,setRuntime] =
    useState(
      runtimeState.getAll()
    );



  useEffect(()=>{


    const unsubscribe =
      runtimeState.subscribeAll(
        next=>{

          setRuntime(
            structuredClone(next)
          );

        }
      );


    return unsubscribe;


  },[
    runtimeState
  ]);



  return resolveProps(
    props,
    runtime
  );

}