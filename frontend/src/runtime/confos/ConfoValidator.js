import componentRegistry
  from "../../actions/componentRegistry";

import {
  getActionByValue,
} from "../../actions/getActionByValue";

import domainRegistry
  from "../contracts/domains/domainRegistry";


// =====================================================
// CONFO VALIDATOR
// =====================================================
//
// Supports:
//
// Legacy:
//   confo.elements[]
//
// Current:
//   confo.tree
//
// The tree model is now the preferred representation.
//
// =====================================================

export function validateConfo(
  confo
) {

  const errors = [];
  const warnings = [];


  // ===================================================
  // BASIC
  // ===================================================

  if (
    !confo
  ) {

    errors.push(
      "Confo is undefined."
    );

    return {
      valid:
        false,

      errors,

      warnings,
    };

  }


  if (
    !confo.id
  ) {

    errors.push(
      "Missing confo.id"
    );

  }


  if (
    !confo.name
  ) {

    warnings.push(
      "Missing confo.name"
    );

  }


  if (
    !confo.version
  ) {

    warnings.push(
      "Missing confo.version"
    );

  }


  if (
    confo.type !==
    "confo"
  ) {

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
  // STRUCTURE
  // ===================================================
  //
  // Prefer tree.
  //
  // Legacy elements remain supported.
  //
  // ===================================================

  if (
    confo.tree
  ) {

    validateTree(
      confo.tree,
      errors,
      warnings
    );

  }
  else if (
    Array.isArray(
      confo.elements
    )
  ) {

    validateElements(
      confo.elements,
      errors,
      warnings
    );

  }
  else {

    errors.push(
      "Confo must contain either 'tree' or 'elements'."
    );

  }


  // ===================================================
  // RESULT
  // ===================================================

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

  // ---------------------------------------------------
  // Missing
  // ---------------------------------------------------

  if (
    capabilities ===
    undefined
  ) {

    warnings.push(
      "Missing capabilities."
    );

    return;

  }


  // ---------------------------------------------------
  // Current format
  //
  // capabilities: [
  //   "compliance",
  //   "video"
  // ]
  // ---------------------------------------------------

  if (
    Array.isArray(
      capabilities
    )
  ) {

    capabilities.forEach(
      capability => {

        if (
          typeof capability !==
          "string"
        ) {

          errors.push(
            "Each capability must be a string."
          );

          return;

        }


        const normalizedCapability =
          capability.trim().toLowerCase();


        if (
          !normalizedCapability
        ) {

          errors.push(
            "Capability cannot be empty."
          );

          return;

        }


        if (
          !domainRegistry[
            normalizedCapability
          ]
        ) {

          warnings.push(
            `Unknown capability '${capability}'.`
          );

        }

      }
    );

    return;

  }


  // ---------------------------------------------------
  // Legacy capability object
  //
  // Keep this temporarily so existing Confos
  // don't break.
  // ---------------------------------------------------

  if (
    typeof capabilities ===
    "object" &&
    capabilities !== null
  ) {

    if (
      capabilities.maxParticipants !==
      undefined &&
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

    return;

  }


  // ---------------------------------------------------
  // Invalid
  // ---------------------------------------------------

  errors.push(
    "capabilities must be an array."
  );

}


// =====================================================
// TREE
// =====================================================

function validateTree(
  tree,
  errors,
  warnings
) {

  if (
    !tree ||
    typeof tree !==
    "object"
  ) {

    errors.push(
      "tree must be an object."
    );

    return;

  }


  const ids =
    new Set();


  validateTreeNode(
    tree,
    "tree",
    ids,
    errors,
    warnings
  );

}


// =====================================================
// TREE NODE
// =====================================================

function validateTreeNode(
  node,
  path,
  ids,
  errors,
  warnings
) {

  if (
    !node ||
    typeof node !==
    "object"
  ) {

    errors.push(
      `${path}: Invalid tree node.`
    );

    return;

  }


  // ===================================================
  // ID
  // ===================================================

  if (
    !node.id
  ) {

    errors.push(
      `${path}: Missing element id.`
    );

  }
  else {

    if (
      ids.has(
        node.id
      )
    ) {

      errors.push(
        `${path}: Duplicate element id '${node.id}'.`
      );

    }

    ids.add(
      node.id
    );

  }


  // ===================================================
  // TYPE
  // ===================================================

  if (
    !node.type
  ) {

    errors.push(
      `${path}: Missing component type.`
    );

  }
  else {

    const registryEntry =
      componentRegistry[
        node.type
      ];


    if (
      !registryEntry
    ) {

      errors.push(
        `${node.id || path}: Unknown component '${node.type}'.`
      );

    }
    else {

      validateContract(
        node,
        registryEntry,
        errors,
        warnings
      );

    }

  }


  // ===================================================
  // PROPS
  // ===================================================

  validateRuntimeBindings(
    node.props,
    node.id ||
      path,
    warnings
  );


  // ===================================================
  // PROP ACTION
  // ===================================================

  const propAction =
    node?.props?.action;


  if (
    propAction
  ) {

    const registered =
      getActionByValue(
        propAction
      );


    if (
      !registered
    ) {

      errors.push(
        `${node.id || path}: Unknown action '${propAction}'.`
      );

    }

  }


  // ===================================================
  // DECLARED ACTIONS
  // ===================================================

  if (
    Array.isArray(
      node.actions
    )
  ) {

    node.actions.forEach(
      (
        action,
        index
      ) => {

        if (
          !action?.name
        ) {

          errors.push(
            `${node.id || path}: Action ${index} is missing name.`
          );

          return;

        }


        const registered =
          getActionByValue(
            action.name
          );


        if (
          !registered
        ) {

          errors.push(
            `${node.id || path}: Unknown action '${action.name}'.`
          );

        }

      }
    );

  }


  // ===================================================
  // CHILDREN
  // ===================================================

  if (
    node.children !==
    undefined &&
    !Array.isArray(
      node.children
    )
  ) {

    errors.push(
      `${node.id || path}: children must be an array.`
    );

    return;

  }


  if (
    Array.isArray(
      node.children
    )
  ) {

    node.children.forEach(
      (
        child,
        index
      ) => {

        validateTreeNode(
          child,
          `${path}.children[${index}]`,
          ids,
          errors,
          warnings
        );

      }
    );

  }

}


// =====================================================
// CONTRACT VALIDATION
// =====================================================

function validateContract(
  node,
  registryEntry,
  errors,
  warnings
) {

  const contract =
    registryEntry?.contract;


  // ---------------------------------------------------
  // No contract
  // ---------------------------------------------------

  if (
    !contract
  ) {

    warnings.push(
      `${node.id}: Component '${node.type}' has no contract.`
    );

    return;

  }


  // ===================================================
  // REQUIRED PROPS
  // ===================================================

  const requiredProps =
    Array.isArray(
      contract.requiredProps
    )
      ? contract.requiredProps
      : [];


  requiredProps.forEach(
    propName => {

      if (
        !propName
      ) {

        return;

      }


      if (
        node?.props?.[
          propName
        ] ===
        undefined
      ) {

        errors.push(
          `${node.id}: Missing required prop '${propName}'.`
        );

      }

    }
  );


  // ===================================================
  // OPTIONAL PROPS
  // ===================================================

  const optionalProps =
    Array.isArray(
      contract.optionalProps
    )
      ? contract.optionalProps
      : [];


  // ---------------------------------------------------
  // Informational only for now.
  //
  // We deliberately do not reject props which aren't
  // declared in the contract because the Confo schema
  // is still evolving.
  // ---------------------------------------------------

  if (
    optionalProps.length === 0
  ) {

    // Intentionally no-op.

  }


  // =====================================================
// CONTRACT ACTIONS
// =====================================================

  const contractActions =
    Array.isArray(contract.actions)
      ? contract.actions
      : Array.isArray(contract.actions?.inputs)
        ? contract.actions.inputs
        : [];

  contractActions.forEach(actionName => {

    const normalizedActionName =
      typeof actionName === "string"
        ? actionName.trim()
        : "";

    if (!normalizedActionName) {
      return;
    }

    const registered =
      getActionByValue(normalizedActionName);

    if (!registered) {

      errors.push(
        `Contract action "${normalizedActionName}" is not registered`
      );

    }

  });


  // ===================================================
  // CONTRACT TYPE
  // ===================================================

  if (
    contract.type &&
    String(
      contract.type
    ) !==
    String(
      node.type
    )
  ) {

    errors.push(
      `${node.id}: Contract type '${contract.type}' does not match component type '${node.type}'.`
    );

  }

}


// =====================================================
// LEGACY ELEMENTS
// =====================================================

function validateElements(
  elements,
  errors,
  warnings
) {

  const ids =
    new Set();


  elements.forEach(
    (
      element,
      index
    ) => {

      if (
        !element ||
        typeof element !==
        "object"
      ) {

        errors.push(
          `Element ${index} is invalid.`
        );

        return;

      }


      if (
        !element.id
      ) {

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


      if (
        !element.type
      ) {

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


      validateRuntimeBindings(
        element.props,
        element.id,
        warnings
      );


      // -----------------------------------------------
      // PROP ACTION
      // -----------------------------------------------

      if (
        element?.props?.action
      ) {

        const registered =
          getActionByValue(
            element.props.action
          );


        if (
          !registered
        ) {

          errors.push(
            `${element.id}: Unknown action '${element.props.action}'.`
          );

        }

      }


      // -----------------------------------------------
      // DECLARED ACTIONS
      // -----------------------------------------------

      if (
        Array.isArray(
          element.actions
        )
      ) {

        element.actions.forEach(
          action => {

            if (
              !action?.name
            ) {

              errors.push(
                `${element.id}: Action missing name.`
              );

              return;

            }


            const registered =
              getActionByValue(
                action.name
              );


            if (
              !registered
            ) {

              errors.push(
                `${element.id}: Unknown action '${action.name}'.`
              );

            }

          }
        );

      }

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

  if (
    !props ||
    typeof props !==
    "object"
  ) {

    return;

  }


  Object.entries(
    props
  ).forEach(
    (
      [
        key,
        value,
      ]
    ) => {

      if (
        typeof value !==
        "string"
      ) {

        return;

      }


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


export default {
  validateConfo,
};