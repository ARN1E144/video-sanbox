// src/runtime/confo/ConfoRuntimeTriggerLoader.js

import { getActionByValue } from "../../actions/getActionByValue.js";

/*
=====================================================
UTILITY
=====================================================
*/

function getValue(source, path) {
  if (!path) {
    return undefined;
  }

  return path
    .split(".")
    .reduce(
      (value, key) => value?.[key],
      source
    );
}


/*
=====================================================
CONDITION BUILDER
=====================================================

Confo JSON uses declarative conditions:

{
  "source": "payload",
  "path": "evidenceId",
  "operator": "exists"
}

RuntimeTriggersContext expects:

({ state, payload, meta }) => boolean

This function performs that conversion.
=====================================================
*/

function buildCondition(condition = {}) {

  if (!condition) {
    return () => true;
  }

  if (typeof condition === "function") {
    console.warn(
      "[ConfoRuntimeTriggerLoader] Functions are not allowed in Confo JSON conditions"
    );

    return () => false;
  }

  const {
    source = "payload",
    path,
    operator = "exists",
    value
  } = condition;


  return ({
    state,
    payload,
    meta
  }) => {

    const sources = {
      state,
      payload,
      meta
    };

    const sourceObject =
      sources[source];

    const actualValue =
      getValue(
        sourceObject,
        path
      );


    switch (operator) {

      /*
      ---------------------------------------------
      EXISTS
      ---------------------------------------------
      */

      case "exists":

        return (
          actualValue !== undefined &&
          actualValue !== null
        );


      /*
      ---------------------------------------------
      EQUALS
      ---------------------------------------------
      */

      case "equals":

        return actualValue === value;


      /*
      ---------------------------------------------
      NOT EQUALS
      ---------------------------------------------
      */

      case "notEquals":

        return actualValue !== value;


      /*
      ---------------------------------------------
      TRUTHY
      ---------------------------------------------
      */

      case "truthy":

        return Boolean(actualValue);


      /*
      ---------------------------------------------
      FALSY
      ---------------------------------------------
      */

      case "falsy":

        return !actualValue;


      /*
      ---------------------------------------------
      CONTAINS
      ---------------------------------------------
      */

      case "contains":

        if (Array.isArray(actualValue)) {

          return actualValue.includes(value);

        }

        if (typeof actualValue === "string") {

          return actualValue.includes(
            String(value)
          );

        }

        return false;


      /*
      ---------------------------------------------
      UNKNOWN OPERATOR
      ---------------------------------------------
      */

      default:

        console.warn(
          "[ConfoRuntimeTriggerLoader] Unsupported condition operator",
          {
            operator,
            condition
          }
        );

        return false;

    }

  };

}


/*
=====================================================
VALIDATE SINGLE TRIGGER
=====================================================
*/

function validateTrigger(trigger) {

  const errors = [];


  if (!trigger || typeof trigger !== "object") {

    return [
      "Runtime trigger must be an object"
    ];

  }


  /*
  ---------------------------------------------
  ID
  ---------------------------------------------
  */

  if (!trigger.id) {

    errors.push(
      "Runtime trigger is missing id"
    );

  }


  /*
  ---------------------------------------------
  EVENT
  ---------------------------------------------
  */

  if (
    !trigger.event ||
    typeof trigger.event !== "string"
  ) {

    errors.push(
      `${trigger.id || "Runtime trigger"} is missing event`
    );

  }


  /*
  ---------------------------------------------
  ACTIONS
  ---------------------------------------------
  */

  if (
    !Array.isArray(trigger.actions) ||
    trigger.actions.length === 0
  ) {

    errors.push(
      `${trigger.id || "Runtime trigger"} must contain at least one action`
    );

  }


  /*
  ---------------------------------------------
  ACTION REGISTRY VALIDATION
  ---------------------------------------------
  */

  if (Array.isArray(trigger.actions)) {

    trigger.actions.forEach(action => {

      if (
        typeof action !== "string"
      ) {

        errors.push(
          `${trigger.id || "Runtime trigger"} contains an invalid action reference`
        );

        return;

      }

      const registeredAction =
        getActionByValue(action);

      if (!registeredAction) {

        errors.push(
          `${trigger.id || "Runtime trigger"} references unknown action: ${action}`
        );

      }

    });

  }


  /*
  ---------------------------------------------
  CONDITION
  ---------------------------------------------
  */

  if (trigger.condition !== undefined) {

    if (
      !trigger.condition ||
      typeof trigger.condition !== "object" ||
      Array.isArray(trigger.condition)
    ) {

      errors.push(
        `${trigger.id || "Runtime trigger"} condition must be a declarative object`
      );

    } else {

      const supportedOperators = [
        "exists",
        "equals",
        "notEquals",
        "truthy",
        "falsy",
        "contains"
      ];

      const operator =
        trigger.condition.operator ||
        "exists";

      if (
        !supportedOperators.includes(
          operator
        )
      ) {

        errors.push(
          `${trigger.id || "Runtime trigger"} uses unsupported condition operator: ${operator}`
        );

      }


      const source =
        trigger.condition.source ||
        "payload";

      const supportedSources = [
        "payload",
        "state",
        "meta"
      ];

      if (
        !supportedSources.includes(
          source
        )
      ) {

        errors.push(
          `${trigger.id || "Runtime trigger"} uses unsupported condition source: ${source}`
        );

      }

    }

  }


  return errors;

}


