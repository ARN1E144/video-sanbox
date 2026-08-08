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

  const handlers = {};

  actions.forEach(action => {

    if(!action?.name){
      return;
    }

    handlers[action.name] =
      (...args) => {

        return runAction(
          action.name,
          ...args
        );

      };

  });

  return handlers;

}


// =====================================================
// TREE ELEMENT RENDERER
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


  const children =
    Array.isArray(
      element.children
    )
      ? element.children
      : [];


  console.log(
    "[ConfoElementRenderer]",
    element.type,
    element.id,
    props
  );


  return (

    <Component

      id={element.id}

      {...props}

      actions={actions}

    >

      {
        children.map(
          child => (

            <ConfoElementRenderer

              key={child.id}

              element={child}

            />

          )
        )
      }

    </Component>

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


  /*
  =====================================================
  CONFO TREE
  =====================================================
  */

  if(!config.tree){

    console.warn(
      "[ConfoRenderer] No tree found",
      config
    );

    return null;

  }


  return (

    <ConfoElementRenderer

      element={
        config.tree
      }

    />

  );

}