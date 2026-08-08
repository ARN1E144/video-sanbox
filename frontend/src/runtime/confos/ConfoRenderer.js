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
// BUILD ACTION HANDLER
// =====================================================

function buildActionHandler(
  element,
  runAction
) {

  const action =
    element?.props?.action;

  const targetId =
    element?.props?.targetId;

  if (!action) {
    return undefined;
  }

  return (...args) => {

    console.log(
      "[CONFO ACTION]",
      {
        action,
        targetId,
        elementId: element.id,
        elementType: element.type
      }
    );

    return runAction(
      action,
      {
        targetId,
        sourceId: element.id,
        sourceType: element.type,
        args
      }
    );

  };

}

// =====================================================
// BUILD DECLARED ACTIONS
// =====================================================

function buildActions(
  actions,
  runAction
) {

  if (!Array.isArray(actions)) {
    return {};
  }

  const handlers = {};

  actions.forEach(action => {

    if (!action?.name) {
      return;
    }

    handlers[action.name] =
      (...args) => {

        console.log(
          "[CONFO DECLARED ACTION]",
          {
            action: action.name,
            trigger: action.trigger
          }
        );

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
}) {

  const {
    runAction
  } = useActionContext();

  // ---------------------------------------------------
  // RESOLVE RUNTIME PROPS
  // ---------------------------------------------------

  const props =
    useRuntimeProps(
      element.props || {}
    );

  // ---------------------------------------------------
  // LOOK UP COMPONENT
  // ---------------------------------------------------

  const registryEntry =
    componentRegistry[
      element.type
    ];

  const Component =
    registryEntry?.component;

  if (!Component) {

    console.error(
      "[ConfoElementRenderer] Missing component:",
      element.type
    );

    return null;
  }

  // ---------------------------------------------------
  // DECLARED ACTIONS
  // ---------------------------------------------------

  const declaredActions =
    buildActions(
      element.actions,
      runAction
    );

  // ---------------------------------------------------
  // PROP ACTION
  //
  // This supports:
  //
  // props: {
  //   action: "call.toggleMic",
  //   targetId: "training-video"
  // }
  // ---------------------------------------------------

  const propAction =
    buildActionHandler(
      element,
      runAction
    );

  // ---------------------------------------------------
  // CHILDREN
  // ---------------------------------------------------

  const children =
    Array.isArray(element.children)
      ? element.children
      : [];

  // ---------------------------------------------------
  // DEBUG
  // ---------------------------------------------------

  console.log(
    "[ConfoElementRenderer]",
    {
      type: element.type,
      id: element.id,
      props,
      action: props.action,
      targetId: props.targetId
    }
  );

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (

    <Component

      id={element.id}

      {...props}

      /*
      -----------------------------------------------
      DECLARED ACTIONS
      -----------------------------------------------
      */

      actions={declaredActions}

      /*
      -----------------------------------------------
      PROP ACTION
      -----------------------------------------------
      */

      onAction={propAction}

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
}) {

  if (!config) {
    return null;
  }

  console.log(
    "[ConfoRenderer]",
    config
  );

  // ---------------------------------------------------
  // CONFO TREE
  // ---------------------------------------------------

  if (!config.tree) {

    console.warn(
      "[ConfoRenderer] No tree found",
      config
    );

    return null;
  }

  return (

    <ConfoElementRenderer
      element={config.tree}
    />

  );

}