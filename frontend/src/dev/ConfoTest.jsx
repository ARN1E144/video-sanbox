import React, {
  useEffect,
  useState
} from "react";

import ConfoLoader
  from "../runtime/confos/ConfoLoader";

import ConfoRenderer
  from "../runtime/confos/ConfoRenderer";

import ConfosRegistry from "../configs/confos/ConfosRegistry";

/*
=====================================================
AVAILABLE CONFOS
=====================================================
*/

const AVAILABLE_CONFOS = [

  {
    id: "confo.one_to_one",
    name: "1-to-1 Video Call"
  },

  {
    id: "confo.one_to_many",
    name: "1-to-Many Video Call"
  },

  {
    id: "confo.host_to_many",
    name: "Host-to-Many Video Call"
  },

  {
    id: "confo.remote_training",
    name: "Remote Training"
  }

];


/*
=====================================================
CONFO TEST
=====================================================
*/

export default function ConfoTest() {

  const [selected, setSelected] =
    useState(
      "confo.remote_training"
    );


  const [confo, setConfo] =
    useState(null);


  const [errors, setErrors] =
    useState([]);


  /*
  ===================================================
  LOAD SELECTED CONFO
  ===================================================
  */

  useEffect(() => {

    try {

      console.log(
        "[ConfoTest] Loading",
        selected
      );


      /*
      -----------------------------------------------
      Get config from registry
      -----------------------------------------------
      */

      const config =
        ConfosRegistry[selected];


      if (!config) {

        console.error(
          "[ConfoTest] Confo not found in registry",
          selected
        );

        setConfo(null);

        setErrors([
          `Confo '${selected}' not found in ConfosRegistry.`
        ]);

        return;

      }


      console.log(
        "[ConfoTest] Registry config",
        config
      );


      /*
      -----------------------------------------------
      Load through ConfoLoader
      -----------------------------------------------
      */

      const loader =
        new ConfoLoader();


      const result =
        loader.load(config);


      console.log(
        "[ConfoTest] LOAD RESULT",
        result
      );


      /*
      -----------------------------------------------
      Validation failed
      -----------------------------------------------
      */

      if (!result.valid) {

        console.error(
          "[ConfoTest] Invalid Confo",
          result.errors
        );

        setConfo(null);

        setErrors(
          result.errors || [
            "Unknown Confo validation error."
          ]
        );

        return;

      }


      /*
      -----------------------------------------------
      Success
      -----------------------------------------------
      */

      setErrors([]);

      setConfo(
        result.confo
      );


    }
    catch (error) {

      console.error(
        "[ConfoTest]",
        error
      );


      setConfo(null);

      setErrors([
        error.message
      ]);

    }

  }, [
    selected
  ]);


  /*
  ===================================================
  RENDER
  ===================================================
  */

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


      {/* =========================================
          TEMPLATE SELECTOR
          ========================================= */}

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
          padding: 8,
          minWidth: 260
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


      {/* =========================================
          VALIDATION ERRORS
          ========================================= */}

      {
        errors.length > 0 && (

          <div
            style={{
              background: "#3b1515",
              border: "1px solid #7f1d1d",
              color: "#fca5a5",
              padding: 12,
              borderRadius: 8,
              marginBottom: 20
            }}
          >

            <strong>
              Confo validation failed
            </strong>


            <ul>

              {
                errors.map(
                  (error, index) => (

                    <li key={index}>
                      {error}
                    </li>

                  )
                )
              }

            </ul>

          </div>

        )
      }


      {/* =========================================
          RENDER CONFO
          ========================================= */}

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