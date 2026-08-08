import ContractValidator from "../contracts/ContractValidator.js";
import RuntimeGraphValidator from "../contracts/RuntimeGraphValidator.js";

export default class ConfoLoader {

  constructor() {}

  load(confo) {

    console.log(
      "[ConfoLoader] Loading",
      confo?.name
    );

    /*
    =====================================================
    1. BASIC CONFO VALIDATION
    =====================================================
    */

    if (!confo) {

      return {
        valid: false,
        errors: ["Confo is undefined."]
      };

    }

    if (!confo.name) {

      return {
        valid: false,
        errors: ["Missing confo.name"]
      };

    }

    if (!confo.tree) {

      return {
        valid: false,
        errors: ["Missing confo.tree"]
      };

    }


    /*
    =====================================================
    2. EXTRACT COMPONENTS
    =====================================================
    */

    const components =
      this.flattenTree(confo.tree);


    /*
    =====================================================
    3. COMPONENT CONTRACT VALIDATION
    =====================================================
    */

    const componentErrors = [];


    components.forEach(component => {

      const result =
        ContractValidator.validateComponent(
          component.type
        );


      if (!result.valid) {

        componentErrors.push(
          ...result.errors.map(
            error =>
              `${component.id || component.type}: ${error}`
          )
        );

      }

    });


    if (componentErrors.length) {

      return {

        valid: false,

        errors: componentErrors

      };

    }


    /*
    =====================================================
    4. RUNTIME GRAPH VALIDATION
    =====================================================
    */

    const graphResult =
      RuntimeGraphValidator.validate(
        confo
      );


    if (!graphResult.valid) {

      return graphResult;

    }


    /*
    =====================================================
    5. SUCCESS
    =====================================================
    */

    return {

      valid: true,

      errors: [],

      confo

    };

  }


  /*
  =====================================================
  FLATTEN TREE
  =====================================================
  */

  flattenTree(node, result = []) {

    if (!node)
      return result;


    /*
    -----------------------------------------
    Add current component
    -----------------------------------------
    */

    if (node.type) {

      result.push(node);

    }


    /*
    -----------------------------------------
    Process children
    -----------------------------------------
    */

    if (Array.isArray(node.children)) {

      node.children.forEach(child => {

        this.flattenTree(
          child,
          result
        );

      });

    }


    return result;

  }

}