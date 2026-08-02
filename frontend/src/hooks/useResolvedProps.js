import {
  useRuntimeValue
}
from "./useRuntimeValue";


function resolveValue(
    value,
    runtimeValues
){

    if(
        typeof value !== "string"
    ){
        return value;
    }


    const match =
        value.match(
            /^{{(.+)}}$/
        );


    if(!match){
        return value;
    }


    const path =
        match[1].trim();


    return runtimeValues[path];

}



export function useResolvedProps(
    props
){

    const channel =
        useRuntimeValue("call.channel");


    const token =
        useRuntimeValue("call.token");


    const uid =
        useRuntimeValue("call.uid");


    const id =
        useRuntimeValue("call.id");


    const runtimeValues = {

        "call.channel":
            channel,

        "call.token":
            token,

        "call.uid":
            uid,

        "call.id":
            id

    };



    function walk(obj){

        if(
            obj === null ||
            typeof obj !== "object"
        ){

            return resolveValue(
                obj,
                runtimeValues
            );

        }


        if(Array.isArray(obj)){

            return obj.map(walk);

        }


        const result={};


        Object.entries(obj)
        .forEach(([key,value])=>{

            result[key]=walk(value);

        });


        return result;

    }


    return walk(props);

}