// src/runtime/confo/ConfoRuntimeTriggers.jsx

import {
  useEffect
} from "react";

import {
  useRuntimeTriggers
} from "../../context/RuntimeTriggersContext.js";

import {
  registerConfoRuntimeTriggers
} from "./ConfoRuntimeTriggerLoader.js";


export default function ConfoRuntimeTriggers({
  confo
}) {

  const {
    registerTrigger 
  } = useRuntimeTriggers();


  useEffect(() => {

    /*
    ================================================
    NO CONFO
    ================================================
    */

    if (!confo) {

      return undefined;

    }


    /*
    ================================================
    NO RUNTIME TRIGGERS
    ================================================
    */

    const triggers =
      confo?.runtime?.triggers;


    if (
      !Array.isArray(triggers) ||
      triggers.length === 0
    ) {

      console.log(
        "[ConfoRuntimeTriggers] No runtime triggers",
        {
          confo:
            confo?.id ||
            confo?.name
        }
      );

      return undefined;

    }


    /*
    ================================================
    REGISTER
    ================================================
    */

    console.log(
      "[ConfoRuntimeTriggers] Installing runtime triggers",
      {
        confo:
          confo?.id ||
          confo?.name,

        count:
          triggers.length
      }
    );


    let unregister;


    try {

      unregister =
        registerConfoRuntimeTriggers(
          confo,
          registerTrigger
        );

    } catch (err) {

      console.error(
        "[ConfoRuntimeTriggers] Failed to install runtime triggers",
        {
          confo:
            confo?.id ||
            confo?.name,

          error: err
        }
      );

    }


    /*
    ================================================
    CLEANUP
    ================================================
    */

    return () => {

      unregister?.();

    };

  }, [
    confo,
    registerTrigger
  ]);


  /*
  ================================================
  RUNTIME-ONLY COMPONENT
  ================================================

  This component intentionally renders nothing.

  Its only responsibility is connecting declarative
  Confo runtime configuration to RuntimeTriggersContext.
  ================================================
  */

  return null;

}