/*
=====================================================
VALIDATE ALL RUNTIME TRIGGERS
=====================================================
*/

export function validateRuntimeTriggers(
  confo
) {

  const triggers =
    confo?.runtime?.triggers || [];


  if (!Array.isArray(triggers)) {

    return {
      valid: false,
      errors: [
        "confo.runtime.triggers must be an array"
      ]
    };

  }


  const errors = [];


  triggers.forEach(trigger => {

    errors.push(
      ...validateTrigger(trigger)
    );

  });


  return {
    valid: errors.length === 0,
    errors
  };

}


/*
=====================================================
CREATE RUNTIME TRIGGER
=====================================================

Converts declarative Confo trigger into the
format RuntimeTriggersContext understands.
=====================================================
*/

export function createRuntimeTrigger(
  trigger
) {

  const errors =
    validateTrigger(trigger);


  if (errors.length) {

    throw new Error(
      errors.join("; ")
    );

  }


  return {

    id: trigger.id,

    name:
      trigger.name ||
      trigger.id,

    event:
      trigger.event,

    condition:
      buildCondition(
        trigger.condition
      ),

    actions:
      trigger.actions,

    meta: {

      source: "confo",

      triggerId:
        trigger.id

    }

  };

}


/*
=====================================================
REGISTER CONFO RUNTIME TRIGGERS
=====================================================
*/

export function registerConfoRuntimeTriggers(
  confo,
  registerTrigger
) {

  if (
    typeof registerTrigger !==
    "function"
  ) {

    throw new Error(
      "registerConfoRuntimeTriggers requires registerTrigger()"
    );

  }


  const triggers =
    confo?.runtime?.triggers || [];


  if (!Array.isArray(triggers)) {

    throw new Error(
      "confo.runtime.triggers must be an array"
    );

  }


  const unregisters = [];


  triggers.forEach(trigger => {

    const runtimeTrigger =
      createRuntimeTrigger(
        trigger
      );


    const unregister =
      registerTrigger(
        runtimeTrigger
      );


    if (
      typeof unregister ===
      "function"
    ) {

      unregisters.push(
        unregister
      );

    }


    console.log(
      "[ConfoRuntimeTriggers] Registered",
      {
        id: trigger.id,
        name: trigger.name,
        event: trigger.event,
        actions: trigger.actions
      }
    );

  });


  /*
  ---------------------------------------------
  RETURN CLEANUP FUNCTION
  ---------------------------------------------
  */

  return () => {

    unregisters.forEach(
      unregister => {

        try {

          unregister?.();

        } catch (err) {

          console.warn(
            "[ConfoRuntimeTriggers] Failed to unregister trigger",
            err
          );

        }

      }
    );


    console.log(
      "[ConfoRuntimeTriggers] Unregistered",
      {
        confo:
          confo?.id ||
          confo?.name
      }
    );

  };

}


export default {
  validateRuntimeTriggers,
  createRuntimeTrigger,
  registerConfoRuntimeTriggers
};