// src/context/ActionContext.js

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { runRuntimeAction } from "../runtime/runRuntimeAction";
import { runActionPipeline } from "../utils/actionPipeline";

import { useRuntimeState } from "./RuntimeStateContext";
import { useRuntimeEvents } from "./RuntimeEventContext";
import { useRuntimeAuth } from "./RuntimeAuthContext";


const ActionContext = createContext(null);


export function ActionProvider({ children }) {


  const [bindings, setBindings] = useState({});


  const runtimeState = useRuntimeState();
  const runtimeEvents = useRuntimeEvents();
  const runtimeAuth = useRuntimeAuth();


  const executeActionRef = useRef(null);



  const get = runtimeState.get;
  const getAll = runtimeState.getAll;
  const set = runtimeState.set;
  const patch = runtimeState.patch;



  /*
  --------------------------------------------------
  BINDINGS
  --------------------------------------------------
  */


  const getBinding = useCallback(
    (id)=> bindings[id] || null,
    [bindings]
  );



  const updateBinding = useCallback(
    (id, patchData={})=>{

      setBindings(prev=>{

        const cur = prev[id] || {};

        return {
          ...prev,

          [id]:{

            ...cur,
            ...patchData,

            config:{
              ...(cur.config || {}),
              ...(patchData.config || {})
            },

            state:{
              ...(cur.state || {}),
              ...(patchData.state || {})
            }

          }

        };

      });

    },
    []
  );



  const removeBinding = useCallback(
    (id)=>{

      setBindings(prev=>{

        const next={...prev};

        delete next[id];

        return next;

      });

    },
    []
  );



  const clearBindings = useCallback(
    ()=>setBindings({}),
    []
  );



  const appendFeedItem = useCallback(
    (id,item)=>{

      setBindings(prev=>{

        const cur = prev[id] || {};

        return {

          ...prev,

          [id]:{

            ...cur,

            items:[
              ...(cur.items || []),
              item
            ]

          }

        };

      });

    },
    []
  );




  /*
  --------------------------------------------------
  NOTIFY
  --------------------------------------------------
  */


  const notify = useCallback(
    (msg)=>{

      console.log(
        "[notify]",
        msg
      );

    },
    []
  );





  /*
  --------------------------------------------------
  RUNTIME ACTION CONTEXT
  --------------------------------------------------
  */


  const buildRuntimeContext = useCallback(()=>{

  return {

    /*
    -----------------------------------------------
    BINDINGS
    -----------------------------------------------
    */

    bindings,


    /*
    -----------------------------------------------
    AUTH
    -----------------------------------------------
    */

    runtimeAuth,


    /*
    -----------------------------------------------
    RUNTIME STATE API
    -----------------------------------------------
    */

    get,
    getAll,

    set,
    patch,


    /*
    -----------------------------------------------
    HELPERS
    -----------------------------------------------
    */

    notify,


    getBinding,
    updateBinding,
    removeBinding,
    clearBindings,

    appendFeedItem,


    /*
    -----------------------------------------------
    AGORA ACCESS
    -----------------------------------------------
    */

    agora:
      runtimeState.agora || null,


    /*
    -----------------------------------------------
    ACTION CHAIN
    -----------------------------------------------
    */

    runAction:(...args)=>
      executeActionRef.current?.(...args)

  };


},[
  bindings,
  runtimeAuth,

  get,
  getAll,

  set,
  patch,

  notify,

  getBinding,
  updateBinding,
  removeBinding,
  clearBindings,

  appendFeedItem,

  runtimeState.agora
]);






  /*
  --------------------------------------------------
  EXECUTE ACTION
  --------------------------------------------------
  */


  const executeAction = useCallback(

    async(actionName,params={})=>{

            /*
      -------------------------------------------
      RUNTIME AUTH ACTION GUARD
      -------------------------------------------
      */

      if(
        !runtimeAuth.allowedActions.includes(actionName)
      ){

        console.warn(
          "[AUTH BLOCKED ACTION]",
          {
            role: runtimeAuth.role,
            action: actionName,
            allowed:
              runtimeAuth.allowedActions
          }
        );


        return {
          ok:false,
          error:"permission_denied"
        };

      }


      if(!runtimeState.runtimeReady){

        console.warn(
          "[ACTION BLOCKED] Runtime not ready"
        );

        return {
          ok:false,
          error:"runtime_not_ready"
        };

      }



      runtimeState.beginTransaction();



      const ctx =
        buildRuntimeContext();




      try{


        const result =
          await runRuntimeAction(
            actionName,
            ctx,
            params
          );




        if(result?.ok){

  await runtimeState.flush();


  const committedState = getAll();


  runtimeEvents.emit(
    actionName,
    {
      action: actionName,

      targetId:
        params?.targetId ?? null,

      params,

      state: committedState,

      result,

      timestamp: Date.now()
    }
  );


  console.log(
    "[AFTER COMMIT]",
    committedState
  );

}


        return result;



      }
      catch(err){


        runtimeState.commit();


        console.error(
          "[Action Error]",
          actionName,
          err
        );


        return {
          ok:false,
          error:err.message
        };


      }


    },


    [
      runtimeState,
      runtimeEvents,
      buildRuntimeContext,
      getAll,
      runtimeAuth
    ]

  );



  executeActionRef.current =
    executeAction;





  /*
  --------------------------------------------------
  PIPELINE
  --------------------------------------------------
  */


  const executePipeline = useCallback(
    async(
      pipeline=[],
      payload={}
    )=>{

      return runActionPipeline(
        pipeline,
        payload,
        {
          runRuntimeAction:executeAction,
          get,
          set,
          notify
        }
      );

    },
    [
      executeAction,
      get,
      set,
      notify
    ]
  );






  const value = useMemo(
    ()=>({

      runtimeState,


      bindings,


      getBinding,
      updateBinding,
      removeBinding,
      clearBindings,
      appendFeedItem,


      get,
      set,


      runRuntimeAction:
        executeAction,


      runActionPipeline:
        executePipeline,


      runAction:
        executeAction,


      notify

    }),

    [
      runtimeState,
      bindings,
      getBinding,
      updateBinding,
      removeBinding,
      clearBindings,
      appendFeedItem,
      get,
      set,
      executeAction,
      executePipeline,
      notify
    ]

  );



  return (

    <ActionContext.Provider value={value}>

      {children}

    </ActionContext.Provider>

  );

}



export function useActionContext(){

  const ctx =
    useContext(ActionContext);


  if(!ctx){

    throw new Error(
      "useActionContext must be used inside provider"
    );

  }


  return ctx;

}