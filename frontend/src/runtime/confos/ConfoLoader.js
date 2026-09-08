// src/runtime/confo/ConfoLoader.js

import ContractValidator
  from "../contracts/ContractValidator.js";

import RuntimeGraphValidator
  from "../contracts/RuntimeGraphValidator.js";

import {
  validateRuntimeTriggers
} from "./ConfoRuntimeTriggerLoader.js";


export default class ConfoLoader {

  constructor() {}

  /*
  =====================================================
  LOAD CONFO
  =====================================================
  */

  load(confo) {

    console.log(
      "[ConfoLoader] Loading",
      confo?.name
    );


    /*
    ===================================================
    1. BASIC CONFO VALIDATION
    ===================================================
    */

    const basicValidation =
      this.validateBasicConfo(
        confo
      );


    if (!basicValidation.valid) {

      return basicValidation;

    }


    /*
    ===================================================
    2. EXTRACT COMPONENTS
    ===================================================
    */

    const components =
      this.flattenTree(
        confo.tree
      );


    /*
    ===================================================
    3. COMPONENT CONTRACT VALIDATION
    ===================================================
    */

    const componentValidation =
      this.validateComponents(
        components
      );


    if (!componentValidation.valid) {

      return componentValidation;

    }


    /*
    ===================================================
    4. RUNTIME TRIGGER VALIDATION
    ===================================================

    This validates:

    confo.runtime.triggers

    but does NOT register them.

    Registration belongs to the React runtime bridge.
    ===================================================
    */

    const triggerValidation =
      validateRuntimeTriggers(
        confo
      );


    if (!triggerValidation.valid) {

      console.error(
        "[ConfoLoader] Runtime trigger validation failed",
        triggerValidation.errors
      );


      return {

        valid: false,

        errors:
          triggerValidation.errors

      };

    }


    /*
    ===================================================
    5. RUNTIME GRAPH VALIDATION
    ===================================================
    */

    const graphResult =
      RuntimeGraphValidator.validate(
        confo
      );


    if (!graphResult.valid) {

      return graphResult;

    }


    /*
    ===================================================
    6. SUCCESS
    ===================================================
    */

    console.log(
      "[ConfoLoader] Confo loaded successfully",
      {
        id: confo.id,
        name: confo.name,
        components: components.length,
        runtimeTriggers:
          confo.runtime?.triggers?.length || 0
      }
    );


    return {

      valid: true,

      errors: [],

      confo

    };

  }


  /*
  =====================================================
  BASIC VALIDATION
  =====================================================
  */

  validateBasicConfo(confo) {

    if (!confo) {

      return {

        valid: false,

        errors: [
          "Confo is undefined."
        ]

      };

    }


    if (!confo.name) {

      return {

        valid: false,

        errors: [
          "Missing confo.name"
        ]

      };

    }


    if (
      confo.type &&
      confo.type !== "confo"
    ) {

      return {

        valid: false,

        errors: [
          "Invalid confo.type. Expected 'confo'."
        ]

      };

    }


    if (!confo.tree) {

      return {

        valid: false,

        errors: [
          "Missing confo.tree"
        ]

      };

    }


    return {

      valid: true,

      errors: []

    };

  }


  /*
  =====================================================
  COMPONENT VALIDATION
  =====================================================
  */

  validateComponents(
    components
  ) {

    const errors = [];


    components.forEach(
      component => {

        const result =
          ContractValidator.validateComponent(
            component.type
          );


        if (!result.valid) {

          errors.push(
            ...result.errors.map(
              error =>
                `${component.id || component.type}: ${error}`
            )
          );

        }

      }
    );


    return {

      valid:
        errors.length === 0,

      errors

    };

  }


  /*
  =====================================================
  FLATTEN TREE
  =====================================================
  */

  flattenTree(
    node,
    result = []
  ) {

    if (!node) {

      return result;

    }


    /*
    -----------------------------------------------
    ADD CURRENT COMPONENT
    -----------------------------------------------
    */

    if (node.type) {

      result.push(
        node
      );

    }


    /*
    -----------------------------------------------
    PROCESS CHILDREN
    -----------------------------------------------
    */

    if (
      Array.isArray(
        node.children
      )
    ) {

      node.children.forEach(
        child => {

          this.flattenTree(
            child,
            result
          );

        }
      );

    }


    return result;

  }

}