import React, {
  useEffect,
  useState
} from "react";

import {
  loadConfo
}
from "../runtime/confos/ConfoLoader";

import ConfoRenderer from "../runtime/confos/ConfoRenderer";

import ConfoValidator from "../runtime/confos/ConfoValidator";

import {
  getAction,
  getAllActions,
} from "../actions/actionsRegistry";


const AVAILABLE_CONFOS = [

  {
    id: "confo.one_to_one",
    name: "1-to-1"
  },

  {
    id: "confo.one_to_many",
    name: "1-to-Many"
  },

  {
    id: "confo.host_to_many",
    name: "Host-to-Many"
  }

];



export default function ConfoTest(){





  const [selected,setSelected] =
    useState(
      "confo.one_to_one"
    );


  const [confo,setConfo] =
    useState(null);


  console.log(
  "%c[TEST]%c Spotlight action:",
  "color: #F59E0B; font-weight: bold;", // Amber/yellow tag
  "font-weight: bold;",
  getAction("call.spotlightUser")
);

console.log(
  "%c[TEST]%c All actions:",
  "color: #F59E0B; font-weight: bold;",
  "font-weight: bold;",
  getAllActions().map(a => a.value)
);

  useEffect(()=>{


    async function load(){

      try {


        const config =
          await loadConfo(
            selected
          );

          console.log("[AFTER LOAD]", config);

          console.log(
            "[AFTER LOAD ELEMENT PROPS]",
            config.elements[0].props
          );

           console.log(
        "[BEFORE SET STATE]",
        config.elements[0].props
        );


        setConfo(
          structuredClone(config)
        );

      }
      catch(err){

        console.error(
          "[ConfoTest]",
          err
        );

      }


    }


    load();


  },[
    selected
  ]);



  return (

    <div>


      <h2>
        Confo Runtime Test
      </h2>


      <select

        value={selected}

        onChange={
          e =>
            setSelected(
              e.target.value
            )
        }

      >

        {
          AVAILABLE_CONFOS.map(
            item=>(

              <option
                key={item.id}
                value={item.id}
              >

                {item.name}

              </option>

            )
          )
        }

      </select>



      {
        confo && (

          <ConfoRenderer
            config={confo}
          />

        )
      }


    </div>

  );

}