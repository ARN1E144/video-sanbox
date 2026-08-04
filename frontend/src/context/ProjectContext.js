// src/context/ProjectContext.js

import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
} from "react";

import {
  makeEmptyProjectSchema,
} from "../schema/gptSchema";


export const ProjectContext = createContext(null);



const DEFAULT_BACKGROUND_CONFIGS = {

  desktop: {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  },

  tablet: {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  },

  mobile: {
    kind: "color",
    color: "#020617",
    imageUrl: "",
    size: "cover",
  },

};





export function ProjectProvider({
  children
}) {


  const [
    projectSchema,
    setProjectSchema
  ] = useState(
    makeEmptyProjectSchema()
  );



  const [
    viewMode,
    setViewMode
  ] = useState("preview");



  const [
    projectType,
    setProjectType
  ] = useState("single");



  const [
    collapsed,
    setCollapsed
  ] = useState(false);



  const [
    backgroundConfigs,
    setBackgroundConfigs
  ] = useState(
    DEFAULT_BACKGROUND_CONFIGS
  );



  const [
    projects,
    setProjects
  ] = useState({});



  const [
    activeProject,
    setActiveProject
  ] = useState(null);







  /*
  ------------------------------------------------------------
  Create project
  ------------------------------------------------------------
  */

  const saveProject = useCallback(
    (name)=>{


      if(!name?.trim()){
        return;
      }



      const id =
        Date.now()
        .toString();



      const newProject = {

        id,

        name,


        type:
          projectType,


        schema:
          projectSchema,


        elements:
          projectSchema.elements || [],


        backgroundConfigs,

      };




      setProjects(prev=>({

        ...prev,

        [id]:
          newProject,

      }));




      setActiveProject(id);



      return id;


    },
    [
      projectType,
      projectSchema,
      backgroundConfigs,
    ]
  );









  /*
  ------------------------------------------------------------
  Load project
  ------------------------------------------------------------
  */

  const loadProject = useCallback(
    (id)=>{


      const project =
        projects[id];



      if(!project){

        console.warn(
          "Project not found:",
          id
        );

        return;

      }




      setActiveProject(id);



      setProjectType(
        project.type ||
        "single"
      );



      setProjectSchema(
        project.schema ||
        makeEmptyProjectSchema()
      );



      setBackgroundConfigs(
        project.backgroundConfigs ||
        DEFAULT_BACKGROUND_CONFIGS
      );


    },
    [
      projects
    ]
  );









  /*
  ------------------------------------------------------------
  Canvas -> Project persistence
  ------------------------------------------------------------
  */

  const saveProjectElements =
    useCallback(
      (elements)=>{


        if(!activeProject){

          console.warn(
            "No active project. Cannot save elements."
          );

          return;

        }



        setProjects(prev=>({


          ...prev,


          [activeProject]:{


            ...prev[activeProject],


            elements,


          },


        }));


      },
      [
        activeProject
      ]
    );









  /*
  ------------------------------------------------------------
  Delete project
  ------------------------------------------------------------
  */

  const deleteProject =
    useCallback(
      (id)=>{


        setProjects(prev=>{


          const copy = {
            ...prev,
          };


          delete copy[id];


          return copy;


        });



        if(activeProject === id){

          setActiveProject(null);

        }


      },
      [
        activeProject
      ]
    );









  const value = useMemo(
    ()=>({


      /*
      Project schema
      */

      projectSchema,

      setProjectSchema,



      /*
      View
      */

      viewMode,

      setViewMode,



      /*
      Type
      */

      projectType,

      setProjectType,



      /*
      Background
      */

      backgroundConfigs,

      setBackgroundConfigs,



      /*
      Projects
      */

      projects,


      activeProject,


      setActiveProject,



      saveProject,


      loadProject,


      deleteProject,


      saveProjectElements,



      /*
      UI
      */

      collapsed,

      setCollapsed,


    }),

    [

      projectSchema,

      viewMode,

      projectType,

      backgroundConfigs,

      projects,

      activeProject,

      saveProject,

      loadProject,

      deleteProject,

      saveProjectElements,

      collapsed,

    ]

  );








  return (

    <ProjectContext.Provider
      value={value}
    >

      {children}

    </ProjectContext.Provider>

  );

}







export function useProjectContext(){

  const ctx =
    React.useContext(
      ProjectContext
    );


  if(!ctx){

    throw new Error(
      "useProjectContext must be used within a ProjectProvider"
    );

  }


  return ctx;

}