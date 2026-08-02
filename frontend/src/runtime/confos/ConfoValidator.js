// =====================================================
// ConfoValidator
// -----------------------------------------------------
// Validates a Confo before it is loaded into the runtime.
//
// Returns:
//
// {
//    valid: true,
//    errors: [],
//    warnings: []
// }
//
// =====================================================

import componentRegistry
from "../../actions/componentRegistry";

import {
  getActionByValue,
}
from "../../actions/getActionByValue";


// =====================================================
// VALIDATE
// =====================================================

export function validateConfo(confo) {

  const errors = [];
  const warnings = [];

  // ===================================================
  // BASIC
  // ===================================================

  if (!confo) {

    errors.push(
      "Confo is undefined."
    );

    return {
      valid: false,
      errors,
      warnings,
    };

  }

  if (!confo.id) {

    errors.push(
      "Missing confo.id"
    );

  }

  if (!confo.name) {

    warnings.push(
      "Missing confo.name"
    );

  }

  if (!confo.version) {

    warnings.push(
      "Missing confo.version"
    );

  }

  if (confo.type !== "confo") {

    errors.push(
      `Invalid type '${confo.type}'. Expected 'confo'.`
    );

  }

  // ===================================================
  // CAPABILITIES
  // ===================================================

  validateCapabilities(
    confo.capabilities,
    errors,
    warnings
  );

  // ===================================================
  // ELEMENTS
  // ===================================================

  validateElements(
    confo.elements,
    errors,
    warnings
  );

  return {

    valid:
      errors.length === 0,

    errors,

    warnings,

  };

}



// =====================================================
// CAPABILITIES
// =====================================================

function validateCapabilities(
  capabilities,
  errors,
  warnings
) {

  if (!capabilities) {

    warnings.push(
      "Missing capabilities."
    );

    return;

  }

  if (
    typeof capabilities.maxParticipants !==
    "number"
  ) {

    warnings.push(
      "capabilities.maxParticipants should be a number."
    );

  }

  if (
    capabilities.roles &&
    !Array.isArray(
      capabilities.roles
    )
  ) {

    errors.push(
      "capabilities.roles must be an array."
    );

  }

}



// =====================================================
// ELEMENTS
// =====================================================

function validateElements(
  elements,
  errors,
  warnings
) {

  if (!Array.isArray(elements)) {

    errors.push(
      "elements must be an array."
    );

    return;

  }

  const ids =
    new Set();

  elements.forEach(
    (element, index) => {

      // -----------------------------------------------
      // ID
      // -----------------------------------------------

      if (!element.id) {

        errors.push(
          `Element ${index} is missing an id.`
        );

      }

      if (
        ids.has(
          element.id
        )
      ) {

        errors.push(
          `Duplicate element id '${element.id}'.`
        );

      }

      ids.add(
        element.id
      );

      // -----------------------------------------------
      // TYPE
      // -----------------------------------------------

      if (!element.type) {

        errors.push(
          `${element.id}: Missing component type.`
        );

      }
      else if (
        !componentRegistry[
          element.type
        ]
      ) {

        errors.push(
          `${element.id}: Unknown component '${element.type}'.`
        );

      }

      // -----------------------------------------------
      // ACTIONS
      // -----------------------------------------------

      if (
        Array.isArray(
          element.actions
        )
      ) {

        element.actions.forEach(
          (action) => {

            if (!action.name) {

              errors.push(
                `${element.id}: Action missing name.`
              );

              return;

            }

            const registered =
              getActionByValue(
                action.name
              );

            if (!registered) {

              errors.push(
                `${element.id}: Unknown action '${action.name}'.`
              );

            }

          }
        );

      }

      // -----------------------------------------------
      // RUNTIME PLACEHOLDERS
      // -----------------------------------------------

      validateRuntimeBindings(
        element.props,
        element.id,
        warnings
      );

    }
  );

}



// =====================================================
// RUNTIME BINDINGS
// =====================================================

function validateRuntimeBindings(
  props,
  elementId,
  warnings
) {

  if (!props)
    return;

  Object.entries(
    props
  ).forEach(
    ([key, value]) => {

      if (
        typeof value !==
        "string"
      )
        return;

      if (
        value.startsWith(
          "{{"
        ) &&
        !value.endsWith(
          "}}"
        )
      ) {

        warnings.push(
          `${elementId}.${key}: Invalid runtime binding '${value}'.`
        );

      }

    }
  );

}