import React, {
  useEffect,
  useState
} from "react";

import ConfoLoader
  from "../runtime/confos/ConfoLoader";

import ConfoRenderer
  from "../runtime/confos/ConfoRenderer";

import oneToOne
  from "../runtime/confos/tests/valid-runtime.confo.js";


const AVAILABLE_CONFOS = [

  {
    id: "confo.one_to_one",
    name: "1-to-1",
    config: oneToOne
  }

];


export default function ConfoTest(){

  const [selected, setSelected] =
    useState(
      "confo.one_to_one"
    );


  const [confo, setConfo] =
    useState(null);


  useEffect(() => {

    try {

      const selectedConfo =
        AVAILABLE_CONFOS.find(
          item =>
            item.id === selected
        );


      if(!selectedConfo){

        console.error(
          "[ConfoTest] Confo not found",
          selected
        );

        return;

      }


      const loader =
        new ConfoLoader();


      const result =
        loader.load(
          selectedConfo.config
        );


      console.log(
        "[ConfoTest] LOAD RESULT",
        result
      );


      if(!result.valid){

        console.error(
          "[ConfoTest] Invalid Confo",
          result.errors
        );

        setConfo(null);

        return;

      }


      setConfo(
        result.confo
      );


    }
    catch(error){

      console.error(
        "[ConfoTest]",
        error
      );

      setConfo(null);

    }

  }, [
    selected
  ]);


  return (

    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#181818",
        color: "#fff",
        padding: 20,
        boxSizing: "border-box"
      }}
    >

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

        style={{
          marginBottom: 20,
          padding: 8
        }}

      >

        {
          AVAILABLE_CONFOS.map(
            item => (

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