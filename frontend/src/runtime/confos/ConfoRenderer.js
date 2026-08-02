// =====================================================
// ConfoRenderer
// -----------------------------------------------------
// Converts a Confo JSON configuration into React UI.
//
// Flow:
//
// Confo Config
//      ↓
// elements[]
//      ↓
// ComponentRegistry
//      ↓
// React Components
//
// =====================================================


import React from "react";

import {
  componentRegistry
}
from "../../actions/componentRegistry";

import {
  useRuntimeState
}
from "../../context/RuntimeStateContext";

import {
  useActionContext
}
from "../../context/ActionContext";



// =====================================================
// RUNTIME VALUE RESOLVER
// =====================================================

function resolveRuntimeValue(
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
      .trim()
      .split(".");


  let result =
    runtime;


  for(
    const key of path
  ){

    if(
      result == null
    ){

      return undefined;

    }


    result =
      result[key];

  }


  return result;

}



// =====================================================
// RESOLVE PROPS
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
            resolveRuntimeValue(
              value,
              runtime
            );

        }


      }
    );


  return output;

}




// =====================================================
// COMPONENT ACTION WRAPPER
// =====================================================

function buildActions(
  actions,
  runAction
){

  if(!Array.isArray(actions))
    return {};


  const handlers = {};



  actions.forEach(
    action=>{


      handlers[
        action.name
      ] = (...args)=>{


        runAction(
          action.name,
          ...args
        );


      };


    }
  );


  return handlers;

}



// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ConfoRenderer({

  config

}){


  const runtimeState =
    useRuntimeState();


  const {
    runAction
  } =
    useActionContext();



  if(!config){

    return null;

  }



  const runtime =
    runtimeState.getState
      ? runtimeState.getState()
      : {};



  return (

    <>

      {
        config.elements?.map(
            element => {

                const registryEntry =
                componentRegistry[
                    element.type
                ];


                const Component =
                registryEntry?.component;


                if(!Component){

                console.error(
                    `[ConfoRenderer] Missing component ${element.type}`
                );

                return null;

                }


                const props =
                resolveProps(
                    element.props,
                    runtime
                );


                console.log(
                "%c[ConfoRenderer PROPS]%c " + element.id,
                "background-color:#DDD6FE;color:#5B21B6;font-weight:bold;",
                "",
                props
                );


                const actions =
                buildActions(
                    element.actions,
                    runAction
                );


                return (

                <Component

                    key={
                    element.id
                    }

                    id={
                    element.id
                    }

                    {...props}

                    actions={
                    actions
                    }

                />

                );

            }
            )

      }

    </>

  );

}