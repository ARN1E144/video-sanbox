import React from "react";

import {
  componentRegistry
} from "../../actions/componentRegistry";

import {
  useActionContext
} from "../../context/ActionContext";

import {
  useRuntimeProps
} from "../../hooks/useRuntimeProps";




// =====================================================
// ACTION BUILDER
// =====================================================

function buildActions(
  actions,
  runAction
){

  if(!Array.isArray(actions)){
    return {};
  }


  const handlers={};


  actions.forEach(action=>{

    handlers[action.name] =
      (...args)=>{

        runAction(
          action.name,
          ...args
        );

      };

  });


  return handlers;

}




// =====================================================
// ELEMENT RENDERER
// =====================================================

function ConfoElementRenderer({
  element
}){


  const {
    runAction
  } =
  useActionContext();



  const props =
    useRuntimeProps(
      element.props || {}
    );



  const registryEntry =
    componentRegistry[
      element.type
    ];



  const Component =
    registryEntry?.component;



  if(!Component){

    console.error(
      "[ConfoElementRenderer] Missing component:",
      element.type
    );

    return null;

  }



  const actions =
    buildActions(
      element.actions,
      runAction
    );



  console.log(
    "[ConfoElementRenderer]",
    element.type,
    props
  );



  return (

    <Component

      id={element.id}

      {...props}

      actions={actions}

    />

  );

}





// =====================================================
// MAIN CONFO RENDERER
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



 if(!Array.isArray(config.elements)){

   console.warn(
     "[ConfoRenderer] No elements found",
     config
   );

   return null;

 }



 return (

   <>

   {
    config.elements.map(
      element=>(

        <ConfoElementRenderer

          key={element.id}

          element={element}

        />

      )
    )
   }

   </>

 );

}