import ContractManager from "./ComponentContractManager.js";
import actionContracts from "./actionContracts.js";

class ContractValidator {

  /*
  ======================================================
  COMPONENT EXISTS
  ======================================================
  */

  componentExists(type) {

    return !!ContractManager.getContract(type);

  }


    /*
  ======================================================
  VALIDATE ACTION
  ======================================================
  */

  validateActionContract(
sourceType,
action,
targetType
){

const contract =
    actionContracts[action];


if(!contract){

return {
valid:false,
errors:[
`Unknown action ${action}`
]
};

}


const errors=[];


if(
!contract.sourceTypes.includes(sourceType)
){

errors.push(
`${sourceType} cannot emit ${action}`
);

}


if(
!contract.targetTypes.includes(targetType)
){

errors.push(
`${action} cannot target ${targetType}`
);

}


return {

valid: errors.length===0,

errors

};


}



  /*
  ======================================================
  VALIDATE COMPONENT
  ======================================================
  */

  validateComponent(type) {

    const contract =
      ContractManager.getContract(type);

    if (!contract) {

      return {
        valid: false,
        errors: [
          `Unknown component '${type}'`
        ]
      };

    }

    const errors = [];

    if (!contract.name)
      errors.push("Missing name");

    if (!contract.version)
      errors.push("Missing version");

    if (!contract.category)
      errors.push("Missing category");

    if (!contract.builder)
      errors.push("Missing builder section");

    if (!contract.runtime)
      errors.push("Missing runtime section");

    if (!contract.actions)
      errors.push("Missing actions");

    if (!contract.targets)
      errors.push("Missing targets");

    return {

      valid:
        errors.length === 0,

      errors

    };

  }



  /*
  ======================================================
  ACTION VALIDATION
  ======================================================
  */

  canOutputAction(
  componentType,
  action
){

  const contract =
    ContractManager.getContract(
      componentType
    );


  if(!contract)
    return false;


  return (
    contract.actions?.outputs || []
  )
  .includes(action);

}



  /*
  ======================================================
  RECEIVE ACTION
  ======================================================
  */

  canInputAction(
  componentType,
  action
){

  const contract =
    ContractManager.getContract(
      componentType
    );


  if(!contract)
    return false;


  return (
    contract.actions?.inputs || []
  )
  .includes(action);

}



  /*
  ======================================================
  TARGET VALIDATION
  ======================================================
  */

  canTarget(
  sourceType,
  targetType
) {

  const contract =
    ContractManager.getContract(sourceType);


  if (!contract)
    return false;


  const accepts =
    contract.targets?.accepts || [];


  const rejects =
    contract.targets?.rejects || [];


  if(rejects.includes(targetType)){
    return false;
  }


  return accepts.includes(targetType);

}



  /*
  ======================================================
  RUNTIME TARGETS
  ======================================================
  */

  canTargetRuntime(
    sourceType,
    runtimeTarget
  ) {

    const contract =
      ContractManager.getContract(
        sourceType
      );

    if (!contract)
      return false;

    return (
      contract.targets?.runtime || []
    ).includes(runtimeTarget);

  }



  /*
  ======================================================
  PROPERTY VALIDATION
  ======================================================
  */

  validateProperties(
    componentType,
    props = {}
  ) {

    const contract =
      ContractManager.getContract(
        componentType
      );

    if (!contract) {

      return {
        valid: false,
        errors: [
          "Unknown component"
        ]
      };

    }

    const errors = [];

    const required =
      contract.validation?.required || [];

    required.forEach((key) => {

      if (
        props[key] === undefined ||
        props[key] === null ||
        props[key] === ""
      ) {

        errors.push(
          `Missing property '${key}'`
        );

      }

    });

    return {

      valid:
        errors.length === 0,

      errors

    };

  }



  /*
  ======================================================
  BINDINGS
  ======================================================
  */

  canBind(
    componentType,
    binding
  ) {

    const bindings =
      ContractManager.getBindings(
        componentType
      );

    return !!bindings[binding];

  }



  /*
  ======================================================
  BUILDER ROLE
  ======================================================
  */

  canBuilderUse(
    componentType,
    role
  ) {

    return ContractManager
      .getBuilderRoles(componentType)
      .includes(role);

  }



  /*
  ======================================================
  RUNTIME ROLE
  ======================================================
  */

  canRuntimeUse(
    componentType,
    role
  ) {

    const contract =
      ContractManager.getContract(
        componentType
      );

    return (
      contract?.runtime?.roles || []
    ).includes(role);

  };

    /*
  ======================================================
  CONNECTION VALIDATION
  ======================================================
  */

  validateConnection({

  sourceType,
  action,
  targetType

}){


  const errors=[];



  /*
  ----------------------------------------
  SOURCE OUTPUT CHECK
  ----------------------------------------
  */

  if(
    !this.canOutputAction(
      sourceType,
      action
    )
  ){

    errors.push(
      `${sourceType} cannot output ${action}`
    );

  }



  /*
  ----------------------------------------
  TARGET INPUT CHECK
  ----------------------------------------
  */

  if(
    targetType &&
    !this.canInputAction(
      targetType,
      action
    )
  ){

    errors.push(
      `${targetType} cannot input ${action}`
    );

  }



  /*
  ----------------------------------------
  TARGET TYPE CHECK
  ----------------------------------------
  */

  if(
    targetType &&
    !this.canTarget(
      sourceType,
      targetType
    )
    ){

        errors.push(
        `${sourceType} cannot target ${targetType}`
        );

    }



    return {

        valid:
        errors.length === 0,

        errors

    };

    }

}

export default new ContractValidator();