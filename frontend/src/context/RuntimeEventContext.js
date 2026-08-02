// src/context/RuntimeEventContext.js

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import { useRuntimeDebugger }
from "./RuntimeDebuggerContext";


const RuntimeEventContext =
  createContext(null);



export function RuntimeEventProvider({
  children,
}) {


  const listenersRef =
    useRef({});


  const debuggerRuntime =
    useRuntimeDebugger();



  // =====================================================
  // 🔥 EMIT EVENT
  // =====================================================

  const emit =
    useCallback((
      event,
      payload = {}
    ) => {


      const eventRecord = {

        id:
          crypto.randomUUID(),

        event,

        payload,

        timestamp:
          Date.now()

      };


      console.log(
        `%c[RUNTIME EVENT] ${event}`,
        "color: orange;",
        payload
      );


      // Debug timeline
      debuggerRuntime?.logEvent?.(
        eventRecord
      );


      const listeners =
        listenersRef.current[event];


      if (!listeners) return;



      // Clone array so listeners
      // can safely remove themselves

      [
        ...listeners
      ]
      .forEach((callback)=>{


        try {


          callback(payload);


        } catch(err){


          console.error(
            `[RuntimeEvent Error] ${event}`,
            err
          );


        }


      });



    }, [
      debuggerRuntime
    ]);





  // =====================================================
  // 🔥 REGISTER LISTENER
  // =====================================================

  const on =
    useCallback((
      event,
      callback
    )=>{


      if(
        !listenersRef.current[event]
      ){

        listenersRef.current[event] =
          [];

      }



      listenersRef.current[event]
        .push(callback);



      return () => {


        off(
          event,
          callback
        );


      };


    }, []);





  // =====================================================
  // 🔥 REMOVE LISTENER
  // =====================================================

  const off =
    useCallback((
      event,
      callback
    )=>{


      const listeners =
        listenersRef.current[event];



      if(!listeners)
        return;



      listenersRef.current[event] =
        listeners.filter(
          cb =>
            cb !== callback
        );



    }, []);





  // =====================================================
  // 🔥 LISTEN ONCE
  // =====================================================

  const once =
    useCallback((
      event,
      callback
    )=>{


      const handler =
        (payload)=>{


          callback(payload);


          off(
            event,
            handler
          );


        };



      return on(
        event,
        handler
      );


    },[
      on,
      off
    ]);





  // =====================================================
  // 🔥 PROVIDER CLEANUP
  // =====================================================

  useEffect(()=>{


    return ()=>{


      listenersRef.current = {};


    };


  },[]);





  // =====================================================
  // 🔥 CONTEXT VALUE
  // =====================================================

  const value =
    useMemo(()=>({


      emit,

      on,

      off,

      once


    }),[
      emit,
      on,
      off,
      once
    ]);




  return (

    <RuntimeEventContext.Provider
      value={value}
    >

      {children}

    </RuntimeEventContext.Provider>

  );


}





export function useRuntimeEvents(){


  const ctx =
    useContext(
      RuntimeEventContext
    );


  if(!ctx){


    throw new Error(
      "useRuntimeEvents must be used inside RuntimeEventProvider"
    );


  }


  return ctx;


}