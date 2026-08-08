import contract from "./ComponentContract.js";

class ComponentContractManager {


  constructor(){

    this.contracts = contract;

  }



  /*
  ---------------------------------------
  GET FULL CONTRACT
  ---------------------------------------
  */

  getContract(type){

    const contract =
      this.contracts[type];


    if(!contract){

      console.warn(
        "[CONTRACT] Missing component",
        type
      );

      return null;

    }


    return contract;

}





  /*
  ---------------------------------------
  BUILDER PERMISSIONS
  ---------------------------------------
  */

  getBuilderRoles(type){

    const contract =
      this.getContract(type);


    return (
      contract?.builder?.roles ||
      []
    );

  }




  canBuild(type, role){

    return this
      .getBuilderRoles(type)
      .includes(role);

  }





  /*
  ---------------------------------------
  EDITABLE PROPERTIES
  ---------------------------------------
  */


  getEditableProps(type){

    const contract =
      this.getContract(type);


    return (
      contract?.editableProps ||
      {}
    );

  }





  /*
  ---------------------------------------
  COMPONENT ACTIONS
  ---------------------------------------
  */


  getActions(type){

    const contract =
      this.getContract(type);


    return (
      contract?.actions?.receives ||
      []
    );

  }





  /*
  ---------------------------------------
  TARGET TYPES
  ---------------------------------------
  */


  getTargets(type){

    const contract =
      this.getContract(type);


    return (
      contract?.targets ||
      []
    );

  }





  /*
  ---------------------------------------
  BINDINGS
  ---------------------------------------
  */


  getBindings(type){

    const contract =
      this.getContract(type);


    return (
      contract?.bindings ||
      {}
    );

  }





  /*
  ---------------------------------------
  CAPABILITIES
  ---------------------------------------
  */


  getCapabilities(type){

    const contract =
      this.getContract(type);


    return (
      contract?.capabilities ||
      {}
    );

  }




  /*
  ---------------------------------------
  VALIDATION
  ---------------------------------------
  */


  validate(type){

    const contract =
      this.getContract(type);


    if(!contract){

      return {
        valid:false,
        errors:[
          "Missing component contract"
        ]
      };

    }


    const errors=[];


    if(!contract.name){

      errors.push(
        "Missing name"
      );

    }


    return {

      valid:
        errors.length===0,

      errors

    };

  }



}


export default new ComponentContractManager();