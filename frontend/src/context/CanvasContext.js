// src/context/CanvasContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

import { useProjectContext } from "./ProjectContext";

import COMPONENTS from "../components/elements/registry";

import {
  projectTreeToElements,
} from "../runtime/project/ProjectTreeLoader";

import {
  elementsToProjectTree,
} from "../runtime/project/ProjectTreeWriter";


const CanvasContext = createContext();



function extractDefaults(editableProps = {}) {

  const result = {};

  Object.entries(editableProps)
    .forEach(([key,value])=>{

      if(
        value &&
        typeof value === "object" &&
        value.default !== undefined
      ){
        result[key] = value.default;
      }
      else{
        result[key] = value;
      }

    });


  return result;

}




function normalizeElement(el){

  if(!el || typeof el !== "object"){
    return null;
  }



  const registryEntry =
    COMPONENTS[el.type];



  const metaDefaults =
    registryEntry?.meta?.editableProps || {};



  const props = {

    ...extractDefaults(metaDefaults),

    ...(el.props || {})

  };




  return {


    ...el,


    type:
      COMPONENTS[el.type]
        ? el.type
        : "Text",



    props,

  };

}




function normalizeElements(list){

  if(!Array.isArray(list)){
    return [];
  }


  return list
    .map(normalizeElement)
    .filter(Boolean);

}





export function CanvasProvider({
 children
}){


 const {
   projectSchema,
   setProjectSchema,
 } =
 useProjectContext();




 const [
   elements,
   setElements
 ] =
 useState([]);

 const isSyncingRef = useRef(false);




 /*
 ----------------------------------------------------
 TREE → CANVAS
 ----------------------------------------------------
 */

useEffect(()=>{


  if(isSyncingRef.current){

    isSyncingRef.current = false;

    return;

  }



  if(!projectSchema?.tree){

    setElements([]);

    return;

  }



  const generated =
    projectTreeToElements(
      projectSchema.tree
    );



  const normalized =
    normalizeElements(
      generated
    );



  console.log(
    "[Canvas] Hydrating from tree",
    normalized
  );

  console.log(
  "🟢 TREE → CANVAS",
  projectSchema?.tree
  );



  setElements(
    normalized
  );


},[
 projectSchema?.tree
]);







 /*
 ----------------------------------------------------
 CANVAS → TREE
 ----------------------------------------------------
 */


 const syncTree = useCallback(
(nextElements)=>{


    const tree =
      elementsToProjectTree(
        nextElements
      );


    console.log(
      "🔵 CANVAS → TREE",
      tree
    );


    isSyncingRef.current = true;


    setProjectSchema(prev=>({

      ...prev,

      tree,

    }));


},
[
 setProjectSchema
]);








 /*
 ----------------------------------------------------
 CANVAS ACTIONS
 ----------------------------------------------------
 */


 const addElement =
 useCallback(
 (newEl)=>{


    const normalized =
      normalizeElement(
        newEl
      );



    if(!normalized){
      return;
    }



    setElements(prev=>{


      const next=[
        ...prev,
        normalized
      ];



      syncTree(next);


      return next;

    });



 },
 [
   syncTree
 ]);







 const updateElement =
 useCallback(
 (
   id,
   updates
 )=>{


 setElements(prev=>{


   const next =
     prev.map(el=>{


       if(el.id !== id){
         return el;
       }



       return normalizeElement({

          ...el,

          ...updates,

          props:{
            ...(el.props || {}),
            ...(updates?.props || {})
          }

       });


     });



   syncTree(next);


   return next;


 });


 },
 [
   syncTree
 ]);








 const removeElement =
 useCallback(
 (id)=>{


   setElements(prev=>{


     const next =
       prev.filter(
         el=>el.id !== id
       );



     syncTree(next);



     return next;


   });


 },
 [
   syncTree
 ]);







 const clearCanvas =
 useCallback(()=>{


   setElements([]);


   syncTree([]);


 },
 [
   syncTree
 ]);







 const loadElements =
 useCallback(
 (saved)=>{


   const normalized =
     normalizeElements(
       saved
     );


   setElements(
     normalized
   );


   syncTree(
     normalized
   );


 },
 [
   syncTree
 ]);







 return (

 <CanvasContext.Provider

 value={{

    elements,

    addElement,

    updateElement,

    removeElement,

    clearCanvas,

    loadElements,

 }}

 >

 {children}

 </CanvasContext.Provider>

 );


}






export function useCanvasState(){

 const ctx =
   useContext(
     CanvasContext
   );


 if(!ctx){

   throw new Error(
    "useCanvasState must be used inside CanvasProvider"
   );

 }


 return ctx;

}