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



  useEffect(()=>{


    async function load(){

      try {


        const config =
          await loadConfo(
            selected
          );


        setConfo(config);


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