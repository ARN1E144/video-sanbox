import ContractValidator from "./ContractValidator.js";


class RuntimeGraphValidator {


  /*
  =====================================================
  VALIDATE FULL GRAPH
  =====================================================
  */

  validate(graph = {}){


    const errors = [];


    const components =
      graph.components || [];



    /*
    ---------------------------------------
    COMPONENT EXISTENCE
    ---------------------------------------
    */

    components.forEach(component => {


      const result =
        ContractValidator.validateComponent(
          component.type
        );


      if(!result.valid){

        errors.push(
          ...result.errors.map(
            e =>
            `${component.id}: ${e}`
          )
        );

      }


    });




    /*
    ---------------------------------------
    CONNECTION VALIDATION
    ---------------------------------------
    */


    components.forEach(source => {


      if(!source.connections)
        return;



      source.connections.forEach(connection => {


        const target =
          components.find(
            c =>
            c.id === connection.targetId
          );



        if(!target){

          errors.push(
            `${source.id}: Missing target ${connection.targetId}`
          );

          return;

        }




        const result =
          ContractValidator.validateConnection({

            sourceType:
              source.type,

            action:
              connection.action,

            targetType:
              target.type

          });




        if(!result.valid){

          errors.push(
            ...result.errors.map(
              e =>
              `${source.id} -> ${target.id}: ${e}`
            )
          );

        }


      });


    });




    return {

      valid:
        errors.length === 0,

      errors

    };


  }


}


export default new RuntimeGraphValidator();