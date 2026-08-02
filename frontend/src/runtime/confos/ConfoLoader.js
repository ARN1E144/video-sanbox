// =====================================================
// ConfoLoader
// -----------------------------------------------------
// Loads a Confo configuration,
// validates it,
// and returns a runtime-ready definition.
//
// Flow:
//
// ID
// ↓
// Registry
// ↓
// Validator
// ↓
// Confo Config
//
// =====================================================


import ConfoRegistry
from "../../configs/confos";

import {
  validateConfo
}
from "./ConfoValidator";



// =====================================================
// LOAD CONFO
// =====================================================

export async function loadConfo(
  confoId
){

  console.log(
    `[ConfoLoader] Loading ${confoId}`
  );


  // -----------------------------------------------
  // Find configuration
  // -----------------------------------------------

  const confo =
    ConfoRegistry[
      confoId
    ];



  if(!confo){

    throw new Error(
      `[ConfoLoader] Confo not found: ${confoId}`
    );

  }



  // -----------------------------------------------
  // Validate
  // -----------------------------------------------

  const validation =
    validateConfo(
      confo
    );



  if(!validation.valid){

    console.error(
      "[ConfoLoader] Validation failed",
      validation.errors
    );


    throw new Error(
      `Invalid Confo: ${confoId}`
    );

  }



  if(validation.warnings.length){

    console.warn(
      "[ConfoLoader] Warnings",
      validation.warnings
    );

  }



  // -----------------------------------------------
  // Prepare runtime object
  // -----------------------------------------------

  return {

    ...confo,

    loadedAt:
      Date.now(),

    status:
      "ready"

  };

}