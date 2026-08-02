import React from "react";
import { useActionContext } from "../../context/ActionContext";


export default function ActionButton({
  action,
  label,
  params = {},
}) {


  const {
    runRuntimeAction
  } = useActionContext();



  const run = async()=>{


    console.group(
      `▶ ${action}`
    );


    try{

      const result =
        await runRuntimeAction(
          action,
          params
        );


      console.log(
        "Result:",
        result
      );


      return result;


    }
    catch(error){

      console.error(
        error
      );

    }
    finally{

      console.groupEnd();

    }


  };



  return (

    <button
      onClick={run}
      style={{
        padding:"8px",
        cursor:"pointer",
      }}
    >
      {label}
    </button>

  );

}