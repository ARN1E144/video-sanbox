// =====================================================
// ConfoRenderer
// -----------------------------------------------------
// Converts Confo JSON configuration into React UI.
//
// Flow:
//
// Confo Config
//      ↓
// elements[]
//      ↓
// ConfoElementRenderer
//      ↓
// ComponentRegistry
//      ↓
// React Components
//
// =====================================================


import {
    use,
  useEffect,
  useState
} from "react";


import {
  componentRegistry
}
from "../../actions/componentRegistry";


import {
  useActionContext
}
from "../../context/ActionContext";


import {
 useRuntimeProps
}
from "../../hooks/useRuntimeProps";

import ConfoNodeRenderer from "../../components/confo/ConfoNodeRenderer";






// =====================================================
// ACTION BUILDER
// =====================================================

function buildActions(
  actions,
  runAction
){

  if(
    !Array.isArray(actions)
  ){

    return {};

  }


  const handlers = {};



  actions.forEach(
    action=>{

      handlers[action.name] =
        (...args)=>{

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
// SINGLE ELEMENT
// =====================================================

function ConfoElementRenderer({

  element

}){


  const {
    runAction
  } =
  useActionContext();



  const registryEntry =
    componentRegistry[
      element.type
    ];



  const Component =
    registryEntry?.component;



  const props =
    useRuntimeProps(
      element.props
    );



  if(!Component){

    console.error(
      `[ConfoRenderer] Missing component ${element.type}`
    );

    return null;

  }



  const actions =
    buildActions(
      element.actions,
      runAction
    );



  console.log(
    "[ConfoElement PROPS]",
    element.id,
    props
  );



  return (

    <Component

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




// =====================================================
// MAIN COMPONENT
// =====================================================


export default function ConfoRenderer({
    config
}){

    if(!config){
        return null;
    }


    console.log(
        "[ConfoRenderer]",
        config
    );


    return (

        <ConfoNodeRenderer
            node={config}
        />

    );

}